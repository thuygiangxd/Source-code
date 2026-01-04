// src/pages/Student/Support.jsx

import { useState, useEffect } from 'react';
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';
import '../../components/Header.css';
import './Support.css';

const LS_KEY = 'studentSupportRequests.v1';

const requestTypeLabel = (type) => {
  switch (type) {
    case 'schedule':
      return 'Thay đổi lịch học';
    case 'tutor':
      return 'Phản hồi về gia sư';
    case 'payment':
      return 'Thắc mắc học phí / thanh toán';
    case 'other':
      return 'Yêu cầu khác';
    default:
      return type;
  }
};

const Support = () => {
  const [requestTab, setRequestTab] = useState('submit'); // 'submit' | 'list'
  const [requestForm, setRequestForm] = useState({
    type: '',       // bắt buộc chọn trước
    courseId: '',
    from: '',
    to: '',
    reason: '',
  });
  const [requests, setRequests] = useState([]);

  // load danh sách đơn từ localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setRequests(parsed);
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const saveRequests = (next) => {
    setRequests(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const handleSubmitRequest = () => {
    const { type, courseId, from, to, reason } = requestForm;

    // 1. Bắt buộc chọn loại yêu cầu
    if (!type) {
      alert('Vui lòng chọn loại yêu cầu trước khi gửi.');
      return;
    }

    // 2. Validate theo từng loại
    if (!reason || !reason.trim()) {
      alert('Vui lòng nhập Nội dung chi tiết.');
      return;
    }

    if (type === 'schedule') {
      if (!courseId) {
        alert('Vui lòng chọn khóa học / lớp học cho yêu cầu thay đổi lịch.');
        return;
      }
      if (!from || !to) {
        alert('Vui lòng chọn đầy đủ Từ ngày và Đến ngày cho yêu cầu thay đổi lịch.');
        return;
      }
    }

    if (type === 'tutor') {
      if (!courseId) {
        alert('Vui lòng chọn khóa học / lớp học khi phản hồi về gia sư.');
        return;
      }
    }

    // type === 'payment' và 'other' chỉ bắt buộc reason (đã check ở trên)

    const r = {
      ...requestForm,
      ts: Date.now(),
      status: 'waiting',
    };
    const next = [r, ...requests];
    saveRequests(next);

    setRequestForm({
      type: '',
      courseId: '',
      from: '',
      to: '',
      reason: '',
    });

    alert('Đã gửi yêu cầu hỗ trợ. Trung tâm sẽ phản hồi sớm nhất có thể.');
  };

  const handleDeleteRequest = (index) => {
    const next = [...requests];
    next.splice(index, 1);
    saveRequests(next);
  };

  const isSchedule = requestForm.type === 'schedule';
  const isTutor = requestForm.type === 'tutor';
  const isPayment = requestForm.type === 'payment';
  const isOther = requestForm.type === 'other';

  return (
    <>
      <DynamicHeader />

      <div className="shell no-sidebar">
        <main className="content-area">
          <section className="content-section active">
            <div className="notice-header">
              <h3>📮 Hỗ trợ học viên</h3>
            </div>

            {/* Tabs ngang giống trong Student/Tutor */}
            <div className="register-tabs">
              <button
                className={`register-tab-btn ${
                  requestTab === 'submit' ? 'is-active' : ''
                }`}
                onClick={() => setRequestTab('submit')}
              >
                Gửi yêu cầu hỗ trợ
              </button>
              <button
                className={`register-tab-btn ${
                  requestTab === 'list' ? 'is-active' : ''
                }`}
                onClick={() => setRequestTab('list')}
              >
                Lịch sử yêu cầu
              </button>
            </div>

            {/* TAB 1: Gửi yêu cầu hỗ trợ */}
            {requestTab === 'submit' && (
              <div className="card soft">
                <div className="stack">
                  <label className="field">
                    <div className="field-label">
                        Loại yêu cầu <span className="required">*</span>
                    </div>
                    <select
                      id="rqType"
                      value={requestForm.type}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          type: e.target.value,
                          // khi đổi loại, có thể reset bớt field không cần
                          // để tránh dữ liệu cũ “dính” qua
                          ...(e.target.value === 'other'
                            ? { courseId: '', from: '', to: '' }
                            : {}),
                        })
                      }
                    >
                      <option value="">-- Chọn loại yêu cầu --</option>
                      <option value="schedule">Thay đổi / sắp xếp lại lịch học</option>
                      <option value="tutor">Phản hồi về gia sư / buổi học</option>
                      <option value="payment">Học phí, thanh toán, hoàn tiền</option>
                      <option value="other">Khác</option>
                    </select>
                  </label>

                  {/* Chỉ hiển thị các field thêm khi đã chọn loại yêu cầu */}
                  {!isOther && requestForm.type && (
                    <label className="field">
                      <div className="field-label">
                            Áp dụng cho khóa học / lớp học <span className="required">*</span>
                        </div>
                      {(isSchedule || isTutor)
                    //   && (
                    //     <span className="required"> *</span>
                    //   )
                      }
                      <select
                        id="rqCourse"
                        value={requestForm.courseId}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            courseId: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Chọn khóa học / lớp học --</option>
                        {/* sau này bind danh sách khóa học/lớp của học viên vào đây */}
                      </select>
                    </label>
                  )}

                  {/* Ngày tháng chỉ cần cho loại schedule */}
                  {isSchedule && (
                    <div className="grid2">
                      <label className="field">
                        <div className="field-label">
                        Từ ngày <span className="required">*</span>
                        </div>
                        <input
                          id="rqFrom"
                          type="date"
                          value={requestForm.from}
                          onChange={(e) =>
                            setRequestForm({
                              ...requestForm,
                              from: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <div className="field-label">
                        Đến ngày <span className="required">*</span>
                        </div>
                        <input
                          id="rqTo"
                          type="date"
                          value={requestForm.to}
                          onChange={(e) =>
                            setRequestForm({
                              ...requestForm,
                              to: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  )}

                  <label className="field">
                    <div className="field-label">
                        Nội dung chi tiết <span className="required">*</span>
                    </div>
                    <textarea
                      id="rqReason"
                      rows="4"
                      placeholder={
                        isSchedule
                          ? 'Mô tả rõ buổi / khoảng thời gian muốn đổi, lý do thay đổi, thời gian đề xuất...'
                          : isTutor
                          ? 'Mô tả buổi học, tên gia sư (nếu có), nội dung muốn phản hồi...'
                          : isPayment
                          ? 'Mô tả vấn đề về học phí, thanh toán, hoàn tiền...'
                          : 'Mô tả rõ vấn đề bạn gặp phải, mong muốn xử lý như thế nào...'
                      }
                      value={requestForm.reason}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          reason: e.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="hstack">
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitRequest}
                    >
                      Gửi yêu cầu
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        setRequestForm({
                          type: '',
                          courseId: '',
                          from: '',
                          to: '',
                          reason: '',
                        })
                      }
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Lịch sử yêu cầu */}
            {requestTab === 'list' && (
              <div className="card soft">
                <strong>Lịch sử yêu cầu hỗ trợ</strong>
                <div id="rqList" className="stack">
                  {requests.length > 0 ? (
                    requests.map((r, index) => (
                      <div key={index} className="file-item">
                        <div>
                          <div>
                            <strong>{requestTypeLabel(r.type)}</strong>{' '}
                            <span className="tag wait">Đang xử lý</span>
                          </div>
                          <div className="uid">
                            {r.courseId || '—'} • {r.from || '—'} → {r.to || '—'} •{' '}
                            {new Date(r.ts).toLocaleString()}
                          </div>
                          <div className="uid">
                            Nội dung: {r.reason || '—'}
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost mini"
                          onClick={() => handleDeleteRequest(index)}
                        >
                          Xóa
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="uid">Chưa có yêu cầu hỗ trợ nào.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Support;
