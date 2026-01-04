import { useNavigate } from 'react-router-dom';
import { getUserRole, getCurrentUser, logout, isAuthenticated } from '../services/authService';
import { getMe } from '../services/userService';
import { useState, useEffect } from 'react';
import logoImage from '../assets/images/Logo_Group.png';
import './Header.css'; // Import shared header styles

const DynamicHeader = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(getUserRole());
  const [user, setUser] = useState(getCurrentUser());

  // Fetch user info nếu chưa có
  // useEffect(() => {
  //   const fetchUserIfNeeded = async () => {
  //     if (isAuthenticated() && !role) {
  //       try {
  //         const userData = await getMe();
  //         const baseRole = userData.role || 'student';

  //         const userInfo = {
  //           username: userData.username,
  //           role: baseRole,          // role thật từ backend
  //           baseRole: baseRole,      // lưu thêm baseRole để sau này biết
  //           name: userData.name,
  //           email: userData.email,
  //           balance: userData.balance
  //         };
  //         localStorage.setItem('user', JSON.stringify(userInfo));
  //         setUser(userInfo);
  //         setRole(baseRole);
  //       } catch (error) {
  //         console.error('Failed to fetch user info:', error);
  //       }
  //     }
  //   };
  //   fetchUserIfNeeded();
  // }, [role]);

    useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (isAuthenticated() && !role) {
        try {
          const userData = await getMe();
          const baseRole = userData.role || 'student';

          const userInfo = {
            username: userData.username,
            role: baseRole,          // role thật từ backend
            baseRole: baseRole,      // lưu thêm baseRole để sau này biết
            name: userData.name,
            email: userData.email,
            balance: userData.balance
          };
          localStorage.setItem('user', JSON.stringify(userInfo));
          setUser(userInfo);
          setRole(baseRole);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      } else {
        // Nếu đã có user trong localStorage nhưng user state rỗng, đồng bộ lại
        try {
          const raw = localStorage.getItem('user');
          if (raw && !user) {
            setUser(JSON.parse(raw));
          }
        } catch (e) { /* ignore */ }
      }
    };
    fetchUserIfNeeded();
  }, []); // chạy 1 lần khi mount


  // Patch cho những user cũ trong localStorage chưa có baseRole
  useEffect(() => {
    if (user && !user.baseRole && user.role) {
      const patched = { ...user, baseRole: user.role };
      localStorage.setItem('user', JSON.stringify(patched));
      setUser(patched);
    }
  }, [user]);

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  // role thật từ backend (không đổi)
  const baseRole = user?.baseRole || user?.role;
  // chỉ cho switch nếu baseRole là 'tutor'
  const canSwitch = baseRole === 'tutor';

// // 🔹 NÚT SWITCH ROLE ĐƠN GIẢN – chỉ đổi UI, không đổi baseRole
//   const handleSwitchRole = () => {
//     // nếu tài khoản không phải tutor thật thì không cho đổi
//     if (!canSwitch) {
//       return;
//     }

//     // nếu hiện tại đang xem UI student thì chuyển sang UI tutor, ngược lại về student
//     const newRole = role === 'student' ? 'tutor' : 'student';
//     setRole(newRole);

