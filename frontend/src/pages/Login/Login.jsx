
// import { useNavigate } from "react-router-dom";
// import { login } from "../../services/authService";  
// import React, { useState, useRef, useEffect } from 'react';
// import './Login.css';
// import Header from '../../components/Header';

// const Login = () => {

//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [userData, setUserData] = useState(null);


//   // Login form states
//   const [username, setUsername]  = useState('');
//   const [password, setPassword] = useState('');
//   const [email, setEmail] = useState('');
//   const [rememberMe, setRememberMe] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
  

//   // State for forgot password modal
//   const [showModal, setShowModal] = useState(false);
//   const [currentStep, setCurrentStep] = useState('email'); // email, otp, reset
//   const [fpEmail, setFpEmail] = useState('');
//   const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
//   const [otpTimer, setOtpTimer] = useState('05:00');
//   const [otpExpired, setOtpExpired] = useState(false);
//   const [resendDisabled, setResendDisabled] = useState(true);
//   const [newPassword, setNewPassword] = useState('');
//   const [rePassword, setRePassword] = useState('');
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showRePassword, setShowRePassword] = useState(false);
//   const [otpMessage, setOtpMessage] = useState('');
//   const [resetMessage, setResetMessage] = useState('');

//   // Refs
//   const otpInputRefs = useRef([]);
//   const currentOTPRef = useRef('');
//   const otpExpireAtRef = useRef(0);
//   const timerIdRef = useRef(null);
//   const resendCooldownIdRef = useRef(null);

//   // Login form handlers
//   // const handleLoginSubmit = (e) => {
//   //   e.preventDefault();
//   //   if (e.target.reportValidity()) {
//   //     alert("Đăng nhập thành công!");
//   //     window.location = "Homepage.html";
//   //   }
//   // };
//   const handleLoginSubmit = async (e) => {
//     e.preventDefault();

//     // 🧩 Kiểm tra dữ liệu đầu vào
//     if (!username || !password) {
//       alert("Vui lòng nhập đầy đủ thông tin đăng nhập.");
//       return;
//     }

//     setLoading(true); // bật loading trước khi gọi API

//     try {
//       await login({ username, password }); // gọi API login và decode token
      
//       // Lấy role từ localStorage (đã được decode từ token)
//       const userStr = localStorage.getItem("user");
//       const user = userStr ? JSON.parse(userStr) : null;
      
//       console.log('✅ User from localStorage:', user);
      
//       // Chuyển hướng dựa trên role
//       if (user?.role === 'tutor') {
//         navigate("/tutor");
//       } else if (user?.role === 'student') {
//         navigate("/student");
//       } else {
//         navigate("/student"); // default
//       }
//     } catch (error) {
//       const msg = error?.response?.data?.detail || "Có lỗi xảy ra khi đăng nhập";
//       alert(msg);
//       console.error("Lỗi:", error);
//     } finally {
//       setLoading(false); // tắt loading sau khi xử lý xong
//     }
//   };

//   // Modal handlers
//   const openModal = () => {
//     setShowModal(true);
//     setCurrentStep('email');
//     setFpEmail('');
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     clearInterval(timerIdRef.current);
//     clearInterval(resendCooldownIdRef.current);
//   };

//   // OTP Timer
//   const startOtpTimer = (seconds = 300) => {
//     otpExpireAtRef.current = Date.now() + seconds * 1000;
//     setOtpExpired(false);
//     clearInterval(timerIdRef.current);
    
//     timerIdRef.current = setInterval(() => {
//       const remain = Math.max(0, Math.floor((otpExpireAtRef.current - Date.now()) / 1000));
//       const mm = String(Math.floor(remain / 60)).padStart(2, '0');
//       const ss = String(remain % 60).padStart(2, '0');
//       setOtpTimer(`${mm}:${ss}`);
      
//       if (remain <= 0) {
//         clearInterval(timerIdRef.current);
//         setOtpMessage('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
//         setOtpExpired(true);
//         setResendDisabled(false);
//       }
//     }, 250);
//   };

