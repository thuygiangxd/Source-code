import '../../components/Header.css';
import './Job_Guest.css';
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';

const Job_Guest = () => {
  return (
    <div className="job-page">
      <DynamicHeader />

      <main>
        <div className="job-guest-shell">
          {/* HERO */}
          <header className="jobs-hero">
            <h2>Tuyển gia sư Online – Trung tâm Gia sư G & 3 N</h2>
            <p>
              Chúng tôi tìm kiếm sinh viên và thầy cô có chuyên môn vững, giàu
              kinh nghiệm giảng dạy và sử dụng thành thạo công cụ dạy học trực tuyến.
            </p>
          </header>

          {/* 1. Mục tiêu tuyển gia sư Online */}
          <section className="job-section">
            <h3>1) Mục tiêu tuyển gia sư Online</h3>
            <ul>
              <li>
                G &amp; 3 N tuyển gia sư Online là các sinh viên và thầy cô
                có trình độ chuyên môn cao và giàu kinh nghiệm giảng dạy.
              </li>
              <li>
                Xây dựng đội ngũ giảng dạy cho dịch vụ gia sư online phát triển
                về chất lượng, số lượng và thấu hiểu tâm lý học sinh, sẵn sàng
                đồng hành trong suốt quá trình học.
              </li>
            </ul>
          </section>

          {/* 2. Thông tin tuyển dụng */}
          <section className="job-section">
            <h3>2) Thông tin tuyển dụng gia sư Online</h3>
            <ul className="key-points">
              <li>
                <strong>Số lượng:</strong> Không giới hạn giáo viên/sinh viên có
                chuyên môn cao, kinh nghiệm giảng dạy, sử dụng thành thạo Zoom/Google Meet.
              </li>
              <li>
                <strong>Giới tính:</strong> Nam/Nữ.
              </li>
              <li>
                <strong>Độ tuổi:</strong> Từ 18 tuổi trở lên.
              </li>
              <li>
                <strong>Thời lượng dạy:</strong> 120 - 180 phút/buổi, mỗi tuần dạy ít nhất 6 buổi.
              </li>
              <li>
                <strong>Hình thức:</strong> Dạy online bán thời gian theo môn học.
                Gia sư được phép tự do lựa chọn lịch dạy phù hợp với thời gian cá nhân.
              </li>
            </ul>
          </section>

          {/* 3. Yêu cầu */}
          <section className="job-section">
            <h3>3) Yêu cầu dành cho ứng viên</h3>
            <ul>
              <li>
                Chuyên môn cao ở môn đăng ký; ưu tiên thầy cô/sinh viên ngành Sư phạm.
              </li>
              <li>
                Có kinh nghiệm giảng dạy, thấu hiểu tâm lý học sinh, truyền đạt thú vị – dễ hiểu.
              </li>
              <li>
                Kiên nhẫn, sẵn sàng giải đáp mọi thắc mắc trong quá trình học.
              </li>
              <li>
                Sử dụng thành thạo thiết bị và công cụ dạy học online, đảm bảo buổi học suôn sẻ – hiệu quả.
              </li>
            </ul>
          </section>

          {/* 4. Cách thức đăng ký */}
          <section className="job-section">
            <h3>4) Cách thức đăng ký làm gia sư Online</h3>
            <ol>
              <li>
                Đăng ký tài khoản và chọn mục “Đăng ký trở thành gia sư” trên website.
              </li>
              <li>
                Chuẩn bị CV có ảnh 3x4, nêu rõ chuyên môn, thành tích nổi bật và kinh nghiệm giảng dạy.
              </li>
              <li>
                Gửi CV và thông tin liên hệ; trung tâm sẽ xem xét và phản hồi trong thời gian sớm nhất.
              </li>
              <li>
                Khi hồ sơ đạt yêu cầu, bạn sẽ được mời phỏng vấn/ demo dạy thử trước khi nhận lớp.
              </li>
            </ol>

            <div className="notice">
              <strong>Lưu ý:</strong> Hồ sơ được xem và duyệt trong thời gian sớm nhất.
              Ứng viên hoàn toàn chịu trách nhiệm với các thông tin đã cung cấp.
            </div>

            <div className="job-cta-inline">
              <a className="btn btn-primary" href="/signup">
                Đăng ký làm gia sư
              </a>
              <a className="btn btn-ghost" href="/login">
                Tôi đã có tài khoản
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Job_Guest;
