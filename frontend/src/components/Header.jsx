import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/images/Logo_Group.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
          <span>GIASUNO1</span>
        </a>
        <nav>
          <div className="nav">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Trang chủ</a>
            <a onClick={() => navigate('/hocphi')} style={{ cursor: 'pointer' }}>Học phí</a>

            {/* <a href="#dsgiasu">Gia sư</a> */}
            <a
              onClick={() => navigate('/listtutor')}
              style={{ cursor: 'pointer' }}
            >
              Gia sư
            </a>
            <a
              onClick={() => navigate('/job-guest')}
              style={{ cursor: 'pointer' }}
            >
              Tuyển dụng
            </a>

            <a className="btn btn-ghost" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Đăng nhập</a>
            <a className="btn btn-primary" onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>Đăng ký</a>
          </div>
        </nav>
        <button className="menu-btn" aria-label="Mở menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
