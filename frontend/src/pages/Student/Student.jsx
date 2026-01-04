import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../../components/Footer';
import '../../components/Header.css';
import './Student.css';
import DynamicHeader from '../../components/DynamicHeader';

import { getUserById, getMe, deposit } from '../../services/userService';

import { isAuthenticated, changePassword } from '../../services/authService';
import { 
  // getCourses,
  // getSubjects,
  // getCourseById, 
  // getTeachingSchedules,
  // getTeachingScheduleById,
  getMyRegistrations,
  createMyRegistration,
  cancelMyRegistration,
  getClasses,
  getClassSessions,
  completeSession,            // ✅ THÊM
} from '../../services/academicService';
import { 
  getResources,
  createResource,             // ✅ THÊM
  deleteResource,             // ✅ THÊM
} from '../../services/learningService';

import {
  createPaymentIntent,
  requestOtp,
  confirmPayment,
  failPaymentOtp,
} from '../../services/paymentService';

const Student = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const LS_KEY = 'studentApp.v1';
  
  // Xác định section ban đầu theo hash URL
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    const raw = window.location.hash.replace('#', '') || 'home';
    let section = raw;

    // Map hash từ DynamicHeader sang section nội bộ
    if (raw === 'thong-tin') section = 'profile';      // Quản lý thông tin
    if (raw === 'khoa-hoc') section = 'my-classes';    // Khóa học của tôi

    const allowed = [
      'home',
      'schedule',
      'my-classes',
      'courses',
      'registrations',
      'profile',
      'wallet',
    ];

    return allowed.includes(section) ? section : 'home';
  });

  const [state, setState] = useState({
    profile: { 
      name: 'Học viên', 
      email: 'student@example.com', 
      phone: '0901234567', 
      grade: '12', 
      school: 'THPT Nguyễn Thị Minh Khai',
      bio: 'Đang chuẩn bị cho kỳ thi THPT Quốc gia.' 
    },
    availableCourses: [],
    myRegistrations: [],
    myClasses: [],
    schedule: [],
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);


  const [profileForm, setProfileForm] = useState(state.profile);
  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionResources, setSessionResources] = useState([]);

  // ✅ Modal thêm tài liệu (Bài nộp)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState(''); // 'submission'
  const [resourceForm, setResourceForm] = useState({ title: '', url: '' });

  // Tabs cho “Quản lý thông tin”
  const [accountTab, setAccountTab] = useState('profile'); // 'profile' | 'security'
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // // Registration form state
  // const [showRegisterForm, setShowRegisterForm] = useState(false);
  // const [registerForm, setRegisterForm] = useState({
  //   courseId: '',
  //   teachingScheduleId: '',
  //   notes: ''
  // });
  // const [availableSchedules, setAvailableSchedules] = useState([]);

  // // Đăng ký khóa học (UI giống Course)
  // const [courseFilters, setCourseFilters] = useState({
  //   grade: '',
  //   subject: '',
  //   query: '',
  // });
  // const [courseList, setCourseList] = useState([]);
  // const [subjectList, setSubjectList] = useState([]);
  // const [courseLoading, setCourseLoading] = useState(true);
  // const [courseError, setCourseError] = useState(null);

  // // ==== STATE cho xem chi tiết & thanh toán khóa học ====
  const [currentUser, setCurrentUser] = useState(null);

  // const [selectedCourse, setSelectedCourse] = useState(null);
  // const [selectedScheduleObj, setSelectedScheduleObj] = useState(null);
  // const [selectedScheduleSummary, setSelectedScheduleSummary] = useState('---');

  // const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  // const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  // const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // // danh sách lịch dạy
  // const [teachingSchedules, setTeachingSchedules] = useState([]);
  // const [loadingSchedules, setLoadingSchedules] = useState(false);
  // const [errorSchedules, setErrorSchedules] = useState(null);

  // // thanh toán + OTP
  // const [paymentIntent, setPaymentIntent] = useState(null);
  // const [selectedRegistration, setSelectedRegistration] = useState(null);
  // const [otpCode, setOtpCode] = useState('');
  // const [isSendingOtp, setIsSendingOtp] = useState(false);
  // const [otpTimer, setOtpTimer] = useState(0);
  // const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Tabs & filter cho "Đơn đăng ký của tôi"
  const [registrationTab, setRegistrationTab] = useState('success'); // 'success' | 'cancelled'
  const [regStatusFilter, setRegStatusFilter] = useState('all');     // 'all' | 'pending' | 'matched' | 'cancelled'

  const [walletTab, setWalletTab] = useState('balance'); // 'balance' | 'history'


  // Lấy user từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchProfile = async () => {
    try {
      if (!isAuthenticated()) return;

      const me = await getMe();
      setCurrentUser(me); // Cập nhật currentUser với dữ liệu mới nhất (bao gồm cả balance)

      // map dữ liệu từ backend sang form
      const profileFromApi = {
        name:  me.name  || 'Học viên',
        email: me.email || '',
        phone: me.phone || '',
        grade: me.grade || '',
        school: me.school || '',
        bio:   me.bio   || '',
      };

      setState(prev => {
        const newState = { ...prev, profile: profileFromApi };
        // đồng bộ lại localStorage
        localStorage.setItem(LS_KEY, JSON.stringify(newState));
        return newState;
      });
      setProfileForm(profileFromApi);
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  // Lấy hồ sơ học viên từ API (dữ liệu thật)
  useEffect(() => {
    fetchProfile();
  }, []);


  // Đếm ngược OTP 10 phút, hết hạn thì báo fail
  // useEffect(() => {
  //   if (otpTimer > 0) {
  //     const interval = setInterval(() => {
  //       setOtpTimer((t) => t - 1);
  //     }, 1000);
  //     return () => clearInterval(interval);
  //   }

  //   if (otpTimer === 0 && paymentIntent?.intent_id) {
  //     failPaymentOtp(paymentIntent.intent_id)
  //       .then(() => {
  //         console.log('OTP hết hạn -> đánh dấu failed');
  //         alert('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP mới!');
  //       })
  //       .catch((err) => console.error('Lỗi failPaymentOtp:', err));
  //   }
  // }, [otpTimer, paymentIntent]);

  // Load state from localStorage
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

  // Đồng bộ activeSection với hash URL
  useEffect(() => {
    const raw = (location.hash || '').replace('#', '') || 'home';
    let section = raw;

    if (raw === 'thong-tin') section = 'profile';
    if (raw === 'khoa-hoc') section = 'my-classes';

    const allowed = [
      'home',
      'schedule',
      'my-classes',
      'courses',
      'registrations',
      'profile',
      'wallet'
    ];

    if (allowed.includes(section)) {
      setActiveSection(section);
    }
  }, [location.hash]);

  // useEffect(() => {
  //   const fetchCourseData = async () => {
  //     try {
  //       setCourseLoading(true);
  //       const [coursesData, subjectsData] = await Promise.all([
  //         getCourses(),
  //         getSubjects(),
  //       ]);
  //       setCourseList(coursesData || []);
  //       setSubjectList(subjectsData || []);
  //       setCourseError(null);
  //     } catch (err) {
  //       console.error('Error fetching courses:', err);
  //       setCourseError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
  //     } finally {
  //       setCourseLoading(false);
  //     }
  //   };

  //   fetchCourseData();
  // }, []);

  // Fetch data on mount
  useEffect(() => {
    const initData = async () => {
      // await fetchAvailableCourses();
      await fetchMyRegistrations();
      await fetchMySchedule();
    };
    initData();
  }, []);

  // const fetchAvailableCourses = async () => {
  //   setLoading(true);
  //   try {
  //     if (!isAuthenticated()) {
  //       console.warn('Not authenticated');
  //       return;
  //     }

  //     const courses = await getCourses();
  //     setState(prev => ({ ...prev, availableCourses: courses }));
  //   } catch (err) {
  //     console.error('Error fetching courses:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchMyRegistrations = async () => {
  //   try {
  //     if (!isAuthenticated()) {
  //       return;
  //     }

  //     const registrations = await getMyRegistrations();
  //     console.log('My Registrations:', registrations);

  //     const enrichedRegistrations = await Promise.all(
  //       registrations.map(async (reg) => {
  //         try {
  //           const [course, schedule] = await Promise.all([
  //             getCourseById(reg.course_id).catch(() => null),
  //             getTeachingScheduleById(reg.teaching_schedule_id).catch(() => null),
  //           ]);

  //           // Thử lấy lớp gắn với đăng ký (khi đã matched)
  //           let classInfo = null;
  //           try {
  //             const classes = await getClasses({ registration_id: reg.id }).catch(() => []);
  //             if (classes && classes.length > 0) classInfo = classes[0];
  //           } catch (_) {}

  //           // Hiển thị lịch
  //           let scheduleDisplay = '';
  //           if (schedule && schedule.schedule_json) {
  //             const sj = schedule.schedule_json;
  //             const days = sj.days?.join(', ') || '';
  //             const time = `${sj.start_time || ''}-${sj.end_time || ''}`;
  //             scheduleDisplay = `${days} ${time}`.trim();
  //           }

  //           // Ngày khai giảng / bế giảng (ưu tiên lấy từ class)
  //           const start_date =
  //             classInfo?.start_date ||
  //             schedule?.start_date ||
  //             null;

  //           const end_date =
  //             classInfo?.end_date ||
  //             schedule?.end_date ||
  //             null;

  //           return {
  //             ...reg,
  //             courseName: course?.course_name || 'Khóa học',
  //             scheduleDisplay: scheduleDisplay || schedule?.schedule_name || 'Chưa có lịch',
  //             start_date,
  //             end_date,
  //             className: classInfo?.class_name || null,
  //             classStatus: classInfo?.status || null,
  //           };
  //         } catch (err) {
  //           console.error('Error enriching registration:', err);
  //           return {
  //             ...reg,
  //             courseName: 'Khóa học',
  //             scheduleDisplay: 'Chưa có lịch',
  //             start_date: null,
  //             end_date: null,
  //           };
  //         }
  //       })
  //     );

  //     console.log('Enriched Registrations:', enrichedRegistrations);
      
  //     const myClasses = enrichedRegistrations.filter(r => r.status === 'matched');
  //     const myRegistrations = enrichedRegistrations;
      
  //     setState(prev => ({ 
  //       ...prev, 
  //       myRegistrations,
  //       myClasses
  //     }));
  //   } catch (err) {
  //     console.error('Error fetching my registrations:', err);
  //   }
  // };
  const fetchMyRegistrations = async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }

      const registrations = await getMyRegistrations();
      console.log('My Registrations:', registrations);

      // A matched registration is a class, so we don't need a separate API call.
      // The data should already be on the registration object.
      const enrichedRegistrations = registrations.map((reg) => {
        try {
          // Hiển thị lịch
          let scheduleDisplay = '';
          if (reg.schedule_json) {
            const sj = reg.schedule_json;
            const days = sj.days?.join(', ') || '';
            const time = `${sj.start_time || ''}-${sj.end_time || ''}`;
            scheduleDisplay = `${days} ${time}`.trim();
          }

          // The backend should provide class-related details on the registration object itself
          // when the status is 'matched'.
          const start_date = reg.start_date || null;
          const end_date = reg.end_date || null;
          const className = reg.class_name || null;
          const classStatus = reg.class_status || null;

          return {
            ...reg,
            courseName: `Môn ${reg.subject} - Lớp ${reg.grade}` ,
            scheduleDisplay: scheduleDisplay || 'Chưa có lịch',
            start_date,
            end_date,
            className,
            
            classStatus,
          };
        } catch (err) {
          console.error('Error enriching registration:', err);
          return {
            ...reg,
            courseName: `Môn ${reg.subject} - Lớp ${reg.grade}`,
            scheduleDisplay: 'Chưa có lịch',
            start_date: reg.start_date,
            end_date: reg.end_date,
          };
        }
      });

      console.log('Enriched Registrations:', enrichedRegistrations);
      
      const myClasses = enrichedRegistrations.filter(r => r.status === 'matched');
      const myRegistrations = enrichedRegistrations;
      
      setState(prev => ({ 
        ...prev, 
        myRegistrations,
        myClasses
      }));
    } catch (err) {
      console.error('Error fetching my registrations:', err);
    }
  };


  // const fetchMySchedule = async () => {
  //   setLoading(true);
  //   try {
  //     if (!isAuthenticated()) {
  //       return;
  //     }

  //     const userStr = localStorage.getItem("user");
  //     const user = userStr ? JSON.parse(userStr) : null;
  //     console.log('👤 Current user:', user);

  //     const allSessions = await getClassSessions();
  //     console.log('📅 Received sessions:', allSessions.length, allSessions);
      
  //     const uniqueClassIds = [...new Set(allSessions.map(s => s.class_id))];
  //     const classesMap = {};
      
  //     await Promise.all(uniqueClassIds.map(async (classId) => {
  //       try {
  //         const classes = await getClasses({ id: classId });
  //         if (classes && classes.length > 0) {
  //               const correctClass = classes.find(c => c.id === classId);
  //               classesMap[classId] = correctClass || classes[0];
  //           // classesMap[classId] = classes[0];
  //         }
  //       } catch (err) {
  //         console.error('Error fetching class:', err);
  //       }
  //     }));

  //     const schedule = allSessions.map(session => {
  //       const classInfo = classesMap[session.class_id];
  //       const className = classInfo?.class_name || 'Lớp học';

  //       let sessionDate = '';
  //       let startTime = '';
  //       let endTime = '';
        
  //       if (session.start_time) {
  //         const dateMatch = session.start_time.match(/^(\d{4}-\d{2}-\d{2})/);
  //         sessionDate = dateMatch ? dateMatch[1] : '';
  //         const timeMatch = session.start_time.match(/T(\d{2}:\d{2})/);
  //         startTime = timeMatch ? timeMatch[1] : '';
  //       }
        
  //       if (session.end_time) {
  //         const timeMatch = session.end_time.match(/T(\d{2}:\d{2})/);
  //         endTime = timeMatch ? timeMatch[1] : '';
  //       }

  //       return {
  //         id: session.id,
  //         date: sessionDate,
  //         time: `${startTime}-${endTime}`,
  //         courseId: className,
  //         status: session.status || 'scheduled',
  //         classId: session.class_id
  //       };
  //     });

  //     schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

  //     console.log('Final schedule:', schedule);
  //     setState(prev => ({ ...prev, schedule }));
  //   } catch (err) {
  //     console.error('Error fetching schedule:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const fetchMySchedule = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated()) {
        return;
      }

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('👤 Current user:', user);

      // 1. Lấy tất cả các buổi học và tất cả các lớp học song song
      const [allSessions, allClasses] = await Promise.all([
        getClassSessions(),
        getClasses() // Gọi MỘT LẦN để lấy TẤT CẢ các lớp
      ]);

      console.log('📅 Received sessions:', allSessions.length, allSessions);
      
      // 2. Chuyển danh sách lớp học thành một Map để tra cứu nhanh
      const classesMap = new Map(allClasses.map(c => [c.id, c]));

      // 3. Xử lý dữ liệu lịch học (không cần gọi API trong vòng lặp nữa)
      const schedule = allSessions.map(session => {
        const classInfo = classesMap.get(session.class_id); // Tra cứu cực nhanh
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
          date: sessionDate,
          time: `${startTime}-${endTime}`,
          courseId: className,
          status: session.status || 'scheduled',
          classId: session.class_id
        };
      });

      schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Final schedule:', schedule);
      setState(prev => ({ ...prev, schedule }));
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save state to localStorage
  const saveState = (newState) => {
    setState(newState);
    localStorage.setItem(LS_KEY, JSON.stringify(newState));
  };

  // Helper functions
  const initials = (name) => {
    if (!name) return 'HV';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || 'H') + (parts.slice(-1)[0]?.[0] || 'V')).toUpperCase();
  };

  // Event handlers
  const handleSaveProfile = () => {
    const newState = { ...state, profile: profileForm };
    saveState(newState);
    // TODO: nếu sau này có API cập nhật hồ sơ thì gọi API ở đây
    alert('Đã lưu hồ sơ.');
    setIsEditingProfile(false); // khóa form lại sau khi lưu
  };


  // const handleChangePassword = () => {
  //   if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
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
  //     confirmPassword: ''
  //   });
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
    // có thể dùng loading chung nếu muốn
    setLoading(true);

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
    setLoading(false);
  }
};

  // const handleOpenRegisterForm = () => {
  //   setShowRegisterForm(true);
  //   setRegisterForm({
  //     courseId: '',
  //     teachingScheduleId: '',
  //     notes: ''
  //   });
  //   setAvailableSchedules([]);
  // };

  // const handleCourseSelect = async (courseId) => {
  //   setRegisterForm(prev => ({ ...prev, courseId, teachingScheduleId: '' }));
    
  //   if (courseId) {
  //     try {
  //       const schedules = await getTeachingSchedules(courseId);
  //       setAvailableSchedules(schedules || []);
  //     } catch (err) {
  //       console.error('Error fetching schedules:', err);
  //       setAvailableSchedules([]);
  //     }
  //   } else {
  //     setAvailableSchedules([]);
  //   }
  // };

  // const handleSubmitRegistration = async () => {
  //   if (!registerForm.courseId || !registerForm.teachingScheduleId) {
  //     alert('Vui lòng chọn khóa học và lịch học');
  //     return;
  //   }

  //   try {
  //     await createMyRegistration({
  //       course_id: registerForm.courseId,
  //       teaching_schedule_id: registerForm.teachingScheduleId,
  //       notes: registerForm.notes || undefined
  //     });

  //     alert('✅ Đã đăng ký khóa học thành công!');
  //     setShowRegisterForm(false);
  //     await fetchMyRegistrations();
  //   } catch (err) {
  //     console.error('Error creating registration:', err);
  //     const errorMsg = err.response?.data?.detail || err.message || 'Không thể đăng ký khóa học';
  //     alert(`❌ Lỗi: ${errorMsg}`);
  //   }
  // };

  const handleCancelRegistration = async (reg) => {
    if (!confirm('Bạn có chắc muốn hủy đăng ký này? Khoản phí sẽ được hoàn lại vào ví của bạn.')) {
      return;
    }

    try {
      // 1. Hủy đăng ký và nhận lại object mới nhất
      const cancelledReg = await cancelMyRegistration(reg.id);
      
      // 2. Hoàn tiền: Ưu tiên fee_amount từ response, nếu không có thì dùng default_fee từ object ban đầu
      const feeToRefund = cancelledReg.fee_amount || reg.default_fee;
      const studentId = cancelledReg.student_id || reg.student_id;

      if (feeToRefund > 0 && studentId) {
        try {
          await deposit(studentId, feeToRefund);
          alert(`✅ Đã hủy đăng ký và hoàn lại ${Number(feeToRefund).toLocaleString('vi-VN')}₫ vào ví của bạn thành công!`);
        } catch (refundError) {
          console.error('Error refunding:', refundError);
          // Vẫn báo thành công hủy, nhưng cảnh báo về việc hoàn tiền
          alert(`✅ Đã hủy đăng ký thành công, nhưng đã xảy ra lỗi trong quá trình hoàn tiền. Vui lòng liên hệ hỗ trợ.`);
        }
      } else {
        alert('✅ Đã hủy đăng ký thành công!');
      }

      // 3. Tải lại dữ liệu
      await fetchMyRegistrations();

    } catch (err) {
      console.error('Error canceling registration:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Không thể hủy đăng ký';
      alert(`❌ Lỗi: ${errorMsg}`);
    }
  };

  const fetchResources = async (sessionId) => {
    if (!sessionId) {
      setSessionResources([]);
      return;
    }
    try {
      const resources = await getResources(sessionId);
      setSessionResources(resources || []);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setSessionResources([]);
    }
  };

  // // Lọc khóa học
  // const filteredCoursesForStudent = courseList.filter((course) => {
  //   const matchGrade =
  //     !courseFilters.grade ||
  //     String(course.education_level) === String(courseFilters.grade);

  //   const matchSubject =
  //     !courseFilters.subject ||
  //     String(course.subject_id) === String(courseFilters.subject);

  //   const text =
  //     (course.course_name || '') + ' ' + (course.description || '');

  //   const matchQuery =
  //     !courseFilters.query ||
  //     text.toLowerCase().includes(courseFilters.query.toLowerCase());

  //   return matchGrade && matchSubject && matchQuery;
  // });

  // const handleCourseFilterChange = (field, value) => {
  //   setCourseFilters((prev) => ({ ...prev, [field]: value }));
  // };

  // const resetCourseFilters = () => {
  //   setCourseFilters({ grade: '', subject: '', query: '' });
  // };

  // // mở modal chi tiết khóa học
  // const handleViewCourseDetail = (course, subject) => {
  //   if (!isAuthenticated()) {
  //     alert('Vui lòng đăng nhập để xem chi tiết khóa học');
  //     navigate('/login');
  //     return;
  //   }

  //   setSelectedCourse({
  //     ...course,
  //     subject_name: subject?.name || 'Môn học',
  //   });
  //   setSelectedScheduleObj(null);
  //   setSelectedScheduleSummary('---');
  //   setOtpCode('');
  //   setPaymentIntent(null);
  //   setSelectedRegistration(null);

  //   setIsDetailModalOpen(true);
  // };

  // const handleOpenScheduleModal = async () => {
  //   if (!selectedCourse) return;

  //   setIsDetailModalOpen(false);
  //   setIsScheduleModalOpen(true);

  //   try {
  //     setLoadingSchedules(true);
  //     setErrorSchedules(null);

  //     const schedules = await getTeachingSchedules(selectedCourse.id);
  //     setTeachingSchedules(schedules || []);
  //   } catch (err) {
  //     console.error('Lỗi tải lịch học:', err);
  //     setErrorSchedules('Không thể tải danh sách lịch học.');
  //   } finally {
  //     setLoadingSchedules(false);
  //   }
  // };

  // const handleCloseScheduleModal = () => {
  //   setIsScheduleModalOpen(false);
  // };
  // const handleConfirmSchedule = () => {
  //   if (!selectedScheduleObj) {
  //     alert('Vui lòng chọn một lịch học.');
  //     return;
  //   }

  //   const sj = selectedScheduleObj.schedule_json || {};
  //   const days = sj.days || [];
  //   const dayLabel = {
  //     Mon: 'Thứ 2',
  //     Tue: 'Thứ 3',
  //     Wed: 'Thứ 4',
  //     Thu: 'Thứ 5',
  //     Fri: 'Thứ 6',
  //     Sat: 'Thứ 7',
  //     Sun: 'Chủ nhật',
  //   };
  //   const dayText = days.map((d) => dayLabel[d] || d).join(' - ');
  //   const start = sj.start_time?.substring(0, 5) || '??:??';
  //   const end = sj.end_time?.substring(0, 5) || '??:??';

  //   setSelectedScheduleSummary(`${dayText} (${start} - ${end})`);
  //   setIsScheduleModalOpen(false);
  //   setIsPaymentModalOpen(true);
  // };

  // Tập dữ liệu cho 2 tab theo yêu cầu
  const allRegs = state.myRegistrations || [];
  const successRegs   = allRegs.filter(r => ['pending','matched'].includes(r.status));
  const cancelledRegs = allRegs.filter(r => ['cancelled','processing'].includes(r.status));
  const regsOfTab = registrationTab === 'success' ? successRegs : cancelledRegs;
  const filteredRegs = regStatusFilter === 'all'
    ? regsOfTab
    : regsOfTab.filter(r => r.status === regStatusFilter);
  const statusOptionsForTab = registrationTab === 'success'
    ? ['all','pending','matched']
    : ['all','pending','cancelled'];

  // const handleClosePayment = () => {
  //   setIsPaymentModalOpen(false);
  // };
  // const handleOpenOtp = async () => {
  //   try {
  //     setIsSendingOtp(true);

  //     // 1. tạo đăng ký
  //     const registration = await createMyRegistration({
  //       course_id: selectedCourse.id,
  //       teaching_schedule_id: selectedScheduleObj.id,
  //     });

  //     // 2. tạo payment intent
  //     const intent = await createPaymentIntent(registration.id);

  //     // 3. gửi OTP
  //     await requestOtp(intent.intent_id);

  //     setPaymentIntent(intent);
  //     setSelectedRegistration(registration);
  //     setIsPaymentModalOpen(false);
  //     setOtpCode('');
  //     setIsOtpModalOpen(true);
  //     setOtpTimer(600); // 10 phút
  //   } catch (err) {
  //     console.error('Lỗi khởi tạo thanh toán:', err);
  //     alert('Không thể khởi tạo thanh toán.');
  //   } finally {
  //     setIsSendingOtp(false);
  //   }
  // };
  // const handleConfirmOtp = async () => {
  //   if (otpCode.length !== 6) {
  //     alert('Vui lòng nhập đủ 6 số OTP');
  //     return;
  //   }

  //   try {
  //     setIsProcessingPayment(true);
  //     await confirmPayment(paymentIntent.intent_id, otpCode);

  //     setIsOtpModalOpen(false);
  //     setIsSuccessModalOpen(true);
  //   } catch (err) {
  //     console.error('Lỗi confirmPayment:', err);
  //     alert('Mã OTP không hợp lệ hoặc đã hết hạn!');
  //   } finally {
  //     setIsProcessingPayment(false);
  //   }
  // };

  // const handleResendOtp = async () => {
  //   try {
  //     if (!paymentIntent?.intent_id) {
  //       alert('Không có giao dịch thanh toán hợp lệ!');
  //       return;
  //     }
  //     setIsSendingOtp(true);
  //     await requestOtp(paymentIntent.intent_id);
  //     setOtpTimer(600);
  //     alert('OTP mới đã được gửi đến email của bạn!');
  //   } catch (err) {
  //     console.error('Lỗi gửi lại OTP:', err);
  //     alert('Không thể gửi lại OTP. Vui lòng thử lại sau.');
  //   } finally {
  //     setIsSendingOtp(false);
  //   }
  // };

  // const handleCloseOtpBack = async () => {
  //   try {
  //     if (paymentIntent?.intent_id) {
  //       await failPaymentOtp(paymentIntent.intent_id);
  //     }
  //   } catch (err) {
  //     console.error('Lỗi failPaymentOtp khi quay lại:', err);
  //   } finally {
  //     setIsOtpModalOpen(false);
  //     setIsPaymentModalOpen(true);
  //     setOtpCode('');
  //   }
  // };

  const handleRowClick = (session) => {
    const sessionWithHardcodedUrl = {
      ...session,
      meeting_url: 'https://meet.google.com/new'
    };
    setSelectedSession(sessionWithHardcodedUrl);
    fetchResources(session.id);
  };

  // ✅ Sửa: không trông chờ fetchMySchedule trả mảng
  const handleCompleteSession = async (sessionId) => {
    try {
      await completeSession(sessionId);
      alert('✅ Đã hoàn thành buổi học!');
      await fetchMySchedule();           // refetch lịch
      await fetchResources(sessionId);   // refetch resources của buổi
    } catch (err) {
      console.error('Error completing session:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Không thể hoàn thành buổi học';
      alert(`❌ Lỗi: ${errorMsg}`);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      return;
    }
    try {
      await deleteResource(resourceId);
      await fetchResources(selectedSession.id);
    } catch (err) {
      console.error("Failed to delete resource:", err);
      alert(`Lỗi: ${err.response?.data?.detail || err.message}`);
    }
  };

  const formatVNDate = (yyyyMMDD) => {
  if (!yyyyMMDD) return '';
  const [y, m, d] = yyyyMMDD.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

  const formatUploadedAt = (uploadedAt) => {
    if (!uploadedAt) return '—';
    const d = new Date(uploadedAt);
    if (Number.isNaN(d.getTime())) return uploadedAt; // nếu parse lỗi thì trả luôn raw
    return d.toLocaleString('vi-VN');
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
    setResourceForm(prev => ({ ...prev, [name]: value }));
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
      console.error("Failed to create resource:", err);
      alert(`Lỗi: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Handle month navigation
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

  // Filter courses (home courses panel)
  const filteredCourses = searchQuery
    ? state.availableCourses.filter(c =>
        c.course_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : state.availableCourses;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':  return 'Hoàn thành';
      case 'processing': return 'Đang diễn ra';
      case 'scheduled':  return 'Đã lên lịch';
      case 'cancelled':  return 'Đã hủy';
      default:           return status || '';
    }
  };

  // === TODAY & UPCOMING ===

// Hôm nay (đếm *buổi*)
const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
const todaySessions = (state.schedule || []).filter(s => s.date === todayStr);

// 1–2 buổi sắp tới
const now = new Date();
const upcomingSessions = (state.schedule || [])
  .filter((s) => {
    if (!s.date || !s.time) return false;
    const [startTime] = s.time.split('-'); // "08:00-10:00" -> "08:00"
    if (!startTime) return false;
    const startDateTime = new Date(`${s.date}T${startTime}:00`);
    return startDateTime >= now && s.status !== 'cancelled';
  })
  .sort((a, b) => {
    const [aStart] = a.time.split('-');
    const [bStart] = b.time.split('-');
    const da = new Date(`${a.date}T${aStart}:00`);
    const db = new Date(`${b.date}T${bStart}:00`);
    return da - db;
  })
  .slice(0, 2);


  // Chỉ hiển thị sidebar trên các trang dashboard / lịch / lớp / đăng ký
  const showSidebar = [
    'home',
    'schedule',
    'my-classes',
    'courses',
    'registrations'
  ].includes(activeSection);

  return (
    <>
      <DynamicHeader />
      

      {/* ✅ MODAL THÊM TÀI LIỆU (Bài nộp) */}
      {isModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {resourceType === 'submission'
                  ? `NỘP BÀI TẬP NGÀY (${formatVNDate(selectedSession?.date) || '...'})`
                  : 'THÊM TÀI LIỆU'}
              </h3>

              {/* <h2>Thêm tài liệu cho mục "{resourceType === 'submission' ? 'Bài nộp' : resourceType}"</h2> */}
              <button className="close-btn" type="button" onClick={closeAddResourceModal}>×</button>
            </div>
            <div className="modal-body">
              <label className="field">
                Tiêu đề
                <input
                  type="text"
                  name="title"
                  value={resourceForm.title}
                  onChange={handleResourceFormChange}
                  placeholder="VD: Bài nộp tuần 1"
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
              <button type="button" className="cancel-btn" onClick={closeAddResourceModal}>Hủy</button>
              <button type="button" className="confirm-btn" onClick={handleAddResource}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      <div className={`shell ${showSidebar ? '' : 'no-sidebar'}`}>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="sidebar">
            <div className="user-mini">
              <div className="avatar" id="avatar2">{initials(state.profile.name)}</div>
              <div>
                <div className="nm" id="studentName2">{state.profile.name}</div>
                <div className="uid" id="studentGrade">Chức vụ: Học viên {state.profile.grade}</div>
              </div>
            </div>
            <nav className="side-nav">
              <a
                className={`side-link ${activeSection === 'home' ? 'is-active' : ''}`}
                href="#home"
                onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}
              >
                <svg viewBox="0 0 24 24"><path d="M4 10L12 4l8 6v8a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2z" fill="currentColor" /></svg>
                Trang chủ
              </a>

              <a
                className={`side-link ${activeSection === 'schedule' ? 'is-active' : ''}`}
                href="#schedule"
                onClick={(e) => { e.preventDefault(); 
                  setSelectedSession(null); 
                  setActiveSection('schedule'); }}
              >
                <svg viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z" fill="currentColor" /></svg>
                Lịch học
              </a>

              <a
                className={`side-link ${activeSection === 'my-classes' ? 'is-active' : ''}`}
                href="#my-classes"
                onClick={(e) => { e.preventDefault(); setActiveSection('my-classes'); }}
              >
                <svg viewBox="0 0 24 24"><path d="M4 19h16V5H4v14Zm2-2V7h12v10H6Zm3-2h6v-2H9v2Z" fill="currentColor" /></svg>
                Lớp đang học
              </a>

              {/* <a
                className={`side-link ${activeSection === 'courses' ? 'is-active' : ''}`}
                href="#courses"
                onClick={(e) => { e.preventDefault(); setActiveSection('courses'); }}
              >
                <svg viewBox="0 0 24 24"><path d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2Z" fill="currentColor" /></svg>
                Đăng ký khóa học
              </a> */}

              <a
                className={`side-link ${activeSection === 'registrations' ? 'is-active' : ''}`}
                href="#registrations"
                onClick={(e) => { e.preventDefault(); setActiveSection('registrations'); }}
              >
                <svg viewBox="0 0 24 24"><path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z" fill="currentColor" /></svg>
                Lịch sử đăng ký
              </a>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="content-area">
          {/* Trang chủ */}
          {activeSection === 'home' && (
            <section className="content-section active">

              <div className="notice-header">
                  <h3>Trang chủ</h3>
                </div>

              <p>Chào mừng quay lại, <strong id="helloName">{state.profile.name}</strong>! Đây là bảng điều khiển dành riêng cho bạn.</p>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Lớp học của tôi</h4>
                  <p className="big" id="statClasses">{state.myClasses.length}</p>
                </div>
                <div className="stat-card">
                  <h4>Đơn đăng ký</h4>
                  <p className="big" id="statRegistrations">{state.myRegistrations.length}</p>
                </div>
                <div className="stat-card">
                  <h4>Buổi học đang đợi bạn</h4>
                  <p className="big" id="statUpcoming">
                    {state.schedule.filter(s => s.status === 'scheduled').length}
                  </p>
                </div>
              </div>
               
              <div className="notice">
                  <ul id="notices">
                    <li>
                      Hôm nay bạn có <strong>{todaySessions.length}</strong> buổi học.
                    </li>

                    <li>
                      Nhớ hoàn thành bài tập trước buổi học tiếp theo.
                    </li>


                  </ul>

                
              </div>

               {/* Lịch học sắp tới */}
    <div className="notice-subsection">
      <h3>📅 Lịch học sắp tới</h3>
    </div>

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
                handleRowClick(s); // mở chi tiết buổi học
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
      <p className="uid">Không có buổi học nào sắp tới.</p>
    )}
            </section>
          )}

          {/* Lịch học */}
          {activeSection === 'schedule' && (
            <section className="content-section active">
              {selectedSession ? (
                <div id="courseDetail">
                  <div className="course-hero">
                    <div className="notice-header">
                      <h3>{selectedSession.courseId}</h3>
                    </div>
                  </div>

                  <div className="course-shell">
                    {/* 🎥 Học Online */}
                    <div className="section">
                      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>🎥 Học Online</h3>

                        {/* {['scheduled', 'processing'].includes(selectedSession.status)
                         ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              if (selectedSession.meeting_url) {
                                window.open(selectedSession.meeting_url, '_blank');
                                handleCompleteSession(selectedSession.id); // ✅ đánh dấu hoàn thành (tùy chính sách)
                              } else {
                                alert('Chưa có link cho buổi học này.');
                              }
                            }}
                          >
                            Vào phòng học
                          </button>
                        ) : 
                        (
                          <button className="btn btn-primary" disabled>
                            Buổi học đã {getStatusText(selectedSession.status)}
                          </button>
                        )} */}
                      </div>

                      <div className="resource-list">
  {sessionResources.filter(r => r.resource_type === 'meeting').length > 0 ? (
    sessionResources
      .filter(r => r.resource_type === 'meeting')
      .map(res => (
        <div key={res.id} className="file-item">
          <div>
            <a
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCompleteSession(selectedSession.id)} // ✅ giữ nguyên logic
            >
              {res.title}
            </a>
            <div className="uid">
              Tải lên: {formatUploadedAt(res.uploaded_at)}
            </div>
          </div>
        </div>
      ))
  ) : (
    <p className="uid">Chưa có link meeting.</p>
  )}
</div>

                    </div>

                    {/* 📚 Slides */}
                    <div className="section">
                      <div><h3>📚 Slides</h3></div>
                      <div className="resource-list" id="slideList">
  {sessionResources.filter(r => r.resource_type === 'slide').length > 0 ? (
    sessionResources
      .filter(r => r.resource_type === 'slide')
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
        </div>
      ))
  ) : (
    <p className="uid">Chưa có slide cho buổi học này.</p>
  )}
</div>

                    </div>

                    {/* 📝 Bài tập */}
                    <div className="section">
                      <div><h3>📝 Bài tập</h3></div>
                      <div className="resource-list" id="exerciseList">
  {sessionResources.filter(r => r.resource_type === 'exercise').length > 0 ? (
    sessionResources
      .filter(r => r.resource_type === 'exercise')
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
        </div>
      ))
  ) : (
    <p className="uid">Chưa có bài tập cho buổi học này.</p>
  )}
</div>

                    </div>

                    {/* 📤 Bài nộp */}
                    <div className="section">
                      <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>📤 Bài nộp</h3>
                        <button className="btn btn-ghost mini" onClick={() => openAddResourceModal('submission')}>+ Thêm</button>
                      </div>
                      <div className="resource-list" id="submissionList">
  {sessionResources.filter(r => r.resource_type === 'submission').length > 0 ? (
    sessionResources
      .filter(r => r.resource_type === 'submission')
      .map(res => (
        <div key={res.id} className="file-item">
          <div>
            <a href={res.url} target="_blank" rel="noopener noreferrer">
              {res.title}
            </a>
            <div className="uid">
              Nộp lúc: {formatUploadedAt(res.uploaded_at)}
            </div>
          </div>
          <button
            className="btn btn-ghost mini"
            onClick={() => handleDeleteResource(res.id)}
            style={{ color: '#ef4444' }}
          >
            Xóa
          </button>
        </div>
      ))
  ) : (
    <p className="uid">Chưa có bài nộp.</p>
  )}
</div>

                    </div>

                    {/* ✅ Review */}
                    <div className="section">
                      <div><h3>✅ Chấm bài và nhận xét</h3></div>
                      <div className="resource-list">
  {sessionResources.filter(r => r.resource_type === 'review').length > 0 ? (
    sessionResources
      .filter(r => r.resource_type === 'review')
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
        </div>
      ))
  ) : (
    <p className="uid">Chưa có bài chấm điểm và nhận xét.</p>
  )}
</div>

                    </div>

                    {/* 🗓️ Các buổi trong lớp */}
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
                              <div className="session-date">
                                {new Date(sessionInClass.date).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="session-info">Buổi học lúc {sessionInClass.time}</div>
                              <div className="session-status">
                                <span className={`tag tag-${sessionInClass.status || 'scheduled'}`}>
                                  {getStatusText(sessionInClass.status)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="session-toolbar">
                      <button onClick={() => setSelectedSession(null)} className="btn btn-ghost back-btn">
                        &larr; Quay lại lịch học
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
                    <h3>Lịch học</h3>
                  </div>

                  <div className="schedule-toolbar">
                    <div className="month-nav">
                      <button onClick={handlePreviousMonth} title="Tháng trước">◄</button>
                      <div>Tháng {scheduleMonth.split('-')[1]} năm {scheduleMonth.split('-')[0]}</div>
                      <button onClick={handleNextMonth} title="Tháng sau">►</button>
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
                    <p className="uid">Không có lịch học trong tháng này.</p>
                  ) : (
                    <table className="table" id="tblSchedule">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Giờ</th>
                          <th>Môn học</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.schedule
                          .filter(s => s.date && s.date.startsWith(scheduleMonth))
                          .map((s, index) => (
                            <tr key={s.id || index} onClick={() => handleRowClick(s)}>
                              <td>{s.date}</td>
                              <td>{s.time}</td>
                              <td>{s.courseId}</td>
                              <td>
                                <span className={`tag tag-${s.status || 'scheduled'}`}>
                                  {s.status === 'completed' ? 'Hoàn thành' :
                                  s.status === 'scheduled' ? 'Đã lên lịch' :
                                  s.status === 'processing' ? 'Đang diễn ra' :
                                  s.status === 'cancelled' ? 'Đã hủy' : s.status}
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

          {/* Lớp đang học */}
          {activeSection === 'my-classes' && (
            <section className="content-section active">
              <div className="notice-header">
                <h3>Danh sách khóa học</h3>
              </div>

              <ul className="notice-list">
                <li>
                  Tổng số lớp đang hoạt động: <strong>{state.myClasses.length}</strong>
                </li>
              </ul>

              {state.myClasses.length === 0 ? (
                <p className="uid">Chưa có lớp đang học.</p>
              ) : (
                <div className="grid2">
                  {state.myClasses.map((c) => (
                    <div key={c.id} className="course-card">
                      <div className="course-head">
                        <div>
                          <strong className="course-title">{c.courseName}</strong>
                          <div className="uid">Lịch học: {c.scheduleDisplay}</div>
                          <div className="uid">
                            Trạng thái: <span className="tag">Đã ghép lớp</span>
                          </div>

                          {/* Khai giảng / bế giảng */}
                          {c.start_date ? (
                            <div className="uid">
                              Khai giảng: {new Date(c.start_date).toLocaleDateString('vi-VN')}
                            </div>
                          ) : (
                            <div className="uid">Khai giảng: (Chưa cập nhật)</div>
                          )}

                          {c.end_date ? (
                            <div className="uid">
                              Bế giảng: {new Date(c.end_date).toLocaleDateString('vi-VN')}
                            </div>
                          ) : (
                            <div className="uid">Bế giảng: (Chưa cập nhật)</div>
                          )}

                          {c.created_at && (
                            <div className="uid">
                              Đăng ký: {new Date(c.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="course-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedSession(null);
                            setActiveSection('schedule');
                          }}
                        >
                          Vào lớp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Đăng ký khóa học */}
          {/* {activeSection === 'courses' && (
            <section className="course-panel card active">
              <div className="notice-header">
                <h3>Đăng ký khóa học</h3>
              </div>

              <div className="card"> */}
                {/* Bộ lọc */}
                {/* <div className="grid3">
                  <div className="field">
                    <label>Cấp/Khối</label>
                    <select
                      value={courseFilters.grade}
                      onChange={(e) =>
                        handleCourseFilterChange('grade', e.target.value)
                      }
                      disabled={courseLoading}
                      className="search"
                    >
                      <option value="">Tất cả</option>
                      <option value="THCS">THCS</option>
                      <option value="THPT">THPT</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Môn học</label>
                    <select
                      value={courseFilters.subject}
                      onChange={(e) =>
                        handleCourseFilterChange('subject', e.target.value)
                      }
                      disabled={courseLoading}
                      className="search"
                    >
                      <option value="">Tất cả</option>
                      {subjectList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Tìm kiếm</label>
                    <input
                      className="search"
                      placeholder="VD: Toán 11 NC, Lý 10..."
                      value={courseFilters.query}
                      onChange={(e) =>
                        handleCourseFilterChange('query', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="hstack">
                  <button className="btn btn-ghost" onClick={resetCourseFilters}>
                    Xóa lọc
                  </button>
                </div> */}

                {/* List khóa học */}
                {/* {courseLoading && (
                  <div className="card">
                    <p>Đang tải dữ liệu...</p>
                  </div>
                )}

                {courseError && (
                  <div className="card">
                    <p>{courseError}</p>
                  </div>
                )}

                {!courseLoading && !courseError && (
                  <div id="classList">
                    {filteredCoursesForStudent.length === 0 ? (
                      <div className="card">
                        <p className="muted">Không tìm thấy khóa học phù hợp</p>
                      </div>
                    ) : (
                      <div className="grid2">
                        {filteredCoursesForStudent.map((course) => {
                          const subject = subjectList.find(
                            (s) => String(s.id) === String(course.subject_id),
                          );
                          return (
                            <div key={course.id} className="class-card">
                              <h3>{course.course_name}</h3>
                              <p className="muted">
                                {subject?.name || 'Môn học'} •{' '}
                                {course.description || 'Chưa có mô tả'}
                              </p>
                              <p>
                                <strong>
                                  {(course.default_fee ?? 0).toLocaleString('vi-VN')}₫
                                </strong>
                              </p>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleViewCourseDetail(course, subject)}
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )} */}

          {/* Đơn đăng ký */}
          {activeSection === 'registrations' && (
            <section className="content-section active">
              <div className="notice-header">
                <h3>Đơn đăng ký của tôi</h3>
              </div>

              <div className="register-tabs">
                <button
                  className={`register-tab-btn ${registrationTab === 'success' ? 'is-active' : ''}`}
                  onClick={() => { setRegistrationTab('success'); setRegStatusFilter('all'); }}
                >
                  Đăng ký thành công
                </button>
                <button
                  className={`register-tab-btn ${registrationTab === 'cancelled' ? 'is-active' : ''}`}
                  onClick={() => { setRegistrationTab('cancelled'); setRegStatusFilter('all'); }}
                >
                  Đã hủy
                </button>
              </div>

              <div className="grid2">
                <div className="field" style={{marginBottom: 4}}>
                  <label>Trạng thái</label>
                  <select
                    value={regStatusFilter}
                    onChange={(e) => setRegStatusFilter(e.target.value)}
                  >
                    {statusOptionsForTab.map(opt => (
                      <option key={opt} value={opt}>
                        {opt === 'all' ? 'Tất cả'
                        : opt === 'pending' ? 'Chờ ghép lớp'
                        : opt === 'matched' ? 'Đã ghép lớp'
                        : opt === 'cancelled' ? 'Đã hủy'
                        : opt}
                      </option>
                    ))}
                  </select>          
                </div>

                {/* <button
                  className="btn btn-ghost"
                  onClick={fetchMyRegistrations}
                  disabled={loading}
                >
                  {loading ? 'Đang tải...' : 'Tải lại'}
                </button> */}
              </div>

              {filteredRegs.length === 0 ? (
                <p className="uid">Không có đơn phù hợp.</p>
              ) : (
                <div className="grid2">
                  {filteredRegs.map(reg => (
                    <div key={reg.id} className="course-card">
                      <div className="course-head">
                        <div>
                          <strong>{reg.courseName}</strong>
                          <div className="uid">Lịch học: {reg.scheduleDisplay}</div>
                          <div className="uid">
                            Trạng thái:{' '}
                            <span
                              className="tag"
                              style={{
                                background:
                                  reg.status === 'pending'   ? '#fbbf24' :
                                  reg.status === 'matched'   ? '#10b981' :
                                  reg.status === 'cancelled' ? '#ef4444' : '#6b7280',
                                color: reg.status === 'pending' ? '#000' : '#fff'
                              }}
                            >
                              {reg.status === 'pending'   ? 'Chờ ghép lớp' :
                              reg.status === 'matched'   ? 'Đã ghép lớp' :
                              reg.status === 'cancelled' ? 'Đã hủy'       : reg.status}
                            </span>
                          </div>

                          {/* Khai giảng / bế giảng nếu có */}
                          {reg.start_date && (
                            <div className="uid">Khai giảng: {new Date(reg.start_date).toLocaleDateString('vi-VN')}</div>
                          )}
                          {reg.end_date && (
                            <div className="uid">Bế giảng: {new Date(reg.end_date).toLocaleDateString('vi-VN')}</div>
                          )}

                          {reg.notes && <div className="uid">Ghi chú: {reg.notes}</div>}
                          {reg.created_at && (
                            <div className="uid">
                              Đăng ký: {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>

                      {reg.status === 'pending' && (
                        <div className="course-actions">
                          <button 
                            className="btn btn-ghost" 
                            onClick={() => handleCancelRegistration(reg)}
                            style={{ background: '#ef4444', color: '#fff' }}
                          >
                            Hủy đăng ký
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Quản lý thông tin */}
          {activeSection === 'profile' && (
            <section className="content-section active">
              <div className="account-header">
                <h3>Quản lý thông tin</h3>
              </div>

              <div className="account-layout">
                {/* Menu tab bên trái */}
                <aside className="sidebar">
                  <nav className="side-nav">
                    <button
                      className={`side-link ${accountTab === 'profile' ? 'is-active' : ''}`}
                      onClick={() => setAccountTab('profile')}
                    >
                      Hồ sơ học viên
                    </button>
                    <button
                      className={`side-link ${accountTab === 'security' ? 'is-active' : ''}`}
                      onClick={() => setAccountTab('security')}
                    >
                      Bảo mật
                    </button>
                  </nav>
                </aside>

                {/* Nội dung tab */}
                <div className="account-content">
                  {/* Tab: Hồ sơ học viên */}
                                    {accountTab === 'profile' && (
                    <div className="cv-panel">
                      <h3>Hồ sơ học viên</h3>

                      <form
                        className="cv-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (isEditingProfile) {
                            handleSaveProfile();
                          }
                        }}
                      >
                        <label className="field">
                          Họ tên
                          <input
                            type="text"
                            placeholder="Họ tên"
                            value={profileForm.name}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, name: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <label className="field">
                          Email
                          <input
                            type="text"
                            placeholder="Email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, email: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <label className="field">
                          SĐT
                          <input
                            type="tel"
                            placeholder="Số điện thoại"
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, phone: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <label className="field">
                          Lớp
                          <input
                            type="text"
                            placeholder="VD: 12"
                            value={profileForm.grade}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, grade: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <label className="field">
                          Trường
                          <input
                            type="text"
                            placeholder="Tên trường"
                            value={profileForm.school}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, school: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <label className="field">
                          Giới thiệu
                          <textarea
                            rows="4"
                            placeholder="Đôi lời giới thiệu..."
                            value={profileForm.bio}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, bio: e.target.value })
                            }
                            disabled={!isEditingProfile}
                          />
                        </label>

                        <div className="hstack">
                          {/* Nút lưu luôn giữ bên trái, nhưng chỉ active khi đang chỉnh sửa */}
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isEditingProfile}
                          >
                            Lưu hồ sơ
                          </button>

                          {/* Nút thứ hai: Chỉnh sửa / Hủy chỉnh sửa */}
                          {!isEditingProfile ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setIsEditingProfile(true)}
                            >
                              Chỉnh sửa
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => {
                                // reset lại form về dữ liệu đang lưu
                                setProfileForm(state.profile);
                                setIsEditingProfile(false);
                              }}
                            >
                              Hủy chỉnh sửa
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  

                  {/* Tab: Bảo mật */}
                  {accountTab === 'security' && (
                    <div className="cv-panel">
                      <h3>Bảo mật tài khoản</h3>
                      <p className="uid small">
                        Đổi mật khẩu định kỳ để bảo vệ tài khoản và thông tin của bạn.
                      </p>

                      <form
                        className="cv-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleChangePassword();
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
                            placeholder="Nhập mật khẩu hiện tại"
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
                            placeholder="Nhập mật khẩu mới"
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
                            placeholder="Nhập lại mật khẩu mới"
                          />
                        </label>

                        <div className="hstack">
                          <button type="submit" className="btn btn-primary">
                            Đổi mật khẩu
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ========= MODALS LIÊN QUAN ĐĂNG KÝ / THANH TOÁN ========= */}
          {/* {isDetailModalOpen && selectedCourse && (
            <div className="modal show">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{selectedCourse.course_name}</h2>
                  <button
                    className="close-btn"
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p><strong>Mã khóa học:</strong> {selectedCourse.id}</p>
                  <p><strong>Môn học:</strong> {selectedCourse.subject_name}</p>
                  <p><strong>Mô tả:</strong> {selectedCourse.description || 'Chưa có mô tả chi tiết.'}</p>
                  <p>
                    <strong>Học phí:</strong>{' '}
                    {(selectedCourse.default_fee ?? 0).toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="pay-btn"
                    onClick={handleOpenScheduleModal}
                  >
                    Thanh toán
                  </button>
                </div>
              </div>
            </div>
          )}

          {isScheduleModalOpen && (
            <div className="modal show">
              <div className="modal-content schedule-modal">
                <div className="modal-header">
                  <h2>Chọn thời gian học</h2>
                  <button
                    className="close-btn"
                    type="button"
                    onClick={handleCloseScheduleModal}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body schedule-body">
                  <div className="field">
                    <label>Chọn lịch học (thứ + giờ)</label>
                    {loadingSchedules && <p>Đang tải lịch học...</p>}
                    {errorSchedules && <p style={{ color: 'red' }}>{errorSchedules}</p>}
                    {!loadingSchedules && !errorSchedules && (
                      <div className="combo-grid">
                        {teachingSchedules.length === 0 ? (
                          <p>Hiện chưa có lịch học cho khóa này.</p>
                        ) : (
                          teachingSchedules.map((s) => {
                            const sj = s.schedule_json || {};
                            const days = sj.days || [];
                            const dayLabel = {
                              Mon: 'Thứ 2',
                              Tue: 'Thứ 3',
                              Wed: 'Thứ 4',
                              Thu: 'Thứ 5',
                              Fri: 'Thứ 6',
                              Sat: 'Thứ 7',
                              Sun: 'Chủ nhật',
                            };
                            const dayText = days
                              .map((d) => dayLabel[d] || d)
                              .join(' - ');
                            const start = sj.start_time?.substring(0, 5);
                            const end = sj.end_time?.substring(0, 5);

                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={
                                  'combo-btn' +
                                  (selectedScheduleObj?.id === s.id ? ' is-selected' : '')
                                }
                                onClick={() => setSelectedScheduleObj(s)}
                              >
                                <span className="combo-days">{dayText}</span>
                                <span className="combo-time">
                                  {start} - {end}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer schedule-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCloseScheduleModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="confirm-btn"
                    onClick={handleConfirmSchedule}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPaymentModalOpen && selectedCourse && (
            <div className="modal show">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Xác nhận thanh toán</h2>
                </div>
                <div className="modal-body">
                  <p><strong>Mã học viên:</strong> {currentUser?.username}</p>
                  <p><strong>Họ tên:</strong> {currentUser?.name}</p>
                  <p><strong>Tên TK:</strong> Trung Tâm GIASUNO1</p>
                  <p>
                    <strong>Số tiền:</strong>{' '}
                    {(selectedCourse.default_fee ?? 0).toLocaleString('vi-VN')}₫
                  </p>
                  <p><strong>Nội dung:</strong> {selectedCourse.course_name}</p>
                  <p><strong>Thời gian học:</strong> {selectedScheduleSummary}</p>
                </div>
                <div className="modal-footer modal-actions">
                  <button
                    type="button"
                    className="cancelPayment-btn"
                    onClick={handleClosePayment}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="confirmPayment-btn"
                    onClick={handleOpenOtp}
                  >
                    Tiếp tục thanh toán
                  </button>
                </div>
              </div>
            </div>
          )}

          {isOtpModalOpen && (
            <div className="modal show">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>XÁC THỰC OTP ĐỂ TIẾN HÀNH THANH TOÁN</h2>
                </div>
                <div className="modal-body">
                  <p>Vui lòng nhập mã OTP được gửi tới email của bạn để xác nhận:</p>
                  <input
                    type="text"
                    className="otp-input"
                    placeholder="......"
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
                      >
                        Gửi lại OTP
                      </button>
                    )}
                    {otpTimer > 0 && (
                      <span className="otp-timer">
                        {Math.floor(otpTimer / 60)}:
                        {(otpTimer % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCloseOtpBack}
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

          {isSuccessModalOpen && (
            <div className="modal show">
              <div className="modal-content success-modal">
                <div className="modal-header">
                  <h2>Thanh toán thành công</h2>
                </div>
                <div className="modal-body">
                  <p>
                    Cảm ơn bạn đã hoàn tất thanh toán. Lịch học của bạn đã được ghi nhận!
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="confirm-btn"
                    onClick={() => {
                      setIsSuccessModalOpen(false);
                      window.location.reload();
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )} */}


          {activeSection === 'wallet' && (
            <section className="content-section active">
              <div className="notice-header">
                <h3>Quản lý ví học viên</h3>
              </div>
              <div className="account-layout">
                <aside className="sidebar">
                  <div className="side-nav">
                    <button
                      className={`side-link ${walletTab === 'balance' ? 'is-active' : ''}`}
                      onClick={() => setWalletTab('balance')}
                    >
                      Số dư ví
                    </button>
                  <button
                    className={`side-link ${walletTab === 'history' ? 'is-active' : ''}`}
                    onClick={() => setWalletTab('history')}
                  >
                    Lịch sử giao dịch
                  </button>
                  </div>
                </aside>

              {walletTab === 'balance' && (
                <div className="card soft" style={{ marginBottom: 16 }}>
                  <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>Số dư hiện tại</h3>
                      <div className="big">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                          .format(currentUser?.balance || 0)}
                      </div>
                    </div>
                    {/* <button className="btn btn-ghost" onClick={fetchProfile}>Tải lại</button> */}
                  </div>
                </div>
              )}

              {walletTab === 'history' && (
  <div className="card">
    <h3>Lịch sử giao dịch</h3>



    {(() => {
      const toKey = (s) => (s || '').toString().trim().toLowerCase();
      const isPaid = (status) => {
        const k = toKey(status);
        return k === 'pending' || k === 'matched';
      };
      const paymentText = (status) =>
        isPaid(status) ? 'Đã thanh toán' : 'Thanh toán không thành công';

      const paymentStyle = (status) =>
        isPaid(status)
          ? { background: '#10b981', color: '#fff' } // xanh: success
          : { background: '#ef4444', color: '#fff' }; // đỏ: failed

      const fmtVNDateTime = (ts) =>
        ts
          ? new Date(ts).toLocaleString('vi-VN', { hour12: false })
          : '--/--/---- --:--';

      const rows = (state.myRegistrations || [])
        // Hiển thị tất cả, mới nhất trước
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      if (rows.length === 0) {
        return <p className="uid">Chưa có giao dịch.</p>;
      }

      return (
        <table className="table">
          <thead>
            <tr>
              <th>Ngày giờ thanh toán</th>
              <th>Khóa học</th>
              <th>Lịch học</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{fmtVNDateTime(r.created_at)}</td>
                <td>{r.courseName}</td>
                <td>{r.scheduleDisplay}</td>
                <td>
                  <span className="tag" style={paymentStyle(r.status)}>
                    {paymentText(r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    })()}

  </div>
)}


  

              </div>
            </section>
)}

        </main>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Student;


