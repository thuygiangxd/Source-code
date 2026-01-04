import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from './BannerCarousel';

const CourseCatalog = ({ banners }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const hideTimerRef = useRef(null);

  const categories = [
    { id: 'daihoc', label: 'Đại học - Cao đẳng' },
    { id: 'hsgioi', label: 'Bồi dưỡng học sinh giỏi' },
    { id: 'ltdh', label: 'Luyện thi đại học' },
    { id: 'thpt', label: 'THPT (Lớp 10 - 11 - 12)' },
    { id: 'vao10', label: 'Luyện thi vào 10' },
    { id: 'thcs', label: 'THCS (Lớp 6 - 7 - 8 - 9)' },
    { id: 'tieu-hoc', label: 'Tiểu học (Lớp 1 - 2 - 3 - 4 - 5)' },
    { id: 'ngoaingu', label: 'Ngoại ngữ' }
  ];

  const handleCategoryHover = (categoryId) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setActiveCategory(categoryId);
    setShowPanel(true);
  };

  const handleCategoryLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setShowPanel(false);
      setActiveCategory(null);
    }, 120);
  };

  const handlePanelEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  };

  return (
    <section className="section" id="catalog">
      <div className="catalog-layout" id="catalogRoot">
        {/* Sidebar */}
        <aside 
          className="course-sidebar" 
          id="sidebar"
          onMouseLeave={handleCategoryLeave}
        >
          <div className="sidebar-head">
            <button className="sidebar-toggle" aria-label="Mở danh mục">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <strong>Các khóa học</strong>
          </div>

          <nav className="course-list">
            {categories.map(cat => (
              <a 
                key={cat.id}
                className={`course-item ${activeCategory === cat.id ? 'is-active' : ''}`}
                data-cat={cat.id}
                onMouseEnter={() => handleCategoryHover(cat.id)}
                onFocus={() => handleCategoryHover(cat.id)}
              >
                <span className="icon-cap"></span>{cat.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Right Column */}
        <div className={`catalog-right ${showPanel ? 'show-panel' : ''}`} id="rightCol">
          {/* Banner */}
          <div className="promo-banner card">
            <BannerCarousel banners={banners} />
          </div>

          {/* Course Panel */}
          <section 
            className="course-panel card" 
            id="panel"
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handleCategoryLeave}
          >
            <div className="panel-head"><span>KHÓA HỌC</span></div>

            {/* Đại học */}
            <div className={`panel-body ${activeCategory === 'daihoc' ? 'is-show' : ''}`} id="daihoc">
              <ul className="panel-list">
                <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">π</span>Toán cao cấp</a></li>
                <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧲</span>Vật lý đại cương</a></li>
              </ul>
            </div>

            {/* Học sinh giỏi */}
            <div className={`panel-body ${activeCategory === 'hsgioi' ? 'is-show' : ''}`} id="hsgioi">
              <div className="panel-groups">
                <details className="panel-group" open>
                  <summary>THCS</summary>
                  <ul className="panel-list">
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">π</span> Toán chuyên</a></li>
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📚</span> Ngữ văn chuyên</a></li>
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📘</span> Tiếng Anh chuyên</a></li>
                  </ul>
                </details>
                <details className="panel-group" open>
                  <summary>THPT</summary>
                  <ul className="panel-list">
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚡</span> Vật lý chuyên</a></li>
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧪</span> Hóa học chuyên</a></li>
                    <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧬</span> Sinh học chuyên</a></li>
                  </ul>
                </details>
              </div>
            </div>

            {/* Luyện thi đại học */}
            <div className={`panel-body ${activeCategory === 'ltdh' ? 'is-show' : ''}`} id="ltdh">
              <details className="panel-group" open>
                <summary>Thi THPTQG</summary>
                <ul className="panel-list">
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">π</span> Toán</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📚</span> Ngữ văn</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📘</span> Tiếng Anh</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚡</span> Vật lý</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧪</span> Hóa học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧬</span> Sinh học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🏺</span> Lịch sử</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🗺️</span> Địa lý</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚖️</span> Giáo dục KT & PL</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">💻</span> Tin học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚙️</span> Công nghệ</a></li>
                </ul>
              </details>

              <details className="panel-group" open>
                <summary>LUYỆN THI ĐGTD ĐHBKHN (TSA)</summary>
                <ul className="panel-list">
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📘</span> Tư duy Toán học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📖</span> Tư duy Đọc hiểu</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚗️</span> Tư duy Khoa học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🎯</span> Tổ hợp môn</a></li>
                </ul>
              </details>

              <details className="panel-group" open>
                <summary>LUYỆN THI ĐGNL ĐHQGHN (HSA)</summary>
                <ul className="panel-list">
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📏</span> Định tính</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧮</span> Định lượng</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🔬</span> Khoa học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🗂️</span> Tổ hợp môn</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">💬</span> Tiếng Anh</a></li>
                </ul>
              </details>

              <details className="panel-group" open>
                <summary>LUYỆN THI ĐGNL ĐHQG-HCM (V-ACT)</summary>
                <ul className="panel-list">
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📗</span> Toán học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🗣️</span> Sử dụng Ngôn ngữ</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚙️</span> Tư duy Khoa học</a></li>
                  <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧩</span> Tổ hợp môn</a></li>
                </ul>
              </details>
            </div>

            {/* THPT */}
            <div className={`panel-body ${activeCategory === 'thpt' ? 'is-show' : ''}`} id="thpt">
              <div className="panel-groups">
                {['Lớp 10', 'Lớp 11', 'Lớp 12'].map(grade => (
                  <details key={grade} className="panel-group" open>
                    <summary>{grade}</summary>
                    <ul className="panel-list">
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">π</span> Toán</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📚</span> Ngữ văn</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">📘</span> Tiếng Anh</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚡</span> Vật lý</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧪</span> Hóa học</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🧬</span> Sinh học</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🏺</span> Lịch sử</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">🗺️</span> Địa lý</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚖️</span> Giáo dục KT & PL</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">💻</span> Tin học</a></li>
                      <li><a className="subject" onClick={() => navigate('/courses')} style={{cursor: 'pointer'}}><span className="ico">⚙️</span> Công nghệ</a></li>
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

export default CourseCatalog;