//   // Resend cooldown
//   const startResendCooldown = (seconds = 60) => {
//     setResendDisabled(true);
//     let left = seconds;
//     clearInterval(resendCooldownIdRef.current);
    
//     resendCooldownIdRef.current = setInterval(() => {
//       left--;
//       if (left <= 0) {
//         clearInterval(resendCooldownIdRef.current);
//         setResendDisabled(false);
//       }
//     }, 1000);
//   };

//   // Generate OTP
//   const genOTP = () => {
//     return Math.floor(100000 + Math.random() * 900000).toString();
//   };

//   // Step 1: Send OTP
//   const handleSendOTP = (e) => {
//     e.preventDefault();
//     if (e.target.reportValidity()) {
//       currentOTPRef.current = genOTP();
//       console.log('[DEMO] OTP gửi tới', fpEmail, '→', currentOTPRef.current);
//       setCurrentStep('otp');
//       startOtpTimer(300);
//       startResendCooldown(60);
//       setOtpValues(['', '', '', '', '', '']);
//       setOtpMessage('Mã OTP đã được gửi. Kiểm tra email của bạn.');
//       setOtpExpired(false);
//     }
//   };

//   // Resend OTP
//   const handleResendOTP = () => {
//     currentOTPRef.current = genOTP();
//     console.log('[DEMO] OTP mới:', currentOTPRef.current);
//     startOtpTimer(300);
//     startResendCooldown(60);
//     setOtpMessage('Đã gửi lại mã OTP. Hãy nhập mã mới.');
//   };

//   // OTP input handlers
//   const handleOtpChange = (index, value) => {
//     const newValue = value.replace(/\D/g, '');
//     const newOtpValues = [...otpValues];
//     newOtpValues[index] = newValue;
//     setOtpValues(newOtpValues);
    
//     if (newValue && index < 5) {
//       otpInputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
//       otpInputRefs.current[index - 1]?.focus();
//     }
//     if (e.key === 'ArrowLeft' && index > 0) {
//       otpInputRefs.current[index - 1]?.focus();
//     }
//     if (e.key === 'ArrowRight' && index < 5) {
//       otpInputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpPaste = (e) => {
//     const data = (e.clipboardData || window.clipboardData)
//       .getData('text')
//       .replace(/\D/g, '')
//       .slice(0, 6);
    
//     if (data) {
//       e.preventDefault();
//       const newOtpValues = [...otpValues];
//       for (let i = 0; i < 6; i++) {
//         newOtpValues[i] = data[i] || '';
//       }
//       setOtpValues(newOtpValues);
//       otpInputRefs.current[Math.min(data.length, 6) - 1]?.focus();
//     }
//   };

//   // Step 2: Verify OTP
//   const handleVerifyOTP = (e) => {
//     e.preventDefault();
//     const code = otpValues.join('');
    
//     if (Date.now() > otpExpireAtRef.current) {
//       setOtpMessage('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
//       setResendDisabled(false);
//       return;
//     }
//     if (code.length !== 6) {
//       setOtpMessage('Vui lòng nhập đủ 6 số.');
//       return;
//     }
//     if (code !== currentOTPRef.current) {
//       setOtpMessage('Mã OTP không đúng.');
//       return;
//     }
    
//     clearInterval(timerIdRef.current);
//     setCurrentStep('reset');
//   };

//   // Step 3: Reset password
//   const handleResetPassword = (e) => {
//     e.preventDefault();
    
//     if (newPassword.length < 6) {
//       setResetMessage('Mật khẩu tối thiểu 6 ký tự.');
//       return;
//     }
//     if (newPassword !== rePassword) {
//       setResetMessage('Hai mật khẩu không khớp.');
//       return;
//     }
    
//     alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
//     closeModal();
//     setEmail('');
//     setPassword('');
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       clearInterval(timerIdRef.current);
//       clearInterval(resendCooldownIdRef.current);
//     };
//   }, []);

//   return (
//     <>
//       <Header />

//       <main className="page-wrap">
//         <section className="auth-card">
//           <div className="auth-head">
//             Đăng nhập
//             <span className="pill">Thành viên</span>
//           </div>

