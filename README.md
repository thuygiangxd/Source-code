# Hệ Thống Kết Nối Gia Sư Trực Tuyến (Online Tutor Matching System)

Dự án này là một nền tảng website toàn diện nhằm hiện đại hóa quy trình dạy và học cá nhân hóa tại Việt Nam].
Hệ thống giúp tự động hóa việc kết nối giữa học viên và gia sư, mang lại trải nghiệm học tập minh bạch, hiệu quả và có thể theo dõi được tiến độ.

## Công Nghệ Sử Dụng
Dự án được xây dựng dựa trên kiến trúc **Microservices** để đảm bảo tính linh hoạt, dễ mở rộng và bảo trì.

* **Frontend:** React (JSX) kết hợp CSS (Responsive Design) giúp tối ưu trải nghiệm trên mọi thiết bị.
* **Backend:** Python kết hợp **FastAPI** cung cấp các API REST hiệu suất cao.
* **Cơ sở dữ liệu:** **Supabase (PostgreSQL)** hỗ trợ lưu trữ dữ liệu quan hệ và truy vấn thời gian thực.
* **Triển khai:** **Docker** giúp đảm bảo tính nhất quán và ổn định giữa các môi trường.

## Tính Năng Cốt Lõi
Hệ thống giải quyết các bất cập của mô hình truyền thống bằng các module nghiệp vụ chuyên sâu[cite: 45, 178]:

* **Học viên:** Tìm kiếm gia sư theo bộ lọc (môn học, trình độ, học phí), đặt lịch, thanh toán trực tuyến và đánh giá chất lượng.
* **Gia sư:** Đăng ký hồ sơ, xác minh danh tính/năng lực, quản lý lịch dạy và theo dõi thu nhập.
* **Lớp học:** Tự động tạo lịch trình, theo dõi tiến độ học tập dưới dạng phần trăm hoàn thành.
* **Tài chính:** Thanh toán học phí an toàn với xác thực OTP qua email và quản lý hóa đơn điện tử
