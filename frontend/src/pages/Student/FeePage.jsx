// src/pages/Fee/FeePage.jsx
import '../../components/Header.css';
import './FeePage.css';

import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';

const FeePage = () => {
  const feeBlocks = [
    {
      title: 'Tiểu học (Lớp 1 – 5)',
      desc: 'Tập trung củng cố nền tảng Toán – Tiếng Việt – Tiếng Anh.',
      rows: [
        { type: 'Online 1 kèm 1', time: '90 phút/buổi', fee: '150.000 đ/buổi' },
        { type: 'Gia sư tại nhà 1 kèm 1', time: '120 phút/buổi', fee: '220.000 đ/buổi' },
      ],
    },
    {
      title: 'THCS (Lớp 6 – 9)',
      desc: 'Ôn tập bám sát chương trình, rèn phương pháp ghi nhớ & luyện đề.',
      rows: [
        { type: 'Online 1 kèm 1', time: '90 phút/buổi', fee: '170.000 đ/buổi' },
        { type: 'Gia sư tại nhà 1 kèm 1', time: '120 phút/buổi', fee: '240.000 đ/buổi' },
      ],
    },
    {
      title: 'THPT (Lớp 10 – 12)',
      desc: 'Luyện thi giữa kỳ, cuối kỳ, ĐGNL, THPTQG các khối A, B, D.',
      rows: [
        { type: 'Online 1 kèm 1', time: '90 phút/buổi', fee: '190.000 đ/buổi' },
        { type: 'Gia sư tại nhà 1 kèm 1', time: '120 phút/buổi', fee: '260.000 đ/buổi' },
      ],
    },
    {
      title: 'Chuyên đề & Luyện thi',
      desc: 'Luyện thi HSG, ĐGNL ĐHQG, IELTS, TOEIC… theo lộ trình cá nhân hóa.',
      rows: [
        { type: 'Chuyên đề HSG / ĐGNL', time: '120 phút/buổi', fee: '280.000 – 320.000 đ/buổi' },
        { type: 'IELTS 1 kèm 1 Online', time: '90 phút/buổi', fee: '300.000 đ/buổi' },
      ],
    },
  ];

  return (
    <>
      <DynamicHeader />

      <main className="fee-page">
        <section className="fee-shell">
          <div className="fee-banner-strip">
            <h2>Học phí – Lệ phí tham khảo</h2>
            <p className="fee-subtitle">
              Mức học phí có thể điều chỉnh linh hoạt theo số buổi, hình thức học và nhu cầu của từng học viên.
            </p>
          </div>

          {/* Ô giới thiệu ngắn */}
          <div className="fee-intro card soft">
            <ul>
              <li>Học thử 1 buổi miễn phí cho học viên mới trước khi quyết định đăng ký.</li>
              <li>Ưu đãi giảm 5–10% cho học viên đóng theo gói 12 buổi / 1 tháng.</li>
              <li>Học phí đã bao gồm tài liệu PDF, bài tập về nhà và chấm chữa chi tiết.</li>
            </ul>
          </div>

          {/* Các khối học phí theo bậc học */}
          <div className="fee-grid">
            {feeBlocks.map((block, idx) => (
              <div className="fee-card" key={idx}>
                <h3>{block.title}</h3>
                <p className="fee-desc">{block.desc}</p>
                <table className="fee-table">
                  <thead>
                    <tr>
                      <th>Hình thức</th>
                      <th>Thời lượng</th>
                      <th>Học phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.type}</td>
                        <td>{row.time}</td>
                        <td className="fee-val">{row.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Ghi chú cuối trang */}
          <div className="fee-note card soft">
            <h4>Quy định chung</h4>
            <ul>
              <li>Học phí được thanh toán theo tháng qua chuyển khoản hoặc ví điện tử.</li>
              <li>Nếu học viên bận, vui lòng báo trước tối thiểu 8 giờ để được dời lịch không tính phí, tối đa 2 lần mỗi khóa.</li>
              <li>Để được tư vấn chi tiết, vui lòng để lại thông tin ở mục “Yêu cầu gia sư” hoặc liên hệ trực tiếp trung tâm.</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FeePage;