//           <form className="auth-body" onSubmit={handleLoginSubmit}>
//             <div>
//               <label htmlFor="username">Tên đăng nhập</label>
//               <input 
//                 className="input" 
//                 id="username" 
//                 type="text" 
//                 name="username" 
//                 required 
//                 placeholder="Username của bạn"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 disabled={loading}
//               />
//             </div>

//             <div className="pw-wrap">
//               <label htmlFor="pw">Mật khẩu</label>
//               <div className="pw-field">
//                 <input 
//                   className="input" 
//                   id="pw" 
//                   type={showPassword ? "text" : "password"}
//                   name="password" 
//                   placeholder="••••••••" 
//                   minLength="3" 
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <button 
//                   type="button" 
//                   className="pw-toggle"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? 'Ẩn' : 'Hiện'}
//                 </button>
//               </div>
//             </div>

//             <div className="row-between">
//               <label className="agree">
//                 <input 
//                   type="checkbox" 
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                 />
//                 <span>Ghi nhớ</span>
//               </label>
//               <button type="button" className="text-link" onClick={openModal}>
//                 Quên mật khẩu?
//               </button>
//             </div>

//             <button type="submit" className="btn btn-primary">Đăng nhập</button>
//           </form>

//           <div className="auth-footer">
//             Chưa có tài khoản? <a href="\signup">Đăng ký</a>
//           </div>
//         </section>
//       </main>

//       <footer className="footer">
//         <p>
//           Copyright © 2025 Online Tutor. Developed by
//           <button className="invisible-btn">Group 09, TDTU</button>.<br/>
//           Reproduction or distribution without permission is prohibited.
//         </p>
//       </footer>

//       {/* Forgot Password Modal */}
//       {showModal && (
//         <div className="modal show" onClick={(e) => e.target.className.includes('modal') && closeModal()}>
//           <div className="modal-card" role="dialog" aria-modal="true">
//             <div className="modal-head">
//               <span>
//                 {currentStep === 'email' ? 'Quên mật khẩu' : 
//                  currentStep === 'otp' ? 'Xác nhận OTP' : 'Đặt lại mật khẩu'}
//               </span>
//               <button className="btn-ghost" onClick={closeModal} aria-label="Đóng">✕</button>
//             </div>
//             <div className="modal-body">
              
//               {/* Step 1: Email */}
//               {currentStep === 'email' && (
//                 <form className="fp-step active" onSubmit={handleSendOTP}>
//                   <div>
//                     <label htmlFor="fpEmail">Email khôi phục</label>
//                     <input 
//                       id="fpEmail" 
//                       className="input" 
//                       type="email" 
//                       required 
//                       placeholder="ten@email.com"
//                       value={fpEmail}
//                       onChange={(e) => setFpEmail(e.target.value)}
//                     />
//                   </div>
//                   <div className="modal-actions">
//                     <button type="submit" className="btn btn-primary">Gửi mã OTP</button>
//                     <button type="button" className="btn btn-ghost" onClick={closeModal}>Huỷ</button>
//                   </div>
//                   <p className="text-muted">Mã OTP sẽ được gửi tới email và <b>hết hạn sau 5 phút</b>.</p>
//                 </form>
//               )}

//               {/* Step 2: OTP */}
//               {currentStep === 'otp' && (
//                 <form className="fp-step active" onSubmit={handleVerifyOTP}>
//                   <div>
//                     <label>Nhập mã OTP</label>
//                     <div className="otp-grid">
//                       {otpValues.map((value, index) => (
//                         <input
//                           key={index}
//                           ref={(el) => otpInputRefs.current[index] = el}
//                           className="otp-input"
//                           inputMode="numeric"
//                           maxLength="1"
//                           value={value}
//                           onChange={(e) => handleOtpChange(index, e.target.value)}
//                           onKeyDown={(e) => handleOtpKeyDown(index, e)}
//                           onPaste={handleOtpPaste}
//                           aria-label={`OTP ${index + 1}`}
//                         />
//                       ))}
//                     </div>
//                     <div className="otp-meta" style={{marginTop: '8px'}}>
//                       <span className="text-muted">Hết hạn sau: <b>{otpTimer}</b></span>
//                       <button 
//                         type="button" 
//                         className="text-link" 
//                         onClick={handleResendOTP}
//                         disabled={resendDisabled}
//                       >
//                         Gửi lại mã
//                       </button>
//                     </div>
//                     {otpMessage && (
//                       <div className={otpExpired ? 'error' : 'text-muted'}>{otpMessage}</div>
//                     )}
//                   </div>
//                   <div className="modal-actions">
//                     <button type="submit" className="btn btn-primary">Xác nhận</button>
//                     <button type="button" className="btn btn-ghost" onClick={() => setCurrentStep('email')}>
//                       Quay lại
//                     </button>
//                   </div>
//                 </form>
//               )}

