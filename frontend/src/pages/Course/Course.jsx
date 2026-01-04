import React from 'react';
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';

const Course = () => {
  return (
    <>
      <DynamicHeader />
      <div style={{ padding: '2rem', minHeight: '60vh' }}>
        <h1>Trang Các khóa học</h1>
        <p>
          Trang này đã được tạm thời vô hiệu hóa và sẽ được thiết kế lại trong tương lai để phù hợp với quy trình đăng ký mới.
        </p>
      </div>
      <Footer />
    </>
  );
};

export default Course;