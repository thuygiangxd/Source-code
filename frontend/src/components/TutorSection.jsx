// src/components/TutorSection.jsx

const TutorSection = ({ tutors = [] }) => {
  const visibleTutors = tutors.slice(0, 6);

  return (
    <section className="section" id="gia-su">
      {/* Card lớn bao quanh toàn bộ khu gia sư */}

        <div className="tutor-section-header">
          <h2>Đội ngũ gia sư tiêu biểu</h2>
          <p className="tutor-subtitle">
            Các thầy cô có kinh nghiệm giảng dạy, phương pháp dễ hiểu
            và lộ trình cá nhân hóa cho từng học viên.
          </p>
        </div>
      <div className="card tutor-section-card">
        {/* Phần thân: grid các thẻ gia sư */}
        <div className="tutor-section-body">
          <div className="tutor-grid">
            {visibleTutors.map((tutor, index) => (
              <article className="card tutor-card" key={index}>
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
                    {tutor.highlights?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <p className="tutor-location">📍 {tutor.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TutorSection;
