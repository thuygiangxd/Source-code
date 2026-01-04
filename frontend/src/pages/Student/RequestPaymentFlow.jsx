// src/pages/Student/RequestPaymentFlow.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';


import { isAuthenticated } from '../../services/authService';
import { getMe } from '../../services/userService';
import { getRegistrationById } from "../../services/academicService";
import "./RequestPaymentFlow.css";

import api from "../../services/api";

import {
  createPaymentIntent,
  requestOtp,
  confirmPayment,
  failPaymentOtp,
} from "../../services/paymentService";

/**
 * Component nhận dữ liệu form từ RequestForm qua location.state:
 * navigate('/request-payment', { state: { formData } })
 */
const RequestPaymentFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const regId = location.state?.regId;
  const [registration, setRegistration] = useState(null);


  const formData = location.state?.formData || null;

  const [user, setUser] = useState(null);

  // step = 1..4 tương ứng 4 modal
  const [step, setStep] = useState(1);

  // Payment + OTP
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  // ====== GUARD: phải có form + login ======
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (!formData) {
      // không có dữ liệu form → quay lại trang chính
      navigate('/student');
    }
  }, [formData, navigate]);

  // ====== Lấy thông tin user hiện tại ======
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch (err) {
        console.error('Lỗi getMe trong RequestPaymentFlow:', err);
      }
    };
    fetchMe();
  }, []);

  // ====== Lấy thông tin registration (nếu có regId) ======
  useEffect(() => {
    const loadReg = async () => {
      if (!regId) return;

      try {
        const data = await getRegistrationById(regId);
        setRegistration(data);
      } catch (err) {
        console.error("Lỗi load registration:", err);
      }
    };

    loadReg();
  }, [regId]);

  // ====== Đếm ngược OTP ======
  useEffect(() => {
    if (otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpTimer]);

  // Hết giờ OTP → đánh dấu fail (nếu có intent_id)
  useEffect(() => {
    const expireOtp = async () => {
      if (otpTimer === 0 && paymentIntent?.intent_id) {
        try {
          await failPaymentOtp(paymentIntent.intent_id);
          console.log('OTP đã hết hạn, đánh dấu failed.');
        } catch (err) {
          console.error('Lỗi failPaymentOtp khi hết hạn:', err);
        }
      }
    };
    expireOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpTimer]);

  const formatVND = (val) => {
    if (!val) return '0đ';
    const n = typeof val === 'number' ? val : parseInt(val, 10) || 0;
    return `${n.toLocaleString('vi-VN')}đ`;
  };

  if (!formData) {
    return null; // đã redirect ở useEffect
  }
  
  if (!registration) {
    return <div>Đang tải thông tin đăng ký...</div>;
  }
  // Lấy thông tin Registration
  const subject = registration.subject;
  const grade = registration.grade;
  const mode = registration.type;
  const amountNumber = parseInt(registration.default_fee, 10);
  const studyLocation = registration.address;
  const note = registration.note;

  const schedule = registration.schedule_json;
  const time_preference =
    `${registration.start_date} → ${registration.end_date} • ${schedule.days.join(", ")} • ${schedule.start_time}–${schedule.end_time}`;


  const {
    name,
    phone
  //   subject,
  //   grade,
  //   mode,
  //   location: studyLocation,
  //   budget,
  //   time_preference,
  //   note,
  } = formData;

  // const amountNumber = parseInt(budget, 10) || 0;
  const paymentDescription = `Đăng ký tìm gia sư – ${subject || 'Môn học'} – ${
    grade || 'Khối/lớp'
  }`;

  // ================== STEP 2 → TẠO INTENT + GỬI OTP ==================
  const handleStartPayment = async () => {
    try {
      setIsSendingOtp(true);
      setError('');

      /**
       * ⚠️ TÙY BACKEND:
       * Ở đây giả sử bạn có thể tạo PaymentIntent chỉ với amount + description.
       * Nếu backend yêu cầu request_id, hãy:
       * 1. Gọi API tạo "tutor_request_draft" trước, nhận id
       * 2. Truyền id đó vào createPaymentIntent(id)
       */
      const intentPayload = {
        amount: amountNumber,
        description: paymentDescription,
        // có thể gửi kèm metadata nếu backend hỗ trợ
        metadata: {
          name,
          phone,
          subject,
          grade,
        },
      };

      const intent = await createPaymentIntent(regId);
      await requestOtp(intent.intent_id);

      setPaymentIntent(intent);
      setStep(3);
      setOtpCode('');
      setOtpTimer(600); // 10 phút
    } catch (err) {
      console.error('Lỗi khởi tạo thanh toán:', err);
      // Nếu backend trả lỗi số dư
      const backendMessage = err?.response?.data?.detail;

      if (backendMessage === "Insufficient balance. Please deposit more to continue.") {
        setError("Số dư không đủ, vui lòng nạp thêm để tiếp tục.");
      } else {
        setError("Không thể khởi tạo thanh toán. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ================== STEP 3 → XÁC NHẬN OTP & LƯU YÊU CẦU ==================
  const saveTutorRequestToBackend = async () => {
    /**
     * ⚠️ TODO: tuỳ endpoint backend của bạn
     * Ví dụ: POST /tutor-requests
     * Dưới đây chỉ là ví dụ, bạn sửa lại path + field cho khớp BE.
     */
    const payload = {
      name,
      phone,
      subject,
      grade,
      mode,
      location: studyLocation,
      budget: amountNumber,
      time_preference,
      note,
      // có thể lưu thêm user_id từ getMe (nếu backend cần)
      student_username: user?.username,
    };

    const res = await api.post('/tutor-requests', payload);
    return res.data;
  };

  const handleConfirmOtp = async () => {
    if (!paymentIntent?.intent_id) return;

    try {
      setIsProcessingPayment(true);
      setError('');

      await confirmPayment(paymentIntent.intent_id, otpCode);

      // ✅ Thanh toán OK → Lưu request xuống backend
      try {
        const saved = await saveTutorRequestToBackend();
        console.log('Yêu cầu gia sư đã được lưu:', saved);
      } catch (err) {
        console.error('Thanh toán thành công nhưng lưu request bị lỗi:', err);
        // tuỳ bạn có muốn show lỗi hay vẫn coi là success
      }

      setStep(4); // sang modal thành công
    } catch (err) {
      console.error('Lỗi xác nhận OTP:', err);
      setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleResendOtp = async () => {
    if (!paymentIntent?.intent_id) return;
    try {
      setIsSendingOtp(true);
      setError('');
      await requestOtp(paymentIntent.intent_id);
      setOtpTimer(600); // 10 phút lại từ đầu
    } catch (err) {
      console.error('Lỗi gửi lại OTP:', err);
      setError('Không thể gửi lại OTP. Vui lòng thử lại sau.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleBackFromOtp = async () => {
    // đánh dấu failed intent hiện tại rồi quay về modal payment
    try {
      if (paymentIntent?.intent_id) {
        await failPaymentOtp(paymentIntent.intent_id);
      }
    } catch (err) {
      console.error('Lỗi failPaymentOtp khi quay lại:', err);
    } finally {
      setStep(2);
      setOtpCode('');
    }
  };

  const handleCloseAll = () => {
    // quay về trang học sinh / homepage tuỳ flow của bạn
    navigate('/student');
  };

  // ================== RENDER ==================
  return (
    <div className="course-page">
      <DynamicHeader />

      <main>
        {/* có thể thêm breadcrumb / heading nếu muốn */}
      </main>

      {/* ===== Modal 1: Review thông tin yêu cầu ===== */}
      {step === 1 && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Thông tin đăng ký tìm gia sư</h2>
              <button
                type="button"
                className="close-btn"
                onClick={handleCloseAll}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Họ tên:</strong> {name}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {phone}
              </p>
              <p>
                <strong>Môn học:</strong> {subject}
              </p>
              <p>
                <strong>Khối/Lớp:</strong> {grade}
              </p>
              <p>
                <strong>Hình thức học:</strong>{' '}
                {mode === 'online'
                  ? 'Online'
                  : mode === 'offline'
                  ? 'Offline'
                  : mode || '—'}
              </p>
              {mode === 'offline' && (
                <p>
                  <strong>Địa chỉ học:</strong> {studyLocation || '—'}
                </p>
              )}
              <p>
                <strong>Thù lao mong muốn:</strong> {formatVND(amountNumber)}
              </p>
              <p>
                <strong>Lịch học dự kiến:</strong>{' '}
                {time_preference || '—'}
              </p>
              {note && (
                <p>
                  <strong>Ghi chú:</strong> {note}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCloseAll}
              >
                Đóng
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={() => setStep(2)}
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal 2: Xác nhận thanh toán ===== */}
      {step === 2 && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Xác nhận thanh toán</h2>
            </div>
            <div className="modal-body">
              <p>
                <strong>Mã học viên:</strong> {user?.username || '---'}
              </p>
              <p>
                <strong>Họ tên:</strong> {user?.name || name}
              </p>
              <p>
                <strong>Tên TK:</strong> Trung Tâm GIASUNO1
              </p>
              <p>
                <strong>Số tiền:</strong> {formatVND(amountNumber)}
              </p>
              <p>
                <strong>Nội dung:</strong> {paymentDescription}
              </p>
              <p>
                <strong>Lịch học dự kiến:</strong>{' '}
                {time_preference || '---'}
              </p>
              {error && (
                <p style={{ color: '#b81f3d', marginTop: 8 }}>{error}</p>
              )}
            </div>
            <div className="modal-footer modal-actions">
              <button
                type="button"
                className="cancelPayment-btn"
                onClick={() => setStep(1)}
                disabled={isSendingOtp}
              >
                Hủy
              </button>
              <button
                type="button"
                className="confirmPayment-btn"
                onClick={handleStartPayment}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Đang khởi tạo...' : 'Tiếp tục thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal 3: Nhập OTP ===== */}
      {step === 3 && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Xác thực OTP để tiến hành thanh toán</h2>
            </div>
            <div className="modal-body">
              <p>Vui lòng nhập mã OTP được gửi tới email của bạn:</p>
              <input
                type="text"
                className="otp-input"
                placeholder="Nhập mã OTP"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, ''))
                }
              />
              <div className="otp-row">
                {isSendingOtp ? (
                  <span className="loading">⏳ Đang gửi OTP...</span>
                ) : (
                  <button
                    type="button"
                    className="resend-otp"
                    onClick={handleResendOtp}
                    disabled={otpTimer > 0}
                  >
                    {otpTimer > 0
                      ? `Gửi lại sau ${Math.floor(otpTimer / 60)}:${String(
                          otpTimer % 60
                        ).padStart(2, '0')}`
                      : 'Gửi lại OTP'}
                  </button>
                )}
              </div>
              {error && (
                <p style={{ color: '#b81f3d', marginTop: 8 }}>{error}</p>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleBackFromOtp}
                  disabled={isProcessingPayment}
                >
                  Quay về
                </button>
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={handleConfirmOtp}
                  disabled={otpCode.length !== 6 || isProcessingPayment}
                >
                  {isProcessingPayment ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal 4: Thành công ===== */}
      {step === 4 && (
        <div className="modal show">
          <div className="modal-content success-modal">
            <div className="modal-header">
              <h2>Thanh toán thành công</h2>
            </div>
            <div className="modal-body">
              <p>
                Cảm ơn bạn đã hoàn tất thanh toán. Yêu cầu tìm gia sư của bạn
                đã được ghi nhận. Lớp mới sẽ xuất hiện ở phía gia sư để đăng ký
                dạy.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="confirm-btn"
                onClick={handleCloseAll}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RequestPaymentFlow;
