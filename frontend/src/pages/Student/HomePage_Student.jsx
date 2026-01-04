import '../../components/Header.css'; // Import shared header styles first
import './HomePage_Student.css';
import '../Home/HomePage.css';

import Footer from '../../components/Footer';
import TutorSection from '../../components/TutorSection';
import TrialForm from '../../components/TrialForm';
import RequestForm from '../../components/RequestForm';
import FeaturesSection from '../../components/FeaturesSection';
import BannerCarousel from '../../components/BannerCarousel';

import DynamicHeader from '../../components/DynamicHeader';

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from '../../services/authService';
import { getMe } from '../../services/userService';

// Import images
import Logo from '../../assets/images/Logo_Group.png';
import Avatar from '../../assets/images/avatar.jpg';
import Banner1 from '../../assets/images/Banner_1.png';
import Banner2 from '../../assets/images/Banner_2.png';
import Banner3 from '../../assets/images/Banner_3.png';
import Banner4 from '../../assets/images/Banner_4.jpg';

// Import tutor images
import TutorMinh from '../../assets/tutors/tutorMinh.png';
import TutorHa from '../../assets/tutors/tutorHa.png';
import TutorAnh from '../../assets/tutors/tutorAnh.png';
import TutorPhuong from '../../assets/tutors/tutorPhuong.png';
import TutorDuy from '../../assets/tutors/tutorDuy.png';
import TutorLinh from '../../assets/tutors/tutorLinh.jpg';

