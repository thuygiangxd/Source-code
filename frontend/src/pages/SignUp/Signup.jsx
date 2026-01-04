import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../../services/authService";
import './Signup.css';
import Header from '../../components/Header';

const Signup = () => {
  
  const navigate = useNavigate();
  
  // Form states
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [loading, setLoading] = useState(false);


  

  
  // Password strength states
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthText, setStrengthText] = useState('Độ mạnh mật khẩu');
  const [strengthClass, setStrengthClass] = useState('weak');
  const [matchText, setMatchText] = useState('');

  // Password strength calculator
  const scorePassword = (pw) => {
    if (!pw) return 0;
    let s = 0;
    const sets = [
      /[a-z]/.test(pw),
      /[A-Z]/.test(pw),
      /[0-9]/.test(pw),
      /[^A-Za-z0-9]/.test(pw),
      pw.length >= 10
    ].filter(Boolean).length;
    s += sets * 20;
    s += Math.min(40, Math.max(0, (pw.length - 6) * 6));
    return Math.min(100, s);
  };

  // Update password strength
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    
    const sc = scorePassword(val);
    setStrengthScore(sc);
    
    if (sc < 40) {
      setStrengthClass('weak');
      setStrengthText('Mật khẩu yếu – thêm chữ hoa, số và ký tự đặc biệt.');
    } else if (sc < 75) {
      setStrengthClass('ok');
      setStrengthText('Tạm ổn – có thể mạnh hơn.');
    } else {
      setStrengthClass('good');
      setStrengthText('Mật khẩu mạnh.');
    }
    
    // Update match text if rePassword is already filled
    if (rePassword) {
      setMatchText(val === rePassword ? 'Khớp mật khẩu.' : 'Hai mật khẩu chưa khớp.');
    }
  };

  // Update re-password match
  const handleRePasswordChange = (e) => {
    const val = e.target.value;
    setRePassword(val);
    
    if (val) {
      setMatchText(val === password ? 'Khớp mật khẩu.' : 'Hai mật khẩu chưa khớp.');
    } else {
      setMatchText('');
    }
  };

  // Handle phone input (digits only)
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setPhone(val);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (username.length < 3) {
      alert('Tên đăng nhập tối thiểu 3 ký tự.');
      return;
    }
    if (password.length < 6) {
      alert('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    if (password !== rePassword) {
      alert('Hai mật khẩu không khớp.');
      return;
    }
    if (!tosAccepted) {
      alert('Bạn cần đồng ý Điều khoản.');
      return;
    }

    setLoading(true);

    try {
      // Call signup API with user-provided username
      const response = await signup({ 
        username, 
        email, 
        name: fullname, 
        phone, 
        password 
      });
      
      console.log('Signup response:', response);
      alert(`Đăng ký thành công! Chào mừng ${response.username}. Vui lòng đăng nhập.`);
      navigate('/login');
    } catch (error) {
      const msg = error?.response?.data?.detail || "Có lỗi xảy ra khi đăng ký";
      alert(msg);
      console.error("Lỗi đăng ký:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Header />

      <main className="page-wrap">
        <section className="auth-card">
          <div className="auth-head">
            Đăng ký tài khoản
            <span className="pill">Miễn phí</span>
          </div>

          <form className="auth-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="col-span-2">
                <label htmlFor="fullname">Họ và tên</label>
                <input 
                  id="fullname" 
                  className="input" 
                  type="text" 
                  name="fullname" 
                  required 
                  placeholder="Nguyễn Văn A"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                />
              </div>


              <div>
                <label htmlFor="email">Email</label>
                <input 
                  id="email" 
                  className="input" 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="phone">Số điện thoại</label>
                <input 
                  id="phone" 
                  className="input" 
                  type="tel" 
                  name="phone" 
                  pattern="^[0-9]{9,12}$" 
                  placeholder="09xxxxxxxx"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>


              <div className="col-span-2">
                <label htmlFor="username">Tên đăng nhập</label>
                <input 
                  id="username" 
                  className="input" 
                  type="text" 
                  name="username" 
                  required 
                  placeholder="username123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength="3"
                />
              </div>


              <div className="col-span-2">
                <label htmlFor="pw">Mật khẩu</label>
                <div className="pw-field">
                  <input 
                    id="pw" 
                    className="input" 
                    type={showPassword ? "text" : "password"}
                    minLength="6" 
                    required 
                    placeholder="Ít nhất 6 ký tự"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <button 
                    type="button" 
                    className="pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                {password && (
                  <div className={`strength strength--${strengthClass}`} aria-hidden="false">
                    <div 
                      className={`strength-bar--${strengthClass}`}
                      style={{ width: `${strengthScore}%` }}
                    ></div>
                  </div>
                )}
                <div className="muted">{password ? strengthText : 'Độ mạnh mật khẩu'}</div>
              </div>

              <div className="col-span-2">
                <label htmlFor="rePw">Nhập lại mật khẩu</label>
                <div className="pw-field">
                  <input 
                    id="rePw" 
                    className="input" 
                    type={showRePassword ? "text" : "password"}
                    minLength="6" 
                    required 
                    placeholder="Nhập lại mật khẩu"
                    value={rePassword}
                    onChange={handleRePasswordChange}
                  />
                  <button 
                    type="button" 
                    className="pw-toggle"
                    onClick={() => setShowRePassword(!showRePassword)}
                  >
                    {showRePassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <div 
                  className="muted" 
                  style={{ 
                    color: matchText.includes('Khớp') ? '#0a7a3d' : '#b42318' 
                  }}
                >
                  {matchText}
                </div>
              </div>
            </div>

            <div className="row-between">
              <label className="agree">
                <input 
                  type="checkbox" 
                  id="tos" 
                  required
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <a href="#" style={{color: 'var(--brand)', fontWeight: 700, textDecoration: 'none'}}>
                    Điều khoản dịch vụ
                  </a>
                </span>
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="auth-footer">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Copyright © 2025 Online Tutor. Developed by
          <button className="invisible-btn">Group 09, TDTU</button>.<br/>
          Reproduction or distribution without permission is prohibited.
        </p>
      </footer>
    </>
  );
};

export default Signup;
