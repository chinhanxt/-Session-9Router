import React from 'react';
import { 
  List, FolderOpen, FileDown, Trash2, ShieldAlert, User 
} from 'lucide-react';
import { CodexConnection } from '../types/connection';

interface LibraryManagerProps {
  savedConnections: CodexConnection[];
  handleBackupUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportAll: () => void;
  handleClearAll: () => void;
  handleUpdatePriority: (id: string, priority: number) => void;
  handleToggleActive: (id: string) => void;
  handleDeleteConnection: (id: string, email: string) => void;
}

export function LibraryManager({
  savedConnections,
  handleBackupUpload,
  handleExportAll,
  handleClearAll,
  handleUpdatePriority,
  handleToggleActive,
  handleDeleteConnection
}: LibraryManagerProps) {
  return (
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
            <FolderOpen className="w-3.5 h-3.5 text-purple-655" />
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
                Hãy dán session ChatGPT ở trên và nhấn <strong className="text-purple-600">"Lưu Vào Danh Sách"</strong>, hoặc click <strong className="text-purple-655">"Nhập File Backup Cũ"</strong> để tải lên toàn bộ tài khoản cũ đã có.
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
  );
}
