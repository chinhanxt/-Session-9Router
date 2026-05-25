# 🚀 Trình Quản Lý & Chuyển Đổi Session 9Router

<div align="center">

[![Vite](https://img.shields.io/badge/Vite-5.4.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-purple?style=for-the-badge&logo=git&logoColor=white)](#)

**Bộ công cụ chuyển đổi nhanh ChatGPT Auth Session sang Codex Connection và tự động gộp/quản lý danh sách tài khoản 9Router an toàn, không lo ghi đè mất dữ liệu.**

</div>

---

## ✨ Điểm Nổi Bật 

* **🔄 Chuyển đổi siêu tốc:** Định dạng dữ liệu ChatGPT Session sang Codex Connection chỉ với 1 click.
* **💾 Thư viện LocalStorage:** Tự động lưu giữ danh sách tài khoản ngay trên trình duyệt, không mất khi reload trang (F5).
* **➕ Gộp Backup thông minh:** Nạp file backup cũ để tự động gộp thêm tài khoản mới vào danh sách, khắc phục hoàn toàn lỗi ghi đè của 9Router.
* **⚡ Nút Lấy Session nhanh:** Mở nhanh đường dẫn API OpenAI để lấy mã JSON session tức thì.
* **🎨 Giao diện Trắng - Tím Premium:** Thiết kế HSL trực quan, bo góc mềm mại, hiển thị hồ sơ avatar và tô màu cú pháp JSON chuyên nghiệp.
* **🔒 Bảo mật tuyệt đối:** Xử lý 100% Client-side cục bộ trong trình duyệt, không gửi dữ liệu đi bất kỳ đâu.

---

## 🎯 Hướng Dẫn Sử Dụng Nhanh

> [!IMPORTANT]
> **BƯỚC 1: LẤY SESSION**
> * Đăng nhập ChatGPT trên trình duyệt.
> * Bấm nút **"Lấy ChatGPT Session"** ở góc trái khung nhập liệu để mở nhanh trang API OpenAI.
> * Sao chép toàn bộ nội dung JSON hiển thị tại đó.

> [!TIP]
> **BƯỚC 2: CHUYỂN ĐỔI & LƯU TRỮ**
> * Dán JSON vào ô **"JSON Session ChatGPT"** và nhấn **"Bắt đầu chuyển đổi"**.
> * Bấm nút **"Lưu Vào Danh Sách"** (Màu xanh lá) để thêm tài khoản vào Thư viện quản lý phía dưới.

> [!WARNING]
> **BƯỚC 3: GỘP TÀI KHOẢN CŨ & XUẤT FILE**
> * Tại khu vực Thư viện, bấm **"Nhập File Backup Cũ"** và chọn file backup sẵn có của bạn để tự động gộp chung danh sách.
> * Điều chỉnh **Độ ưu tiên (Priority)** hoặc trạng thái tài khoản trực quan nếu cần.
> * Bấm **"Xuất File Sao Lưu Toàn Bộ"** để tải về file cấu hình `.json` duy nhất chứa đầy đủ tất cả tài khoản.
> * Nạp file này vào trang quản trị 9Router của bạn một lần duy nhất là hoàn tất!

---

## 🛠️ Cài Đặt Cục Bộ

Yêu cầu máy tính đã cài đặt [Node.js](https://nodejs.org/).

```bash
# 1. Tải mã nguồn
git clone https://github.com/chinhanxt/-Session-9Router.git
cd -Session-9Router

# 2. Cài đặt thư viện
npm install

# 3. Chạy môi trường phát triển (Mở http://localhost:5173/)
npm run dev

# 4. Biên dịch Production
npm run build
```

---

## 🔒 Giấy Phép & Bảo Mật

* **An toàn 100%:** Dữ liệu hoàn toàn chạy offline trên trình duyệt của bạn.
* **Mã nguồn mở:** Được cấp phép theo chuẩn [MIT License](LICENSE).
