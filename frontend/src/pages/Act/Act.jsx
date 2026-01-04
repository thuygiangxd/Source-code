// src/pages/Act/Act.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';
import { getClasses, getAllAssignments, getPaidStatusesForMonth, markAsPaid, getRegistrations } from '../../services/academicService';
import { getUserById, deposit } from '../../services/userService';

import logoImage from '../../assets/images/Logo_Group.png';
import avatarImage from '../../assets/images/avatar.jpg';



import './Act.css';
import Footer from '../../components/Footer';

const Act = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());

  const money = (n) => Math.round(n || 0).toLocaleString('vi-VN') + '₫';


  // Tab trên header: Học phí / Thù lao
  const [financeTab, setFinanceTab] = useState('hocphi');

  // Tab con trong Học phí
  const [hocPhiTab, setHocPhiTab] = useState('invoice'); // 'invoice' | 'refund'

  // Tab con trong Thù lao gia sư
  const [tutorTab, setTutorTab] = useState('salary'); // 'salary' | 'request' | 'history'

  // Modal chi tiết (dùng cho hóa đơn / hoàn tiền)
  const [detailModal, setDetailModal] = useState(null); // { type, data } | null

  // ==== STATE TÌM KIẾM / LỌC ====

  // Học phí - Hóa đơn
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [invoiceFromDate, setInvoiceFromDate] = useState(''); // yyyy-MM-dd
  const [invoiceToDate, setInvoiceToDate] = useState('');
  const [invoiceData, setInvoiceData] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Học phí - Hoàn tiền
  const [refundSearch, setRefundSearch] = useState('');
  const [refundStatusFilter, setRefundStatusFilter] = useState('all');
  const [refundFromDate, setRefundFromDate] = useState('');
  const [refundToDate, setRefundToDate] = useState('');

  // Thù lao - Bảng lương (lọc theo thời gian)
  const [salarySearch, setSalarySearch] = useState('');
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [paidStatuses, setPaidStatuses] = useState({});

  const fetchPayrollData = async (month) => {
    if (!month) return;
    setLoadingPayroll(true);
    try {
        // 1. Get all assignments
        const allAssignments = await getAllAssignments();

        // 2. Enrich with class info (start_date, tutor_salary)
        const enrichedAssignments = await Promise.all(
            allAssignments.map(async (assign) => {
                const classes = await getClasses({ student_tutor_assignments_id: assign.id });
                const classInfo = classes && classes.length > 0 ? classes[0] : null;
                return {
                    ...assign,
                    classInfo: classInfo,
                };
            })
        );

        // 3. Filter by month
        const monthlyAssignments = enrichedAssignments.filter(assign => 
            assign.classInfo && assign.classInfo.start_date && assign.classInfo.start_date.startsWith(month)
        );

        // 4. Group by tutor
        const summary = monthlyAssignments.reduce((acc, assign) => {
            const tutorId = assign.tutor_user_id;
            if (!tutorId) return acc;

            if (!acc[tutorId]) {
                acc[tutorId] = {
                    tutor_id: tutorId,
                    tutor_name: 'Loading...', // Placeholder
                    class_count: 0,
                    total_salary: 0,
                };
            }
            acc[tutorId].class_count += 1;
            acc[tutorId].total_salary += Number(assign.classInfo.tutor_salary || 0);
            return acc;
        }, {});

        // 5. Fetch tutor names and paid statuses
        const tutorIds = Object.keys(summary);
        if (tutorIds.length > 0) {
            const [users, paidTutorIds] = await Promise.all([
                Promise.all(tutorIds.map(id => getUserById(id).catch(() => null))),
                getPaidStatusesForMonth(month).catch(() => [])
            ]);
            
            const userMap = users.reduce((acc, user) => {
                if (user) acc[user.id] = user;
                return acc;
            }, {});

            const paidTutorIdsSet = new Set(paidTutorIds);

            // Inject names, usernames, and payment status
            for (const tutorId in summary) {
                summary[tutorId].tutor_name = userMap[tutorId]?.name || 'N/A';
                summary[tutorId].tutor_username = userMap[tutorId]?.username || 'N/A';
                summary[tutorId].status = paidTutorIdsSet.has(tutorId) ? 'paid' : 'unpaid';
            }
        }
        
        setPayrollData(Object.values(summary));

    } catch (err) {
        console.error("Failed to fetch payroll data:", err);
        setPayrollData([]);
    } finally {
        setLoadingPayroll(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const registrations = await getRegistrations();
      
      const enrichedData = await Promise.all(
        registrations.map(async (reg) => {
          const student = reg.student_id ? await getUserById(reg.student_id).catch(() => null) : null;
          return {
            ...reg,
            studentCode: student?.username || 'N/A',
            studentName: student?.name || 'N/A',
            classCode: reg.id || 'N/A',
            subject: `Môn ${reg.subject} - Lớp ${reg.grade}`,
            registerDate: reg.created_at ? new Date(reg.created_at).toLocaleDateString('vi-VN') : 'N/A',
            tuitionFee: reg.default_fee || 0,
            status: reg.status, // pending, matched, cancelled
            invoiceCode: `HD-${reg.id}`
          };
        })
      );
      setInvoiceData(enrichedData);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setInvoiceData([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    // Only fetch data if the payroll tab is active
    if (financeTab === 'thulao' && tutorTab === 'salary') {
      fetchPayrollData(payMonth);
    }
    // Fetch invoices when the invoice tab is active
    if (financeTab === 'hocphi' && hocPhiTab === 'invoice') {
      fetchInvoices();
    }
  }, [payMonth, tutorTab, financeTab, hocPhiTab]);

  const handlePay = async (tutorId, amount, month) => {
    if (!tutorId || !amount || !month) return;
    if (!window.confirm(`Bạn có chắc muốn thanh toán ${money(amount)} cho gia sư này?`)) {
      return;
    }

    try {
      // 1. Deposit money to tutor's balance
      await deposit(tutorId, amount);

      // 2. Mark as paid for the month
      await markAsPaid(tutorId, month);

      alert('Thanh toán thành công!');
      
      // 3. Refresh data
      fetchPayrollData(payMonth);

    } catch (err) {
      console.error("Payment failed:", err);
      alert(`Thanh toán thất bại: ${err.response?.data?.detail || err.message}`);
    }
  };



  // Thù lao - Yêu cầu thanh toán
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestFromDate, setRequestFromDate] = useState('');
  const [requestToDate, setRequestToDate] = useState('');

  // Thù lao - Lịch sử thanh toán
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');

  const displayName = user?.name || 'Ngoc Huynh';
  const displayCode = user?.username || 'student1';

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  const openDetailModal = (type, data) => {
    setDetailModal({ type, data });
  };

  const closeDetailModal = () => {
    setDetailModal(null);
  };

  // ==== DỮ LIỆU GIẢ CHO HỌC PHÍ ====

  // const invoiceRows = [
  //   {
  //     id: 1,
  //     studentCode: 'HV001',
  //     studentName: 'Nguyễn Gia Huy',
  //     classCode: 'L001',
  //     subject: 'Toán lớp 10',
  //     registerDate: '01/10/2025', // dd/MM/yyyy
  //     tuitionFee: '6.000.000đ',
  //     status: 'Đã thanh toán',
  //     invoiceCode: 'HD2025-001',
  //   },
  //   {
  //     id: 2,
  //     studentCode: 'HV002',
  //     studentName: 'Trần Mai Phương',
  //     classCode: 'L008',
  //     subject: 'Tiếng Anh lớp 8',
  //     registerDate: '05/10/2025',
  //     tuitionFee: '6.000.000đ',
  //     status: 'Đã hoàn tiền',
  //     invoiceCode: 'HD2025-002',
  //   },
  // ];

  // ==== DỮ LIỆU GIẢ CHO THÙ LAO GIA SƯ ====

  // Bảng lương: thêm ngày chốt lương (ISO + display)
  // const tutorSalaryRows = [
  //   {
  //     id: 1,
  //     tutorCode: 'GS001',
  //     tutorName: 'Nguyễn Minh An',
  //     classCount: 3,
  //     classFee: '8.000.000đ',
  //     netFee: '7.500.000đ',
  //     payDate: '2025-10-31', // yyyy-MM-dd
  //     payDateDisplay: '31/10/2025',
  //   },
  //   {
  //     id: 2,
  //     tutorCode: 'GS002',
  //     tutorName: 'Trần Thảo Vy',
  //     classCount: 2,
  //     classFee: '5.000.000đ',
  //     netFee: '5.000.000đ',
  //     payDate: '2025-11-05',
  //     payDateDisplay: '05/11/2025',
  //   },
  // ];

  // Yêu cầu thanh toán
  const tutorRequestRows = [
    {
      id: 1,
      requestCode: 'RQ2025-001',
      tutorCode: 'GS001',
      tutorName: 'Nguyễn Minh An',
      amount: '7.500.000đ',
      createdDate: '05/11/2025', // dd/MM/yyyy
      processedDate: '07/11/2025',
      status: 'Đã thanh toán',
      note: 'Chuyển khoản Vietcombank.',
    },
    {
      id: 2,
      requestCode: 'RQ2025-002',
      tutorCode: 'GS002',
      tutorName: 'Trần Thảo Vy',
      amount: '5.000.000đ',
      createdDate: '10/11/2025',
      processedDate: '',
      status: 'Đang xử lý',
      note: 'Dự kiến xử lý trong 2 ngày làm việc.',
    },
  ];

  // Lịch sử thanh toán
  const tutorHistoryRows = [
    {
      id: 1,
      paymentCode: 'PAY2025-001',
      tutorCode: 'GS001',
      tutorName: 'Nguyễn Minh An',
      amount: '7.500.000đ',
      processedDate: '07/11/2025', // dd/MM/yyyy
      staffName: 'Ngọc Huỳnh',
      status: 'Hoàn tất',
      note: 'Đã gửi ủy nhiệm chi qua email.',
    },
    {
      id: 2,
      paymentCode: 'PAY2025-002',
      tutorCode: 'GS002',
      tutorName: 'Trần Thảo Vy',
      amount: '3.000.000đ',
      processedDate: '01/11/2025',
      staffName: 'Cao Thùy Giang',
      status: 'Hoàn tất',
      note: 'Thanh toán đợt 1.',
    },
  ];

  // ==== HÀM LỌC DỮ LIỆU ====

  const parseISODate = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const parseDMYDate = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map((p) => p.trim());
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  };

  const withinRange = (rowDate, fromStr, toStr) => {
    if (!rowDate) return true;
    const from = fromStr ? parseISODate(fromStr) : null;
    const to = toStr ? parseISODate(toStr) : null;

    let ok = true;
    if (from) ok = ok && rowDate >= from;
    if (to) ok = ok && rowDate <= to;
    return ok;
  };

  // Hóa đơn – lọc theo trạng thái + khoảng ngày đăng ký
  const filteredInvoices = invoiceData.filter((row) => {
    if (row.status === 'cancelled') return false; // Luôn loại bỏ hóa đơn đã hoàn tiền

    const keyword = invoiceSearch.trim().toLowerCase();
    const combined = `${row.studentCode} ${row.studentName} ${row.subject}`.toLowerCase();
    const searchOk = !keyword || combined.includes(keyword);

    const statusOk = (() => {
      if (invoiceStatusFilter === 'all') return true;
      if (invoiceStatusFilter === 'paid') return ['pending', 'matched'].includes(row.status);
      if (invoiceStatusFilter === 'unpaid') return row.status === 'processing'; // Lọc các hóa đơn có trạng thái 'processing'
      return true;
    })();

    const rowDate = parseDMYDate(row.registerDate);
    const dateOk = withinRange(rowDate, invoiceFromDate, invoiceToDate);

    return searchOk && statusOk && dateOk;
  });

  // Hoàn tiền – lọc các hóa đơn có trạng thái 'cancelled'
  const filteredRefunds = invoiceData.filter((row) => {
    if (row.status !== 'cancelled') return false; // Chỉ lấy hóa đơn đã hoàn tiền

    const keyword = refundSearch.trim().toLowerCase();
    const combined = `${row.studentCode} ${row.studentName} ${row.classCode} ${row.subject}`.toLowerCase();
    const searchOk = !keyword || combined.includes(keyword);

    const statusOk = (() => {
      if (refundStatusFilter === 'all') return true;
      // Chỉ có trạng thái 'Đã hoàn tiền' từ invoiceData cho tab này
      if (refundStatusFilter === 'Đã hoàn tiền') return true;
      // Các trạng thái khác (ví dụ: 'Đang xử lý') sẽ không có kết quả, điều này đúng
      return false;
    })();

    const rowDate = parseDMYDate(row.registerDate); // Dùng registerDate để lọc ngày
    const dateOk = withinRange(rowDate, refundFromDate, refundToDate);

    return searchOk && statusOk && dateOk;
  });

  // Bảng lương – lọc theo khoảng payDate (ISO)
  // const filteredSalaries = tutorSalaryRows.filter((row) => {
  //   const keyword = salarySearch.trim().toLowerCase();
  //   const combined = `${row.tutorCode} ${row.tutorName}`.toLowerCase();
  //   const searchOk = !keyword || combined.includes(keyword);

  //   const rowDate = parseISODate(row.payDate);
  //   const dateOk = withinRange(rowDate, salaryFromDate, salaryToDate);

  //   return searchOk && dateOk;
  // });

  // Yêu cầu thanh toán – lọc theo trạng thái + ngày tạo
  const filteredRequests = tutorRequestRows.filter((row) => {
    const keyword = requestSearch.trim().toLowerCase();
    const combined = `${row.requestCode} ${row.tutorCode} ${row.tutorName}`.toLowerCase();
    const searchOk = !keyword || combined.includes(keyword);

    const statusOk =
      requestStatusFilter === 'all' || row.status === requestStatusFilter;

    const rowDate = parseDMYDate(row.createdDate);
    const dateOk = withinRange(rowDate, requestFromDate, requestToDate);

    return searchOk && statusOk && dateOk;
  });

  // Lịch sử thanh toán – lọc theo trạng thái + ngày xử lý
  const filteredHistories = tutorHistoryRows.filter((row) => {
    const keyword = historySearch.trim().toLowerCase();
    const combined = `${row.paymentCode} ${row.tutorCode} ${row.tutorName} ${row.staffName}`.toLowerCase();
    const searchOk = !keyword || combined.includes(keyword);

    const statusOk =
      historyStatusFilter === 'all' || row.status === historyStatusFilter;

    const rowDate = parseDMYDate(row.processedDate);
    const dateOk = withinRange(rowDate, historyFromDate, historyToDate);

    return searchOk && statusOk && dateOk;
  });

  const filteredPayrollData = payrollData.filter(row => {
    const keyword = salarySearch.trim().toLowerCase();
    if (!keyword) return true;
    const tutorName = (row.tutor_name || '').toLowerCase();
    const tutorUsername = (row.tutor_username || '').toLowerCase();
    return tutorName.includes(keyword) || tutorUsername.includes(keyword);
  });

  return (
    <>
      {/* HEADER (giống HR) */}
      <header className="site-header">
        <div className="header-inner">
          {/* Logo */}
          <a
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate('/act');
            }}
          >
            <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
            <span>GIASUNO1</span>
          </a>

          {/* Tabs tài chính */}
          <nav>
            <div className="nav">
              <a
                className={`top-link ${
                  financeTab === 'hocphi' ? 'is-active' : ''
                }`}
                href="#hocphi"
                onClick={(e) => {
                  e.preventDefault();
                  setFinanceTab('hocphi');
                }}
              >
                Học phí
              </a>

              <a
                className={`top-link ${
                  financeTab === 'thulao' ? 'is-active' : ''
                }`}
                href="#thulao"
                onClick={(e) => {
                  e.preventDefault();
                  setFinanceTab('thulao');
                }}
              >
                Thù lao gia sư
              </a>

              {/* User mini */}
              <details className="user-mini" aria-label="Tùy chọn tài khoản">
                <summary
                  className="avatar-btn"
                  aria-haspopup="menu"
                  aria-expanded="false"
                >
                  <img src={avatarImage} alt="Ảnh đại diện" />
                  <div className="u-meta">
                    <div className="nm">{displayName}</div>
                    <div className="uid">Mã NV: {displayCode}</div>
                  </div>
                  <svg
                    className="chev"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </summary>

                <div className="user-popover" role="menu">
                  <button type="button" className="mi" role="menuitem">
                    <svg
                      className="mi-ico"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.24-8 5v1h16v-1c0-2.76-3.6-5-8-5Z"
                        fill="currentColor"
                      />
                    </svg>
                    Quản lý thông tin
                  </button>

                  <button type="button" className="mi" role="menuitem">
                    <svg
                      className="mi-ico"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M17 8V6a5 5 0 0 0-10 0v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2Zm-8 0V6a3 3 0 0 1 6 0v2H9Z"
                        fill="currentColor"
                      />
                    </svg>
                    Đổi mật khẩu
                  </button>

                  <hr className="menu-divider" />

                  <button
                    role="menuitem"
                    type="button"
                    className="mi link-danger"
                    onClick={handleLogout}
                  >
                    <svg
                      className="mi-ico"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 17v2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6v2H5v10h5Zm9.59-5-3-3L17 7l5 5-5 5-1.41-2 3-3H11v-2h8.59Z"
                        fill="currentColor"
                      />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </details>
            </div>
          </nav>

          {/* Icon menu mobile (chưa xử lý JS) */}
          <button className="menu-btn" aria-label="Mở menu">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="#111"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="act-main">
        {/* ==== HỌC PHÍ ==== */}
        <section
          id="hocphi"
          className={`act-section ${
            financeTab === 'hocphi' ? 'is-active' : ''
          }`}
        >
          <div className="act-card">
            {/* Header chung */}
            <div className="act-card-header">
              <h2>Quản lý học phí</h2>
              <p>
                Theo dõi hóa đơn thanh toán và yêu cầu hoàn tiền học phí của học
                viên theo từng khóa học.
              </p>
            </div>

            {/* Body: panel trái / phải */}
            <div className="act-card-body">
              {/* Panel trái – menu con */}
              <aside className="act-side">
                <button
                  type="button"
                  className={`act-side-link ${
                    hocPhiTab === 'invoice' ? 'is-active' : ''
                  }`}
                  onClick={() => setHocPhiTab('invoice')}
                >
                  Hóa đơn thanh toán
                </button>
                <button
                  type="button"
                  className={`act-side-link ${
                    hocPhiTab === 'refund' ? 'is-active' : ''
                  }`}
                  onClick={() => setHocPhiTab('refund')}
                >
                  Yêu cầu hoàn tiền
                </button>
              </aside>

              {/* Panel phải – nội dung bảng */}
              <div className="act-panel">
                {/* Bảng HÓA ĐƠN THANH TOÁN */}
                {hocPhiTab === 'invoice' && (
                  <>
                    <h3 className="act-panel-title">
                      Danh sách hóa đơn thanh toán
                    </h3>

                    {/* Toolbar tìm kiếm / lọc */}
                    <div className="act-toolbar">
                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Tìm kiếm</label>
                          <input
                            type="text"
                            placeholder="Tìm mã HV, tên, lớp, môn..."
                            value={invoiceSearch}
                            onChange={(e) =>
                              setInvoiceSearch(e.target.value)
                            }
                          />
                        </div>

                        <div className="act-field">
                          <label>Trạng thái</label>
                          <select
                            value={invoiceStatusFilter}
                            onChange={(e) =>
                              setInvoiceStatusFilter(e.target.value)
                            }
                          >
                            <option value="all">Tất cả</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="unpaid">Chưa thanh toán</option>
                            
                          </select>
                        </div>
                      </div>

                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Từ ngày</label>
                          <input
                            type="date"
                            value={invoiceFromDate}
                            onChange={(e) =>
                              setInvoiceFromDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="act-field">
                          <label>Đến ngày</label>
                          <input
                            type="date"
                            value={invoiceToDate}
                            onChange={(e) =>
                              setInvoiceToDate(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <table className="act-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Mã học viên</th>
                          <th>Họ tên</th>
                          <th>Mã lớp</th>
                          <th>Môn học</th>
                          <th>Ngày đăng ký</th>
                          <th>Học phí</th>
                          <th>Tình trạng</th>
                          <th>Hóa đơn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingInvoices ? (
                          <tr><td colSpan="8">Đang tải dữ liệu...</td></tr>
                        ) : filteredInvoices.length > 0 ? (
                          filteredInvoices.map((row, index) => (
                            <tr key={row.id}>
                              <td>{index + 1}</td>
                              <td>{row.studentCode}</td>
                              <td>{row.studentName}</td>
                              <td>{row.classCode}</td>
                              <td>{row.subject}</td>
                              <td>{row.registerDate}</td>
                              <td>{money(row.tuitionFee)}</td>
                              <td>
                                {/* <span
                                  className={`act-badge ${
                                    ['pending', 'matched'].includes(row.status) ? 'act-badge--success' : 'act-badge--muted'
                                  }`}
                                >
                                  {['pending', 'matched'].includes(row.status) ? 'Đã thanh toán' : 'Đã hoàn tiền'}
                                </span> */}
                                <span
                                  className={`act-badge ${
                                    row.status === 'cancelled'
                                      ? 'act-badge--warning'
                                      : row.status === 'processing'
                                      ? 'act-badge--warning'
                                      : 'act-badge--success'
                                  }`}
                                >
                                  {row.status === 'cancelled'
                                    ? 'Đã hoàn tiền'
                                    : row.status === 'processing'
                                    ? 'Chưa thanh toán'
                                    : 'Đã thanh toán'}
                                </span>

                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="act-link-button"
                                  onClick={() =>
                                    openDetailModal('invoice', row)
                                  }
                                >
                                  Xem chi tiết
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8}>Không tìm thấy dữ liệu phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Bảng YÊU CẦU HOÀN TIỀN */}
                {hocPhiTab === 'refund' && (
                  <>
                    <h3 className="act-panel-title">
                      Danh sách yêu cầu hoàn tiền
                    </h3>

                    {/* Toolbar tìm kiếm / lọc */}
                    <div className="act-toolbar">
                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Tìm kiếm</label>
                          <input
                            type="text"
                            placeholder="Tìm mã HV, tên, lớp, môn..."
                            value={refundSearch}
                            onChange={(e) =>
                              setRefundSearch(e.target.value)
                            }
                          />
                        </div>

                        <div className="act-field">
                          <label>Trạng thái</label>
                          <select
                            value={refundStatusFilter}
                            onChange={(e) =>
                              setRefundStatusFilter(e.target.value)
                            }
                          >
                            <option value="all">Tất cả</option>
                            <option value="Đã hoàn tiền">Đã hoàn tiền</option>
                            <option value="Đang xử lý">Đang xử lý</option>
                          </select>
                        </div>
                      </div>

                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Từ ngày</label>
                          <input
                            type="date"
                            value={refundFromDate}
                            onChange={(e) =>
                              setRefundFromDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="act-field">
                          <label>Đến ngày</label>
                          <input
                            type="date"
                            value={refundToDate}
                            onChange={(e) =>
                              setRefundToDate(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <table className="act-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Mã học viên</th>
                          <th>Họ tên</th>
                          <th>Mã lớp</th>
                          <th>Môn học</th>
                          <th>Ngày yêu cầu</th>
                          <th>Số tiền yêu cầu</th>
                          <th>Tình trạng</th>
                          <th>Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRefunds.length > 0 ? (
                          filteredRefunds.map((row, index) => (
                            <tr key={row.id}>
                              <td>{index + 1}</td>
                              <td>{row.studentCode}</td>
                              <td>{row.studentName}</td>
                              <td>{row.classCode}</td>
                              <td>{row.subject}</td>
                              <td>{row.registerDate}</td> {/* Sử dụng registerDate làm ngày yêu cầu */}
                              <td>{money(row.tuitionFee)}</td> {/* Sử dụng tuitionFee làm số tiền */}
                              <td>
                                <span className="act-badge act-badge--muted">
                                  Đã hoàn tiền {/* Trạng thái cố định vì tất cả các mục ở đây đều là hóa đơn đã hoàn tiền */}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="act-link-button"
                                  onClick={() =>
                                    openDetailModal('invoice', row) // Mở modal chi tiết hóa đơn cho mục đã hoàn tiền
                                  }
                                >
                                  Xem chi tiết
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9}>Không tìm thấy dữ liệu phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==== THÙ LAO GIA SƯ ==== */}
        <section
          id="thulao"
          className={`act-section ${
            financeTab === 'thulao' ? 'is-active' : ''
          }`}
        >
          <div className="act-card">
            <div className="act-card-header">
              <h2>Thù lao gia sư</h2>
              <p>Quản lý bảng lương, yêu cầu và lịch sử thanh toán thù lao cho gia sư.</p>
            </div>

            <div className="act-card-body">
              {/* Menu bên trái */}
              <aside className="act-side">
                <button
                  type="button"
                  className={`act-side-link ${
                    tutorTab === 'salary' ? 'is-active' : ''
                  }`}
                  onClick={() => setTutorTab('salary')}
                >
                  Bảng lương
                </button>
                {/* <button
                  type="button"
                  className={`act-side-link ${
                    tutorTab === 'request' ? 'is-active' : ''
                  }`}
                  onClick={() => setTutorTab('request')}
                >
                  Yêu cầu thanh toán
                </button> */}
                <button
                  type="button"
                  className={`act-side-link ${
                    tutorTab === 'history' ? 'is-active' : ''
                  }`}
                  onClick={() => setTutorTab('history')}
                >
                  Lịch sử thanh toán
                </button>
              </aside>

              {/* Panel phải */}
              <div className="act-panel">
                {/* Bảng lương */}
                {tutorTab === 'salary' && (
                  <>
                    <h3 className="act-panel-title">Bảng lương gia sư</h3>

                    <div className="act-toolbar">
                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Tìm kiếm</label>
                          <input
                            type="text"
                            placeholder="Tìm mã, tên gia sư..."
                            value={salarySearch}
                            onChange={(e) =>
                              setSalarySearch(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Lọc theo tháng</label>
                          <input
                            type="month"
                            value={payMonth}
                            onChange={(e) =>
                              setPayMonth(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <table className="act-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Mã gia sư</th>
                          <th>Tên gia sư</th>
                          <th>Số lớp đã dạy</th>
                          <th>Tổng thù lao</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPayroll ? (
                          <tr><td colSpan="7" className="uid">Đang tải...</td></tr>
                        ) : filteredPayrollData.length === 0 ? (
                          <tr><td colSpan="7" className="uid">Không có dữ liệu lương cho tháng này.</td></tr>
                        ) : (
                          filteredPayrollData.map((row, index) => (
                            <tr key={row.tutor_id}>
                              <td>{index + 1}</td>
                              <td>{row.tutor_username}</td>
                              <td>{row.tutor_name}</td>
                              <td>{row.class_count}</td>
                              <td>{money(row.total_salary)}</td>
                              <td>
                                <span className={`act-badge ${row.status === 'paid' ? 'act-badge--success' : 'act-badge--warning'}`}>
                                  {row.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="act-btn act-btn-primary"
                                 
                                  onClick={() => handlePay(row.tutor_id, row.total_salary, payMonth)}
                                  disabled={row.status === 'paid' || row.total_salary <= 0}
                                >
                                  Thanh toán
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4">Tổng cộng</td>
                          <td colSpan="3">{money(filteredPayrollData.reduce((acc, row) => acc + row.total_salary, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                )}

                {/* Yêu cầu thanh toán */}
                {tutorTab === 'request' && (
                  <>
                    <h3 className="act-panel-title">
                      Yêu cầu thanh toán thù lao
                    </h3>

                    {/* Toolbar tìm kiếm / lọc */}
                    <div className="act-toolbar">
                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Tìm kiếm</label>
                          <input
                            type="text"
                            placeholder="Tìm mã yêu cầu, mã/tên gia sư..."
                            value={requestSearch}
                            onChange={(e) =>
                              setRequestSearch(e.target.value)
                            }
                          />
                        </div>

                        <div className="act-field">
                          <label>Trạng thái</label>
                          <select
                            value={requestStatusFilter}
                            onChange={(e) =>
                              setRequestStatusFilter(e.target.value)
                            }
                          >
                            <option value="all">Tất cả</option>
                            <option value="Đã thanh toán">Đã thanh toán</option>
                            <option value="Đang xử lý">Đang xử lý</option>
                          </select>
                        </div>
                      </div>

                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Từ ngày</label>
                          <input
                            type="date"
                            value={requestFromDate}
                            onChange={(e) =>
                              setRequestFromDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="act-field">
                          <label>Đến ngày</label>
                          <input
                            type="date"
                            value={requestToDate}
                            onChange={(e) =>
                              setRequestToDate(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <table className="act-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Mã yêu cầu</th>
                          <th>Mã gia sư</th>
                          <th>Tên gia sư</th>
                          <th>Số tiền</th>
                          <th>Ngày tạo</th>
                          <th>Ngày xử lý</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((row, index) => (
                          <tr key={row.id}>
                            <td>{index + 1}</td>
                            <td>{row.requestCode}</td>
                            <td>{row.tutorCode}</td>
                            <td>{row.tutorName}</td>
                            <td>{row.amount}</td>
                            <td>{row.createdDate}</td>
                            <td>{row.processedDate || '-'}</td>
                            <td>
                              <span
                                className={`act-badge ${
                                  row.status === 'Đã thanh toán'
                                    ? 'act-badge--success'
                                    : 'act-badge--warning'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td>{row.note}</td>
                          </tr>
                        ))}
                        {filteredRequests.length === 0 && (
                          <tr>
                            <td colSpan={9}>Không tìm thấy dữ liệu phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Lịch sử thanh toán */}
                {tutorTab === 'history' && (
                  <>
                    <h3 className="act-panel-title">Lịch sử thanh toán</h3>

                    {/* Toolbar tìm kiếm / lọc */}
                    <div className="act-toolbar">
                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Tìm kiếm</label>
                          <input
                            type="text"
                            placeholder="Tìm mã thanh toán, mã/tên gia sư..."
                            value={historySearch}
                            onChange={(e) =>
                              setHistorySearch(e.target.value)
                            }
                          />
                        </div>

                        <div className="act-field">
                          <label>Trạng thái</label>
                          <select
                            value={historyStatusFilter}
                            onChange={(e) =>
                              setHistoryStatusFilter(e.target.value)
                            }
                          >
                            <option value="all">Tất cả</option>
                            <option value="Hoàn tất">Hoàn tất</option>
                          </select>
                        </div>
                      </div>

                      <div className="act-toolbar-group">
                        <div className="act-field">
                          <label>Từ ngày</label>
                          <input
                            type="date"
                            value={historyFromDate}
                            onChange={(e) =>
                              setHistoryFromDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="act-field">
                          <label>Đến ngày</label>
                          <input
                            type="date"
                            value={historyToDate}
                            onChange={(e) =>
                              setHistoryToDate(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <table className="act-table">
                      <thead>
                        <tr>
                          <th>Mã thanh toán</th>
                          <th>Mã gia sư</th>
                          <th>Tên gia sư</th>
                          <th>Số tiền</th>
                          <th>Ngày xử lý</th>
                          <th>Nhân viên xử lý</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistories.map((row) => (
                          <tr key={row.id}>
                            <td>{row.paymentCode}</td>
                            <td>{row.tutorCode}</td>
                            <td>{row.tutorName}</td>
                            <td>{row.amount}</td>
                            <td>{row.processedDate}</td>
                            <td>{row.staffName}</td>
                            <td>
                              <span className="act-badge act-badge--success">
                                {row.status}
                              </span>
                            </td>
                            <td>{row.note}</td>
                          </tr>
                        ))}
                        {filteredHistories.length === 0 && (
                          <tr>
                            <td colSpan={8}>Không tìm thấy dữ liệu phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL CHI TIẾT HÓA ĐƠN / HOÀN TIỀN */}
      {detailModal && (
        <div className="act-modal" role="dialog" aria-modal="true">
          <div className="act-modal-content">
            {detailModal.type === 'invoice' && (
              <>
                <h3>Chi tiết hóa đơn</h3>
                <div className="act-detail-grid">
                  <div>
                    <strong>Mã hóa đơn:</strong> {detailModal.data.invoiceCode}
                  </div>
                  <div>
                    <strong>Mã học viên:</strong> {detailModal.data.studentCode}
                  </div>
                  <div>
                    <strong>Họ tên:</strong> {detailModal.data.studentName}
                  </div>
                  <div>
                    <strong>Mã lớp:</strong> {detailModal.data.classCode}
                  </div>
                  <div>
                    <strong>Môn học:</strong> {detailModal.data.subject}
                  </div>
                  <div>
                    <strong>Ngày đăng ký:</strong>{' '}
                    {detailModal.data.registerDate}
                  </div>
                  {/* <div>
                    <strong>Học phí:</strong> {detailModal.data.tuitionFee}
                  </div> */}
                  {/* <div>
                    <strong>Tình trạng:</strong> {
                      ['pending', 'matched'].includes(detailModal.data.status) 
                        ? 'Đã thanh toán' 
                        : 'Đã hoàn tiền'
                    }
                  </div> */}
                  <div>
                    <strong>Học phí:</strong> {parseInt(detailModal.data.tuitionFee).toLocaleString('vi-VN')}₫
                  </div>

                  <div>
                    <strong>Tình trạng:</strong> {
                      detailModal.data.status === 'cancelled'
                        ? 'Đã hoàn tiền'
                        : detailModal.data.status === 'processing'
                        ? 'Chưa thanh toán'
                        : 'Đã thanh toán'
                    }
                  </div>

                </div>
                <div className="act-modal-actions">
                  <button
                    type="button"
                    className="act-btn act-btn-primary"
                    onClick={() => alert('Giả lập xuất hóa đơn')}
                  >
                    Xuất hóa đơn
                  </button>
                  <button
                    type="button"
                    className="act-btn act-btn-ghost"
                    onClick={closeDetailModal}
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}

            {detailModal.type === 'refund' && (
              <>
                <h3>Chi tiết yêu cầu hoàn tiền</h3>
                <div className="act-detail-grid">
                  <div>
                    <strong>Mã yêu cầu:</strong> {detailModal.data.refundCode}
                  </div>
                  <div>
                    <strong>Mã học viên:</strong> {detailModal.data.studentCode}
                  </div>
                  <div>
                    <strong>Họ tên:</strong> {detailModal.data.studentName}
                  </div>
                  <div>
                    <strong>Mã lớp:</strong> {detailModal.data.classCode}
                  </div>
                  <div>
                    <strong>Môn học:</strong> {detailModal.data.subject}
                  </div>
                  <div>
                    <strong>Ngày yêu cầu:</strong>{' '}
                    {detailModal.data.requestDate}
                  </div>
                  <div>
                    <strong>Số tiền:</strong> {detailModal.data.amount}
                  </div>
                  <div>
                    <strong>Tình trạng:</strong> {detailModal.data.status}
                  </div>
                  <div className="act-detail-full">
                    <strong>Lý do:</strong> {detailModal.data.reason}
                  </div>
                </div>
                <div className="act-modal-actions">
                 
                  <button
                    type="button"
                    className="act-btn act-btn-ghost"
                    onClick={closeDetailModal}
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Act;