//               {/* Step 3: Reset password */}
//               {currentStep === 'reset' && (
//                 <form className="fp-step active" onSubmit={handleResetPassword}>
//                   <div className="pw-wrap">
//                     <label htmlFor="newPw">Mật khẩu mới</label>
//                     <div className="pw-field">
//                       <input 
//                         className="input" 
//                         id="newPw" 
//                         type={showNewPassword ? "text" : "password"}
//                         minLength="6" 
//                         required 
//                         placeholder="Mật khẩu mới (≥ 6 ký tự)"
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                       />
//                       <button 
//                         type="button" 
//                         className="pw-toggle"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                       >
//                         {showNewPassword ? 'Ẩn' : 'Hiện'}
//                       </button>
//                     </div>
//                   </div>
//                   <div className="pw-wrap">
//                     <label htmlFor="rePw">Nhập lại mật khẩu</label>
//                     <div className="pw-field">
//                       <input 
//                         className="input" 
//                         id="rePw" 
//                         type={showRePassword ? "text" : "password"}
//                         minLength="6" 
//                         required 
//                         placeholder="Nhập lại mật khẩu"
//                         value={rePassword}
//                         onChange={(e) => setRePassword(e.target.value)}
//                       />
//                       <button 
//                         type="button" 
//                         className="pw-toggle"
//                         onClick={() => setShowRePassword(!showRePassword)}
//                       >
//                         {showRePassword ? 'Ẩn' : 'Hiện'}
//                       </button>
//                     </div>
//                   </div>
//                   {resetMessage && <div className="error">{resetMessage}</div>}
//                   <div className="modal-actions">
//                     <button type="submit" className="btn btn-primary">Đặt lại mật khẩu</button>
//                     <button type="button" className="btn btn-ghost" onClick={closeModal}>Đóng</button>
//                   </div>
//                 </form>
//               )}

//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Login;






// SUA

import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService";  
import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import Header from '../../components/Header';