const HomePage_Student = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 👉 HÀM SCROLL TỚI FORM TÌM GIA SƯ
  const scrollToRequestForm = () => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('requestForm'); // form trong RequestForm.jsx
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // -------------------------------------------
  // auth & user
  // -------------------------------------------
  useEffect(() => {
    console.log("Render Home");
    // Chặn nếu chưa đăng nhập
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const me = await getMe();           //gọi qua service
        setUserData(me);
        setError("");
      } catch (err) {
        console.error("Error fetching user data:", err);
        const status = err?.response?.status;
        // Hết hạn/invalid token → logout và quay về login
        if (status === 401 || status === 404) {
          logout();
          navigate("/login");
          return;
        }
        setError("Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // -------------------------------------------
  // Hash routing từ menu header:
  // /student#thong-tin  →  /mypage#thong-tin
  // /student#khoa-hoc   →  /mypage#khoa-hoc
  // -------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashRoute = () => {
      const raw = window.location.hash.replace('#', '');

      // chỉ xử lý khi đã đăng nhập
      if (!isAuthenticated()) return;

      if (raw === 'thong-tin' || raw === 'khoa-hoc') {
        // chuyển sang trang dashboard học viên
        navigate(`/mypage#${raw}`);
      }
    };

    // xử lý ngay lần đầu (trường hợp vào thẳng /student#thong-tin)
    handleHashRoute();

    window.addEventListener('hashchange', handleHashRoute);
    return () => window.removeEventListener('hashchange', handleHashRoute);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const banners = [Banner1, Banner2, Banner3, Banner4];

  const tutors = [
    {
      name: 'Nguyễn Văn Minh',
      subject: 'Giáo viên môn Toán',
      image: TutorMinh,
      highlights: [
        '10 năm kinh nghiệm',
        'Chuyên ôn thi THPTQG',
        'Hơn 1000 học sinh đạt 9+ môn Toán'
      ],
      location: 'TP.HCM'
    },
    {
      name: 'Trần Thu Hà',
      subject: 'Giáo viên Hóa học THCS',
      image: TutorHa,
      highlights: [
        '8 năm giảng dạy',
        'Học sinh tiến bộ sau 4 tuần',
        'Phương pháp dễ hiểu'
      ],
      location: 'Hà Nội'
    },
    {
      name: 'Lê Quang Anh',
      subject: 'Tiếng Anh · IELTS',
      image: TutorAnh,
      highlights: [
        'IELTS 8.0',
        'Lộ trình cá nhân hóa',
        'Speaking/Listening focus'
      ],
      location: 'Online'
    },
    {
      name: 'Phạm Thu Phương',
      subject: 'Ngữ văn THPT',
      image: TutorPhuong,
      highlights: [
        'Hơn 10 năm kinh nghiệm',
        'Giảng viên tiêu biểu TP',
        'Giọng nói truyền cảm'
      ],
      location: 'Hải Phòng'
    },
    {
      name: 'Nguyễn Hữu Duy',
      subject: 'Vật lý · Chuyên đề',
      image: TutorDuy,
      highlights: [
        'Ôn thi HSG/ĐGNL',
        'Giải Nhất HSGQG môn Vật lý 2022',
        'Thi ĐGNL ĐHQGHCM đạt 1700đ'
      ],
      location: 'Đà Nẵng'
    },
    {
      name: 'Nguyễn Ngọc Linh',
      subject: 'Sinh học THPT',
      image: TutorLinh,
      highlights: [
        'Sơ đồ tư duy súc tích',
        'Lý thuyết – bài tập cân bằng',
        'Ôn thi khối B hiệu quả'
      ],
      location: 'Cần Thơ'
    }
  ];

  return (
    <div className="homepage">
      {/* Header */}
      <DynamicHeader />

      <button
        type="button"
        className="floating-find-tutor"
        onClick={scrollToRequestForm}
      >
        Tìm gia sư
      </button>

      <main>

        {/* Hero Section with Trial Form */}
        <section className="hero">
          <BannerCarousel banners={banners} />

          {/* Trial Form */}
          <div className="hero-illustration">
            <TrialForm />
          </div>
        </section>

        {/* Tutors Section */}
        <TutorSection tutors={tutors} />

        {/* Request Section */}

        <section className="section" id="hocphi">
          <div className="request-grid">
            <div className="card request-copy">
              <h2>HỌC PHÍ - LỆ PHÍ THAM KHẢO</h2>
              <p className="muted">
                Đây chỉ là học phí tham khảo. Mức học phí có thể điều chỉnh linh hoạt theo số buổi, hình thức học và nhu cầu của từng học viên.
              </p>

              

              <table className="home-fee-table">
                <tbody>
                  <tr>
                    <th>Tiểu học &amp; THCS</th>
                    <td>90 phút/buổi</td>
                    <td className="fee-val">180.000 – 230.000đ</td>
                  </tr>
                  <tr>
                    <th>THPT (10–12)</th>
                    <td>90 phút/buổi</td>
                    <td className="fee-val">220.000 – 280.000đ</td>
                  </tr>
                  <tr>
                    <th>Luyện thi, HSG</th>
                    <td>90–120 phút/buổi</td>
                    <td className="fee-val">từ 300.000đ</td>
                  </tr>
                </tbody>
              </table>

              <section className="card soft fee-extra">
                <h3>Ưu đãi & Quyền lợi đi kèm</h3>

                <ul className="fee-extra-list">
                  <li>
                    <strong>Học thử 1 buổi miễn phí</strong> cho tất cả học viên mới trước khi quyết định đăng ký chính thức.
                  </li>

                  <li>
                    <strong>Học phí đã bao gồm toàn bộ tài liệu PDF</strong>, bài tập về nhà, ngân hàng câu hỏi và bộ đề theo từng môn.
                  </li>

                  <li>
                    <strong>Chấm bài chi tiết</strong> – mỗi bài tập được giáo viên sửa lỗi, phản hồi rõ ràng và gợi ý cách cải thiện.
                  </li>

                  <li>
                    <strong>Báo cáo tiến độ hàng tuần</strong> cho phụ huynh, bao gồm điểm mạnh – điểm yếu, mức độ hoàn thành bài tập, và đề xuất điều chỉnh lộ trình.
                  </li>

                  <li>
                    <strong>Hỗ trợ thay đổi lịch học linh hoạt</strong> (thông báo trước ≥ 8 tiếng), tối đa 2 lần/tháng.
                  </li>

                  <li>
                    <strong>Tư vấn lộ trình cá nhân hóa</strong> theo năng lực đầu vào, mục tiêu điểm số hoặc kỳ thi (ĐGNL, THPTQG, IELTS, HSG…).
                  </li>

                  <li>
                    <strong>Cam kết chất lượng</strong>: thay gia sư miễn phí nếu không phù hợp trong 1–2 buổi đầu tiên.
                  </li>
                </ul>
              </section>
        

              <div className="cta-inline" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/hocphi')}
                >
                  Xem bảng học phí chi tiết
                </button>
              </div>
            </div>

            <RequestForm />
          </div>
        </section>


        {/* Recruitment CTA */}
        <section className="section" id="tuyendung">
          <div className="band band--purple">
            <div>
              <h3 style={{margin:'0 0 6px'}}>👩‍🏫 Đồng hành cùng chúng tôi</h3>
              <p className="muted" style={{margin:0, color:'#f6f6f6'}}>
                Trở thành một phần của đội ngũ gia sư chuyên nghiệp, tận tâm và sáng tạo.
              </p>
            </div>
            <div className="hero-cta">
              <button className="btn btn-light" onClick={() => navigate('/job')}>Ứng tuyển ngay</button>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <FeaturesSection />

        

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage_Student;
