import React, { useState, useCallback, useEffect } from 'react';
import { 
  ArrowRight, AlertCircle, RefreshCw, FileJson, Zap, Download, 
  ExternalLink, Key, Plus, Check, Info
} from 'lucide-react';

// Import Types
import { ChatGPTSession, CodexConnection, ParsedProfile } from './types/connection';

// Import Helpers
import { convertSessionToCodex } from './utils/helpers';

// Import Components
import { HighlightedJson } from './components/HighlightedJson';
import { ProfileCard } from './components/ProfileCard';
import { LibraryManager } from './components/LibraryManager';
import { Instructions } from './components/Instructions';

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
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-purple-655 shrink-0" />}
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
            
            {/* Nội dung bên trái: Hiện Textarea HOẶC Card Profile */}
            {parsedProfile ? (
              <ProfileCard parsedProfile={parsedProfile} />
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

        {/* KHU VỰC QUẢN LÝ THƯ VIỆN TÀI KHOẢN */}
        <LibraryManager 
          savedConnections={savedConnections}
          handleBackupUpload={handleBackupUpload}
          handleExportAll={handleExportAll}
          handleClearAll={handleClearAll}
          handleUpdatePriority={handleUpdatePriority}
          handleToggleActive={handleToggleActive}
          handleDeleteConnection={handleDeleteConnection}
        />

        {/* BẢNG HƯỚNG DẪN TỪNG BƯỚC */}
        <Instructions />

      </div>

      {/* Phần Chân Trang */}
      <footer className="border-t border-slate-200/50 py-6 bg-slate-50 text-center relative z-10 mt-auto flex flex-col items-center justify-center gap-1.5">
        <p className="text-[10px] sm:text-xs text-slate-455 font-light">
          Dữ liệu được bảo mật và lưu trữ 100% cục bộ trên trình duyệt của bạn (Client-side).
        </p>
        <p className="text-[10px] sm:text-xs text-slate-400 font-light flex items-center gap-1 justify-center">
          <span>Phát triển bởi</span>
          <a 
            href="https://github.com/chinhanxt" 
            target="_blank" 
            rel="noreferrer" 
            className="text-purple-650 hover:text-purple-800 font-bold flex items-center gap-0.5 transition-colors"
          >
            chinhanxt <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </footer>

    </div>
  );
}

export default App;