const Login = () => {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);


  // Login form states
  const [username, setUsername]  = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  

  // State for forgot password modal
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState('email'); // email, otp, reset
  const [fpEmail, setFpEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState('05:00');
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Refs
  const otpInputRefs = useRef([]);
  const currentOTPRef = useRef('');
  const otpExpireAtRef = useRef(0);
  const timerIdRef = useRef(null);
  const resendCooldownIdRef = useRef(null);

  // Login form handlers
  // const handleLoginSubmit = (e) => {
  //   e.preventDefault();
  //   if (e.target.reportValidity()) {
  //     alert("Đăng nhập thành công!");
  //     window.location = "Homepage.html";
  //   }
  // };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // 🧩 Kiểm tra dữ liệu đầu vào
    if (!username || !password) {
      alert("Vui lòng nhập đầy đủ thông tin đăng nhập.");
      return;
    }

    setLoading(true); // bật loading trước khi gọi API

    try {
      await login({ username, password }); // gọi API login và decode token
      
      // Lấy role từ localStorage (đã được decode từ token)
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log('✅ User from localStorage:', user);
      
      // Chuyển hướng dựa trên role
      if (user?.role === 'tutor') {
        navigate("/tutor");
      } else if (user?.role === 'student') {
        navigate("/student");
      } else if (user?.role === 'staff') {
        navigate("/hr");
      } else if (user?.role === 'admin') {
        navigate("/act");
      } else {
        navigate("/student"); // default
      }
    } catch (error) {
      const msg = error?.response?.data?.detail || "Có lỗi xảy ra khi đăng nhập";
      alert(msg);
      console.error("Lỗi:", error);
    } finally {
      setLoading(false); // tắt loading sau khi xử lý xong
    }
  };

  // Modal handlers
  const openModal = () => {
    setShowModal(true);
    setCurrentStep('email');
    setFpEmail('');
  };

  const closeModal = () => {
    setShowModal(false);
    clearInterval(timerIdRef.current);
    clearInterval(resendCooldownIdRef.current);
  };

  // OTP Timer
  const startOtpTimer = (seconds = 300) => {
    otpExpireAtRef.current = Date.now() + seconds * 1000;
    setOtpExpired(false);
    clearInterval(timerIdRef.current);
    
    timerIdRef.current = setInterval(() => {
      const remain = Math.max(0, Math.floor((otpExpireAtRef.current - Date.now()) / 1000));
      const mm = String(Math.floor(remain / 60)).padStart(2, '0');
      const ss = String(remain % 60).padStart(2, '0');
      setOtpTimer(`${mm}:${ss}`);
      
      if (remain <= 0) {
        clearInterval(timerIdRef.current);
        setOtpMessage('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
        setOtpExpired(true);
        setResendDisabled(false);
      }
    }, 250);
  };

  // Resend cooldown
  const startResendCooldown = (seconds = 60) => {
    setResendDisabled(true);
    let left = seconds;
    clearInterval(resendCooldownIdRef.current);
    
    resendCooldownIdRef.current = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(resendCooldownIdRef.current);
        setResendDisabled(false);
      }
    }, 1000);
  };

  // Generate OTP
  const genOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: Send OTP
  const handleSendOTP = (e) => {
    e.preventDefault();
    if (e.target.reportValidity()) {
      currentOTPRef.current = genOTP();
      console.log('[DEMO] OTP gửi tới', fpEmail, '→', currentOTPRef.current);
      setCurrentStep('otp');
      startOtpTimer(300);
      startResendCooldown(60);
      setOtpValues(['', '', '', '', '', '']);
      setOtpMessage('Mã OTP đã được gửi. Kiểm tra email của bạn.');
      setOtpExpired(false);
    }
  };

  // Resend OTP
  const handleResendOTP = () => {
    currentOTPRef.current = genOTP();
    console.log('[DEMO] OTP mới:', currentOTPRef.current);
    startOtpTimer(300);
    startResendCooldown(60);
    setOtpMessage('Đã gửi lại mã OTP. Hãy nhập mã mới.');
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    const newValue = value.replace(/\D/g, '');
    const newOtpValues = [...otpValues];
    newOtpValues[index] = newValue;
    setOtpValues(newOtpValues);
    
    if (newValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const data = (e.clipboardData || window.clipboardData)
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    
    if (data) {
      e.preventDefault();
      const newOtpValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtpValues[i] = data[i] || '';
      }
      setOtpValues(newOtpValues);
      otpInputRefs.current[Math.min(data.length, 6) - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const code = otpValues.join('');
    
    if (Date.now() > otpExpireAtRef.current) {
      setOtpMessage('Mã OTP đã hết hạn. Vui lòng gửi lại mã.');
      setResendDisabled(false);
      return;
    }
    if (code.length !== 6) {
      setOtpMessage('Vui lòng nhập đủ 6 số.');
      return;
    }
    if (code !== currentOTPRef.current) {
      setOtpMessage('Mã OTP không đúng.');
      return;
    }
    
    clearInterval(timerIdRef.current);
    setCurrentStep('reset');
  };

  // Step 3: Reset password
  const handleResetPassword = (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setResetMessage('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== rePassword) {
      setResetMessage('Hai mật khẩu không khớp.');
      return;
    }
    
    alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
    closeModal();
    setEmail('');
    setPassword('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIdRef.current);
      clearInterval(resendCooldownIdRef.current);
    };
  }, []);

  return (
    <>
      <Header />

      <main className="page-wrap">
        <section className="auth-card">
          <div className="auth-head">
            Đăng nhập
            <span className="pill">Thành viên</span>
          </div>

          <form className="auth-body" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="username">Tên đăng nhập</label>
              <input 
                className="input" 
                id="username" 
                type="text" 
                name="username" 
                required 
                placeholder="Username của bạn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="pw-wrap">
              <label htmlFor="pw">Mật khẩu</label>
              <div className="pw-field">
                <input 
                  className="input" 
                  id="pw" 
                  type={showPassword ? "text" : "password"}
                  name="password" 
                  placeholder="••••••••" 
                  minLength="3" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div className="row-between">
              <label className="agree">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ</span>
              </label>
              <button type="button" className="text-link" onClick={openModal}>
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="btn btn-primary">Đăng nhập</button>
          </form>

          <div className="auth-footer">
            Chưa có tài khoản? <a href="\signup">Đăng ký</a>
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

      {/* Forgot Password Modal */}
      {showModal && (
        <div className="modal show" onClick={(e) => e.target.className.includes('modal') && closeModal()}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-head">
              <span>
                {currentStep === 'email' ? 'Quên mật khẩu' : 
                 currentStep === 'otp' ? 'Xác nhận OTP' : 'Đặt lại mật khẩu'}
              </span>
              <button className="btn-ghost" onClick={closeModal} aria-label="Đóng">✕</button>
            </div>
            <div className="modal-body">
              
              {/* Step 1: Email */}
              {currentStep === 'email' && (
                <form className="fp-step active" onSubmit={handleSendOTP}>
                  <div>
                    <label htmlFor="fpEmail">Email khôi phục</label>
                    <input 
                      id="fpEmail" 
                      className="input" 
                      type="email" 
                      required 
                      placeholder="ten@email.com"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary">Gửi mã OTP</button>
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>Huỷ</button>
                  </div>
                  <p className="text-muted">Mã OTP sẽ được gửi tới email và <b>hết hạn sau 5 phút</b>.</p>
                </form>
              )}

              {/* Step 2: OTP */}
              {currentStep === 'otp' && (
                <form className="fp-step active" onSubmit={handleVerifyOTP}>
                  <div>
                    <label>Nhập mã OTP</label>
                    <div className="otp-grid">
                      {otpValues.map((value, index) => (
                        <input
                          key={index}
                          ref={(el) => otpInputRefs.current[index] = el}
                          className="otp-input"
                          inputMode="numeric"
                          maxLength="1"
                          value={value}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          aria-label={`OTP ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className="otp-meta" style={{marginTop: '8px'}}>
                      <span className="text-muted">Hết hạn sau: <b>{otpTimer}</b></span>
                      <button 
                        type="button" 
                        className="text-link" 
                        onClick={handleResendOTP}
                        disabled={resendDisabled}
                      >
                        Gửi lại mã
                      </button>
                    </div>
                    {otpMessage && (
                      <div className={otpExpired ? 'error' : 'text-muted'}>{otpMessage}</div>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary">Xác nhận</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setCurrentStep('email')}>
                      Quay lại
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Reset password */}
              {currentStep === 'reset' && (
                <form className="fp-step active" onSubmit={handleResetPassword}>
                  <div className="pw-wrap">
                    <label htmlFor="newPw">Mật khẩu mới</label>
                    <div className="pw-field">
                      <input 
                        className="input" 
                        id="newPw" 
                        type={showNewPassword ? "text" : "password"}
                        minLength="6" 
                        required 
                        placeholder="Mật khẩu mới (≥ 6 ký tự)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="pw-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>
                  <div className="pw-wrap">
                    <label htmlFor="rePw">Nhập lại mật khẩu</label>
                    <div className="pw-field">
                      <input 
                        className="input" 
                        id="rePw" 
                        type={showRePassword ? "text" : "password"}
                        minLength="6" 
                        required 
                        placeholder="Nhập lại mật khẩu"
                        value={rePassword}
                        onChange={(e) => setRePassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="pw-toggle"
                        onClick={() => setShowRePassword(!showRePassword)}
                      >
                        {showRePassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>
                  {resetMessage && <div className="error">{resetMessage}</div>}
                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary">Đặt lại mật khẩu</button>
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>Đóng</button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
