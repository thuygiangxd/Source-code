import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';
import { createMyRegistration } from "../services/academicService";


const LS_KEY = 'requestForm.v1';

const RequestForm = () => {
  const navigate = useNavigate();

  const [requestForm, setRequestForm] = useState({
    name: '',
    phone: '',
    subject: '',
    grade: '',
    mode: '',
    location: '',
    budget: '',
    time_preference: '',
    note: ''
  });

  const [requestTimePickerOpen, setRequestTimePickerOpen] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [requestTime, setRequestTime] = useState('');
  const [requestStartTime, setRequestStartTime] = useState('');
  const [requestEndTime, setRequestEndTime] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

   // NEW: mẫu tuần & danh sách ngày trong tuần
  const [weekPattern, setWeekPattern] = useState('');        // '', '246', '357', 'custom'
  const [weekDays, setWeekDays] = useState([]);              // ['Mon','Wed','Fri', ...]


  // Checkbox đồng ý
  const [consent, setConsent] = useState(false);

  // Lỗi thù lao
  const [budgetError, setBudgetError] = useState('');

  // Chọn "Khác" cho môn / khối
  const [subjectOption, setSubjectOption] = useState('');
  const [gradeOption, setGradeOption] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customGrade, setCustomGrade] = useState('');

  // Chọn lớp cụ thể khi chọn Tiểu học / THCS / THPT
  const [classOption, setClassOption] = useState('');


  // ========= LOAD DRAFT TỪ LOCALSTORAGE KHI VỪA MỞ TRANG =========
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved.classOption) setClassOption(saved.classOption);

      if (saved.requestForm) setRequestForm(saved.requestForm);
      if (typeof saved.consent === 'boolean') setConsent(saved.consent);
      if (saved.subjectOption) setSubjectOption(saved.subjectOption);
      if (saved.gradeOption) setGradeOption(saved.gradeOption);
      if (saved.customSubject) setCustomSubject(saved.customSubject);
      if (saved.customGrade) setCustomGrade(saved.customGrade);

      if (saved.requestDate) setRequestDate(saved.requestDate);
      if (saved.requestTime) setRequestTime(saved.requestTime);
      if (saved.requestStartTime) setRequestStartTime(saved.requestStartTime);
      if (saved.requestEndTime) setRequestEndTime(saved.requestEndTime);

      if (saved.weekPattern) setWeekPattern(saved.weekPattern);
      if (Array.isArray(saved.weekDays)) setWeekDays(saved.weekDays);

      // Nếu time_preference có dạng "yyyy-mm-dd • hh:mm" thì tách ra
      if (saved.requestForm?.time_preference) {
        const [d, t] = saved.requestForm.time_preference.split(' • ');
        setRequestDate(d || '');
        setRequestTime(t || '');
      }
    } catch (err) {
      console.error('Lỗi khi load draft RequestForm:', err);
    }
  }, []);

  // ========= LƯU DRAFT VÀO LOCALSTORAGE MỖI KHI THAY ĐỔI =========
  useEffect(() => {
    const data = {
      requestForm,
      consent,
      subjectOption,
      gradeOption,
      customSubject,
      customGrade,
      classOption,
      requestDate,
      requestTime,
      weekPattern,
      weekDays,
      requestStartTime,
      requestEndTime
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [requestForm, consent, subjectOption, gradeOption, customSubject, customGrade, classOption, requestDate, requestTime, weekPattern, weekDays, requestStartTime, requestEndTime]);

  const getTodayMin = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // yyyy-mm-dd -> yyyy-mm-dd (cộng 1 tháng)
  const addOneMonth = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // tránh bug khi tháng sau ít ngày hơn
    const day = d.getDate();
    d.setMonth(d.getMonth() + 1);

    // Nếu nhảy sang tháng + 2 vì ngày lớn (31 -> tháng 2),
    // lùi về ngày cuối tháng trước đó
    while (d.getDate() < day) {
      d.setDate(d.getDate() - 1);
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // "1000000" -> "1.000.000"
  const formatCurrency = (value) => {
    if (!value) return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

    const dayOptions = [
    { code: 'Mon', label: 'Thứ 2' },
    { code: 'Tue', label: 'Thứ 3' },
    { code: 'Wed', label: 'Thứ 4' },
    { code: 'Thu', label: 'Thứ 5' },
    { code: 'Fri', label: 'Thứ 6' },
    { code: 'Sat', label: 'Thứ 7' },
    { code: 'Sun', label: 'Chủ nhật' },
  ];

  const handleSelectWeekPattern = (type) => {
    setWeekPattern(type);

    if (type === '246') {
      setWeekDays(['Mon', 'Wed', 'Fri']);
    } else if (type === '357') {
      setWeekDays(['Tue', 'Thu', 'Sat']);
    } else {
      // custom: để người dùng tự chọn ngày
      setWeekDays([]);
    }
  };

  const handleToggleDay = (code) => {
    setWeekDays((prev) =>
      prev.includes(code)
        ? prev.filter((d) => d !== code)
        : [...prev, code]
    );
  };


    const applyRequestTime = () => {
      if (!requestDate || !requestStartTime || !requestEndTime) {
        setToastMessage('Vui lòng chọn ngày bắt đầu và khung giờ học.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2200);
        return;
      }

      // Tạo object ngày giờ
      const now = new Date();
      const startDateTime = new Date(`${requestDate}T${requestStartTime}:00`);
      const endDateTime = new Date(`${requestDate}T${requestEndTime}:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setToastMessage('Ngày hoặc giờ không hợp lệ.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2200);
        return;
      }

      // Ngày hôm nay nhưng giờ bắt đầu > hiện tại
      const todayStr = now.toISOString().split("T")[0];
      if (requestDate === todayStr && startDateTime <= now) {
        setToastMessage('Giờ bắt đầu phải muộn hơn thời điểm hiện tại.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
        return;
      }

      // Giờ kết thúc phải > giờ bắt đầu
      if (endDateTime <= startDateTime) {
        setToastMessage('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
        return;
      }

      // Check tuần
      if (!weekPattern || weekDays.length === 0) {
        setToastMessage('Chọn thời gian học trong tuần.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2200);
        return;
      }

      // if (weekPattern === 'custom' && weekDays.length !== 3) {
      //   setToastMessage('Vui lòng chọn đủ 3 ngày học trong tuần.');
      //   setShowToast(true);
      //   setTimeout(() => setShowToast(false), 2200);
      //   return;
      // }

      // if (!requestForm.time_preference) {
      //   setToastMessage('Vui lòng chọn lịch học (ngày, thứ, khung giờ).');
      //   setShowToast(true);
      //   setTimeout(() => setShowToast(false), 2200);
      //   return;
      // }


      // Format ngày kết thúc
      const endDate = addOneMonth(requestDate);

      // Map thứ
      const dayLabelMap = {
        Mon: 'Thứ 2',
        Tue: 'Thứ 3',
        Wed: 'Thứ 4',
        Thu: 'Thứ 5',
        Fri: 'Thứ 6',
        Sat: 'Thứ 7',
        Sun: 'Chủ nhật',
      };
      const daysText = weekDays.map((d) => dayLabelMap[d]).join(', ');

      // Create summary
      const summary = `Từ ${requestDate} đến ${endDate} • ${daysText} • ${requestStartTime}–${requestEndTime}`;

      setRequestForm((prev) => ({
        ...prev,
        time_preference: summary,
      }));

      setRequestTimePickerOpen(false);
    };



  const handleRequestFormSubmit = async (e) => {
    e.preventDefault();

    // 🔐 CHƯA ĐĂNG NHẬP → YÊU CẦU LOGIN, KHÔNG XÓA FORM
    if (!isAuthenticated()) {
      setToastMessage('Vui lòng đăng nhập hoặc đăng ký để gửi yêu cầu. Thông tin bạn đã nhập sẽ được lưu lại.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);

      // Điều hướng tới trang login (hoặc signup tùy flow của bạn)
      navigate('/login');
      return;
    }

    // ✅ ĐÃ ĐĂNG NHẬP → TIẾP TỤC VALIDATE & SUBMIT

    // Chuẩn hóa thù lao
    const normalizedBudget = requestForm.budget
      ? String(parseInt(requestForm.budget, 10))
      : '';

    if (!normalizedBudget || isNaN(parseInt(normalizedBudget, 10)) || parseInt(normalizedBudget, 10) <= 0) {
      setBudgetError('Thù lao phải là số nguyên > 0.');
      setToastMessage('Vui lòng nhập thù lao hợp lệ.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
      return;
    }

    // Chuẩn hóa lớp
    const parseGrade = (g) => {
      if (!g) return "";
      if (g.startsWith("Lớp ")) {
        return g.replace("Lớp ", ""); // "Lớp 11" -> "11"
      }
      return g;
    };


    // const payload = {
    //   ...requestForm,
    //   budget: normalizedBudget
    // };

    // navigate('/request-payment', {
    //   state: { formData: payload },
    // });
    // TẠO PAYLOAD ĐÚNG ĐỊNH DẠNG CHO createMyRegistration()
    const payload = {
      name: requestForm.name,
      phone: requestForm.phone,

      education_level:
        gradeOption === "THPT" ? "THPT" :
        gradeOption === "THCS" ? "THCS" :
        gradeOption === "Tiểu học" ? "Tiểu học" :
        "Khác",

      grade: parseGrade(requestForm.grade),
      subject: requestForm.subject,
      default_fee: parseInt(normalizedBudget, 10),

      type: requestForm.mode,
      address: requestForm.location || "",

      start_date: requestDate,
      end_date: addOneMonth(requestDate),

      schedule_json: {
        days: weekDays,
        start_time: requestStartTime,
        end_time: requestEndTime,
      },

      note: requestForm.note || "",
    };

    try {
      // GỌI API LƯU BẢN ĐĂNG KÝ
      const created = await createMyRegistration(payload);
      const regId = created?.id;   // backend trả về id

      // → CHUYỂN SANG MÀN THANH TOÁN
      navigate("/request-payment", {
        state: {
          regId,
          formData: payload,
        },
      });

    } catch (error) {
      console.error("Lỗi khi tạo đăng ký:", error);
      setToastMessage("Không thể gửi yêu cầu.");
      setShowToast(true);
    };

    // console.log('Yêu cầu gia sư:', payload);


    // TODO: ở đây sau này bạn gọi API backend để gửi yêu cầu

    // Reset form + xóa draft
    setRequestForm({
      name: '',
      phone: '',
      subject: '',
      grade: '',
      mode: '',
      location: '',
      budget: '',
      time_preference: '',
      note: ''
    });
    setRequestDate('');
    setRequestTime('');
    setConsent(false);
    setBudgetError('');
    setSubjectOption('');
    setGradeOption('');
    setCustomSubject('');
    setCustomGrade('');
    setWeekPattern('');
    setWeekDays([]);

    // localStorage.removeItem(LS_KEY);

    // setToastMessage('Đã nhận yêu cầu. Chúng tôi sẽ liên hệ sớm!');
    // setShowToast(true);
    // setTimeout(() => setShowToast(false), 2200);
  };

  return (
    <>
      <form className="card request-form" id="requestForm" onSubmit={handleRequestFormSubmit}>
        <h2>Đăng ký tìm gia sư</h2>
        <p className="muted">
          Để lại yêu cầu của bạn tại đây. Chúng tôi sẽ phản hồi sớm nhất có thể.
        </p>

        <div className="form-grid">
          {/* Họ tên */}
          <div className="field">
            <label htmlFor="rqName">Họ và tên</label>
            <input 
              id="rqName" 
              name="name" 
              type="text" 
              placeholder="Nguyễn Văn A"
              value={requestForm.name}
              onChange={(e) => setRequestForm({...requestForm, name: e.target.value})}
              required 
            />
          </div>

          {/* SĐT */}
          <div className="field">
            <label htmlFor="rqPhone">Số điện thoại</label>
            <input 
              id="rqPhone" 
              name="phone" 
              type="tel" 
              placeholder="09xx xxx xxx"
              value={requestForm.phone}
              onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})}
              required 
            />
          </div>

          {/* Môn học + Khác */}
          <div className="field">
            <label htmlFor="rqSubject">Môn học</label>
            <select 
              id="rqSubject" 
              name="subject"
              value={subjectOption}
              onChange={(e) => {
                const v = e.target.value;
                setSubjectOption(v);

                if (v !== 'Khác') {
                  setCustomSubject('');
                  setRequestForm({...requestForm, subject: v});
                } else {
                  setRequestForm({...requestForm, subject: ''});
                }
              }}
              required
            >
              <option value="">Chọn môn</option>
              <option value="Toán">Toán</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lý">Địa lý</option>
              <option value="Tin học">Tin học</option>
              <option value="Công nghệ">Công nghệ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {subjectOption === 'Khác' && (
            <div className="field">
              <label>Nhập môn học</label>
              <input
                type="text"
                placeholder="Ví dụ: Piano, Vẽ, Lập trình…"
                value={customSubject}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomSubject(v);
                  setRequestForm({...requestForm, subject: v});
                }}
                required
              />
            </div>
          )}

          {/* Khối/Lớp + Khác */}
          <div className="field">
            <label htmlFor="rqGrade">Khối học</label>
            <select 
              id="rqGrade" 
              name="grade"
              value={gradeOption}
              onChange={(e) => {
                const v = e.target.value;
                setGradeOption(v);
                setCustomGrade('');
                setClassOption('');

                // Nếu là Tiểu học / THCS / THPT thì chưa set grade ngay
                if (v === 'Tiểu học' || v === 'THCS' || v === 'THPT') {
                  setRequestForm({ ...requestForm, grade: '' });
                } else if (v === 'Đại học/Cao đẳng') {
                  setRequestForm({ ...requestForm, grade: 'Đại học/Cao đẳng' });
                } else if (v === 'Khác') {
                  setRequestForm({ ...requestForm, grade: '' });
                } else {
                  // giá trị rỗng
                  setRequestForm({ ...requestForm, grade: '' });
                }
              }}
              required
            >
              <option value="">Chọn khối/lớp</option>
              <option value="Tiểu học">Tiểu học</option>
              <option value="THCS">THCS</option>
              <option value="THPT">THPT</option>
              <option value="Đại học/Cao đẳng">Đại học/Cao đẳng</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Nếu là Tiểu học / THCS / THPT thì bắt buộc chọn LỚP cụ thể */}
          {(gradeOption === 'Tiểu học' || gradeOption === 'THCS' || gradeOption === 'THPT') && (
            <div className="field">
              <label>Lớp cụ thể</label>
              <select
                value={classOption}
                onChange={(e) => {
                  const v = e.target.value;
                  setClassOption(v);
                  // Lưu trực tiếp LỚP cụ thể vào grade
                  setRequestForm({ ...requestForm, grade: v });
                }}
                required
              >
                <option value="">Chọn lớp</option>

                {gradeOption === 'Tiểu học' && (
                  <>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                  </>
                )}

                {gradeOption === 'THCS' && (
                  <>
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                  </>
                )}

                {gradeOption === 'THPT' && (
                  <>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Nếu chọn Khác thì cho tự nhập khối/lớp */}
          {gradeOption === 'Khác' && (
            <div className="field">
              <label>Nhập khối/lớp</label>
              <input
                type="text"
                placeholder="Ví dụ: Luyện thi IELTS, Lớp năng khiếu…"
                value={customGrade}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomGrade(v);
                  setRequestForm({ ...requestForm, grade: v });
                }}
                required
              />
            </div>
          )}


          {/* Hình thức học */}
          <div className="field">
            <label>Hình thức học</label>
            <select
              value={requestForm.mode}
              onChange={(e) => setRequestForm({
                ...requestForm,
                mode: e.target.value,
                location: e.target.value === 'offline' ? requestForm.location : ''
              })}
              required
            >
              <option value="">Chọn hình thức</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Địa chỉ chỉ khi Offline */}
          {requestForm.mode === 'offline' && (
            <div className="field">
              <label htmlFor="rqLocation">Địa chỉ học (Offline)</label>
              <input 
                id="rqLocation" 
                name="location" 
                type="text" 
                placeholder="VD: Quận 7, TP.HCM"
                value={requestForm.location}
                onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                required
              />
            </div>
          )}

          {/* Thù lao */}
          <div className="field">
            <label htmlFor="rqBudget">Thù lao</label>
            <input 
              id="rqBudget" 
              name="budget" 
              type="text"
              inputMode="numeric"
              placeholder="Ví dụ: 2.000.000"
              value={formatCurrency(requestForm.budget)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, ''); // chỉ lấy số

                if (!digits) {
                  setRequestForm({...requestForm, budget: ''});
                  setBudgetError('Vui lòng nhập thù lao.');
                  return;
                }

                const num = parseInt(digits, 10);

                if (isNaN(num) || num <= 0) {
                  setRequestForm({...requestForm, budget: digits});
                  setBudgetError('Thù lao phải là số nguyên > 0.');
                } else {
                  setRequestForm({...requestForm, budget: String(num)});
                  setBudgetError('');
                }
              }}
              required
            />
            {budgetError && (
              <p className="field-error">{budgetError}</p>
            )}
          </div>

                    {/* Lịch học */}
          <div className="field field--full">
            <label>Lịch học</label>
            <div className={`picker slim ${requestTimePickerOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="picker-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setRequestTimePickerOpen(!requestTimePickerOpen);
                }}
              >
                {requestForm.time_preference || 'Chọn lịch học (ngày, tuần, khung giờ)'}
              </button>

              <div className="picker-pop">
                {/* Ngày bắt đầu */}
                <div className="picker-sec">
                  <div className="picker-title">Ngày bắt đầu</div>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    min={getTodayMin()}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Ngày kết thúc (1 tháng sau) */}
                <div className="picker-sec" style={{ marginTop: '12px' }}>
                  <div className="picker-title">Ngày kết thúc (dự kiến)</div>
                  <input
                    type="date"
                    value={requestDate ? addOneMonth(requestDate) : ''}
                    readOnly
                    disabled={!requestDate}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      width: '100%',
                      backgroundColor: '#f9fafb',
                    }}
                  />
                  <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    Tự động tính sau 1 tháng kể từ ngày bắt đầu.
                  </p>
                </div>

                {/* Thời gian học trong tuần */}
                <div className="picker-sec" style={{ marginTop: '12px' }}>
                  <div className="picker-title">Thời gian học trong tuần</div>

                  {/* Hàng chọn mẫu 2-4-6 / 3-5-7 / Khác */}
                  <div className="week-pattern-row">
                    <button
                      type="button"
                      className={`pattern-btn ${weekPattern === '246' ? 'is-selected' : ''}`}
                      onClick={() => handleSelectWeekPattern('246')}
                    >
                      Thứ 2 - 4 - 6
                    </button>
                    <button
                      type="button"
                      className={`pattern-btn ${weekPattern === '357' ? 'is-selected' : ''}`}
                      onClick={() => handleSelectWeekPattern('357')}
                    >
                      Thứ 3 - 5 - 7
                    </button>
                    <button
                      type="button"
                      className={`pattern-btn ${weekPattern === 'custom' ? 'is-selected' : ''}`}
                      onClick={() => handleSelectWeekPattern('custom')}
                    >
                      Khác
                    </button>
                  </div>

                  {/* Các ngày trong tuần */}
                  <div className="picker-days">
                    {dayOptions.map((d) => {
                      const active = weekDays.includes(d.code);
                      const lockedPattern = weekPattern === '246' || weekPattern === '357';

                      return (
                        <button
                          key={d.code}
                          type="button"
                          className={`day-btn ${active ? 'is-selected' : ''}`}
                          aria-pressed={active}
                          disabled={lockedPattern}
                          onClick={() => handleToggleDay(d.code)}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Khung giờ trong ngày */}
                <div className="picker-sec" style={{ marginTop: '12px' }}>
                  <div className="picker-title">Khung giờ</div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13 }}>Bắt đầu</label>
                      <input
                        type="time"
                        value={requestStartTime}
                        onChange={(e) => setRequestStartTime(e.target.value)}
                        min="06:00"
                        max="22:00"
                        required
                        style={{
                          padding:'8px 10px',
                          border:'1px solid var(--border)',
                          borderRadius:'10px',
                          width:'100%',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13 }}>Kết thúc</label>
                      <input
                        type="time"
                        value={requestEndTime}
                        onChange={(e) => setRequestEndTime(e.target.value)}
                        min="06:30"
                        max="23:59"
                        required
                        style={{
                          padding:'8px 10px',
                          border:'1px solid var(--border)',
                          borderRadius:'10px',
                          width:'100%',
                        }}
                      />
                    </div>
                  </div>
                </div>


                <div className="picker-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setRequestTimePickerOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={applyRequestTime}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Ghi chú */}
          <div className="field field--full">
            <label htmlFor="rqNote">Ghi chú (tuỳ chọn)</label>
            <textarea 
              id="rqNote" 
              name="note" 
              rows="3" 
              placeholder="Mục tiêu, nội dung cần kèm, số buổi/tuần…"
              value={requestForm.note}
              onChange={(e) => setRequestForm({...requestForm, note: e.target.value})}
            ></textarea>
          </div>

          {/* Checkbox đồng ý */}
          <label className="agree field--full">
            <input
              type="checkbox"
              id="rqAgree"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>Tôi đã xác nhận lại các thông tin trên.</span>
          </label>

          {/* Nút submit */}
          <button
            className="btn btn-primary btn-block field--full"
            type="submit"
            disabled={!consent}
          >
            Gửi yêu cầu ngay
          </button>
        </div>
      </form>

      {/* Toast */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
};

export default RequestForm;
