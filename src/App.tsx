import { useState, useCallback, useEffect } from 'react';
import { 
  ArrowRight, AlertCircle, RefreshCw, FileJson, Zap, Download, 
  ExternalLink, Key, Settings, User, Calendar, ShieldCheck, Edit3, Plus,
  Check, Trash2, Save, FileDown, FolderOpen, ShieldAlert, List, Info
} from 'lucide-react';

// ============================================================================
// ĐỊNH NGHĨA PHÂN LOẠI DỮ LIỆU & HÀM BỔ TRỢ
// ============================================================================

interface ChatGPTSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  account?: {
    id?: string;
    planType?: string;
  };
  accessToken?: string;
  sessionToken?: string;
  expires?: string;
}

interface CodexConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  testStatus: string;
  expiresIn: number;
  providerSpecificData: {
    chatgptAccountId: string;
    chatgptPlanType: string;
  };
  id: string;
  provider: string;
  authType: string;
  name: string;
  email: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ParsedProfile {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  expires: string;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function convertSessionToCodex(session: ChatGPTSession, priority: number = 1): CodexConnection {
  const now = new Date();
  const expiresIn = 864000; // 10 ngày tính bằng giây
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  return {
    accessToken: session.accessToken || '',
    refreshToken: session.sessionToken || '',
    expiresAt: expiresAt.toISOString(),
    testStatus: 'active',
    expiresIn,
    providerSpecificData: {
      chatgptAccountId: session.account?.id || '',
      chatgptPlanType: session.account?.planType || 'plus',
    },
    id: generateUUID(),
    provider: 'codex',
    authType: 'oauth',
    name: session.user?.email || '',
    email: session.user?.email || '',
    priority,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// Định dạng thời gian thân thiện bằng tiếng Việt
function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return 'Không rõ hạn';
  try {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ngày ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// ============================================================================
// BỘ HIỂN THỊ CÚ PHÁP JSON ĐẸP MẮT
// ============================================================================

function HighlightedJson({ json }: { json: string }) {
  if (!json) return null;
  
  const lines = json.split('\n');
  return (
    <pre className="text-[11px] font-mono select-text leading-relaxed p-1">
      {lines.map((line, i) => {
        // Tìm kiếm các cặp key: value
        const keyMatch = line.match(/^(\s*)"([^"]+)":/);
        if (keyMatch) {
          const indent = keyMatch[1];
          const key = keyMatch[2];
          const rest = line.substring(keyMatch[0].length);
          
          // Định dạng màu sắc dựa trên kiểu dữ liệu của value
          let valueSpan = <span className="text-slate-700">{rest}</span>;
          if (rest.includes('"')) {
            // Chuỗi ký tự (Màu xanh lá nhẹ)
            valueSpan = <span className="text-emerald-600 font-medium">{rest}</span>;
          } else if (rest.includes('true') || rest.includes('false')) {
            // Boolean (Màu hồng đào)
            valueSpan = <span className="text-rose-500 font-semibold">{rest}</span>;
          } else if (rest.match(/\d+/)) {
            // Số (Màu chàm)
            valueSpan = <span className="text-indigo-500 font-semibold">{rest}</span>;
          } else if (rest.includes('null')) {
            // Null (Màu xám nhạt)
            valueSpan = <span className="text-slate-400 italic">{rest}</span>;
          }
          
          return (
            <div key={i} className="hover:bg-purple-50/60 px-1 rounded transition-colors">
              <span className="text-slate-350">{indent}</span>
              <span className="text-purple-600 font-semibold">"{key}"</span>
              <span className="text-slate-400">:</span>
              {valueSpan}
            </div>
          );
        }
        
        return (
          <div key={i} className="hover:bg-purple-50/60 px-1 rounded transition-colors text-slate-400">
            {line}
          </div>
        );
      })}
    </pre>
  );
}

// ============================================================================
// THÀNH PHẦN CHÍNH GIAO DIỆN
// ============================================================================

function App() {
  const [sessionInput, setSessionInput] = useState('');
  const [converterOutput, setConverterOutput] = useState('');
  const [converterError, setConverterError] = useState('');
  
  // Trạng thái lưu thông tin tài khoản đã phân tích từ session
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);

  // Danh sách các kết nối tài khoản đã lưu
  const [savedConnections, setSavedConnections] = useState<CodexConnection[]>(() => {
    try {
      const saved = localStorage.getItem('9router_saved_connections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Lưu trạng thái cấu hình của file backup khác ngoài providerConnections (như settings, apiKeys, proxyPools...)
  const [backupMetadata, setBackupMetadata] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('9router_backup_metadata');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Trạng thái hiển thị thông báo
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Hàm bổ trợ hiển thị thông báo
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  }, []);

  // Tự động tắt toast sau 4 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Hàm bổ trợ để lưu danh sách vào localStorage
  const saveConnectionsToStorage = useCallback((conns: CodexConnection[]) => {
    setSavedConnections(conns);
    try {
      localStorage.setItem('9router_saved_connections', JSON.stringify(conns));
    } catch (err) {
      console.error('Không thể lưu vào localStorage', err);
    }
  }, []);

  const handleConvert = useCallback(() => {
    setConverterError('');
    setConverterOutput('');
    setParsedProfile(null);

    if (!sessionInput.trim()) {
      setConverterError('Vui lòng nhập hoặc dán nội dung JSON session của ChatGPT vào ô bên dưới.');
      return;
    }

    try {
      const session: ChatGPTSession = JSON.parse(sessionInput);

      if (!session.accessToken) {
        setConverterError('Không tìm thấy mã khóa "accessToken" trong dữ liệu JSON. Vui lòng kiểm tra lại cấu trúc session.');
        return;
      }

      // Phân tích thông tin người dùng từ file session
      const name = session.user?.name || 'Người dùng ChatGPT';
      const email = session.user?.email || 'Không có email';
      const avatar = session.user?.picture || '';
      const plan = session.account?.planType || 'free';
      const expires = session.expires || '';

      setParsedProfile({ name, email, avatar, plan, expires });

      // Priority mặc định là 1
      const codexConnection = convertSessionToCodex(session, 1);
      setConverterOutput(JSON.stringify(codexConnection, null, 2));
      showToast('Đã phân tích session thành công!', 'success');
    } catch {
      setConverterError('Định dạng JSON không hợp lệ. Vui lòng kiểm tra và sửa lại các ký tự bị lỗi.');
    }
  }, [sessionInput, showToast]);

  // Lưu tài khoản vừa chuyển đổi vào danh sách
  const handleSaveToList = useCallback(() => {
    if (!converterOutput) return;

    try {
      const newConnection: CodexConnection = JSON.parse(converterOutput);
      
      const updatedConns = [...savedConnections];
      const index = updatedConns.findIndex(
        (c) => c.email === newConnection.email || c.name === newConnection.name
      );

      let isUpdate = false;
      if (index > -1) {
        // Cập nhật tài khoản cũ trùng tên/email, giữ nguyên ID cũ
        updatedConns[index] = {
          ...newConnection,
          id: updatedConns[index].id,
          priority: updatedConns[index].priority, // Giữ nguyên độ ưu tiên cũ
          isActive: updatedConns[index].isActive // Giữ nguyên trạng thái active cũ
        };
        isUpdate = true;
      } else {
        // Thêm mới
        updatedConns.push(newConnection);
      }

      saveConnectionsToStorage(updatedConns);
      
      // Reset converter và hiện thông báo
      setSessionInput('');
      setConverterOutput('');
      setParsedProfile(null);
      
      showToast(
        isUpdate 
          ? `Đã cập nhật token mới cho tài khoản "${newConnection.email}" thành công!` 
          : `Đã lưu tài khoản "${newConnection.email}" vào danh sách quản lý thành công!`,
        'success'
      );
    } catch {
      showToast('Không thể lưu tài khoản. Vui lòng kiểm tra lại cấu trúc dữ liệu.', 'error');
    }
  }, [converterOutput, savedConnections, saveConnectionsToStorage, showToast]);

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.providerConnections) {
          showToast('File backup không đúng định dạng của 9Router (Thiếu providerConnections).', 'error');
          return;
        }

        // Lưu metadata backup
        const metadata = {
          settings: parsed.settings || {},
          providerNodes: parsed.providerNodes || [],
          proxyPools: parsed.proxyPools || [],
          apiKeys: parsed.apiKeys || [],
          combos: parsed.combos || [],
          modelAliases: parsed.modelAliases || {},
          customModels: parsed.customModels || [],
          mitmAlias: parsed.mitmAlias || {},
          pricing: parsed.pricing || {},
        };
        
        setBackupMetadata(metadata);
        try {
          localStorage.setItem('9router_backup_metadata', JSON.stringify(metadata));
        } catch {}

        // Gộp các kết nối vào danh sách hiện tại
        const importedConns: CodexConnection[] = parsed.providerConnections || [];
        const updatedConns = [...savedConnections];

        let addedCount = 0;
        let updatedCount = 0;

        importedConns.forEach((newConn) => {
          const index = updatedConns.findIndex(
            (c) => c.email === newConn.email || c.name === newConn.name
          );
          if (index > -1) {
            updatedConns[index] = {
              ...updatedConns[index],
              ...newConn
            };
            updatedCount++;
          } else {
            updatedConns.push(newConn);
            addedCount++;
          }
        });

        saveConnectionsToStorage(updatedConns);
        showToast(
          `Đã nhập file backup: Gộp thêm ${addedCount} tài khoản mới & cập nhật ${updatedCount} tài khoản cũ!`, 
          'success'
        );
      } catch {
        showToast('File tải lên không phải định dạng JSON hợp lệ.', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset file input để có thể chọn lại cùng 1 file
    e.target.value = '';
  };

  const handleExportAll = useCallback(() => {
    if (savedConnections.length === 0) {
      showToast('Danh sách tài khoản trống. Vui lòng thêm tài khoản trước khi xuất file.', 'error');
      return;
    }

    try {
      const metadata = backupMetadata || {
        settings: {},
        providerNodes: [],
        proxyPools: [],
        apiKeys: [],
        combos: [],
        modelAliases: {},
        customModels: [],
        mitmAlias: {},
        pricing: {},
      };

      const finalBackup = {
        ...metadata,
        providerConnections: savedConnections,
      };

      const blob = new Blob([JSON.stringify(finalBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `9router_backup_gop_${savedConnections.length}tk_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`Đã xuất file sao lưu gồm ${savedConnections.length} tài khoản thành công!`, 'success');
    } catch {
      showToast('Không thể tạo file sao lưu.', 'error');
    }
  }, [savedConnections, backupMetadata, showToast]);

  const handleUpdatePriority = useCallback((id: string, priority: number) => {
    const updated = savedConnections.map(conn => 
      conn.id === id ? { ...conn, priority, updatedAt: new Date().toISOString() } : conn
    );
    saveConnectionsToStorage(updated);
    showToast('Đã cập nhật độ ưu tiên thành công!', 'success');
  }, [savedConnections, saveConnectionsToStorage, showToast]);

  const handleToggleActive = useCallback((id: string) => {
    const updated = savedConnections.map(conn => 
      conn.id === id ? { ...conn, isActive: !conn.isActive, updatedAt: new Date().toISOString() } : conn
    );
    saveConnectionsToStorage(updated);
    showToast('Đã cập nhật trạng thái hoạt động!', 'success');
  }, [savedConnections, saveConnectionsToStorage, showToast]);

  const handleDeleteConnection = useCallback((id: string, email: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${email}" khỏi danh sách quản lý?`)) {
      const updated = savedConnections.filter(conn => conn.id !== id);
      saveConnectionsToStorage(updated);
      showToast(`Đã xóa tài khoản "${email}" khỏi thư viện.`, 'info');
    }
  }, [savedConnections, saveConnectionsToStorage, showToast]);

  const handleClearAll = useCallback(() => {
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa SẠCH toàn bộ danh sách tài khoản đang quản lý? Hành động này sẽ xóa dữ liệu trên trình duyệt của bạn.')) {
      saveConnectionsToStorage([]);
      setBackupMetadata(null);
      try {
        localStorage.removeItem('9router_backup_metadata');
      } catch {}
      showToast('Đã xóa sạch thư viện tài khoản.', 'info');
    }
  }, [saveConnectionsToStorage, showToast]);

  const handleDownloadSingle = useCallback(() => {
    if (!converterOutput) return;
    try {
      const connection = JSON.parse(converterOutput);
      const finalBackup = {
        settings: {},
        providerConnections: [connection],
        providerNodes: [],
        proxyPools: [],
        apiKeys: [],
        combos: [],
        modelAliases: {},
        customModels: [],
        mitmAlias: {},
        pricing: {},
      };
      const blob = new Blob([JSON.stringify(finalBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `9router_backup_don_${connection.email || 'account'}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã tải file sao lưu riêng lẻ thành công!', 'success');
    } catch {
      showToast('Không thể tải file sao lưu.', 'error');
    }
  }, [converterOutput, showToast]);

  const handleClearConverter = () => {
    setSessionInput('');
    setConverterOutput('');
    setConverterError('');
    setParsedProfile(null);
  };

  const handleEditSession = () => {
    setParsedProfile(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-outfit relative">
      
      {/* Toast thông báo nổi bật */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg animate-slide-in-right ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-500/5' 
            : toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-100 text-rose-800 shadow-rose-500/5'
            : 'bg-purple-50 border-purple-100 text-purple-800 shadow-purple-500/5'
        }`}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-650 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-purple-650 shrink-0" />}
          <span className="text-[11px] font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Nền Gradient Tím Nhạt Phía Trên */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.06),transparent_60%)] pointer-events-none" />

      {/* Vùng Nội Dung Chính */}
      <div className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col justify-center space-y-8 animate-fade-in">
        
        {/* Phần Tiêu Đề */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center shadow-md shadow-purple-500/5">
              <Zap className="w-5 h-5 text-purple-600 text-glow-purple" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-outfit">
              Bộ Chuyển Đổi Session 9Router
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-lg mx-auto font-light leading-relaxed">
            Chuyển đổi ChatGPT Auth Session sang định dạng cấu hình Codex Connection tương thích hoàn toàn với 9Router.
          </p>
        </div>

        {/* Bố Cục Hai Bảng Cân Đối Đối Xứng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Bảng Bên Trái: Nhập Liệu / Hồ sơ người dùng */}
          <div className="bg-white border border-purple-100/80 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-purple-200/60 hover:shadow-md transition-all duration-300">
            {/* Header Bảng Nhập */}
            <div className="bg-purple-50/30 border-b border-purple-100/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[49px]">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider whitespace-nowrap">
                  {parsedProfile ? 'Hồ Sơ ChatGPT Đã Phân Tích' : 'JSON Session ChatGPT (Đầu Vào)'}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                {parsedProfile ? (
                  <button
                    onClick={handleEditSession}
                    className="text-[10px] text-purple-700 hover:text-purple-850 flex items-center gap-1 font-bold bg-purple-100/50 border border-purple-200/50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition-all shadow-sm"
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <a
                    href="https://chatgpt.com/api/auth/session"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-700 hover:text-purple-850 flex items-center gap-1 font-bold bg-purple-100/50 border border-purple-200/50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition-all shadow-sm"
                    title="Nhấp để tới trang API Auth Session của ChatGPT lấy mã JSON"
                  >
                    <Key className="w-3.5 h-3.5 shrink-0" />
                    Lấy ChatGPT Session
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
                  </a>
                )}
                <button
                  onClick={handleClearConverter}
                  className="text-[10px] text-slate-400 hover:text-purple-600 flex items-center gap-1.5 transition-colors font-bold"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  Xóa
                </button>
              </div>
            </div>
            
            {/* Nội dung bên trái: Hiện Textarea HOẶC Card Profile cực kỳ đẹp */}
            {parsedProfile ? (
              <div className="p-6 flex-grow flex flex-col justify-center items-center space-y-6 bg-gradient-to-b from-purple-50/20 to-white animate-fade-in">
                
                {/* Ảnh đại diện người dùng */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  {parsedProfile.avatar ? (
                    <img 
                      src={parsedProfile.avatar} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full border-2 border-purple-200 relative z-10 object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-purple-200 bg-purple-50 flex items-center justify-center relative z-10">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                </div>

                {/* Tên & Email */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-extrabold text-purple-950">{parsedProfile.name}</h3>
                  <p className="text-xs text-slate-500 font-light">{parsedProfile.email}</p>
                </div>

                {/* Phân loại tài khoản (Huy hiệu lấp lánh) */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider ${
                    parsedProfile.plan.toLowerCase() === 'plus' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/10' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    Gói ChatGPT {parsedProfile.plan.toUpperCase()}
                  </span>
                </div>

                {/* Thời gian hết hạn */}
                <div className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hết hạn Session (Dự kiến)</p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      {formatVietnameseDate(parsedProfile.expires)}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <textarea
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder='Dán JSON Auth Session của bạn tại đây... (Ví dụ: { "accessToken": "eyJhbG...", "sessionToken": "sess-..." })'
                className="w-full flex-grow min-h-[400px] border-0 focus:ring-0 focus:outline-none p-4.5 text-xs font-mono text-slate-700 placeholder-slate-400 resize-none leading-relaxed bg-white"
                spellCheck={false}
              />
            )}
          </div>

          {/* Bảng Bên Phải: Kết Quả */}
          <div className="bg-white border border-purple-100/80 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-purple-200/60 hover:shadow-md transition-all duration-300">
            {/* Header Bảng Xuất */}
            <div className="bg-purple-50/30 border-b border-purple-100/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[49px]">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider whitespace-nowrap">
                  JSON Kết Nối 9Router (Đầu Ra)
                </span>
              </div>

              {converterOutput && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto animate-fade-in">
                  <button
                    onClick={handleSaveToList}
                    className="text-[10px] text-emerald-750 hover:text-emerald-950 flex items-center gap-1.5 transition-colors border border-emerald-250/60 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl shadow-sm font-bold animate-fade-in"
                    title="Lưu tài khoản này vào thư viện để quản lý lâu dài"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Lưu Vào Danh Sách
                  </button>
                  <button
                    onClick={handleDownloadSingle}
                    className="text-[10px] text-purple-750 hover:text-purple-950 flex items-center gap-1.5 transition-colors border border-purple-200/60 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-xl shadow-sm font-bold animate-fade-in"
                    title="Tải riêng file sao lưu chỉ cho tài khoản này"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Tải File Riêng Lẻ
                  </button>
                </div>
              )}
            </div>

            {/* Khung Hiển Thị Kết Quả */}
            <div className="w-full flex-grow min-h-[400px] max-h-[400px] p-4.5 overflow-auto bg-white flex flex-col justify-start">
              {converterError ? (
                <div className="flex items-start gap-2.5 text-rose-750 bg-rose-500/5 border border-rose-100 rounded-xl p-4 animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm font-light leading-relaxed">{converterError}</span>
                </div>
              ) : converterOutput ? (
                <div className="animate-fade-in">
                  {/* Render JSON tô màu cú pháp chuyên nghiệp */}
                  <HighlightedJson json={converterOutput} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-slate-400 text-center space-y-2">
                  <FileJson className="w-9 h-9 text-slate-355 stroke-[1.5]" />
                  <p className="text-xs italic font-light max-w-xs px-4 leading-relaxed">
                    Cấu trúc cấu hình 9Router được tạo mới sẽ tự động hiển thị tại đây sau khi bạn nhấn nút "Bắt đầu chuyển đổi".
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Nút Kích Hoạt Chuyển Đổi */}
        <div className="flex justify-center pt-2 animate-fade-in">
          <button
            onClick={handleConvert}
            className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-12 py-3.5 rounded-2xl transition-all duration-200 shadow-md shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:scale-95 text-sm"
          >
            <span>Bắt đầu chuyển đổi</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* ============================================================================ */}
        {/* KHU VỰC QUẢN LÝ THƯ VIỆN TÀI KHOẢN (LOCAL STORAGE MANAGER) */}
        {/* ============================================================================ */}
        <div className="bg-white border border-purple-100 rounded-2xl shadow-sm hover:border-purple-200/60 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col animate-fade-in">
          {/* Header Thư Viện */}
          <div className="bg-purple-50/20 border-b border-purple-100/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center shadow-inner">
                <List className="w-4.5 h-4.5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-purple-950 uppercase tracking-wider">
                  Thư Viện Tài Khoản Đang Quản Lý ({savedConnections.length})
                </h2>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  Đồng bộ an toàn trên bộ nhớ trình duyệt. Hỗ trợ chỉnh sửa và gộp tự động.
                </p>
              </div>
            </div>

            {/* Các hành động chính */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Nút Nhập Backup Cũ */}
              <input
                type="file"
                accept=".json"
                onChange={handleBackupUpload}
                className="hidden"
                id="library-backup-upload"
              />
              <label 
                htmlFor="library-backup-upload" 
                className="text-[10px] text-purple-750 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 px-3.5 py-2 rounded-xl transition-all shadow-sm font-bold cursor-pointer flex items-center gap-1.5"
                title="Tải lên file backup cũ của bạn để gộp thêm các tài khoản vào danh sách quản lý hiện tại"
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-650" />
                Nhập File Backup Cũ
              </label>

              {/* Nút Xuất File Backup Hợp Nhất */}
              {savedConnections.length > 0 && (
                <>
                  <button
                    onClick={handleExportAll}
                    className="text-[10px] text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none px-3.5 py-2 rounded-xl transition-all shadow-md shadow-purple-500/10 font-bold flex items-center gap-1.5"
                    title="Xuất một file sao lưu 9Router duy nhất chứa toàn bộ các tài khoản trong danh sách"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Xuất File Sao Lưu Toàn Bộ ({savedConnections.length} TK)
                  </button>

                  {/* Nút Xóa Sạch */}
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 px-3.5 py-2 rounded-xl transition-all shadow-sm font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-550" />
                    Xóa Sạch Thư Viện
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nội Dung Thư Viện */}
          <div className="p-6 bg-slate-50/30">
            {savedConnections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-purple-400 stroke-[1.2]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500">Thư viện của bạn đang trống</p>
                  <p className="text-[10px] text-slate-400 font-light max-w-sm leading-relaxed">
                    Hãy dán session ChatGPT ở trên và nhấn <strong className="text-purple-600">"Lưu Vào Danh Sách"</strong>, hoặc click <strong className="text-purple-650">"Nhập File Backup Cũ"</strong> để tải lên toàn bộ tài khoản cũ đã có.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedConnections.map((conn) => (
                  <div 
                    key={conn.id} 
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md transition-all duration-300 relative group ${
                      conn.isActive 
                        ? 'border-purple-100 hover:border-purple-200/60' 
                        : 'border-slate-200 bg-slate-100/20 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Hộp điều khiển xóa ở góc */}
                    <button
                      onClick={() => handleDeleteConnection(conn.id, conn.email)}
                      className="absolute top-3 right-3 text-slate-350 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa tài khoản này khỏi danh sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Dữ liệu tài khoản */}
                    <div className="flex items-start gap-2.5 pr-6">
                      <div className="w-8.5 h-8.5 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 shadow-inner">
                        <User className="w-4.5 h-4.5 text-purple-500" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <h3 className="text-xs font-extrabold text-purple-950 truncate" title={conn.email}>
                          {conn.email}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate select-all">
                          ID: {conn.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Phân loại gói */}
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                        conn.providerSpecificData?.chatgptPlanType?.toLowerCase() === 'plus'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200/40'
                          : 'bg-slate-100 text-slate-650 border border-slate-200'
                      }`}>
                        ChatGPT {conn.providerSpecificData?.chatgptPlanType?.toUpperCase() || 'FREE'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                        conn.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-250/30'
                          : 'bg-rose-50 text-rose-700 border border-rose-250/30'
                      }`}>
                        {conn.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>

                    {/* Dòng điều khiển: Độ ưu tiên & Kích hoạt */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      {/* Trình chọn độ ưu tiên */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 font-bold">Ưu tiên:</span>
                        <select
                          value={conn.priority || 1}
                          onChange={(e) => handleUpdatePriority(conn.id, parseInt(e.target.value))}
                          className="text-[10px] font-bold text-slate-650 border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white focus:outline-none focus:border-purple-300"
                        >
                          <option value={1}>1 (Mặc định)</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5 (Cao nhất)</option>
                        </select>
                      </div>

                      {/* Nút bật/tắt hoạt động */}
                      <button
                        onClick={() => handleToggleActive(conn.id)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          conn.isActive
                            ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 hover:text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-205'
                        }`}
                      >
                        {conn.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bảng Hướng Dẫn Từng Bước */}
        <div className="bg-purple-50/40 border border-purple-100/60 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
          <h4 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            Hướng dẫn lấy Session & quản lý gộp nhiều tài khoản 9Router:
          </h4>
          <ol className="text-xs text-slate-650 space-y-3.5 list-decimal list-inside font-light leading-relaxed font-outfit">
            <li>
              Đăng nhập tài khoản ChatGPT của bạn trên trình duyệt, sau đó nhấn nút 
              <strong className="text-purple-750 ml-1">"Lấy ChatGPT Session"</strong> ở phía trên để mở nhanh trang session của OpenAI.
            </li>
            <li>Sao chép toàn bộ nội dung JSON hiển thị tại trang đó và dán vào ô bên trái **"JSON Session ChatGPT"**.</li>
            <li>
              Nhấn nút **"Bắt đầu chuyển đổi"** ở bên dưới.
            </li>
            <li>
              Nhấn nút **"Lưu Vào Danh Sách"** vừa xuất hiện ở góc trên khung kết quả để lưu tài khoản vào Thư viện. Bạn có thể lặp lại các bước trên nhiều lần để thêm nhiều tài khoản khác nhau!
            </li>
            <li>
              <span className="text-purple-750 font-bold">*(Tùy chọn)*</span> Nếu muốn gộp nhanh các tài khoản cũ đã có trên 9Router, hãy nhấn **"Nhập File Backup Cũ"** ở khu vực Thư viện phía dưới và tải lên file backup cũ của bạn.
            </li>
            <li>
              Tại Thư viện, bạn có thể chỉnh sửa nhanh **Độ ưu tiên (Priority)**, tạm dừng/kích hoạt hoặc xóa tài khoản.
            </li>
            <li>
              Cuối cùng, nhấn **"Xuất File Sao Lưu Toàn Bộ"** ở khu vực Thư viện để tải về một file sao lưu JSON duy nhất chứa toàn bộ các tài khoản đang quản lý.
            </li>
            <li>Truy cập vào trang quản trị 9Router của bạn, click chọn nút **"Nhập bản sao lưu"** và tải lên file vừa tải về là hoàn tất!</li>
          </ol>
        </div>

      </div>

      {/* Phần Chân Trang */}
      <footer className="border-t border-slate-200/50 py-6 bg-slate-50 text-center relative z-10 mt-auto">
        <p className="text-[10px] sm:text-xs text-slate-455 font-light flex items-center justify-center">
          Dữ liệu được bảo mật và lưu trữ 100% cục bộ trên trình duyệt của bạn (Client-side).
        </p>
      </footer>

    </div>
  );
}

export default App;
