import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/Header.css';
import './Tutor.css';
import DynamicHeader from '../../components/DynamicHeader';
import Footer from '../../components/Footer';
import { getUserById, getMe  } from '../../services/userService';
import { isAuthenticated, changePassword } from '../../services/authService';

import {
  claimAssignments,
  getMyAssignments,
  releaseMyAssignment,
  getRegistrations,
  getRegistrationById,
  getClasses,
  getClassSessions,
  completeSession,
  processSession,
} from '../../services/academicService';
import {
  getResources,
  createResource,
  deleteResource,
} from '../../services/learningService';


const Tutor = () => {
  const navigate = useNavigate();
  const LS_KEY = 'tutorApp.v1';

  const [isEditingProfile, setIsEditingProfile] = useState(false);


  // Những section có menu bên trái
  const sectionsWithSidebar = [
    'home',
    'schedule',
    'teaching-courses',
    'register-classes',
    'requests',
  ];

  // Active section
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    const raw = window.location.hash.replace('#', '') || 'home';
    let section = raw;

    // Map hash từ header sang section
    if (raw === 'change-pass') section = 'payroll';
    if (raw === 'support') section = 'requests';

    const allowed = [
      'home',
      'schedule',
      'teaching-courses',
      'register-classes',
      'payroll',
      'profile',
      'requests',
    ];
    return allowed.includes(section) ? section : 'home';
  });

  // STATE CHÍNH
  const [state, setState] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      major: 'Toán',
      level: 'THPT',
      bio: '5 năm kinh nghiệm luyện thi THPTQG.',
    },
    openClasses: [],
    myClasses: [],
    schedule: [], //lịch dạy
    timesheet: [
      {
        date: '2025-11-03',
        courseId: 'C101',
        start: '19:00',
        end: '20:30',
        hours: 1.5,
      },
      {
        date: '2025-11-01',
        courseId: 'C202',
        start: '17:00',
        end: '18:30',
        hours: 1.5,
      },
    ],
    requests: [],
    complaints: [],
  });

  // FORM STATE
  const [profileForm, setProfileForm] = useState(state.profile);
  const [requestForm, setRequestForm] = useState({
    type: 'change',
    courseId: '',
    from: '',
    to: '',
    reason: '',
  });

  

  const [payMonth, setPayMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [scheduleMonth, setScheduleMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState('');
  const [resourceForm, setResourceForm] = useState({ title: '', url: '' });
  const [sessionResources, setSessionResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classStatusFilter, setClassStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Tabs
  const [accountTab, setAccountTab] = useState('profile');
  const [walletTab, setWalletTab] = useState('payroll');
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false); // 👈 thêm dòng này

  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchPayrollForMonth = async (month) => {
    if (!month || !isAuthenticated()) return;
    setLoadingPayroll(true);
    try {
      // 1. Get all assignments for the current tutor
      const assignments = await getMyAssignments();

      // 2. Enrich assignments with details
      const allClasses = await Promise.all(
        assignments.map(async (assign) => {
          try {
            const [student, classes] = await Promise.all([
              getUserById(assign.student_id).catch(() => null),
              getClasses({ student_tutor_assignments_id: assign.id }).catch(() => []),
            ]);

            const classInfo = classes && classes.length > 0 ? classes[0] : null;
            if (!classInfo) return null;

            return {
              id: classInfo.id,
              class_name: classInfo.class_name,
              studentName: student?.name || 'Học viên',
              start_date: classInfo.start_date,
              tutor_salary: classInfo.tutor_salary,
            };
          } catch (err) {
            console.error('Error processing assignment for payroll:', err);
            return null;
          }
        })
      );

      // 3. Filter by the selected month on the client side
      const filteredClasses = allClasses.filter(c => {
        if (!c || !c.start_date) return false;
        return c.start_date.startsWith(month);
      });

      setPayrollData(filteredClasses);

    } catch (err) {
        console.error("Failed to fetch payroll data:", err);
        setPayrollData([]);
    } finally {
        setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'payroll') {
      fetchPayrollForMonth(payMonth);
    }
  }, [payMonth, activeSection]);
  
  const [complaintForm, setComplaintForm] = useState({
    topic: 'salary',
    content: '',
  });

        const [complaintTab, setComplaintTab] = useState('submit'); // 'submit' | 'list'
      
        // Load localStorage
        useEffect(() => {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            try {
              const loaded = JSON.parse(raw);
              setState(loaded);
              setProfileForm(loaded.profile);
            } catch (e) {
              console.warn(e);
            }
          }
        }, []);
      
        useEffect(() => {
        const fetchTutorProfile = async () => {
          try {
            if (!isAuthenticated()) return;
      
            const me = await getMe();
            setCurrentUser(me);
      
            // Map dữ liệu từ backend sang profile hiện tại
            const profileFromBackend = {
              name: me.name || 'Gia sư',
              email: me.email || '',
              phone: me.phone || '',
              major: me.major || state.profile.major,    // hoặc me.major || ''
              level: me.level || state.profile.level,    // hoặc me.level || ''
              bio: me.bio || state.profile.bio,          // hoặc me.bio || ''
            };
      
            // Cập nhật state chính
            setState((prev) => {
              const newState = { ...prev, profile: profileFromBackend };
              // lưu lại vào localStorage để lần sau mở lại vẫn có dữ liệu mới
              localStorage.setItem(LS_KEY, JSON.stringify(newState));
              return newState;
            });
      
            // Đồng bộ form hiển thị
            setProfileForm(profileFromBackend);
          } catch (err) {
            console.error('Failed to fetch tutor profile:', err);
          }
        };
      
        fetchTutorProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);  // Init dữ liệu
  useEffect(() => {
    const initData = async () => {
      await fetchOpenClasses();
      await fetchMyClasses();
      await fetchMySchedule();
    };
    initData();
  }, []);

  // Lắng nghe hash change
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace('#', '') || 'home';
      let section = raw;

      if (raw === 'change-pass') section = 'payroll';
      if (raw === 'support') section = 'requests';

      const allowed = [
        'home',
        'schedule',
        'teaching-courses',
        'register-classes',
        'payroll',
        'profile',
        'requests',
      ];
      if (allowed.includes(section)) {
        setActiveSection(section);
        if (section === 'schedule') {
          setSelectedSession(null);
  }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // === FETCH DATA ===
  const fetchMyClasses = async () => {
    try {
      if (!isAuthenticated()) return;

      const assignments = await getMyAssignments();

      const myClasses = await Promise.all(
        assignments.map(async (assign) => {
          try {
            const [registration, student, classes] = await Promise.all([
              getRegistrationById(assign.registration_id).catch(() => null),
              getUserById(assign.student_id).catch(() => null),
              getClasses({ student_tutor_assignments_id: assign.id }).catch(
                () => []
              ),
            ]);

            const classInfo = classes && classes.length > 0 ? classes[0] : null;

            let scheduleDisplay = '';
            if (registration && registration.schedule_json) {
              const sj = registration.schedule_json;
              const days = sj.days?.join(', ') || '';
              const time = `${sj.start_time || ''}-${sj.end_time || ''}`;
              scheduleDisplay = `${days} ${time}`.trim();
            }

            return {
              id: assign.id,
              assignmentId: assign.id,
              name: registration ? `Môn ${registration.subject} - Lớp ${registration.grade}` : (classInfo?.class_name || 'Khóa học'),
              studentName: student?.name || 'Học viên',
              studentId: assign.student_id,
              schedule: scheduleDisplay || 'Chưa có lịch',
              status: assign.status,
              startDate: classInfo?.start_date || null,
              endDate: classInfo?.end_date || null,
              classStatus: classInfo?.status || null,
              className: classInfo?.class_name || null,
              classId: classInfo?.id || null,
              salary: classInfo?.tutor_salary || null,
            };
          } catch (err) {
            console.error('Error processing assignment:', err);
            return {
              id: assign.id,
              assignmentId: assign.id,
              name: 'Khóa học',
              studentName: 'Học viên',
              studentId: assign.student_id,
              schedule: 'Chưa có lịch',
              status: assign.status,
              startDate: null,
              endDate: null,
              classStatus: null,
              className: null,
              classId: null,
            };
          }
        })
      );

      setState((prev) => ({ ...prev, myClasses }));
    } catch (err) {
      console.error('Error fetching my classes:', err);
    }
  };

  const fetchMySchedule = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated()) return;

      const [allSessions, allClasses] = await Promise.all([
        getClassSessions(),
        getClasses()
      ]);

      const classesMap = new Map(allClasses.map(c => [c.id, c]));

      const schedule = allSessions.map((session) => {
        try {
          const classInfo = classesMap.get(session.class_id);
          const className = classInfo?.class_name || 'Lớp học';

          let sessionDate = '';
          let startTime = '';
          let endTime = '';

          if (session.start_time) {
            const dateMatch = session.start_time.match(/^(\d{4}-\d{2}-\d{2})/);
            sessionDate = dateMatch ? dateMatch[1] : '';

            const timeMatch = session.start_time.match(/T(\d{2}:\d{2})/);
            startTime = timeMatch ? timeMatch[1] : '';
          }
          if (session.end_time) {
            const timeMatch = session.end_time.match(/T(\d{2}:\d{2})/);
            endTime = timeMatch ? timeMatch[1] : '';
          }

          return {
            id: session.id,
            sessionId: session.id,
            date: sessionDate,
            time: `${startTime}-${endTime}`,
            courseId: className, // This is used as the display name in the schedule table
            note: '', // substitute_tutor_user_id is removed
            status: session.status || 'scheduled',
            classId: session.class_id,
          };
        } catch (err) {
          console.error('Error processing session:', err);
          return {
            id: session.id,
            sessionId: session.id,
            date: '',
            time: '',
            courseId: 'Lớp học',
            note: '',
            status: 'scheduled',
            classId: session.class_id,
          };
        }
      });

      schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

      setState((prev) => ({ ...prev, schedule }));
      return schedule;
    } catch (err) {
      console.error('Error fetching schedule:', err);
      return state.schedule;
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenClasses = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated()) {
        console.warn('Not authenticated');
        return;
      }

      const registrations = await getRegistrations({ status: 'pending' });

      const openClasses = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const student = await getUserById(reg.student_id).catch(
              () => null
            );

            let scheduleDisplay = '';
            if (reg.schedule_json) {
              const sj = reg.schedule_json;
              const days = sj.days?.join(', ') || '';
              const time = `${sj.start_time || ''}-${sj.end_time || ''}`;
              scheduleDisplay = `${days} ${time}`;
            }

            return {
              id: reg.id,
              registrationId: reg.id,
              name: `Môn ${reg.subject} - Lớp ${reg.grade}`,
              studentName: student?.name || 'Học viên',
              studentId: reg.student_id,
              schedule: scheduleDisplay || 'Chưa có lịch',
              status: reg.status,
              education_level: reg.education_level,
              type: reg.type,
              address: reg.address,
              note: reg.note,
              default_fee: reg.default_fee,
              startDate: reg.start_date,
              endDate: reg.end_date,
            };
          } catch (err) {
            console.error('Error processing registration:', err);
            return {
              id: reg.id,
              registrationId: reg.id,
              name: 'Khóa học',
              studentName: 'Học viên',
              studentId: reg.student_id,
              schedule: 'Chưa có lịch',
              status: reg.status,
            };
          }
        })
      );

      setState((prev) => ({ ...prev, openClasses }));
    } catch (err) {
      console.error('Error fetching open classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save state
  const saveState = (newState) => {
    setState(newState);
    localStorage.setItem(LS_KEY, JSON.stringify(newState));
  };

  // Helpers
  const money = (n) => (n || 0).toLocaleString('vi-VN') + '₫';

  const initials = (name) => {
    if (!name) return 'GS';
    const parts = name.trim().split(/\s+/);
    return (
      (parts[0]?.[0] || 'G') + (parts.slice(-1)[0]?.[0] || 'S')
    ).toUpperCase();
  };

  const formatUploadedAt = (uploadedAt) => {
    if (!uploadedAt) return '—';
    const d = new Date(uploadedAt);
    if (Number.isNaN(d.getTime())) return uploadedAt; // phòng trường hợp parse lỗi
    return d.toLocaleString('vi-VN');
  };

  const totalHoursInMonth = (yyyymm) => {
    const [y, m] = yyyymm.split('-').map(Number);
    return state.timesheet
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === y && d.getMonth() + 1 === m && r.hours > 0;
      })
      .reduce((a, b) => a + b.hours, 0);
  };

  // Handlers
  // const handleSaveProfile = () => {
  //   const newState = { ...state, profile: profileForm };
  //   saveState(newState);
  //   alert('Đã lưu hồ sơ.');
  // };
  const handleSaveProfile = () => {
  if (!isEditingProfile) return; // không làm gì nếu chưa bật chỉnh sửa

  const newState = { ...state, profile: profileForm };
  saveState(newState);
  alert('Đã lưu hồ sơ.');
  setIsEditingProfile(false); // lưu xong khóa lại
};


  const handleApplyClass = async (id) => {
    const c = state.openClasses.find((x) => x.id === id);
    if (!c) return;
    try {
      if (!isAuthenticated()) {
        alert('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }
      await claimAssignments(c.registrationId);
      alert(`✅ Đã đăng ký lớp ${c.name} thành công!`);
      await fetchOpenClasses();
      await fetchMyClasses();
    } catch (err) {
      console.error('Error applying class:', err);
      const errorMsg =
        err.response?.data?.detail || err.message || 'Không thể đăng ký lớp';
      alert(`❌ Lỗi: ${errorMsg}`);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await completeSession(sessionId);
      alert('✅ Đã hoàn thành buổi học!');
      const newSchedule = await fetchMySchedule();
      const updatedSession = newSchedule.find((s) => s.id === sessionId);
      if (updatedSession) {
        setSelectedSession(updatedSession);
      }
    } catch (err) {
      console.error('Error completing session:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        'Không thể hoàn thành buổi học';
      alert(`❌ Lỗi: ${errorMsg}`);
    }
  };

  const handleSubmitRequest = () => {
    const r = {
      ...requestForm,
      ts: Date.now(),
      status: 'waiting',
    };
    const newState = { ...state, requests: [r, ...state.requests] };
    saveState(newState);
    setRequestForm({
      type: 'change',
      courseId: '',
      from: '',
      to: '',
      reason: '',
    });
    alert('Đã gửi đơn. Vui lòng đợi duyệt.');
  };

  const handleDeleteRequest = (index) => {
    const newRequests = [...state.requests];
    newRequests.splice(index, 1);
    saveState({ ...state, requests: newRequests });
  };

  const canCancelClass = (c) => {
  if (!c) return false;

  // Điều kiện cũ
  if (c.status !== 'active') return false;
  if (c.classStatus !== 'open') return false;

  // Điều kiện mới: chỉ được hủy nếu còn ít nhất 7 ngày trước khai giảng
  if (c.startDate) {
    const start = new Date(c.startDate); // ngày khai giảng
    if (Number.isNaN(start.getTime())) {
      // nếu parse lỗi ngày thì cho an toàn là KHÔNG cho hủy
      return false;
    }

    const now = new Date();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const lastCancelTime = start.getTime() - oneWeekMs;

    // Nếu hiện tại đã sau mốc "7 ngày trước khai giảng" thì không cho hủy
    if (now.getTime() > lastCancelTime) {
      return false;
    }
  }

  return true;
};


  const handleReleaseClass = async (assignmentId) => {
    if (
      !window.confirm(
        'Bạn có chắc muốn hủy đăng ký lớp này? Lớp sẽ quay lại danh sách chờ đăng ký.'
      )
    ) {
      return;
    }
    try {
      await releaseMyAssignment(assignmentId);
      alert('✅ Đã hủy đăng ký lớp học thành công!');
      await fetchMyClasses();
      await fetchOpenClasses();
    } catch (err) {
      console.error('Error releasing class:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        'Không thể hủy đăng ký lớp';
      alert(`❌ Lỗi: ${errorMsg}`);
    }
  };

  const handleRequestPayout = () => {
    alert('Đã gửi yêu cầu thanh toán kỳ này.');
  };

  // Resources
  const fetchResources = async (sessionId) => {
    if (!sessionId) {
      setSessionResources([]);
      return;
    }
    try {
      const resources = await getResources(sessionId);
      setSessionResources(resources || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setSessionResources([]);
    }
  };

  const handleRowClick = (session) => {
    const sessionWithHardcodedUrl = {
      ...session,
      meeting_url: 'https://meet.google.com/new',
    };
    setSelectedSession(sessionWithHardcodedUrl);
    fetchResources(session.id);
  };

  const handleProcessAndShowDetails = async (session) => {
    try {
      let sessionDataForDetails = session;
      if (session.status === 'scheduled') {
        await processSession(session.sessionId);
        const newSchedule = await fetchMySchedule();
        const updatedSessionInList = newSchedule.find((s) => s.id === session.id);
        if (updatedSessionInList) {
          sessionDataForDetails = updatedSessionInList;
        } else {
          sessionDataForDetails = { ...session, status: 'processing' };
        }
      }
      handleRowClick(sessionDataForDetails);
    } catch (err) {
      console.error('Error processing and showing details:', err);
      alert(
        `Đã có lỗi xảy ra: ${err.response?.data?.detail || err.message}`
      );
      handleRowClick(session);
    }
  };

  const handleJoinMeeting = () => {
  if (!selectedSession) {
    alert('Vui lòng chọn buổi học trước.');
    return;
  }

  // 1. Nếu đã có link meeting cho buổi này → dùng lại
  const existingMeeting = sessionResources.find(
    (r) => r.resource_type === 'meeting'
  );

  if (existingMeeting) {
    window.open(existingMeeting.url, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Chưa có link → mở meet.google.com/new
  window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');

  // 3. Nhắc gia sư copy & lưu lại
  alert(
    'Hệ thống đã mở một phòng Google Meet mới.\n' +
    'Vui lòng copy link phòng học và quay lại bấm "Thêm link phòng học" để lưu link này cho những lần sau.'
  );
};


  const openAddResourceModal = (type) => {
    setResourceType(type);
    setIsModalOpen(true);
  };

  const closeAddResourceModal = () => {
    setIsModalOpen(false);
    setResourceForm({ title: '', url: '' });
  };

  const handleResourceFormChange = (e) => {
    const { name, value } = e.target;
    setResourceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || !resourceForm.url || !selectedSession) {
      alert('Vui lòng điền cả tiêu đề và URL.');
      return;
    }
    const resourceData = {
      ...resourceForm,
      session_id: selectedSession.id,
      resource_type: resourceType,
    };
    try {
      await createResource(resourceData);
      closeAddResourceModal();
      await fetchResources(selectedSession.id);
    } catch (err) {
      console.error('Failed to create resource:', err);
      alert(`Lỗi: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      return;
    }
    try {
      await deleteResource(resourceId);
      await fetchResources(selectedSession.id);
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert(`Lỗi: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Month nav
  const handlePreviousMonth = () => {
    const [year, month] = scheduleMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const monthStr = String(newMonth).padStart(2, '0');
    setScheduleMonth(`${newYear}-${monthStr}`);
  };

  const handleNextMonth = () => {
    const [year, month] = scheduleMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const monthStr = String(newMonth).padStart(2, '0');
    setScheduleMonth(`${newYear}-${monthStr}`);
  };

  // Filtered lists
  const filteredOpenClasses = searchQuery
    ? state.openClasses.filter((c) =>
        (c.name + ' ' + c.studentName + ' ' + c.schedule)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : state.openClasses;

  let filteredMyClasses = state.myClasses.filter((c) => c.status !== 'released');
  if (classStatusFilter !== 'all') {
    filteredMyClasses = filteredMyClasses.filter(
      (c) => c.classStatus === classStatusFilter
    );
  }
  if (searchQuery) {
    filteredMyClasses = filteredMyClasses.filter((c) =>
      (c.name + ' ' + c.studentName + ' ' + c.schedule)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }

  const teachingClasses = state.myClasses.filter(
    (c) => c.status !== 'released' && c.classStatus === 'open'
  );

  const ym = new Date().toISOString().slice(0, 7);
  const statHours = totalHoursInMonth(ym);
  const sessions = state.timesheet.filter(
    (r) => r.hours > 0 && r.date.startsWith(ym)
  ).length;

// 1–2 buổi sắp tới
const now = new Date();
const upcomingSessions = state.schedule
  .filter((s) => {
    if (!s.date || !s.time) return false;
    const [startTime] = s.time.split('-');        // "19:00-20:30" -> "19:00"
    if (!startTime) return false;
    const startDateTime = new Date(`${s.date}T${startTime}:00`);
    return startDateTime >= now && s.status !== 'cancelled';
  })
  .sort((a, b) => {
    const [startA] = a.time.split('-');
    const [startB] = b.time.split('-');
    const dA = new Date(`${a.date}T${startA}:00`);
    const dB = new Date(`${b.date}T${startB}:00`);
    return dA - dB;
  })
  .slice(0, 2); // chỉ lấy 2 buổi gần nhất

  // Đếm số lớp học trong NGÀY HÔM NAY (dựa trên schedule load từ backend)
const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Các buổi học hôm nay
const todaySessions = state.schedule.filter((s) => s.date === todayStr);

// Nếu muốn đếm *buổi* thì dùng todaySessions.length
// Nếu muốn đếm *lớp* khác nhau thì lấy theo classId / courseId
const todayClassCount = new Set(
  todaySessions.map((s) => s.classId || s.courseId)
).size;


  // Label helpers
  const requestTypeLabel = (type) => {
    switch (type) {
      case 'change':
        return 'Đổi lịch';
      case 'leave':
        return 'Nghỉ tạm thời';
      case 'resign':
        return 'Nghỉ việc';
      default:
        return type;
    }
  };

  const complaintTopicLabel = (topic) => {
    switch (topic) {
      case 'salary':
        return 'Vấn đề lương / thanh toán';
      case 'class':
        return 'Vấn đề lớp học';
      case 'other':
        return 'Khác';
      default:
        return topic;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'scheduled':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang diễn ra';
      case 'scheduled':
        return 'Đã lên lịch';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // const handleChangePassword = () => {
  //   if (
  //     !securityForm.currentPassword ||
  //     !securityForm.newPassword ||
  //     !securityForm.confirmPassword
  //   ) {
  //     alert('Vui lòng nhập đầy đủ thông tin.');
  //     return;
  //   }
  //   if (securityForm.newPassword !== securityForm.confirmPassword) {
  //     alert('Mật khẩu mới và xác nhận không khớp.');
  //     return;
  //   }
  //   alert('Đổi mật khẩu demo (UI), chưa kết nối API backend.');
  //   setSecurityForm({
  //     currentPassword: '',
  //     newPassword: '',
  //     confirmPassword: '',
  //   });
  // };

  // const handleSubmitComplaint = () => {
  //   if (!complaintForm.content.trim()) {
  //     alert('Vui lòng nhập nội dung khiếu nại.');
  //     return;
  //   }
  //   const c = {
  //     ...complaintForm,
  //     ts: Date.now(),
  //     status: 'waiting',
  //   };
  //   const newState = {
  //     ...state,
  //     complaints: [c, ...(state.complaints || [])],
  //   };
  //   saveState(newState);
  //   setComplaintForm({ topic: 'salary', content: '' });
  //   alert('Đã gửi khiếu nại. Bộ phận hỗ trợ sẽ phản hồi trong 1–2 ngày làm việc.');
  // };
  const handleChangePassword = async () => {
  const { currentPassword, newPassword, confirmPassword } = securityForm;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Vui lòng nhập đầy đủ thông tin.');
    return;
  }
// 
  // if (newPassword.length < 6) {
    // alert('Mật khẩu mới tối thiểu 6 ký tự.');
    // return;
  // }
// 
  if (newPassword === currentPassword) {
    alert('Mật khẩu mới phải khác mật khẩu hiện tại.');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Mật khẩu mới và xác nhận không khớp.');
    return;
  }

  try {
    setPasswordLoading(true);

    const res = await changePassword(currentPassword, newPassword);
    alert(res?.message || 'Đổi mật khẩu thành công.');

    // reset form
    setSecurityForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  } catch (error) {
    console.error('Change password error:', error);
    const msg =
      error?.response?.data?.detail ||
      error?.message ||
      'Đổi mật khẩu thất bại. Vui lòng thử lại.';
    alert(msg);
  } finally {
    setPasswordLoading(false);
  }
};

  const handleDeleteComplaint = (index) => {
    const next = [...(state.complaints || [])];
    next.splice(index, 1);
    saveState({ ...state, complaints: next });
  };
const [registerTab, setRegisterTab] = useState('open'); // 'open' | 'registered'
const [requestTab, setRequestTab] = useState('submit'); 


  // Modal add resource
  const renderAddResourceModal = () => {
  if (!isModalOpen) return null;

  // Text header tùy theo loại tài liệu
  const headerText =
    resourceType === 'meeting'
      ? 'THÊM LINK PHÒNG HỌC'
      : resourceType === 'slide'
      ? 'THÊM SLIDE BÀI GIẢNG'
      : resourceType === 'exercise'
      ? 'THÊM BÀI TẬP'
      : resourceType === 'review'
      ? 'THÊM LINK CHẤM BÀI / NHẬN XÉT'
      : 'THÊM TÀI LIỆU';

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{headerText}</h3>
          <button
            className="close-btn"
            type="button"
            onClick={closeAddResourceModal}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            Tiêu đề
            <input
              type="text"
              name="title"
              value={resourceForm.title}
              onChange={handleResourceFormChange}
              placeholder="VD: Link Zoom, Slide buổi 1, Bài tập chương 1..."
            />
          </label>

          <label className="field">
            URL
            <input
              type="text"
              name="url"
              value={resourceForm.url}
              onChange={handleResourceFormChange}
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="cancel-btn"
            onClick={closeAddResourceModal}
          >
            Hủy
          </button>
          <button
            type="button"
            className="confirm-btn"
            onClick={handleAddResource}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};


  // RENDER
  return (
    <>
      <DynamicHeader />
      {renderAddResourceModal()}

      {/* Nếu activeSection nằm trong sectionsWithSidebar => có sidebar
          Ngược lại (profile, payroll, ...) thì thêm class .no-sidebar */}
      <div
        className={`shell ${
          sectionsWithSidebar.includes(activeSection) ? '' : 'no-sidebar'
        }`}
      >
        {/* SIDEBAR – chỉ cho các trang nằm trong sectionsWithSidebar */}
        {sectionsWithSidebar.includes(activeSection) && (
          <aside className="sidebar">
            <div className="user-mini">
              <div className="avatar" id="avatar2">
                {initials(state.profile.name)}
              </div>
              <div>
                <div className="nm" id="tutorName2">
                  {state.profile.name}
                </div>
                <div className="uid" id="tutorRank">
                  Chức vụ: Gia sư
                </div>
              </div>
            </div>

            <nav className="side-nav">
              <a
                className={`side-link ${
                  activeSection === 'home' ? 'is-active' : ''
                }`}
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSession(null);
                  setActiveSection('home');
                }}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M4 10L12 4l8 6v8a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2z"
                    fill="currentColor"
                  />
                </svg>
                Trang chủ
              </a>


              <a
                className={`side-link ${
                  activeSection === 'schedule' ? 'is-active' : ''
                }`}
                href="#schedule"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSession(null);
                  setActiveSection('schedule');
                }}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z"
                    fill="currentColor"
                  />
                </svg>
                Lịch giảng dạy
              </a>

              <a
                className={`side-link ${
                  activeSection === 'teaching-courses' ? 'is-active' : ''
                }`}
                href="#teaching-courses"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('teaching-courses');
                }}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M4 19h16V5H4v14Zm2-2V7h12v10H6Zm3-2h6v-2H9v2Z"
                    fill="currentColor"
                  />
                </svg>
                Danh sách khóa học
              </a>

              <a
                className={`side-link ${
                  activeSection === 'register-classes' ? 'is-active' : ''
                }`}
                href="#register-classes"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('register-classes');
                }}
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2Z"
                    fill="currentColor"
                  />
                </svg>
                Đăng ký lớp mới
              </a>

              
            </nav>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="content-area">
          {/* Trang chủ */}
          {activeSection === 'home' && (
            <section className="content-section active">

              {/* <div className="notice-panel"> */}
                <div className="notice-header">
                  <h3>📢 Thông báo</h3>
                </div>
                <div className="notice-body">
                  <ul className="notice-list">
                    <li>
                      Hôm nay bạn có <strong>{todayClassCount}</strong> lớp học.
                      Lịch dạy tuần đã được cập nhật.
                    </li>
                    <li>
                      Bạn hiện đang dạy <strong>{state.myClasses.length}</strong> lớp học đang hoạt động.
                    </li>
                  </ul>

                  <div className="notice-subsection">
                    <h3>📅 Lịch học sắp tới</h3> </div>


                  {/* Lịch học sắp tới */}
                  {upcomingSessions.length > 0 ? (
                    <div className="upcoming-block">
                      <div className="upcoming-list">
                        {upcomingSessions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="upcoming-session-btn"
                            onClick={() => {
                              setActiveSection('schedule');
                              handleProcessAndShowDetails(s);
                            }}
                          >
                            <span className="upcoming-dot" />
                            <span className="upcoming-main">
                              <span className="upcoming-class">{s.courseId}</span>
                              <span className="upcoming-meta">
                                {s.date} <span className="dot-sep">•</span> {s.time}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-session">

                      <div className='notice uid'>
                      <span>Không có buổi học nào sắp tới.</span>


                      </div>
                    </div>
                  )}

                </div>
              {/* </div> */}
              
              

            </section>
          )}


        {/* Lịch dạy */}
          {activeSection === 'schedule' && (
            <section className="content-section active">
              {selectedSession ? (
                <div id="courseDetail">

                  <div className="course-hero">
                    <div className='notice-header'>
                      <h3>{selectedSession.courseId}</h3>
                    </div>
                  </div>
                  <div className="course-shell">

                    <div className="section">
                      <div className="section-header-row">
                        <div>
                          <h3>🎥 Học Online</h3>

                        </div>

                        <div className="hstack">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleJoinMeeting}
                          >
                            Vào phòng học
                          </button>

                          <button
                            className="btn btn-ghost mini"
                            type="button"
                            onClick={() => openAddResourceModal('meeting')}
                          >
                            + Thêm link phòng học
                          </button>
                        </div>
                      </div>

                      <div className="resource-list" id="slideList">
                        {/* {sessionResources.filter(r => r.resource_type === 'meeting').length > 0 ? (
                          sessionResources
                            .filter(r => r.resource_type === 'meeting')
                            .map(res => (
                              <div key={res.id} className="file-item">
                                <a href={res.url} target="_blank" rel="noopener noreferrer">
                                  {res.title}
                                </a>
                                <button
                                  className="btn btn-ghost mini"
                                  onClick={() => handleDeleteResource(res.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            ))
                        ) : (
                          <p className="uid">Chưa có link meeting</p>
                        )} */}
                        {sessionResources.filter(r => r.resource_type === 'meeting').length > 0 ? (
                          sessionResources
                            .filter(r => r.resource_type === 'meeting')
                            .map(res => (
                              <div key={res.id} className="file-item">
                                <div>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer">
                                    {res.title}
                                  </a>
                                  <div className="uid">
                                    Tải lên: {formatUploadedAt(res.uploaded_at)}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-ghost mini"
                                  onClick={() => handleDeleteResource(res.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            ))
                        ) : (
                          <p className="uid">Chưa có link meeting</p>
                        )}

                      </div>
                    </div>


                    <div className="section">
                      <div>
                        <h3>📚 Slides</h3>
                        <button className="btn btn-ghost mini" onClick={() => openAddResourceModal('slide')}>+ Thêm tài liệu</button>
                      </div>
                      <div className="resource-list" id="slideList">
                        {/* {sessionResources.filter(r => r.resource_type === 'slide').length > 0 ? (
                          sessionResources.filter(r => r.resource_type === 'slide').map(res => (
                            <div key={res.id} className="file-item">
                              <a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a>
                              <button className="btn btn-ghost mini" onClick={() => handleDeleteResource(res.id)} >Xóa</button>
                            </div>
                          ))
                        ) : (
                          <p className="uid">Chưa có slide cho buổi học này.</p>
                        )} */}

                        {sessionResources.filter(r => r.resource_type === 'slide').length > 0 ? (
  sessionResources.filter(r => r.resource_type === 'slide').map(res => (
    <div key={res.id} className="file-item">
      <div>
        <a href={res.url} target="_blank" rel="noopener noreferrer">
          {res.title}
        </a>
        <div className="uid">
          Tải lên: {formatUploadedAt(res.uploaded_at)}
        </div>
      </div>
      <button
        className="btn btn-ghost mini"
        onClick={() => handleDeleteResource(res.id)}
      >
        Xóa
      </button>
    </div>
  ))
) : (
  <p className="uid">Chưa có slide cho buổi học này.</p>
)}

                      </div>
                    </div>

                    <div className="section">
                      <div>
                        <h3>📝 Bài tập</h3>
                        <button className="btn btn-ghost mini" onClick={() => openAddResourceModal('exercise')}>+ Thêm tài liệu</button>
                      </div>
                      <div className="resource-list" id="exerciseList">
                        {/* {sessionResources.filter(r => r.resource_type === 'exercise').length > 0 ? (
                          sessionResources.filter(r => r.resource_type === 'exercise').map(res => (
                            <div key={res.id} className="file-item">
                              <a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a>
                              <button className="btn btn-ghost mini" onClick={() => handleDeleteResource(res.id)} >Xóa</button>
                            </div>
                          ))
                        ) : (
                          <p className="uid">Chưa có bài tập cho buổi học này.</p>
                        )} */}
                        {sessionResources.filter(r => r.resource_type === 'exercise').length > 0 ? (
  sessionResources.filter(r => r.resource_type === 'exercise').map(res => (
    <div key={res.id} className="file-item">
      <div>
        <a href={res.url} target="_blank" rel="noopener noreferrer">
          {res.title}
        </a>
        <div className="uid">
          Tải lên: {formatUploadedAt(res.uploaded_at)}
        </div>
      </div>
      <button
        className="btn btn-ghost mini"
        onClick={() => handleDeleteResource(res.id)}
      >
        Xóa
      </button>
    </div>
  ))
) : (
  <p className="uid">Chưa có bài tập cho buổi học này.</p>
)}

                      </div>
                    </div>

                    <div className="section">
                      <h3>📤 Bài nộp</h3>
                      <div className="resource-list" id="slideList">
                        {/* {sessionResources.filter(r => r.resource_type === 'submission').length > 0 ? (
                          sessionResources.filter(r => r.resource_type === 'submission').map(res => (
                            <div key={res.id} className="file-item">
                              <a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a>
                            </div>
                          ))
                        ) : (
                          <p className="uid">Chưa có bài nộp.</p>
                        )} */}
                        {sessionResources.filter(r => r.resource_type === 'submission').length > 0 ? (
  sessionResources.filter(r => r.resource_type === 'submission').map(res => (
    <div key={res.id} className="file-item">
      <div>
        <a href={res.url} target="_blank" rel="noopener noreferrer">
          {res.title}
        </a>
        <div className="uid">
          Nộp lúc: {formatUploadedAt(res.uploaded_at)}
        </div>
      </div>
    </div>
  ))
) : (
  <p className="uid">Chưa có bài nộp.</p>
)}

                      </div>
                    </div>

                    <div className="section">
                      <div>
                        <h3>✅ Chấm bài và nhận xét</h3>
                        <button className="btn btn-ghost mini" onClick={() => openAddResourceModal('review')}>+ Thêm tài liệu</button>
                      </div>
                      <div className="resource-list" id="exerciseList">
                        {/* {sessionResources.filter(r => r.resource_type === 'review').length > 0 ? (
                          sessionResources.filter(r => r.resource_type === 'review').map(res => (
                            <div key={res.id} className="file-item">
                              <a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a>
                              <button className="btn btn-ghost mini" onClick={() => handleDeleteResource(res.id)}>Xóa</button>
                            </div>
                          ))
                        ) : (
                          <p className="uid">Chưa có bài chấm điểm và nhận xét.</p>
                        )} */}
                        {sessionResources.filter(r => r.resource_type === 'review').length > 0 ? (
  sessionResources.filter(r => r.resource_type === 'review').map(res => (
    <div key={res.id} className="file-item">
      <div>
        <a href={res.url} target="_blank" rel="noopener noreferrer">
          {res.title}
        </a>
        <div className="uid">
          Tải lên: {formatUploadedAt(res.uploaded_at)}
        </div>
      </div>
      <button
        className="btn btn-ghost mini"
        onClick={() => handleDeleteResource(res.id)}
      >
        Xóa
      </button>
    </div>
  ))
) : (
  <p className="uid">Chưa có bài chấm điểm và nhận xét.</p>
)}

                      </div>
                    </div>
                      
                  {/* <div>
                  <button onClick={() => setSelectedSession(null)} className="btn btn-ghost"  >
                    &larr; Quay lại lịch dạy
                  </button>

                  <button onClick={() => handleRowClick(selectedSession)} className="btn btn-ghost">
                      Tải lại
                  </button>
                  </div> */}


                  <div className="section">
                      <h3>🗓️ Các buổi học trong lớp</h3>
                      <div className="session-list">
                        {state.schedule
                          .filter(s => s.classId === selectedSession.classId)
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .map(sessionInClass => (
                            <div 
                              key={sessionInClass.id}
                              className={`session-item ${sessionInClass.id === selectedSession.id ? 'active' : ''}`}
                              onClick={() => handleRowClick(sessionInClass)}
                            >
                              <div className="session-date">{new Date(sessionInClass.date).toLocaleDateString('vi-VN')}</div>
                              <div className="session-info">
                                Buổi học lúc {sessionInClass.time}
                              </div>
                              <div className="session-status">
                                <span 
                                  className="tag"
                                  style={{
                                    background: getStatusColor(sessionInClass.status),
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                  }}
                                >
                                  {getStatusText(sessionInClass.status)}
                                </span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                                      <div className="session-toolbar">
                    <button onClick={() => setSelectedSession(null)} className="btn btn-ghost back-btn">
                      &larr; Quay lại lịch dạy
                    </button>

                    <button onClick={() => handleRowClick(selectedSession)} className="btn btn-ghost reload-btn">
                      Tải lại
                    </button>
                  </div>

                  </div>
                </div>
              ) : (
                <>
                  
                <div className="notice-header">
                  <h3>Lịch giảng dạy</h3>
                </div>
                  
                  {/* Filter by month */}
                  <div className="schedule-toolbar">
                    <div className="month-nav">
                      <button 
                        onClick={handlePreviousMonth}
                        title="Tháng trước"

                      >
                        ◄
                      </button>
                      <div>
                        Tháng {scheduleMonth.split('-')[1]} năm {scheduleMonth.split('-')[0]}
                      </div>
                      <button 
                        onClick={handleNextMonth}
                        title="Tháng sau"

                      >
                        ►
                      </button>
                    </div>
                    <button 
                      className="btn btn-ghost" 
                      onClick={fetchMySchedule}
                      disabled={loading}
                    >
                      {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                  </div>

                  {state.schedule.filter(s => s.date && s.date.startsWith(scheduleMonth)).length === 0 ? (
                    <p className="uid">Không có lịch dạy trong tháng này</p>
                  ) : (
                    <table className="table" id="tblSchedule">
                      <thead>
                        <tr>
                          <th>Ngày học</th>
                          <th>Giờ học</th>
                          <th>Môn học</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.schedule
                          .filter(s => s.date && s.date.startsWith(scheduleMonth)) // Filter by selected month
                          .map((s, index) => (
                          <tr key={s.id || index} onClick={() => handleProcessAndShowDetails(s)} >
                            <td>{s.date}</td>
                            <td>{s.time}</td>
                            <td>{s.courseId}</td>
                            <td>
                              <span className={`tag tag-${s.status}`}>
                                {s.status === 'completed' ? 'Hoàn thành' : 
                                s.status === 'scheduled' ? 'Đã lên lịch' :
                                s.status === 'processing' ? 'Đang diễn ra' :
                                s.status === 'cancelled' ? 'Hủy' : s.status}
                              </span>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </section>
          )}

          {/* Khóa đang dạy */}
          {activeSection === 'teaching-courses' && (
            <section className="content-section active">
                <div className="notice-header">
                  <h3>Danh sách khóa học</h3>
                </div>
              <div>
                  <ul className="notice-list">

                    <li>
                      Tổng số lớp đang hoạt động: <strong>{teachingClasses.length}</strong>
                    </li>
                  </ul>

                {teachingClasses.length === 0 ? (
                  <p className="uid">Chưa có lớp đang dạy.</p>
                ) : (
                  <div className="grid2">
                    {teachingClasses.map((c) => (
                      <div key={c.id} className="course-card">
                        <div className="course-head">
                          <div>
                            <strong>{c.name}</strong>
                            {/* {c.className && (
                              <div className="uid">
                                Lớp: {c.className}
                              </div>
                            )} */}
                            <div className="uid">
                              Học viên: {c.studentName}
                            </div>
                            <div className="uid">
                              Lịch học: {c.schedule}
                            </div>
                            {c.startDate && (
                              <div className="uid">
                                Khai giảng:{' '}
                                {new Date(
                                  c.startDate
                                ).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                            {c.endDate && (
                              <div className="uid">
                                Bế giảng:{' '}
                                {new Date(
                                  c.endDate
                                ).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="course-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setActiveSection('schedule')}
                          >
                            Vào lớp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === 'register-classes' && (
  <section className="content-section active">
    <div className="notice-header">
      <h3>Đăng ký lớp mới</h3>
    </div>

    {/* Tabs ngang: Lớp đang mở / Lớp đã đăng ký */}
    <div className="register-tabs">
      <button
        className={`register-tab-btn ${
          registerTab === 'open' ? 'is-active' : ''
        }`}
        onClick={() => setRegisterTab('open')}
      >
        Lớp đang mở
      </button>
      <button
        className={`register-tab-btn ${
          registerTab === 'registered' ? 'is-active' : ''
        }`}
        onClick={() => setRegisterTab('registered')}
      >
        Quản lý lịch sử
      </button>
    </div>

    {/* ========== TAB 1: LỚP ĐANG MỞ ========== */}
    {registerTab === 'open' && (
      <>
        <ul className="notice-list">
          <li>
            Tổng số lớp chưa được đăng ký:{' '}
            <strong>{filteredOpenClasses.length}</strong>
          </li>
        </ul>

        <div className="hstack">
          <input
            className="search"
            placeholder="Tìm theo môn/lớp/học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className="btn btn-ghost"
            onClick={() => {
              setSearchQuery('');
              fetchOpenClasses();
              fetchMyClasses();
            }}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>

        <div>
          {loading ? (
            <p className="uid">Đang tải danh sách lớp...</p>
          ) : filteredOpenClasses.length === 0 ? (
            <p className="uid">Chưa có lớp nào đang chờ nhận.</p>
          ) : (
            <div className="grid2">
              {filteredOpenClasses.map((c) => (
                <div key={c.id} className="course-card">
                  <div className="course-head">
                    <div>
                      <strong className="course-title">{c.name}</strong>
                      <div className="uid">Học viên: {c.studentName}</div>
                      <div className="uid">Lịch học: {c.schedule}</div>
                      {c.startDate && (
                      <div className="uid">
                        Bắt đầu:{' '}
                        {new Date(c.startDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {c.endDate && (
                      <div className="uid">
                        Kết thúc:{' '}
                        {new Date(c.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                      <div className="uid">Thù lao: {money((c.default_fee || 0) * 0.65)}</div>
                      <div className="uid">
                        Trạng thái:{' '}
                        <span className="tag">{c.status}</span>
                      </div>
            
                    </div>
                  </div>
                  <div className="course-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApplyClass(c.id)}
                    >
                      Đăng ký
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )}

    {/* ========== TAB 2: LỚP ĐÃ ĐĂNG KÝ ========== */}
    {registerTab === 'registered' && (
      <>
        <ul className="notice-list">
          <li>
            Tổng số lớp bạn đã đăng ký:{' '}
            <strong>{filteredMyClasses.length}</strong>
          </li>
        </ul>

        <div className="hstack">
          <select
            value={classStatusFilter}
            onChange={(e) => setClassStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="open">Đã nhận</option>
            <option value="closed">Hết hiệu lực</option>
          </select>
        </div>

        {filteredMyClasses.length === 0 ? (
          <p className="uid">Chưa có lớp nào đã đăng ký.</p>
        ) : (
          <div className="grid2">
            {filteredMyClasses.map((c) => (
              <div key={c.id} className="course-card">
                <div className="course-head">
                  <div>
                    <strong className="course-title">{c.name}</strong>
                    {/* {c.className && (
                      <div className="uid">Lớp: {c.className}</div>
                    )} */}
                    <div className="uid">Học viên: {c.studentName}</div>
                    <div className="uid">Lịch học: {c.schedule}</div>

                    <div className="uid">
                      Tiền công: {money(Number(c.salary))}
                    </div>

                    {c.startDate && (
                      <div className="uid">
                        Bắt đầu:{' '}
                        {new Date(c.startDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {c.endDate && (
                      <div className="uid">
                        Kết thúc:{' '}
                        {new Date(c.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {c.classStatus && (
                      <div className="uid">
                        Trạng thái lớp:{' '}
                        <span className="tag">
                          {c.classStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* {c.status === 'active' && c.classStatus === 'open' && (
                  <div className="course-actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleReleaseClass(c.assignmentId)}
                    >
                      Hủy đăng ký
                    </button>
                  </div>
                )} */}
                {canCancelClass(c) && (
  <div className="course-actions">
    <button
      className="btn btn-ghost"
      onClick={() => handleReleaseClass(c.assignmentId)}
    >
      Hủy đăng ký
    </button>
  </div>
)}

              </div>
            ))}
          </div>
        )}
      </>
    )}
  </section>
)}


          {/* Ví / Lương & Khiếu nại – KHÔNG NẰM TRONG SIDEBAR, nên shell đã có no-sidebar */}

          {activeSection === 'payroll' && (           
            <section className="content-section active">
                                <div className="account-header">
              <h3>Ví của tôi</h3></div>
              <div className="account-layout">
                
                <div className="account-menu">
 
                  <button
                    className={`account-tab-btn ${
                      walletTab === 'payroll' ? 'is-active' : ''
                    }`}
                    onClick={() => setWalletTab('payroll')}
                  >
                    Nhận lương
                  </button>
                  <button
                    className={`account-tab-btn ${
                      walletTab === 'complaint' ? 'is-active' : ''
                    }`}
                    onClick={() => setWalletTab('complaint')}
                  >
                    Khiếu nại
                  </button>
                </div>

                <div className="account-content">
                  {walletTab === 'payroll' && (
                    <>
                      <div className="wallet-balance">
                      <div className="balance-card">
                        <p>Số dư hiện tại</p>
                        <h3>{Math.floor(currentUser?.balance ?? 0).toLocaleString('vi-VN')}₫</h3>
                      </div>
                      </div>
                      <div className="hstack" >
                        <label className="pill-btn">
                          
                          <input
                            type="month"
                            id="payMonth"
                            className="input-inline-month"
                            value={payMonth}
                            onChange={(e) => setPayMonth(e.target.value)}
                          />
                        </label>
                        {/* <button
                          className="btn btn-ghost"
                          id="btnPayout"
                          onClick={handleRequestPayout}
                        >
                          Yêu cầu thanh toán
                        </button> */}
                        
                        
                      </div>

                      <table
                        className="table"
                        id="tblPayroll"
                      >
                        <thead>
                          <tr>
                            <th>Lớp học</th>
                            <th>Tên học viên</th>
                            <th>Lương theo lớp</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingPayroll ? (
                            <tr><td colSpan="4" className="uid">Đang tải dữ liệu lương...</td></tr>
                          ) : payrollData.length === 0 ? (
                            <tr><td colSpan="4" className="uid">Không có lương trong tháng này.</td></tr>
                          ) : (
                            payrollData.map(p => (
                              <tr key={p.id}>
                                <td>{p.class_name}</td>
                                <td>{p.studentName}</td>
                                <td>{money(Number(p.tutor_salary || 0))}</td>
                                <td>{money(Number(p.tutor_salary || 0))}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3">Tổng</td>
                            <td id="payTotal">
                              {money(payrollData.reduce((acc, p) => acc + Number(p.tutor_salary || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="notice uid">
                        Đơn vị tính: VND. Lương tạm tính dựa trên bảng chấm công đã ghi nhận.
                      </p>
                    </>
                  )}

                


                  

                  {walletTab === 'complaint' && (
  <div className="wallet-complaint">
    {/* Tabs ngang giống phần Đăng ký lớp */}
    <div className="register-tabs">
      <button
        className={`register-tab-btn ${
          complaintTab === 'submit' ? 'is-active' : ''
        }`}
        onClick={() => setComplaintTab('submit')}
      >
        Nộp đơn khiếu nại
      </button>
      <button
        className={`register-tab-btn ${
          complaintTab === 'list' ? 'is-active' : ''
        }`}
        onClick={() => setComplaintTab('list')}
      >
        Danh sách đơn đã nộp
      </button>
    </div>

    {/* TAB 1: Nộp đơn khiếu nại (hình 3) */}
    {complaintTab === 'submit' && (
      <div className="card soft">
        <div className="stack">
          <label className="field">
            Loại khiếu nại
            <select
              value={complaintForm.topic}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  topic: e.target.value,
                })
              }
            >
              <option value="salary">Vấn đề lương / thanh toán</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label className="field">
            Nội dung
            <textarea
              rows="4"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              value={complaintForm.content}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  content: e.target.value,
                })
              }
            />
          </label>
          <div className="hstack">
            <button
              className="btn btn-primary"
              onClick={handleSubmitComplaint}
            >
              Gửi khiếu nại
            </button>
            <button
              className="btn btn-ghost"
              onClick={() =>
                setComplaintForm({
                  topic: 'salary',
                  content: '',
                })
              }
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}

    {/* TAB 2: Danh sách đơn đã nộp (hình 4) */}
    {complaintTab === 'list' && (
      <div className="card soft">
        <strong>Danh sách khiếu nại</strong>
        <div className="stack">
          {state.complaints && state.complaints.length > 0 ? (
            state.complaints.map((c, index) => (
              <div key={index} className="file-item">
                <div>
                  <div>
                    <strong>{complaintTopicLabel(c.topic)}</strong>{' '}
                    <span className="tag wait">Đang xử lý</span>
                  </div>
                  <div className="uid">
                    {new Date(c.ts).toLocaleString()}
                  </div>
                  <div className="uid">
                    Nội dung: {c.content || '—'}
                  </div>
                </div>
                <button
                  className="btn btn-ghost mini"
                  onClick={() => handleDeleteComplaint(index)}
                >
                  Xóa
                </button>
              </div>
            ))
          ) : (
            <p className="uid">Chưa có khiếu nại nào.</p>
          )}
        </div>
      </div>
    )}
  </div>
)}

                </div>
              </div>

            </section>
          )}

          {/* Quản lý tài khoản – không nằm trong sidebar */}
      {activeSection === 'profile' && (
        <section className="content-section active">
              <div className="account-header">
                <h3>Quản lý tài khoản</h3></div> 
          <div className="account-layout">
            
            <aside className="sidebar"> 
              <div className="user-mini">
                <div className="avatar" id="avatar2">
                  {initials(state.profile.name)}
                </div>
                <div>
                  <div className="nm" id="tutorName2">
                    {state.profile.name}
                  </div>
                  <div className="uid" id="tutorRank">
                    Chức vụ: Gia sư
                  </div>
                </div>
              </div>
         
              <nav className="side-nav">
                <button 
                  className={`side-link ${accountTab === 'profile' ? 'is-active' : ''}`}
                  onClick={() => setAccountTab('profile')}
                >
                  Hồ sơ gia sư
                </button>
                <button 
                  className={`side-link ${accountTab === 'security' ? 'is-active' : ''}`}
                  onClick={() => setAccountTab('security')}
                >
                  Đổi mật khẩu
                </button>
              </nav>
            </aside>
            
            
            <div className="account-content">
                {accountTab === 'profile' && (
                  <div className="cv-panel">
                    <h3>Hồ sơ gia sư</h3>


                    <form
                      className="cv-form"
                      onSubmit={(e) => {
                        e.preventDefault();          // chặn reload
                        handleSaveProfile();         // dùng lại hàm lưu cũ
                      }}
                    >
                      <label className="field">
                        Họ tên
                        <input
                          id="pfName"
                          type="text"
                          placeholder="Họ tên"
                          value={profileForm.name}
                          disabled                   // luôn khóa, không cho chỉnh
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Email
                        <input
                          id="pfEmail"
                          type="text"
                          placeholder="Email"
                          value={profileForm.email}
                          disabled={!isEditingProfile} // chỉ mở khi bấm Chỉnh sửa
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        SĐT
                        <input
                          id="pfPhone"
                          type="tel"
                          placeholder="Số điện thoại"
                          value={profileForm.phone}
                          disabled={!isEditingProfile}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Chuyên môn
                        <input
                          id="pfMajor"
                          type="text"
                          placeholder="VD: Toán, Lý, Hóa (có thể nhiều hơn 1, phân cách bằng dấu phẩy)"
                          value={profileForm.major}
                          disabled
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              major: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Cấp độ
                        <input
                          id="pfLevel"
                          type="text"
                          placeholder="VD: THCS, THPT (có thể nhiều hơn 1)"
                          value={profileForm.level}
                          disabled
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              level: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Giới thiệu
                        <textarea
                          id="pfBio"
                          rows="4"
                          placeholder="Đôi lời giới thiệu..."
                          value={profileForm.bio}
                          disabled
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              bio: e.target.value,
                            })
                          }
                        />
                      </label>

                      <div className="hstack">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!isEditingProfile}   // chỉ bấm được khi đang chỉnh
                        >
                          Lưu hồ sơ
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (isEditingProfile) {
                              // nếu đang chỉnh mà bấm Hủy → trả form về state gốc
                              setProfileForm(state.profile);
                            }
                            setIsEditingProfile((prev) => !prev);
                          }}
                        >
                          {isEditingProfile ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {accountTab === 'security' && (
                  <div className="cv-panel">
                    <h3>Bảo mật tài khoản</h3>
                    <p className="uid small">
                      Đổi mật khẩu định kỳ để bảo vệ tài khoản và thông tin lớp dạy của bạn.
                    </p>

                    <form
                      className="cv-form"
                      onSubmit={(e) => {
                        e.preventDefault();        // chặn reload
                        handleChangePassword();    // dùng lại hàm đổi mật khẩu cũ
                      }}
                    >
                      <label className="field">
                        Mật khẩu hiện tại
                        <input
                          type="password"
                          value={securityForm.currentPassword}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Mật khẩu mới
                        <input
                          type="password"
                          value={securityForm.newPassword}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              newPassword: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        Nhập lại mật khẩu mới
                        <input
                          type="password"
                          value={securityForm.confirmPassword}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                      </label>

                      <div className="hstack">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}


                </div>
              </div>
            </section>
          )}

          {/* Nộp đơn */}
          {activeSection === 'requests' && (
  <section className="content-section active">
    <div className="notice-header">
      <h3>📮 Nộp đơn</h3>
    </div>

    {/* Tabs ngang giống Đăng ký lớp / Khiếu nại */}
    <div className="register-tabs">
      <button
        className={`register-tab-btn ${
          requestTab === 'submit' ? 'is-active' : ''
        }`}
        onClick={() => setRequestTab('submit')}
      >
        Nộp đơn
      </button>
      <button
        className={`register-tab-btn ${
          requestTab === 'list' ? 'is-active' : ''
        }`}
        onClick={() => setRequestTab('list')}
      >
        Danh sách đơn đã gửi
      </button>
    </div>

    {/* TAB 1: Nộp đơn */}
    {requestTab === 'submit' && (
      <div className="card soft">
        <div className="stack">
          <label className="field">
            Loại đơn
            <select
              id="rqType"
              value={requestForm.type}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  type: e.target.value,
                })
              }
            >
              <option value="change">Xin đổi lịch dạy</option>
              <option value="leave">Xin nghỉ dạy tạm thời</option>
              <option value="resign">Nghỉ việc</option>
            </select>
          </label>

          <label className="field">
            Áp dụng cho lớp
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
              <option value="">-- Chọn lớp --</option>
            </select>
          </label>

          <div className="grid2">
            <label className="field">
              Từ ngày
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
              Đến ngày
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

          <label className="field">
            Lý do
            <textarea
              id="rqReason"
              rows="4"
              placeholder="Trình bày lý do..."
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
              Gửi đơn
            </button>
            <button
              className="btn btn-ghost"
              onClick={() =>
                setRequestForm({
                  type: 'change',
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

    {/* TAB 2: Danh sách đơn đã gửi */}
    {requestTab === 'list' && (
      <div className="card soft">
        <strong>Đơn đã gửi</strong>
        <div id="rqList" className="stack">
          {state.requests.length > 0 ? (
            state.requests.map((r, index) => (
              <div key={index} className="file-item">
                <div>
                  <div>
                    <strong>{requestTypeLabel(r.type)}</strong>{' '}
                    <span className="tag wait">Đang chờ duyệt</span>
                  </div>
                  <div className="uid">
                    {r.courseId || '—'} • {r.from || '—'} → {r.to || '—'} •{' '}
                    {new Date(r.ts).toLocaleString()}
                  </div>
                  <div className="uid">
                    Lý do: {r.reason || '—'}
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
            <p className="uid">Chưa có đơn nào được gửi.</p>
          )}
        </div>
      </div>
    )}
  </section>
)}

        </main>
      </div>

      <Footer />
    </>
  );
};

export default Tutor;





