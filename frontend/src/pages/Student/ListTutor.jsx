// ListTutor.jsx
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';

import './ListTutor.css';

import TutorMinh from '../../assets/tutors/tutorMinh.png';
import TutorHa from '../../assets/tutors/tutorHa.png';
import TutorAnh from '../../assets/tutors/tutorAnh.png';
import TutorPhuong from '../../assets/tutors/tutorPhuong.png';
import TutorDuy from '../../assets/tutors/tutorDuy.png';
import TutorLinh from '../../assets/tutors/tutorLinh.jpg';

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

const ListTutor = () => {
  return (
    <div className="list-tutor-page">
      {/* ⭐ HEADER */}
      <DynamicHeader />

      <main>
        <section className="list-tutor-shell">
          {/* BANNER GIỐNG HỌC PHÍ */}
          <div className="tutor-banner">
            <h2>Đội ngũ gia sư trung tâm</h2>

          </div>

          {/* DANH SÁCH GIA SƯ */}
          <section className="list-tutor-section">
            <div className="tutor-grid">
              {tutors.map((tutor, index) => (
                <div className="tutor-card" key={index}>
                  <div className="tutor-img-wrapper">
                    <img
                      src={tutor.image}
                      alt={tutor.name}
                      className="tutor-img"
                    />
                  </div>
                  <div className="tutor-info">
                    <h3 className="tutor-name">{tutor.name}</h3>
                    <p className="tutor-subject">{tutor.subject}</p>
                    <ul className="tutor-highlights">
                      {tutor.highlights.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <p className="tutor-location">📍 {tutor.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      {/* ⭐ FOOTER */}
      <Footer />
    </div>
  );
};

export default ListTutor;

