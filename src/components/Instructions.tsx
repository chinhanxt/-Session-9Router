
import { Settings } from 'lucide-react';

export function Instructions() {
  return (
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
  );
}
