import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/Header.css';
import './Job.css';
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';
import { getMe } from '../../services/userService';
import { isAuthenticated } from '../../services/authService';
import { createTutorProfile } from "../../services/academicService";



const Job = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [cvForm, setCvForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    notes: '',
    cv: null
  });
  const [cvMessage, setCvMessage] = useState('');

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const handleCvFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'cv') {
      setCvForm({ ...cvForm, cv: files[0] });
    } else {
      setCvForm({ ...cvForm, [name]: value });
    }
  };

  const handleCvSubmit = async (e) => {
    e.preventDefault();
    
    const file = cvForm.cv;
    if (!file) {
      alert('Vui lòng chọn file CV.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn ( >5MB ).');
      return;
    }

    try {
    if (!cvForm.cv) {
      alert("Chưa chọn CV!");
      return;
    }

      const form = new FormData();
      form.append("cv", cvForm.cv);         // file CV
      form.append("status", "inactive");

      const res = await createTutorProfile(form);

      setCvMessage("Nộp CV thành công!");
      console.log("Saved:", res.data);

    } catch (err) {
      console.error(err);
      alert("Nộp CV thất bại!");
    }
    
    setCvMessage('CV đã lưu.');
    setCvForm({
      fullname: '',
      email: '',
      phone: '',
      notes: '',
      cv: null
    });
    // Reset file input
    document.getElementById('cvFile').value = '';
  };

  const handleResetCV = () => {
    setCvForm({
      fullname: '',
      email: '',
      phone: '',
      notes: '',
      cv: null
    });
    setCvMessage('');
    document.getElementById('cvFile').value = '';
  };

  const [user, setUser] = useState(null);

  const initials = (name) => {
    if (!name) return 'GS';
    const parts = name.trim().split(/\s+/);
    return (
      (parts[0]?.[0] || 'G') + (parts.slice(-1)[0]?.[0] || 'S')
    ).toUpperCase();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await getMe();
        setUser(me);
        setCvForm(prev => ({
          ...prev,
          fullname: me?.name || "",
          email: me?.email || "",
          phone: me?.phone || ""
        }));
      } catch (err) {
        console.error('Failed to fetch user for Job page:', err);
      }
    };

    fetchUser();
  }, []);



  return (
    <div className="job-page">
      <DynamicHeader />

      <main>
        <div className="shell">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="user-mini">
            <div className="avatar">
                {initials(user?.name || '')}
              </div>

              <div>
                <div className="nm">
                  {user?.name || 'Ứng viên gia sư'}
                </div>
                {user?.email && (
                  <div className="uid">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <nav className="side-nav">
              <button 
                className={`side-link ${activeTab === 'jobs' ? 'is-active' : ''}`}
                onClick={() => handleTabSwitch('jobs')}
              >
                📝 Thông tin tuyển dụng
              </button>
              <button 
                className={`side-link ${activeTab === 'createCV' ? 'is-active' : ''}`}
                onClick={() => handleTabSwitch('createCV')}
              >
                📄 Tạo CV cá nhân
              </button>
            </nav>
          </aside>


          {/* RIGHT CONTENT */}
          <section className="content">
            
            {/* TAB: JOBS */}
            {activeTab === 'jobs' && (
              <div id="panelJobs" className="tab-panel">
                {/* JOBS CONTENT */}
                <header className="jobs-hero">
                  <h2>Tuyển gia sư Online – Trung tâm Gia sư G & 3 N</h2>
                  <p>Chúng tôi tìm kiếm sinh viên và thầy cô có chuyên môn vững, giàu kinh nghiệm giảng dạy và sử dụng thành thạo công cụ dạy học trực tuyến.</p>
                </header>

                {/* 1. Mục tiêu */}
                <section className="job-section">
                  <h3>1) Mục tiêu tuyển gia sư Online</h3>
                  <ul>
                    <li>G & 3 N tuyển gia sư Online là các sinh viên và thầy cô có trình độ chuyên môn cao và giàu kinh nghiệm giảng dạy.</li>
                    <li>Xây dựng đội ngũ giảng dạy cho dịch vụ gia sư online phát triển về chất lượng, số lượng và thấu hiểu tâm lý học sinh, sẵn sàng đồng hành trong suốt quá trình học.</li>
                  </ul>
                </section>

                {/* 2. Thông tin tuyển dụng */}
                <section className="job-section">
                  <h3>2) Thông tin tuyển dụng gia sư Online</h3>
                  <ul className="key-points">
                    <li><strong>Số lượng:</strong> Không giới hạn giáo viên/sinh viên có chuyên môn cao, kinh nghiệm giảng dạy, sử dụng thành thạo Zoom/Google Meet.</li>
                    <li><strong>Giới tính:</strong> Nam/Nữ.</li>
                    <li><strong>Độ tuổi:</strong> Từ 18 tuổi trở lên.</li>
                    <li><strong>Thời lượng dạy:</strong> 120 - 180 phút/buổi. Mỗi tuần dạy ít nhất 6 buổi</li>
                    <li><strong>Hình thức:</strong> Dạy online bán thời gian theo môn học. Gia sư được phép tự do lựa chọn lịch dạy cho phù hợp với thời gian.</li>
                  </ul>
                </section>

                {/* 3. Yêu cầu */}
                <section className="job-section">
                  <h3>3) Yêu cầu dành cho ứng viên</h3>
                  <ul>
                    <li>Chuyên môn cao ở môn đăng ký; ưu tiên thầy cô/sinh viên ngành Sư phạm.</li>
                    <li>Có kinh nghiệm giảng dạy, thấu hiểu tâm lý học sinh, truyền đạt thú vị – dễ hiểu.</li>
                    <li>Kiên nhẫn, sẵn sàng giải đáp mọi thắc mắc trong quá trình học.</li>
                    <li>Sử dụng thành thạo thiết bị và công cụ dạy học online, đảm bảo buổi học suôn sẻ – hiệu quả.</li>
                  </ul>
                </section>

                {/* 4. Cách thức đăng ký */}
                <section className="job-section">
                  <h3>4) Cách thức đăng ký làm gia sư Online</h3>
                  <ol>
                    <li>Đọc kỹ và thực hiện theo hướng dẫn đăng ký trở thành gia sư trên trang web.</li>
                    <li>Chuẩn bị CV có ảnh 3x4, nêu rõ chuyên môn, thành tích nổi bật và kinh nghiệm giảng dạy để điền vào mẫu đăng ký.</li>
                    <li>Sau khi đăng ký, chờ trung tâm xem xét và phản hồi. Nếu được giao lớp, chuẩn bị giáo án kỹ lưỡng và bắt đầu giảng dạy.</li>
                    <li>Khi hồ sơ đạt yêu cầu, thông tin của bạn sẽ hiển thị ở danh sách "Gia sư Online tiêu biểu" để phụ huynh/học sinh tham khảo.</li>
                  </ol>

                  <div className="notice">
                    <strong>Lưu ý:</strong> Hồ sơ được xem và duyệt <strong>trong thời gian sớm nhất</strong>. Ứng viên hoàn toàn chịu trách nhiệm với các thông tin đã ứng tuyển.
                  </div>
                </section>

                <div id="jobList" className="job-list"></div>
              </div>
            )}

            {/* TAB: CREATE CV */}
            {activeTab === 'createCV' && (
              <div id="panelCreateCV" className="tab-panel">
                <div className="cv-panel">
                  <h3>Hồ sơ ứng tuyển</h3>
                  <form id="cvForm" className="cv-form" onSubmit={handleCvSubmit}>
                    <label>Họ và tên</label>
                    {/* <input 
                      name="fullname" 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      value={cvForm.fullname}
                      onChange={handleCvFormChange}
                      required 
                    /> */}
                    <input 
                      name="fullname"
                      type="text"
                      value={cvForm.fullname}
                      disabled
                    />

                    <label>Email</label>
                    {/* <input 
                      name="email" 
                      type="email" 
                      placeholder="mail@example.com" 
                      value={cvForm.email}
                      onChange={handleCvFormChange}
                      required 
                    /> */}
                    <input 
                      name="email"
                      type="email"
                      value={cvForm.email}
                      disabled
                    />

                    <label>Số điện thoại</label>
                    {/* <input 
                      name="phone" 
                      type="tel" 
                      placeholder="0912xxxxxx" 
                      value={cvForm.phone}
                      onChange={handleCvFormChange}
                      required 
                    /> */}
                    <input 
                      name="phone"
                      type="tel"
                      value={cvForm.phone}
                      disabled
                    />

                    <label>Kinh nghiệm / Ghi chú</label>
                    <textarea 
                      name="notes" 
                      rows="4" 
                      placeholder="Mô tả kinh nghiệm giảng dạy, bằng cấp..."
                      value={cvForm.notes}
                      onChange={handleCvFormChange}
                    ></textarea>

                    <label>Tải lên CV (pdf, png, jpg)</label>
                    <input 
                      id="cvFile" 
                      name="cv" 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      onChange={handleCvFormChange}
                      required 
                    />

                    <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
                      <button type="submit" className="btn btn-accent">Lưu hồ sơ</button>
                      <button 
                        type="button" 
                        id="resetCV" 
                        className="btn btn-outline"
                        onClick={handleResetCV}
                      >
                        Đặt lại
                      </button>
                    </div>

                    {cvMessage && (
                      <div id="cvMessage" style={{marginTop:'10px', color:'green'}}>
                        {cvMessage}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Job;