//     if (newRole === 'student') {
//       navigate('/student');
//     } else {
//       navigate('/tutor');
//     }
//   };

  const handleSwitchRole = () => {
    // nếu tài khoản không phải tutor thật thì không cho đổi
    if (!canSwitch) {
      return;
    }

    // nếu hiện tại đang xem UI student thì chuyển sang UI tutor, ngược lại về student
    const newRole = role === 'student' ? 'tutor' : 'student';

    // Cập nhật state và localStorage ngay lập tức để các phần khác đọc cùng nguồn sẽ cập nhật
    const patchedUser = { ...(user || {}), role: newRole };
    try {
      localStorage.setItem('user', JSON.stringify(patchedUser));
    } catch (e) {
      console.error('Failed to write user to localStorage', e);
    }
    setUser(patchedUser);
    setRole(newRole);

    // Điều hướng tới trang tương ứng
    if (newRole === 'student') {
      navigate('/student');
    } else {
      navigate('/tutor');
    }
  };

  // Header cho Guest (chưa đăng nhập)
  if (!role) {
    return (
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
            <span>GIASUNO1</span>
          </a>
          <nav>
            <div className="nav">
              <a onClick={() => navigate('/')}>Trang chủ</a>
              <a onClick={() => navigate('/hocphi')} style={{ cursor: 'pointer' }}>Học phí</a>
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
              <path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
    );
  }

  // Header cho Student UI
  if (role === 'student') {
    return (
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/student'); }}>
            <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
            <span>GIASUNO1</span>
          </a>
          <nav>
            <div className="nav">
              <a onClick={() => navigate('/student')} style={{ cursor: 'pointer' }}>
                Trang chủ
              </a>
              <a
                onClick={() => navigate('/hocphi')}
                style={{ cursor: 'pointer' }}
              >
                Học phí
              </a>
              <a
                onClick={() => navigate('/listtutor')}
                style={{ cursor: 'pointer' }}
              >
                Gia sư
              </a>
              <a
                onClick={() => navigate('/job')}
                style={{ cursor: 'pointer' }}
              >
                Tuyển dụng
              </a>
              <a
                onClick={() => navigate('/support')}
                style={{ cursor: 'pointer' }}
              >
                Hỗ trợ
              </a>

              <details className="user-mini" aria-label="Tùy chọn tài khoản">
                <summary className="avatar-btn" aria-haspopup="menu" aria-expanded="false">
                  <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div>
                  <div className="u-meta">
                    <div className="nm">username: {user?.username || 'N/A'}</div>
                  </div>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>

                <div className="user-popover" role="menu">

                  <a
                    role="menuitem"
                    className="mi"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/mypage#thong-tin')}
                  >
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.24-8 5v1h16v-1c0-2.76-3.6-5-8-5Z"
                        fill="currentColor"
                      />
                    </svg>
                    Quản lý thông tin
                  </a>

                  <a
                    role="menuitem"
                    className="mi"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/mypage#khoa-hoc')}
                  >
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 19h16V5H4v14Zm2-2V7h12v10H6Zm3-2h6v-2H9v2Z" fill="currentColor" />
                    </svg>
                    Khóa học của tôi
                  </a>

                  <a role="menuitem" href="#wallet" className="mi">
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-1 9H5V9h15v7Zm-3-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="currentColor" />
                    </svg>
                    Ví của tôi
                  </a>

                  {/* Nút switch chỉ hiện nếu baseRole là 'tutor' */}
                  {canSwitch && (
                    <button
                      type="button"
                      className="mi"
                      style={{ cursor: 'pointer' }}
                      onClick={handleSwitchRole}
                    >
                      <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z"
                          fill="currentColor"
                        />
                      </svg>
                      Chuyển sang chế độ Gia sư
                    </button>
                  )}

                  <hr className="menu-divider" />

                  <button role="menuitem" type="button" className="mi link-danger" onClick={handleLogout}>
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M10 17v2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6v2H5v10h5Zm9.59-5-3-3L17 7l5 5-5 5-1.41-2 3-3H11v-2h8.59Z" fill="currentColor" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </details>
            </div>
          </nav>
          <button className="menu-btn" aria-label="Mở menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
    );
  }

  // Header cho Tutor UI
  if (role === 'tutor') {
    const initials = (name) => {
      if (!name) return 'GS';
      const parts = name.trim().split(/\s+/);
      return ((parts[0]?.[0] || 'G') + (parts.slice(-1)[0]?.[0] || 'S')).toUpperCase();
    };

    return (
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/tutor'); }}>
            <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
            <span>GIASUNO1</span>
          </a>

          <nav>
            <div className="nav">
              <a href="#home">Trang chủ</a>
              <a href="#schedule">Lịch giảng dạy</a>
              <a href="#requests">Nộp đơn</a>
            </div>
          </nav>

          <div className="header-actions">
            <button className="notif-btn" title="Thông báo">🔔</button>
          </div>

          {/* User Account Dropdown */}
          <details className="user-mini" aria-label="Tùy chọn tài khoản">
            <summary className="avatar-btn" aria-haspopup="menu" aria-expanded="false">
              <div className="avatar" id="avatar">{initials(user?.name)}</div>
              <div className="u-meta">
                <div className="nm">{user?.username || 'Giáo viên'}</div>
              </div>
              <svg className="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>

            <div className="user-popover" role="menu">
              <a role="menuitem" href="#profile" className="mi">
                <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.24-8 5v1h16v-1c0-2.76-3.6-5-8-5Z" fill="currentColor" />
                </svg>
                Quản lý tài khoản
              </a>

              <a role="menuitem" href="#change-pass" className="mi">
                <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-1 9H5V9h15v7Zm-3-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="currentColor" />
                </svg>
                Ví của tôi
              </a>

              <a role="menuitem" href="#support" className="mi">
                <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 6.32 17.94L22 22l-2.06-3.68A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm2.07-7.75-.9.92A3.5 3.5 0 0 0 13.5 12h-2v-.5c0-.83.67-1.5 1.5-1.5a1.5 1.5 0 1 0-1.5-1.5H9a3 3 0 1 1 6 0c0 .66-.26 1.3-.93 2.25Z" fill="currentColor" />
                </svg>
                Trung tâm hỗ trợ
              </a>

              {/* Nút switch chỉ hiện nếu baseRole là 'tutor' */}
              {canSwitch && (
                <button
                  type="button"
                  className="mi"
                  style={{ cursor: 'pointer' }}
                  onClick={handleSwitchRole}
                >
                  <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z"
                      fill="currentColor"
                    />
                  </svg>
                  Chuyển sang chế độ Học viên
                </button>
              )}

              <hr className="menu-divider" />

              <button role="menuitem" type="button" className="mi link-danger" id="btnLogout" onClick={handleLogout}>
                <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 17v2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6v2H5v10h5Zm9.59-5-3-3L17 7l5 5-5 5-1.41-2 3-3H11v-2h8.59Z" fill="currentColor" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </details>
        </div>
      </header>
    );
  }

  // Default header (fallback)
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
            <a className="btn btn-ghost" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Đăng nhập</a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default DynamicHeader;
