import { useState, useEffect } from 'react';

const TrialForm = () => {
  const [trialForm, setTrialForm] = useState({
    name: '',
    phone: '',
    subject: '',
    grade: '',
    mode: '',
    scheduleDate: '',
    scheduleSlot: '',
    note: ''
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const timeSlots = ['07–09h', '09–11h', '13–15h', '15–17h', '19–21h'];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerOpen && !e.target.closest('.picker')) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [pickerOpen]);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const toISO = (date) => {
    return date.toISOString().slice(0, 10);
  };

  const applySchedule = () => {
    if (!selectedDate || !selectedSlot) {
      alert('Vui lòng chọn ngày và khung giờ.');
      return;
    }
    setTrialForm(prev => ({
      ...prev,
      scheduleDate: selectedDate,
      scheduleSlot: selectedSlot
    }));
    setPickerOpen(false);
  };

  const handleTrialFormSubmit = (e) => {
    e.preventDefault();
    if (!trialForm.scheduleDate || !trialForm.scheduleSlot) {
      alert('Bạn chưa chọn ngày & khung giờ học thử.');
      return;
    }
    alert('Đăng ký thành công! Chúng tôi sẽ liên hệ sớm để sắp lịch.');
    setTrialForm({
      name: '',
      phone: '',
      subject: '',
      grade: '',
      mode: '',
      scheduleDate: '',
      scheduleSlot: '',
      note: ''
    });
    setSelectedDate('');
    setSelectedSlot('');
  };

  return (
    <div className="trial-wrap card">
      <div className="trial-head">
        <strong>Đăng ký học thử</strong>
        <span className="pill">Miễn phí</span>
      </div>

      <form className="trial-body" onSubmit={handleTrialFormSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Họ và tên</span>
            <input 
              type="text" 
              name="name" 
              placeholder="Nguyễn Văn A" 
              value={trialForm.name}
              onChange={(e) => setTrialForm({...trialForm, name: e.target.value})}
              required 
            />
          </label>

          <label className="field">
            <span>Số điện thoại</span>
            <input 
              type="tel" 
              name="phone" 
              placeholder="09xx xxx xxx" 
              pattern="^[0-9+\s()-]{8,}$"
              value={trialForm.phone}
              onChange={(e) => setTrialForm({...trialForm, phone: e.target.value})}
              required 
            />
          </label>

          <label className="field">
            <span>Môn học</span>
            <select 
              name="subject" 
              value={trialForm.subject}
              onChange={(e) => setTrialForm({...trialForm, subject: e.target.value})}
              required
            >
              <option value="">Chọn môn</option>
              <option>Toán</option>
              <option>Vật lý</option>
              <option>Hóa học</option>
              <option>Ngữ văn</option>
              <option>Tiếng Anh</option>
              <option>Sinh học</option>
            </select>
          </label>

          <label className="field">
            <span>Lớp</span>
            <select 
              name="grade"
              value={trialForm.grade}
              onChange={(e) => setTrialForm({...trialForm, grade: e.target.value})}
              required
            >
              <option value="">Chọn lớp</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>

          <div className="field field--full">
            <span>Hình thức</span>
            <div className="inline-options">
              <label className="radio">
                <input 
                  type="radio" 
                  name="mode" 
                  value="Online"
                  checked={trialForm.mode === 'Online'}
                  onChange={(e) => setTrialForm({...trialForm, mode: e.target.value})}
                  required 
                />
                <span className="mark"></span>
                <span>Online</span>
              </label>
              <label className="radio">
                <input 
                  type="radio" 
                  name="mode" 
                  value="Offline"
                  checked={trialForm.mode === 'Offline'}
                  onChange={(e) => setTrialForm({...trialForm, mode: e.target.value})}
                  required 
                />
                <span className="mark"></span>
                <span>Offline</span>
              </label>
            </div>
          </div>

          <div className="field field--full">
            <span>Khung giờ ưa thích</span>
            <div className={`picker ${pickerOpen ? 'is-open' : ''}`} id="schedulePicker">
              <button 
                type="button" 
                className="picker-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen(!pickerOpen);
                }}
              >
                <span className="picker-text">
                  {trialForm.scheduleDate && trialForm.scheduleSlot 
                    ? `${trialForm.scheduleDate.split('-').reverse().join('/')} • ${trialForm.scheduleSlot}`
                    : 'Chọn ngày & giờ'}
                </span>
              </button>

              <div className="picker-pop">
                <div className="picker-sec">
                  <div className="picker-title">Chọn ngày (7 ngày tới)</div>
                  <div className="picker-days">
                    {getNext7Days().map((date, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        className="day-btn"
                        aria-pressed={selectedDate === toISO(date)}
                        onClick={() => setSelectedDate(toISO(date))}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="picker-sec">
                  <div className="picker-title">Chọn khung giờ</div>
                  <div className="picker-slots">
                    {timeSlots.map((slot, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        className="slot-btn"
                        aria-pressed={selectedSlot === slot}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="picker-actions">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setPickerOpen(false)}
                  >
                    Huỷ
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={applySchedule}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>

          <label className="field field--full">
            <span>Ghi chú (tuỳ chọn)</span>
            <textarea 
              name="note" 
              rows="3" 
              placeholder="..."
              value={trialForm.note}
              onChange={(e) => setTrialForm({...trialForm, note: e.target.value})}
            ></textarea>
          </label>
        </div>

        <label className="agree">
          <input type="checkbox" required />
          <span>Tôi đồng ý để trung tâm liên hệ tư vấn.</span>
        </label>

        <button className="btn btn-primary btn-block" type="submit">
          Đăng ký học thử ngay
        </button>
        <p className="muted" style={{margin: '8px 0 0', fontSize: '13px'}}>
          Chúng tôi sẽ liên hệ sớm để xác nhận lịch phù hợp. Đối với hình thức học thử offline, 
          bạn vui lòng di chuyển đến trung tâm để có trải nghiệm học tập thuận tiện và tốt nhất.
        </p>
      </form>
    </div>
  );
};

export default TrialForm;
