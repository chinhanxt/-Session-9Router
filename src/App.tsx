import React, { useState, useCallback, useEffect } from 'react';
import { 
  ArrowRight, AlertCircle, RefreshCw, FileJson, Zap, Download, 
  Plus, Check, Info, Cpu, ClipboardCheck
} from 'lucide-react';

// Import Types
import { ChatGPTSession, CodexConnection, ParsedProfile, ProviderType } from './types/connection';

// Import Helpers
import { convertSessionToCodex, generateUUID } from './utils/helpers';

// Import Components
import { HighlightedJson } from './components/HighlightedJson';
import { ProfileCard } from './components/ProfileCard';
import { LibraryManager } from './components/LibraryManager';
import { Instructions } from './components/Instructions';

function App() {
  const [providerMode, setProviderMode] = useState<ProviderType>('codex');
  const [sessionInput, setSessionInput] = useState('');
  const [converterOutput, setConverterOutput] = useState('');
  const [converterError, setConverterError] = useState('');
  
  // Trạng thái lưu thông tin tài khoản đã phân tích từ session
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);

  // Danh sách các kết nối tài khoản đã lưu
  const [savedConnections, setSavedConnections] = useState<CodexConnection[]>(() => {
    try {
      const saved = localStorage.getItem('9router_saved_connections');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(c => c && typeof c === 'object' && c.id) : [];
    } catch {
      return [];
    }
  });

  // Lưu trạng thái cấu hình của file backup khác ngoài providerConnections
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

  // Lưu danh sách vào localStorage
  const saveConnectionsToStorage = useCallback((conns: CodexConnection[]) => {
    const validConns = conns.filter(c => c && typeof c === 'object' && c.id);
    setSavedConnections(validConns);
    try {
      localStorage.setItem('9router_saved_connections', JSON.stringify(validConns));
    } catch (err) {
      console.error('Không thể lưu vào localStorage', err);
    }
  }, []);

  const runClaudeConversion = useCallback((text: string) => {
    const skMatch = text.match(/sk-ant-[A-Za-z0-9_-]+/i);
    const sessionKey = skMatch ? skMatch[0] : text.trim();

    const now = new Date();
    const expiresIn = 31536000; // 1 năm
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    const subKey = sessionKey.length > 25 ? sessionKey.substring(13, 21) : 'session';
    const email = `claude-${subKey}@claude.ai`;

    setParsedProfile({
      name: `Tài khoản Claude Web (${sessionKey.substring(0, 16)}...)`,
      email: email,
      avatar: '',
      plan: 'Claude Web',
      expires: expiresAt.toISOString(),
    });

    const claudeConnection: CodexConnection = {
      accessToken: sessionKey,
      refreshToken: '',
      expiresAt: expiresAt.toISOString(),
      testStatus: 'active',
      expiresIn,
      providerSpecificData: {
        sessionKey: sessionKey,
        orgId: '',
      },
      id: generateUUID(),
      provider: 'claude',
      authType: 'session_key',
      name: email,
      email: email,
      priority: 1,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setConverterOutput(JSON.stringify(claudeConnection, null, 2));
    setConverterError('');
    showToast('⚡ Đã dán & chuyển đổi Claude Session thành công!', 'success');
  }, [showToast]);

  const runChatGPTConversion = useCallback((inputJsonStr: string) => {
    try {
      const session: ChatGPTSession = JSON.parse(inputJsonStr);

      if (!session.accessToken) {
        setConverterError('Không tìm thấy mã khóa "accessToken" trong dữ liệu JSON ChatGPT.');
        return;
      }

      const name = session.user?.name || session.user?.email || 'Người dùng ChatGPT';
      const email = session.user?.email || 'chatgpt-user@openai.com';
      const avatar = session.user?.picture || '';
      const plan = session.account?.planType || 'plus';
      const expires = session.expires || '';

      setParsedProfile({ name, email, avatar, plan, expires });

      const codexConnection = convertSessionToCodex(session, 1);
      setConverterOutput(JSON.stringify(codexConnection, null, 2));
      setConverterError('');
      showToast('⚡ Đã dán & chuyển đổi ChatGPT Session thành công!', 'success');
    } catch {
      setConverterError('Định dạng JSON ChatGPT không hợp lệ. Vui lòng dán cấu trúc JSON Auth Session từ ChatGPT.');
    }
  }, [showToast]);

  const handleConvert = useCallback(() => {
    setConverterError('');
    setConverterOutput('');
    setParsedProfile(null);

    const input = sessionInput.trim();
    if (!input) {
      setConverterError(
        providerMode === 'claude'
          ? 'Vui lòng dán mã sessionKey (sk-ant-sid...) của Claude vào ô bên dưới.'
          : 'Vui lòng dán nội dung JSON Auth Session của ChatGPT vào ô bên dưới.'
      );
      return;
    }

    if (providerMode === 'claude') {
      runClaudeConversion(input);
    } else {
      runChatGPTConversion(input);
    }
  }, [sessionInput, providerMode, runClaudeConversion, runChatGPTConversion]);

  // Nút 1-Click Clipboard Theo Tab (Chuẩn hóa 100% providerMode)
  const handleOneClickPasteAndConvert = useCallback(async () => {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {}

    if (providerMode === 'claude') {
      // TAB CLAUDE: Luôn xử lý mẫu/mã Claude
      if (!text || !text.trim() || !text.includes('sk-ant-')) {
        text = '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';
      }
      setSessionInput(text);
      runClaudeConversion(text);
    } else {
      // TAB CHATGPT: Luôn xử lý mẫu/mã ChatGPT
      let isValidChatGPTJson = false;
      if (text && text.trim()) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.accessToken) {
            isValidChatGPTJson = true;
          }
        } catch {}
      }

      if (!isValidChatGPTJson) {
        // Mẫu ChatGPT Session chuẩn nếu clipboard trống hoặc không phải JSON ChatGPT
        const sampleChatGPTSession = {
          user: {
            id: "user-chatgpt-1click",
            name: "Tài khoản ChatGPT Plus",
            email: "chatgpt-user@openai.com",
            picture: ""
          },
          expires: "2026-08-07T15:45:00.000Z",
          accessToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6Im9wZW5haS1zZXNzaW9uLWtleSJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJjaGF0Z3B0LXVzZXJAb3BlbmFpLmNvbSIsIm5hbWUiOiJDaGF0R1BUIFVzZXIifSwiaWF0IjoxNzIzMDAwMDAwLCJleHAiOjE3MjMwODY0MDB9.sample_token_1click",
          account: {
            id: "acc-chatgpt-plus",
            planType: "plus"
          }
        };
        text = JSON.stringify(sampleChatGPTSession, null, 2);
      }

      setSessionInput(text);
      runChatGPTConversion(text);
    }
  }, [providerMode, runClaudeConversion, runChatGPTConversion]);

  const handleClearConverter = () => {
    setSessionInput('');
    setConverterOutput('');
    setConverterError('');
    setParsedProfile(null);
  };

  const handleEditSession = () => {
    setParsedProfile(null);
  };

  // Lưu tài khoản vừa chuyển đổi vào danh sách
  const handleSaveToList = useCallback(() => {
    if (!converterOutput) return;

    try {
      const newConnection: CodexConnection = JSON.parse(converterOutput);
      
      const updatedConns = [...savedConnections];
      const index = updatedConns.findIndex(
        (c) => (c.email && c.email === newConnection.email) || (c.name && c.name === newConnection.name)
      );

      let isUpdate = false;
      if (index > -1) {
        updatedConns[index] = {
          ...newConnection,
          id: updatedConns[index].id,
          priority: updatedConns[index].priority,
          isActive: updatedConns[index].isActive
        };
        isUpdate = true;
      } else {
        updatedConns.push(newConnection);
      }

      saveConnectionsToStorage(updatedConns);
      
      setSessionInput('');
      setConverterOutput('');
      setParsedProfile(null);
      
      const providerLabel = newConnection.provider === 'claude' ? 'Claude Web' : 'ChatGPT';
      showToast(
        isUpdate 
          ? `Đã cập nhật token mới cho tài khoản ${providerLabel} "${newConnection.email || newConnection.name}"!` 
          : `Đã lưu tài khoản ${providerLabel} "${newConnection.email || newConnection.name}" vào danh sách quản lý!`,
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

        const importedConns: CodexConnection[] = parsed.providerConnections || [];
        const updatedConns = [...savedConnections];

        let addedCount = 0;
        let updatedCount = 0;

        importedConns.forEach((newConn) => {
          const index = updatedConns.findIndex(
            (c) => (c.email && c.email === newConn.email) || (c.name && c.name === newConn.name)
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

      {/* Nền Gradient Nổi Bật Phía Trên */}
      <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
        providerMode === 'claude'
          ? 'bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.08),transparent_60%)]'
          : 'bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.06),transparent_60%)]'
      }`} />

      {/* Vùng Nội Dung Chính */}
      <div className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col justify-center space-y-8 animate-fade-in">
        
        {/* Phần Tiêu Đề & 2 Tabs Chính */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 justify-center">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-md transition-colors ${
              providerMode === 'claude' 
                ? 'bg-amber-100 border-amber-200 shadow-amber-500/10' 
                : 'bg-purple-100 border-purple-200 shadow-purple-500/5'
            }`}>
              {providerMode === 'claude' ? (
                <Cpu className="w-5 h-5 text-amber-600" />
              ) : (
                <Zap className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
              Bộ Chuyển Đổi Session 9Router
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-xl mx-auto font-light leading-relaxed">
            Chuyển đổi <strong className="text-purple-650 font-semibold">ChatGPT Auth Session</strong> & <strong className="text-amber-700 font-semibold">Claude Web Session Key</strong> sang định dạng 9Router tương thích hoàn toàn.
          </p>

          {/* 2 TABS CHÍNH: CHATGPT HOẶC CLAUDE */}
          <div className="inline-flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mt-3">
            <button
              onClick={() => {
                setProviderMode('codex');
                handleClearConverter();
              }}
              className={`text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                providerMode === 'codex'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-750 hover:bg-purple-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              🤖 ChatGPT Session
            </button>

            <button
              onClick={() => {
                setProviderMode('claude');
                handleClearConverter();
              }}
              className={`text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                providerMode === 'claude'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              🧠 Claude Web Session
            </button>
          </div>
        </div>

        {/* Nút 1-Click Clipboard Theo Tab */}
        <div className="flex justify-center">
          <button
            onClick={handleOneClickPasteAndConvert}
            className={`group text-xs font-extrabold text-white px-8 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              providerMode === 'claude'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600'
            }`}
            title={`Nhấn nút này để dán mã ${providerMode === 'claude' ? 'Claude sessionKey' : 'ChatGPT Session'} và xuất ngay JSON 9Router bên màn hình phải!`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📋 Dán từ Clipboard & Chuyển Đổi {providerMode === 'claude' ? 'Claude' : 'ChatGPT'} (1-Click)</span>
          </button>
        </div>

        {/* Bố Cục Hai Bảng Cân Đối Đối Xứng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Bảng Bên Trái: Nhập Liệu / Hồ sơ người dùng */}
          <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 ${
            providerMode === 'claude' ? 'border-amber-200/80 hover:border-amber-300' : 'border-purple-100/80 hover:border-purple-200/60'
          }`}>
            {/* Header Bảng Nhập */}
            <div className={`border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[49px] ${
              providerMode === 'claude' ? 'bg-amber-50/40 border-amber-100/60' : 'bg-purple-50/30 border-purple-100/50'
            }`}>
              <div className="flex items-center gap-2">
                <FileJson className={`w-4 h-4 shrink-0 ${providerMode === 'claude' ? 'text-amber-600' : 'text-purple-600'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  providerMode === 'claude' ? 'text-amber-950' : 'text-purple-950'
                }`}>
                  {parsedProfile 
                    ? `Hồ Sơ ${parsedProfile.provider === 'claude' ? 'Claude' : 'ChatGPT'} Đã Phân Tích` 
                    : providerMode === 'claude'
                    ? 'Session Key Claude Web (Đầu Vào)'
                    : 'JSON Session ChatGPT (Đầu Vào)'
                  }
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                {parsedProfile && (
                  <button
                    onClick={handleEditSession}
                    className="text-[10px] text-purple-700 hover:text-purple-850 flex items-center gap-1 font-bold bg-purple-100/50 border border-purple-200/50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition-all shadow-sm"
                  >
                    Chỉnh sửa
                  </button>
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
                placeholder={
                  providerMode === 'claude'
                    ? 'Dán mã sessionKey (sk-ant-sid01-..., sk-ant-sid02-...) của Claude tại đây...'
                    : 'Dán JSON Auth Session của ChatGPT tại đây...'
                }
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
            className={`group flex items-center gap-2 text-white font-semibold px-12 py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-sm ${
              providerMode === 'claude'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'
            }`}
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
