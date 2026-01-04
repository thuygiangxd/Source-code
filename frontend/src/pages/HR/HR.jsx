// src/pages/HR/HR.jsx

// import { useState } from 'react';
import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';

import logoImage from '../../assets/images/Logo_Group.png';
import avatarImage from '../../assets/images/avatar.jpg';

import './HR.css';
import Footer from '../../components/Footer';
import { getTutorProfiles } from '../../services/academicService';
import { getUserById } from "../../services/userService";
import { updateTutorProfile } from "../../services/academicService";
import { updateUser } from "../../services/userService";
import { getClasses, getRegistrationById, getClassSessions } from '../../services/academicService';
import { getAllAssignments } from '../../services/academicService';


const HR = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [tutorStatusLoading, setTutorStatusLoading] = useState(false);
  const [classList, setClassList] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [tutorSaveLoading, setTutorSaveLoading] = useState(false);
  const [assignmentList, setAssignmentList] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // useEffect(() => {
  //   if (activeTopTab === "khoahoc") {
  //     loadClasses();
  //   }
  // }, [activeTopTab]);




  // Tabs trên cùng: Nhân sự / Học viên / Khóa học
  const [activeTopTab, setActiveTopTab] = useState('nhansu');
  useEffect(() => {
  if (activeTopTab === "khoahoc") {
      loadClasses();
    }
  if (activeTopTab === "hocvien") {
      loadStudents();
    }
  }, [activeTopTab]);

  // Tabs bên trái trong Nhân sự
  const [hrTab, setHrTab] = useState('staff'); // 'staff' | 'waiting'
  useEffect(() => {
      if (hrTab === 'waiting') {
        loadWaitingProfiles();
      }
    }, [hrTab]);

    // const loadWaitingProfiles = async () => {
    //   try {
    //     const res = await getTutorProfiles(); // hoặc lọc status
    //     const mapped = res.map((item, idx) => ({
    //       id: idx + 1,
    //       code: "HS" + String(idx + 1).padStart(3, '0'),
    //       name: item.fullname || "Không tên",
    //       submitDate: item.created_at || "—",
    //       status: item.status === "inactive" ? "Đang chờ duyệt" : "Đã duyệt",
    //       note: item.note || "",
    //       email: item.email || "",
    //       phone: item.phone || "",
    //       cvFileName: item.bio?.split("/").pop()
    //     }));
    //     setWaitingRows(mapped);
    //   } catch (err) {
    //     console.error(err);
    //   }
    // };
    const formatDate = (iso) => {
      if (!iso) return "—";
      const d = new Date(iso);
      return d.toLocaleDateString("vi-VN"); // 22/11/2025
    };
    const [waitingLoading, setWaitingLoading] = useState(false);

    const loadWaitingProfiles = async () => {
      try {
        setWaitingLoading(true);      // BẮT ĐẦU LOAD
        // Lấy tất cả hồ sơ tutor
        const profiles = await getTutorProfiles();

        const waitingProfiles = profiles.filter(
          (p) =>
            p.status === "inactive" ||
            p.status === "active" ||
            p.status === "rejected"
        );

        // Duyệt từng hồ sơ, lấy thông tin user tương ứng
        const list = await Promise.all(
          waitingProfiles.map(async (p, idx) => {
            let userInfo = {};
            try {
              userInfo = await getUserById(p.user_id); 
            } catch {
              console.warn("Không tìm thấy user: ", p.user_id);
            }

            return {
              profileId: p.id,
              id: idx + 1,
              // code: "HS" + String(idx + 1).padStart(3, "0"),
              code : p.id,

              // tên user từ User Service
              name: userInfo.name || userInfo.fullname || "Không tên",

              // email + phone chuẩn backend user
              email: userInfo.email || "",
              phone: userInfo.phone || "",

              // format ngày nộp
              submitDate: formatDate(p.created_at),

              // trạng thái
              // status: p.status === "inactive" ? "Đang chờ duyệt" : "Đã duyệt",
              status:
                p.status === "inactive"
                  ? "Đang chờ duyệt"
                  : p.status === "active"
                  ? "Đã duyệt"
                  : p.status === "rejected"
                  ? "Từ chối"
                  : "Không xác định",

              // CV file
              cvFileName: p.bio?.split("/").pop() || "",

              note: "",
            };
          })
        );

        setWaitingRows(list);
      } catch (err) {
        console.error("Lỗi load hồ sơ:", err);
      }
      setWaitingLoading(false);     // KẾT THÚC LOAD
    };


  // Tabs trong Khóa học: chỉ còn 3 mục
  const [courseTab, setCourseTab] = useState('class'); // 'class' | 'resource' | 'dispatch'

  // Bộ lọc trong Quản lý nhân sự (danh sách gia sư)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ===== DỮ LIỆU NHÂN SỰ (DEMO, CÓ EMAIL/PHONE/HISTORY) =====
  const [tutors, setTutors] = useState([
    // {
    //   id: 1,
    //   code: 'GS001',
    //   name: 'Nguyễn Minh An',
    //   gender: 'Nam',
    //   status: 'Đang hoạt động',
    //   note: 'Gia sư Toán tiểu học.',
    //   email: 'gs001@example.com',
    //   phone: '0912345678',
    //   history: [],
    // },
    // {
    //   id: 2,
    //   code: 'GS002',
    //   name: 'Trần Thảo Vy',
    //   gender: 'Nữ',
    //   status: 'Tạm dừng',
    //   note: 'Đang tạm dừng vì bận lịch học.',
    //   email: 'gs002@example.com',
    //   phone: '0987654321',
    //   history: [],
    // },
  ]);
  useEffect(() => {
    loadActiveTutors();
  }, []);

  const loadActiveTutors = async () => {
    try {
      setStaffLoading(true);
      const profiles = await getTutorProfiles(); // lấy toàn bộ tutor_profile

      // lọc những tutor ACTIVE
      // const activeProfiles = profiles.filter(p => p.status === "active");
      const activeProfiles = profiles.filter(
        p => p.status !== "rejected" && p.status !== "inactive"
      );

      const list = await Promise.all(
        activeProfiles.map(async (p) => {
          let userInfo = {};
          try {
            userInfo = await getUserById(p.user_id);
          } catch {
            console.warn("User không tồn tại:", p.user_id);
          }

          return {
            profileId: p.id,
            userId: p.user_id,
            // id: idx + 1,
            code: p.user_id,
            name: userInfo.name || "Không tên",
            gender: userInfo.gender || "—",
            // status: "Đang hoạt động",
            status:
              p.status === "active"
                ? "Đang hoạt động"
                : p.status === "ended"
                ? "Đã kết thúc hợp đồng"
                : "Không xác định",
            note: "",
            email: userInfo.email || "",
            phone: userInfo.phone || "",
            // history: [],
          };
        })
      );

      setTutors(list);
    } catch (err) {
      console.error("Lỗi load gia sư:", err);
    }
    setStaffLoading(false);
  };

  // ===== DỮ LIỆU HỌC VIÊN =====
  const [studentLoading, setStudentLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const loadStudents = async () => {
      try {
          setStudentLoading(true);
  
          const assignments = await getAllAssignments();
  
          const studentCourseCount = new Map();
          assignments.forEach(assign => {
              if (assign.student_id) {
                  const count = studentCourseCount.get(assign.student_id) || 0;
                  studentCourseCount.set(assign.student_id, count + 1);
              }
          });
  
          const studentIds = Array.from(studentCourseCount.keys());
  
          const studentList = await Promise.all(
              studentIds.map(async (studentId) => {
                  try {
                      const userInfo = await getUserById(studentId);
                      return {
                      
                          // id: userInfo.id,
                          userId: userInfo.id,
                          // code: `HV${String(userInfo.id).padStart(3, '0')}`,
                          // code: "HV" + String(idx + 1).padStart(3, "0"),
                          code : userInfo.id,
                          name: userInfo.name || 'Không tên',
                          gender: userInfo.gender || '—',
                          courses: studentCourseCount.get(studentId) || 0,
                          status: userInfo.status || 'Đang sử dụng', // Re-added status field
                          email: userInfo.email || '',
                          phone: userInfo.phone || '',
                          note: '',
                          history: [],
                      };
                  } catch (error) {
                      console.warn(`Không tìm thấy user (student): ${studentId}`, error);
                      return null;
                  }
              })
          );
  
          const validStudents = studentList.filter(s => s !== null);
          setStudents(validStudents);
  
      } catch (err) {
          console.error("Lỗi load học viên:", err);
          setStudents([]);
      } finally {
          setStudentLoading(false);
      }
  };
  // ===== DỮ LIỆU LỚP HỌC (DEMO) =====
  // const [classes] = useState([
  //   {
  //     id: 1,
  //     code: 'L001',
  //     studentCode: 'HV001',
  //     studentName: 'Nguyễn Gia Huy',
  //     tutorCode: 'GS001',
  //     tutorName: 'Nguyễn Minh An',
  //     subject: 'Toán',
  //     level: 'Tiểu học',
  //     grade: 'Lớp 1',
  //     registerDate: '25/10/2025',
  //     assignDate: '28/10/2025',
  //     startDate: '01/11/2025',
  //     endDate: '01/02/2026',
  //     timeSlot: 'Thứ 2 - 4 - 6 | 18:00 – 19:30',
  //     totalSessions: 24,
  //     completedSessions: 6,
  //     remainingSessions: 18,
  //     status: 'Đang học',
  //     note: '',
  //     classLink: 'https://meet.google.com/abc-defg-hij',
  //   },
  //   {
  //     id: 2,
  //     code: 'L002',
  //     studentCode: 'HV002',
  //     studentName: 'Trần Mai Phương',
  //     tutorCode: 'GS002',
  //     tutorName: 'Trần Thảo Vy',
  //     subject: 'Tiếng Anh',
  //     level: 'THCS',
  //     grade: 'Lớp 8',
  //     registerDate: '10/10/2025',
  //     assignDate: '12/10/2025',
  //     startDate: '15/10/2025',
  //     endDate: '15/01/2026',
  //     timeSlot: 'Thứ 3 - 5 - 7 | 19:00 – 20:30',
  //     totalSessions: 30,
  //     completedSessions: 10,
  //     remainingSessions: 20,
  //     status: 'Đang học',
  //     note: 'Luyện thi vào 10.',
  //     classLink: 'https://meet.google.com/xyz-1234-567',
  //   },
  //   {
  //     id: 3,
  //     code: 'L003',
  //     studentCode: 'HV003',
  //     studentName: 'Lê Minh Khang',
  //     tutorCode: 'GS003',
  //     tutorName: 'Phạm Anh Tú',
  //     subject: 'Toán',
  //     level: 'THPT',
  //     grade: 'Lớp 12',
  //     registerDate: '20/07/2025',
  //     assignDate: '22/07/2025',
  //     startDate: '01/08/2025',
  //     endDate: '01/11/2025',
  //     timeSlot: 'Thứ 7 | 08:00 – 10:00',
  //     totalSessions: 12,
  //     completedSessions: 12,
  //     remainingSessions: 0,
  //     status: 'Hoàn thành',
  //     note: 'Đã kết thúc khóa.',
  //     classLink: 'https://meet.google.com/example',
  //   },
  // ]);

  // Popup chi tiết lớp học
  const [selectedClass, setSelectedClass] = useState(null);


  // Bộ lọc trong Hồ sơ đang chờ
  const [waitingRows, setWaitingRows] = useState([
  //   {
  //     id: 1,
  //     code: 'HS001',
  //     name: 'Phạm Văn Dũng',
  //     submitDate: '10/11/2025',
  //     status: 'Đang chờ duyệt',
  //     note: 'Ứng tuyển gia sư Toán THPT.',
  //     email: 'hs001@example.com',
  //     phone: '0912000111',
  //     cvFileName: 'CV_PhamVanDung.pdf',
  //   },
  //   {
  //     id: 2,
  //     code: 'HS002',
  //     name: 'Lê Ngọc Ánh',
  //     submitDate: '09/11/2025',
  //     status: 'Thiếu giấy tờ',
  //     note: 'Thiếu bằng tốt nghiệp để đối chiếu.',
  //     email: 'hs002@example.com',
  //     phone: '0912000222',
  //     cvFileName: 'CV_LeNgocAnh.pdf',
  //   },
  ]);

  const [waitingSearchTerm, setWaitingSearchTerm] = useState('');
  const [waitingStatusFilter, setWaitingStatusFilter] = useState('all');

  // Bộ lọc trong Học viên
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  // Popup thêm hồ sơ ứng tuyển (form nộp CV)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [cvForm, setCvForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    notes: '',
    cv: null,
  });
  const [cvMessage, setCvMessage] = useState('');

  // Popup xem chi tiết hồ sơ (HS001, HS002,…)
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isSupplementMode, setIsSupplementMode] = useState(false);
  const [supplementNote, setSupplementNote] = useState('');

  // Popup hồ sơ gia sư (click vào Mã gia sư ở tab Nhân sự)
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isTutorEditMode, setIsTutorEditMode] = useState(false);
  const [tutorForm, setTutorForm] = useState({
    code: '',
    fullname: '',
    email: '',
    phone: '',
    notes: '',
    status: '',
  });

  // Popup hồ sơ học viên (click vào Mã học viên ở tab Học viên)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentEditMode, setIsStudentEditMode] = useState(false);
  const [studentSaveLoading, setStudentSaveLoading] = useState(false);
  const [studentForm, setStudentForm] = useState({
    code: '',
    fullname: '',
    gender: '',
    email: '',
    phone: '',
    notes: '',
    status: '',
    courses: 0,
  });

  const displayName = user?.name || 'Ngoc Huynh';
  const displayCode = user?.username || 'student1';

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  const handleCourseTabClick = (tab, e) => {
    e.preventDefault();
    setCourseTab(tab);
  };

  // ===== LỌC DANH SÁCH GIA SƯ =====
  const filteredTutors = tutors.filter((row) => {
    const matchSearch =
      !searchTerm ||
      row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || row.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Lọc danh sách hồ sơ đang chờ
  const filteredWaitingRows = waitingRows.filter((row) => {
    const keyword = waitingSearchTerm.toLowerCase();
    const matchSearch =
      !keyword ||
      row.code.toLowerCase().includes(keyword) ||
      row.name.toLowerCase().includes(keyword);

    const matchStatus =
      waitingStatusFilter === 'all' || row.status === waitingStatusFilter;

    return matchSearch && matchStatus;
  });

  // Lọc danh sách học viên
  const filteredStudents = students.filter((row) => {
    const keyword = studentSearchTerm.toLowerCase();
    const matchSearch =
      !keyword ||
      row.code.toLowerCase().includes(keyword) ||
      row.name.toLowerCase().includes(keyword);

    const matchStatus =
      studentStatusFilter === 'all' || row.status === studentStatusFilter;

    return matchSearch && matchStatus;
  });

  // Lịch sử chỉnh sửa hiện tại của gia sư đang mở
  const currentTutorHistory =
    selectedTutor
      ? tutors.find((t) => t.code === selectedTutor.code)?.history || []
      : [];

  // Lịch sử chỉnh sửa hiện tại của học viên đang mở
  const currentStudentHistory =
    selectedStudent
      ? students.find((s) => s.code === selectedStudent.code)?.history || []
      : [];

  // ===== HANDLER POPUP CV (form nộp hồ sơ) =====
  const openCvModal = () => {
    setIsCvModalOpen(true);
    setCvMessage('');
  };

  const closeCvModal = () => {
    setIsCvModalOpen(false);
  };

  const handleCvFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'cv') {
      setCvForm((prev) => ({ ...prev, cv: files[0] || null }));
    } else {
      setCvForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleResetCV = () => {
    setCvForm({
      fullname: '',
      email: '',
      phone: '',
      notes: '',
      cv: null,
    });
    const input = document.getElementById('cvFile');
    if (input) input.value = '';
    setCvMessage('');
  };

  const handleCvSubmit = (e) => {
    e.preventDefault();
    // Sau này bạn gắn API lưu hồ sơ ở đây
    console.log('CV form submit', cvForm);
    setCvMessage('Đã lưu hồ sơ ứng tuyển (demo).');
  };

  // ===== HANDLER POPUP XEM CHI TIẾT HỒ SƠ =====
  const openApplicationDetail = (row) => {
    setSelectedApplication(row);
    setIsSupplementMode(false);
    setSupplementNote('');
  };

  const closeApplicationDetail = () => {
    setSelectedApplication(null);
    setIsSupplementMode(false);
    setSupplementNote('');
  };

  // Khi duyệt hồ sơ: cập nhật status hồ sơ + đẩy sang danh sách gia sư
  const handleApproveApplication = async () => {
    if (!selectedApplication) return;

    setApproveLoading(true);

    await updateTutorProfile(selectedApplication.profileId, {
      status: "active"
    });

    const now = new Date().toLocaleString('vi-VN');
    const tutorCode = 'GS' + selectedApplication.code.slice(2); // HS001 -> GS001

    // Cập nhật trạng thái hồ sơ
    setWaitingRows((prev) =>
      prev.map((row) =>
        row.id === selectedApplication.id
          ? { ...row, status: 'Đã duyệt' }
          : row
      )
    );
    setSelectedApplication((prev) =>
      prev ? { ...prev, status: 'Đã duyệt' } : prev
    );

    // Thêm/ cập nhật vào danh sách gia sư
    setTutors((prev) => {
      const existed = prev.some((t) => t.code === tutorCode);
      if (existed) {
        return prev.map((t) =>
          t.code === tutorCode
            ? {
                ...t,
                status: 'Đang hoạt động',
                // history: [
                //   ...(t.history || []),
                //   {
                //     time: now,
                //     user: displayName,
                //     action: 'Duyệt hồ sơ gia sư',
                //   },
                // ],
              }
            : t
        );
      }

      const newTutor = {
        id: prev.length + 1,
        code: tutorCode,
        name: selectedApplication.name,
        gender: '—',
        status: 'Đã duyệt',
        note: selectedApplication.note || '',
        email: selectedApplication.email,
        phone: selectedApplication.phone,
        // history: [
        //   {
        //     time: now,
        //     user: displayName,
        //     action: 'Duyệt hồ sơ và thêm vào danh sách gia sư',
        //   },
        // ],
      };

      return [...prev, newTutor];
    });
    setApproveLoading(false);
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;

    setRejectLoading(true);

    // Gọi API update status = rejected
    await updateTutorProfile(selectedApplication.profileId, {
      status: "rejected"
    });
    setWaitingRows((prev) =>
      prev.map((row) =>
        row.id === selectedApplication.id
          ? { ...row, status: 'Từ chối' }
          : row
      )
    );
    setSelectedApplication((prev) =>
      prev ? { ...prev, status: 'Từ chối' } : prev
    );

    setRejectLoading(false);
  };

  const handleStartSupplement = () => {
    if (!selectedApplication) return;
    setIsSupplementMode(true);
    setSupplementNote(selectedApplication.note || '');
  };

  const handleSaveSupplement = () => {
    if (!selectedApplication) return;
    const content = supplementNote.trim();
    if (!content) return;

    setWaitingRows((prev) =>
      prev.map((row) =>
        row.id === selectedApplication.id
          ? { ...row, note: content }
          : row
      )
    );
    setSelectedApplication((prev) =>
      prev ? { ...prev, note: content } : prev
    );
    setIsSupplementMode(false);
    setSupplementNote('');
  };

  // ===== HỒ SƠ GIA SƯ (CLICK MÃ GIA SƯ) =====
  const openClassDetail = (row) => {
  setSelectedClass(row);
};

const closeClassDetail = () => {
  setSelectedClass(null);
};


  const openTutorDetail = (row) => {
    setSelectedTutor(row);
    setTutorForm({
      profileId: row.profileId,
      code: row.code,
      fullname: row.name,
      email: row.email || '',
      phone: row.phone || '',
      notes: row.note || '',
      status: row.status || '',
    });
    setIsTutorEditMode(false);
  };

  const closeTutorDetail = () => {
    setSelectedTutor(null);
    setIsTutorEditMode(false);
  };

  const handleTutorFormChange = (e) => {
    const { name, value } = e.target;
    setTutorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTutorStartEdit = () => {
    setIsTutorEditMode(true);
  };

  const handleTutorStatusUpdate = async (newStatus) => {
    if (!selectedTutor) return;
    setTutorStatusLoading(true);
    await updateTutorProfile(selectedTutor.profileId, { status: newStatus });
    const statusMapping = {
      active: "Đang hoạt động",
      ended: "Đã kết thúc hợp đồng",
    };
    const now = new Date().toLocaleString('vi-VN');

    // // Cập nhật form
    // setTutorForm((prev) => ({ ...prev, status: newStatus }));

    // // Cập nhật danh sách gia sư + history
    // setTutors((prev) =>
    //   prev.map((t) => {
    //     if (t.code !== selectedTutor.code) return t;
    //     // const newHistory = [
    //     //   ...(t.history || []),
    //     //   {
    //     //     time: now,
    //     //     user: displayName,
    //     //     action: `Cập nhật trạng thái: ${newStatus}`,
    //     //   },
    //     // ];
    //     return {
    //       ...t,
    //       status: newStatus,
    //       // history: newHistory,
    //     };
    //   })
    // );
    const viStatus = newStatus === "ended"
      ? "Đã kết thúc hợp đồng"
      : "Đang hoạt động";

    // Cập nhật form
    setTutorForm((prev) => ({ ...prev, status: viStatus }));

    // Cập nhật trong danh sách tutors
    setTutors((prev) =>
      prev.map((t) =>
        t.code === selectedTutor.code
          ? { ...t, status: viStatus }
          : t
      )
    );

    // Cập nhật selectedTutor đang mở
    setSelectedTutor((prev) =>
      prev
        ? { ...prev, status: viStatus }
        : prev
    );

    // Cập nhật selectedTutor để hiển thị realtime
    setSelectedTutor((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
            history: [
              ...(prev.history || []),
              {
                time: now,
                user: displayName,
                action: `Cập nhật trạng thái: ${newStatus}`,
              },
            ],
          }
        : prev
    );
    setTutorStatusLoading(false);
  };

  const handleTutorSaveComplete = async () => {
    if (!selectedTutor) return;
    setTutorSaveLoading(true);

    await updateUser(selectedTutor.userId, {
      name: tutorForm.fullname,
      email: tutorForm.email,
      phone: tutorForm.phone
    });

    const now = new Date().toLocaleString('vi-VN');

    setTutors((prev) =>
      prev.map((t) => {
        if (t.code !== selectedTutor.code) return t;
        // const newHistory = [
        //   ...(t.history || []),
        //   {
        //     time: now,
        //     user: displayName,
        //     action: 'Cập nhật thông tin hồ sơ',
        //   },
        // ];
        return {
          ...t,
          name: tutorForm.fullname,
          email: tutorForm.email,
          phone: tutorForm.phone,
          note: tutorForm.notes,
          status: tutorForm.status,
          // history: newHistory,
        };
      })
    );

    setSelectedTutor((prev) =>
      prev
        ? {
            ...prev,
            name: tutorForm.fullname,
            email: tutorForm.email,
            phone: tutorForm.phone,
            note: tutorForm.notes,
            status: tutorForm.status,
            history: [
              ...(prev.history || []),
              {
                time: now,
                user: displayName,
                action: 'Cập nhật thông tin hồ sơ',
              },
            ],
          }
        : prev
    );

    setIsTutorEditMode(false);
    setTutorSaveLoading(false);
  };

  // ===== HỒ SƠ HỌC VIÊN (CLICK MÃ HỌC VIÊN) =====
  const openStudentDetail = (row) => {
    setSelectedStudent(row);
    setStudentForm({
      code: row.code,
      fullname: row.name,
      gender: row.gender || '',
      email: row.email || '',
      phone: row.phone || '',
      notes: row.note || '',
      status: row.status || '',
      courses: row.courses || 0,
    });
    setIsStudentEditMode(false);
  };

  const closeStudentDetail = () => {
    setSelectedStudent(null);
    setIsStudentEditMode(false);
  };

  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentStartEdit = () => {
    setIsStudentEditMode(true);
  };

  const handleStudentStatusUpdate = (newStatus) => {
    if (!selectedStudent) return;
    const now = new Date().toLocaleString('vi-VN');

    // Cập nhật form
    setStudentForm((prev) => ({ ...prev, status: newStatus }));

    // Cập nhật danh sách học viên + history
    setStudents((prev) =>
      prev.map((s) => {
        if (s.code !== selectedStudent.code) return s;
        const newHistory = [
          ...(s.history || []),
          {
            time: now,
            user: displayName,
            action: `Cập nhật trạng thái hoạt động: ${newStatus}`,
          },
        ];
        return {
          ...s,
          status: newStatus,
          history: newHistory,
        };
      })
    );

    // Cập nhật selectedStudent để hiển thị realtime
    setSelectedStudent((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
            history: [
              ...(prev.history || []),
              {
                time: now,
                user: displayName,
                action: `Cập nhật trạng thái hoạt động: ${newStatus}`,
              },
            ],
          }
        : prev
    );
  };

  

  const handleStudentSaveComplete = async () => {
    if (!selectedStudent) return;

    setStudentSaveLoading(true);
    try {
      // Call API to update user data
      await updateUser(selectedStudent.userId, {
        name: studentForm.fullname,
        gender: studentForm.gender,
        email: studentForm.email,
        phone: studentForm.phone,
        status: studentForm.status,
      });

      const now = new Date().toLocaleString('vi-VN');

      // Update local state in the main list
      setStudents((prev) =>
        prev.map((s) => {
          if (s.code !== selectedStudent.code) return s;
          const newHistory = [
            ...(s.history || []),
            {
              time: now,
              user: displayName,
              action: 'Cập nhật thông tin hồ sơ học viên',
            },
          ];
          return {
            ...s,
            name: studentForm.fullname,
            gender: studentForm.gender,
            email: studentForm.email,
            phone: studentForm.phone,
            note: studentForm.notes,
            status: studentForm.status,
            courses: studentForm.courses,
            history: newHistory,
          };
        })
      );

      // Update state of the currently opened modal
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              name: studentForm.fullname,
              gender: studentForm.gender,
              email: studentForm.email,
              phone: studentForm.phone,
              note: studentForm.notes,
              status: studentForm.status,
              courses: studentForm.courses,
              history: [
                ...(prev.history || []),
                {
                  time: now,
                  user: displayName,
                  action: 'Cập nhật thông tin hồ sơ học viên',
                },
              ],
            }
          : prev
      );

      setIsStudentEditMode(false);
    } catch (error) {
      console.error("Lỗi cập nhật thông tin học viên:", error);
      alert("Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setStudentSaveLoading(false);
    }
  };

  // ===== DANH SÁCH LỚP HỌC =====
  const loadClasses = async () => {
    try {
      setClassLoading(true);

      const data = await getClasses();  // ⭐ Dùng API bạn đã có

      const statusMapping = {
        open: "Đang mở",
        closed: "Đã đóng",
      };

      const mapped = data.map((cls, i) => ({
        stt: i + 1,
        classId: cls.id,
        code: cls.class_code || `L${String(i + 1).padStart(3, "0")}`,
        studentCode: cls.student_code || "HV???",
        tutorCode: cls.tutor_code || "GS???",
        subject: cls.subject,
        level: cls.level,
        grade: cls.grade,
        startDate: cls.start_date,
        endDate: cls.end_date,
        status: statusMapping[cls.status] || cls.status
      }));

      setClassList(mapped);
    } catch (err) {
      console.error("Lỗi load lớp:", err);
    } finally {
      setClassLoading(false);
    }
  };

  const formatToDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  // Tránh lỗi timezone khi date không có giờ (YYYY-MM-DD)
  if (value.length === 10) {
    return value.split("-").reverse().join("/");
  }

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
};

  

  const loadAllAssignments = async () => {
    try {
      setAssignmentLoading(true);
      const assignments = await getAllAssignments();

      // Cache for users to avoid re-fetching
      const usersCache = new Map();
      const getUser = async (userId) => {
        if (!userId) return { name: 'N/A', id: 'N/A' };
        if (usersCache.has(userId)) {
          return usersCache.get(userId);
        }
        try {
          const user = await getUserById(userId);
          usersCache.set(userId, user);
          return user;
        } catch (error) {
          console.error(`Failed to fetch user ${userId}`, error);
          return { name: 'N/A', id: 'N/A' }; // Return a default object on error
        }
      };

      const enrichedAssignments = await Promise.all(
        assignments.map(async (assign) => {
          const [student, tutor, registration, classInfo] = await Promise.all([
            getUser(assign.student_id),
            getUser(assign.tutor_user_id),
            getRegistrationById(assign.registration_id).catch(() => null),
            getClasses({ student_tutor_assignments_id: assign.id }).then(res => res[0] || null).catch(() => null),
          ]);

          let allSessions = [];
          if (classInfo && classInfo.id) {
              allSessions = await getClassSessions({ class_id: classInfo.id }).catch(() => []);
          }

          let scheduleDisplay = 'Chưa có lịch';
          if (registration && registration.schedule_json) {
            const sj = registration.schedule_json;
            const days = sj.days?.join(', ') || '';
            const time = `${sj.start_time || ''}-${sj.end_time || ''}`;
            scheduleDisplay = `${days} ${time}`.trim();
          }

          return {
            ...assign,
            id: assign.id,
            // id: idx + 1,
            className: classInfo?.class_name || `Lớp ${registration?.subject || ''}`,
            classCode: classInfo?.id || 'N/A', //Mã lớp
            // classCode: "L" + String(idx + 1).padStart(3, "0"),
            studentName: student?.name || 'Học viên',
            studentCode: student?.id || 'HV N/A',//Mã học viên
            tutorName: tutor?.name || 'Chưa có gia sư',
            tutorCode: tutor?.id || 'GS N/A', //Mã gia sư
            // tutorCode: "GS" + String(idx + 1).padStart(3, "0"),
            startDate: formatToDate(classInfo?.start_date),
            endDate: formatToDate(classInfo?.end_date),
            schedule: scheduleDisplay, //Thời gian học
            subject: registration?.subject, //Mã môn học
            grade: registration?.grade, //Mã lớp
            registrationDate: formatToDate(registration?.created_at),//Ngày đăng ký
            assignmentDate: formatToDate(assign?.assigned_at),
            status: assign.status,
            classStatus: classInfo?.status || 'Chưa tạo lớp',//Trạng thái lớp
            totalSessions: allSessions.length,
            completedSessions: allSessions.filter(s => s.status === 'completed').length,
            remainingSessions: allSessions.filter(s => s.status !== 'completed').length,
          };
        })
      );

      setAssignmentList(enrichedAssignments);
    } catch (err) {
      console.error("Error fetching all assignments:", err);
      setAssignmentList([]);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTopTab === "khoahoc") {
      loadAllAssignments();
    }
  }, [activeTopTab]);


  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="site-header">
        <div className="header-inner">
          {/* Logo */}
          <a
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate('/hr');
            }}
          >
            <img className="brand-logo" src={logoImage} alt="G&3N Logo" />
            <span>GIASUNO1</span>
          </a>

          {/* Tabs trên header */}
          <nav>
            <div className="nav">
              <a
                href="#nhansu"
                className={`top-link ${
                  activeTopTab === 'nhansu' ? 'is-active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTopTab('nhansu');
                }}
              >
                Nhân sự
              </a>
              <a
                href="#hocvien"
                className={`top-link ${
                  activeTopTab === 'hocvien' ? 'is-active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTopTab('hocvien');
                }}
              >
                Học viên
              </a>
              <a
                href="#khoahoc"
                className={`top-link ${
                  activeTopTab === 'khoahoc' ? 'is-active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTopTab('khoahoc');
                }}
              >
                Khóa học
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
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.24-8 5v1h16v-1c0-2.76-3.6-5-8-5Z"
                        fill="currentColor"
                      />
                    </svg>
                    Quản lý thông tin
                  </button>

                  <button type="button" className="mi" role="menuitem">
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
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
                    <svg className="mi-ico" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* ===== MAIN ===== */}
      <main className="hr-main">
        {/* ========== TAB NHÂN SỰ ========== */}
        {activeTopTab === 'nhansu' && (
          <section id="nhansu" className="hr-section is-active">
            <div className="hr-card">
              {/* Header card */}
              <div className="hr-card-header">
                <h2>Nhân sự</h2>
                <p>Quản lý danh sách gia sư và hồ sơ ứng tuyển của trung tâm.</p>
              </div>

              <div className="hr-card-body">
                {/* Sidebar trái */}
                <aside className="hr-side">
                  <button
                    type="button"
                    className={`hr-side-link ${
                      hrTab === 'staff' ? 'is-active' : ''
                    }`}
                    onClick={() => setHrTab('staff')}
                  >
                    Quản lý nhân sự
                  </button>
                  <button
                    type="button"
                    className={`hr-side-link ${
                      hrTab === 'waiting' ? 'is-active' : ''
                    }`}
                    onClick={() => setHrTab('waiting')}
                  >
                    Hồ sơ đang chờ
                  </button>
                </aside>

                {/* Panel phải */}
                <div className="hr-panel">
                  {/* ---- 1. DANH SÁCH GIA SƯ ---- */}
                  {hrTab === 'staff' && (
                    <>
                      <h3 className="hr-panel-title">
                        Danh sách gia sư trong trung tâm
                      </h3>

                      {/* Filter hàng trên */}
                      <div className="hr-toolbar">
                        <input
                          type="text"
                          className="hr-search"
                          placeholder="Tìm theo tên hoặc mã gia sư..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="hr-toolbar-group">
                          <select
                            className="hr-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="all">Tình trạng hợp đồng</option>
                            <option value="Đang hoạt động">Đang hoạt động</option>
                            {/* <option value="Tạm dừng">Tạm dừng</option> */}
                            {/* <option value="Đã duyệt">Đã duyệt</option> */}
                            <option value="Kết thúc hợp đồng">
                              Kết thúc hợp đồng
                            </option>
                          </select>

                          <button
                            type="button"
                            className="hr-btn hr-btn-filter"
                          >
                            Lọc
                          </button>

                          <button
                            type="button"
                            className="hr-btn hr-btn-primary"
                            onClick={openCvModal}
                          >
                            + Thêm gia sư
                          </button>
                        </div>
                      </div>

                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Mã gia sư</th>
                            <th>Họ tên</th>
                            <th>Giới tính</th>
                            <th>Tình trạng hợp đồng</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        {/* <tbody>
                          {filteredTutors.map((row, index) => (
                            <tr key={row.id}>
                              <td>{index + 1}</td>
                              <td>
                                <button
                                  type="button"
                                  className="hr-code-pill"
                                  onClick={() => openTutorDetail(row)}
                                >
                                  {row.code}
                                </button>
                              </td>
                              <td>
                                <span className="hr-name-cell">{row.name}</span>
                              </td>
                              <td>{row.gender}</td>
                              <td>
                                <span
                                  className={`hr-badge ${
                                    row.status === 'Đang hoạt động'
                                      ? 'hr-badge--active'
                                      : row.status === 'Tạm dừng'
                                      ? 'hr-badge--pause'
                                      : 'hr-badge--muted'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                              <td className="hr-note-col">{row.note}</td>
                            </tr>
                          ))}
                        </tbody> */}
                        <tbody>
                          {staffLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                Đang tải dữ liệu...
                              </td>
                            </tr>
                          ) : filteredTutors.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                Không có gia sư nào.
                              </td>
                            </tr>
                          ) : (
                            filteredTutors.map((row, index) => (
                              <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="hr-code-pill"
                                    onClick={() => openTutorDetail(row)}
                                  >
                                    {row.code}
                                  </button>
                                </td>
                                <td><span className="hr-name-cell">{row.name}</span></td>
                                <td>{row.gender}</td>
                                <td>
                                  <span className={`hr-badge ${
                                    row.status === 'Đang hoạt động'
                                      ? 'hr-badge--active'
                                      : row.status === 'Tạm dừng'
                                      ? 'hr-badge--pause'
                                      : 'hr-badge--muted'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="hr-note-col">{row.note}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* ---- 2. HỒ SƠ ĐANG CHỜ ---- */}
                  {hrTab === 'waiting' && (
                    <>
                      <h3 className="hr-panel-title">
                        Hồ sơ gia sư đang chờ xét duyệt
                      </h3>

                      {/* Bộ lọc hồ sơ đang chờ */}
                      <div className="hr-toolbar">
                        <input
                          type="text"
                          className="hr-search"
                          placeholder="Tìm theo tên hoặc mã hồ sơ..."
                          value={waitingSearchTerm}
                          onChange={(e) => setWaitingSearchTerm(e.target.value)}
                        />

                        <div className="hr-toolbar-group">
                          <select
                            className="hr-select"
                            value={waitingStatusFilter}
                            onChange={(e) =>
                              setWaitingStatusFilter(e.target.value)
                            }
                          >
                            <option value="all">Trạng thái hồ sơ</option>
                            <option value="Đang chờ duyệt">Đang chờ duyệt</option>
                            {/* <option value="Thiếu giấy tờ">Thiếu giấy tờ</option> */}
                            <option value="Đã duyệt">Đã duyệt</option>
                            <option value="Từ chối">Từ chối</option>
                          </select>

                          <button
                            type="button"
                            className="hr-btn hr-btn-filter"
                          >
                            Lọc
                          </button>
                        </div>
                      </div>

                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Mã hồ sơ</th>
                            <th>Họ tên</th>
                            <th>Ngày nộp</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        {/* <tbody>
                          {filteredWaitingRows.map((row, index) => (
                            <tr key={row.id}>
                              <td>{index + 1}</td>
                              <td>
                                <button
                                  type="button"
                                  className="hr-code-pill"
                                  onClick={() => openApplicationDetail(row)}
                                >
                                  {row.code}
                                </button>
                              </td>
                              <td>
                                <span className="hr-name-cell">{row.name}</span>
                              </td>
                              <td>{row.submitDate}</td>
                              <td>
                                <span className="hr-badge hr-badge--muted">
                                  {row.status}
                                </span>
                              </td>
                              <td className="hr-note-col">{row.note}</td>
                            </tr>
                          ))}
                        </tbody> */}
                        <tbody>
                          {waitingLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                Đang tải dữ liệu...
                              </td>
                            </tr>
                          ) : filteredWaitingRows.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                Không có hồ sơ nào.
                              </td>
                            </tr>
                          ) : (
                            filteredWaitingRows.map((row, index) => (
                              <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <button className="hr-code-pill" onClick={() => openApplicationDetail(row)}>
                                    {row.code}
                                  </button>
                                </td>
                                <td>{row.name}</td>
                                <td>{row.submitDate}</td>
                                <td>{row.status}</td>
                                <td>{row.note}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========== TAB HỌC VIÊN ========== */}
        {activeTopTab === 'hocvien' && (
          <section id="hocvien" className="hr-section is-active">
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>Học viên</h2>
                <p>Quản lý danh sách học viên đang có trong hệ thống.</p>
              </div>

              <div className="hr-card-body">
                {/* CỘT TRÁI: BỘ LỌC HỌC VIÊN */}
                <aside className="hr-side">
                  <div className="hv-filter-title">Bộ lọc</div>
                  <div className="hv-filter-group">
                    <input
                      type="text"
                      className="hv-filter-input"
                      placeholder="Mã hoặc tên học viên..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                    />

                    <select
                      className="hv-filter-select"
                      value={studentStatusFilter}
                      onChange={(e) => setStudentStatusFilter(e.target.value)}
                    >
                      <option value="all">Trạng thái</option>
                      <option value="Đang sử dụng">Đang sử dụng</option>
                      <option value="Khóa tạm thời">Khóa tạm thời</option>
                      <option value="Khóa vĩnh viễn">Khóa vĩnh viễn</option>
                    </select>
                  </div>

                  <div className="hv-filter-actions">
                    <button className="hr-btn hr-btn-primary" type="button">
                      Lọc
                    </button>
                  </div>
                </aside>

                {/* CỘT PHẢI: BẢNG DANH SÁCH HỌC VIÊN */}
                <div className="hr-panel">
                  <h3 className="hr-panel-title">Danh sách học viên</h3>
                  <p className="hv-muted">
                    Tổng quan các học viên đang có trong hệ thống.
                  </p>

                  <table className="hr-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã học viên</th>
                        <th>Họ tên</th>
                        <th>Giới tính</th>
                        <th>Số khóa đang học</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentLoading ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                            Không có học viên nào.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((row, index) => (
                          <tr key={row.id}>
                            <td>{index + 1}</td>
                            <td>
                              <button
                                type="button"
                                className="hr-code-pill"
                                onClick={() => openStudentDetail(row)}
                              >
                                {row.code}
                              </button>
                            </td>
                            <td>
                              <span className="hr-name-cell">{row.name}</span>
                            </td>
                            <td>{row.gender}</td>
                            <td>{row.courses}</td>
                            <td>
                              <span
                                className={`hr-badge ${
                                  row.status === 'Đang sử dụng'
                                    ? 'hr-badge--active'
                                    : row.status === 'Khóa tạm thời'
                                    ? 'hr-badge--pause'
                                    : 'hr-badge--muted'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========== TAB KHÓA HỌC ========== */}
        {activeTopTab === 'khoahoc' && (
          <section id="khoahoc" className="hr-section is-active">
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>Khóa học</h2>
                <p>Quản lý lớp học, tài liệu theo môn và điều phối gia sư.</p>
              </div>

              <div className="hr-card-body">
                {/* SIDEBAR KHÓA HỌC */}
                <aside className="hr-side">
                  <button
                    type="button"
                    className={`hr-side-link ${
                      courseTab === 'class' ? 'is-active' : ''
                    }`}
                    onClick={(e) => handleCourseTabClick('class', e)}
                  >
                    Quản lý lớp học
                  </button>
                  <button
                    type="button"
                    className={`hr-side-link ${
                      courseTab === 'resource' ? 'is-active' : ''
                    }`}
                    onClick={(e) => handleCourseTabClick('resource', e)}
                  >
                    Tài liệu theo môn
                  </button>
                  <button
                    type="button"
                    className={`hr-side-link ${
                      courseTab === 'dispatch' ? 'is-active' : ''
                    }`}
                    onClick={(e) => handleCourseTabClick('dispatch', e)}
                  >
                    Điều phối gia sư
                  </button>
                </aside>

                {/* NỘI DUNG CHÍNH KHÓA HỌC */}
                <div className="hr-panel">
                  {/* ==== 1. QUẢN LÝ LỚP HỌC ==== */}
                  {courseTab === 'class' && (
                    <>
                      <h3 className="hr-panel-title">Quản lý lớp học</h3>
                      <p className="hv-muted">
                        Danh sách tất cả các lớp học và trạng thái phân công gia sư.
                      </p>

                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Mã lớp</th>
                            <th>Mã học viên</th>
                            <th>Mã gia sư</th>
                            <th>Môn</th>
                            <th>Lớp</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        
                        <tbody>
                          {assignmentLoading ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: "center" }}>
                                Đang tải dữ liệu...
                              </td>
                            </tr>
                          ) : assignmentList.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: "center" }}>
                                Không có lớp học nào.
                              </td>
                            </tr>
                          ) : (
                            assignmentList.map((row, index) => (
                              <tr key={row.id} onClick={() => openClassDetail(row)} style={{ cursor: 'pointer' }}>
                                <td>{index + 1}</td>
                                <td>{row.classCode}</td>
                                <td>{row.studentCode}</td>
                                <td>{row.tutorCode}</td>
                                <td>{row.subject}</td>
                                <td>{row.grade}</td>
                                <td>{row.startDate}</td>
                                <td>{row.endDate}</td>
                     
                                <td>
                                  <span className={`hr-badge ${
                                      row.classStatus === 'open' ? 'hr-badge--active' : 'hr-badge--pause'
                                    }`}>
                                    {row.classStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* ==== 2. TÀI LIỆU THEO MÔN ==== */}
                  {courseTab === 'resource' && (
                    <>
                      <h3 className="hr-panel-title">Tài liệu theo môn</h3>
                      <p className="hv-muted">
                        Thống kê tài liệu học tập theo từng môn học và khối lớp.
                      </p>

                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Môn</th>
                            <th>Cấp học</th>
                            <th>Lớp học</th>
                            <th>Số tài liệu</th>
                            <th>Định dạng chính</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>Toán</td>
                            <td>Tiểu học</td>
                            <td>1–5</td>
                            <td>24</td>
                            <td>PDF, Worksheet</td>
                            <td>
                              <button
                                type="button"
                                className="hr-btn hr-btn-filter"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td>2</td>
                            <td>Tiếng Anh</td>
                            <td>THCS</td>
                            <td>6–9</td>
                            <td>18</td>
                            <td>Slide, Video</td>
                            <td>
                              <button
                                type="button"
                                className="hr-btn hr-btn-filter"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td>3</td>
                            <td>Luyện thi ĐH khối A</td>
                            <td>THPT</td>
                            <td>Khối A</td>
                            <td>35</td>
                            <td>Đề luyện, PDF</td>
                            <td>
                              <button
                                type="button"
                                className="hr-btn hr-btn-filter"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* ==== 3. ĐIỀU PHỐI GIA SƯ ==== */}
                  {courseTab === 'dispatch' && (
                    <>
                      <h3 className="hr-panel-title">Điều phối gia sư</h3>
                      <p className="hv-muted">
                        Danh sách các lớp cần điều phối gia sư khi gia sư báo vắng.
                      </p>

                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>STT</th>
                            <th>Mã lớp học</th>
                            <th>Mã học viên</th>
                            <th>Mã gia sư</th>
                            <th>Môn học</th>
                            <th>Khối học</th>
                            <th>Lớp học</th>
                            <th>Ngày học</th>
                            <th>Thời gian học</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                L001
                              </button>
                            </td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                HV001
                              </button>
                            </td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                GS001
                              </button>
                            </td>
                            <td>Toán</td>
                            <td>Tiểu học</td>
                            <td>Lớp 4</td>
                            <td>25/11/2025</td>
                            <td>18:00 – 19:30</td>
                            <td>
                              <span className="hr-badge hr-badge--pause">
                                Gia sư báo vắng
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td>2</td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                L002
                              </button>
                            </td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                HV005
                              </button>
                            </td>
                            <td>
                              <button type="button" className="hr-code-pill">
                                GS008
                              </button>
                            </td>
                            <td>Tiếng Anh</td>
                            <td>THCS</td>
                            <td>Lớp 7</td>
                            <td>26/11/2025</td>
                            <td>19:00 – 20:30</td>
                            <td>
                              <span className="hr-badge hr-badge--active">
                                Đã điều phối gia sư
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ===== POPUP HỒ SƠ ỨNG TUYỂN (FORM NỘP) ===== */}
      {isCvModalOpen && (
        <div className="hr-modal" role="dialog" aria-modal="true">
          <div className="hr-modal-content">
            <div id="panelCreateCV" className="cv-panel">
              <h3>Hồ sơ ứng tuyển</h3>
              <form id="cvForm" className="cv-form" onSubmit={handleCvSubmit}>
                <label>Họ và tên</label>
                <input
                  name="fullname"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={cvForm.fullname}
                  onChange={handleCvFormChange}
                  required
                />

                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="mail@example.com"
                  value={cvForm.email}
                  onChange={handleCvFormChange}
                  required
                />

                <label>Số điện thoại</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="0912xxxxxx"
                  value={cvForm.phone}
                  onChange={handleCvFormChange}
                  required
                />

                <label>Kinh nghiệm / Ghi chú</label>
                <textarea
                  name="notes"
                  rows="4"
                  placeholder="Mô tả kinh nghiệm giảng dạy, bằng cấp..."
                  value={cvForm.notes}
                  onChange={handleCvFormChange}
                ></textarea>

                <label>Tải lên CV (pdf, png, jpg)</label>
                <input
                  id="cvFile"
                  name="cv"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleCvFormChange}
                  required
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn-accent">
                    Lưu hồ sơ
                  </button>
                  <button
                    type="button"
                    id="resetCV"
                    className="btn-outline"
                    onClick={handleResetCV}
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={closeCvModal}
                  >
                    Đóng
                  </button>
                </div>

                {cvMessage && (
                  <div id="cvMessage" style={{ marginTop: '10px', color: 'green' }}>
                    {cvMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP XEM CHI TIẾT HỒ SƠ ỨNG TUYỂN ===== */}
      {selectedApplication && (
        <div className="hr-modal" role="dialog" aria-modal="true">
          <div className="hr-modal-content">
            <div className="cv-panel">
              <h3>Chi tiết hồ sơ gia sư</h3>

              <div className="cv-view-grid">
                <div className="cv-view-label">Mã hồ sơ</div>
                <div className="cv-view-value">{selectedApplication.code}</div>

                <div className="cv-view-label">Họ và tên</div>
                <div className="cv-view-value">{selectedApplication.name}</div>

                <div className="cv-view-label">Email</div>
                <div className="cv-view-value">{selectedApplication.email}</div>

                <div className="cv-view-label">Số điện thoại</div>
                <div className="cv-view-value">{selectedApplication.phone}</div>

                <div className="cv-view-label">Ngày nộp</div>
                <div className="cv-view-value">
                  {selectedApplication.submitDate}
                </div>

                <div className="cv-view-label">Trạng thái</div>
                <div className="cv-view-value">{selectedApplication.status}</div>

                <div className="cv-view-label">Ghi chú</div>
                <div className="cv-view-value">
                  {selectedApplication.note || '—'}
                </div>

                <div className="cv-view-label">CV</div>
                <div className="cv-view-value">
                  {/* <button
                    type="button"
                    className="hr-btn hr-btn-filter"
                  >
                    Xem CV (PDF) – {selectedApplication.cvFileName}
                  </button> */}
                  <button
                    type="button"
                    className="hr-btn hr-btn-filter"
                    onClick={() => {
                      const filePath = selectedApplication.cvFileName;
                      if (!filePath) {
                        alert("Không tìm thấy file CV!");
                        return;
                      }

                      // Tạo link đến file trên backend
                      // const url = `http://localhost:8000/${selectedApplication.cvFileName}`;
                      // Mở PDF trên tab mới
                      window.open(`http://localhost:8003/upload_cv/${selectedApplication.cvFileName}`, "_blank");
                    }}
                  >
                    Xem CV (PDF)
                  </button>
                </div>
              </div>

              {isSupplementMode && (
                <div className="cv-supplement">
                  <label>Nội dung yêu cầu bổ sung</label>
                  <textarea
                    rows="3"
                    value={supplementNote}
                    onChange={(e) => setSupplementNote(e.target.value)}
                    placeholder="Ghi rõ các giấy tờ hoặc thông tin cần bổ sung..."
                  />
                  <div className="cv-supplement-actions">
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={handleSaveSupplement}
                    >
                      Lưu yêu cầu
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        setIsSupplementMode(false);
                        setSupplementNote('');
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              <div className="cv-actions-row">
                {/* <button
                  type="button"
                  className="btn-accent"
                  onClick={handleApproveApplication}
                >
                  Chấp nhận
                </button> */}
                {/* <button
                  type="button"
                  className="btn-accent"
                  onClick={handleApproveApplication}
                  disabled={approveLoading}
                >
                  {approveLoading ? "Đang xử lý..." : "Chấp nhận"}
                </button> */}
                <button
                  type="button"
                  className="btn-accent"
                  onClick={handleApproveApplication}
                  disabled={approveLoading || selectedApplication.status !== "Đang chờ duyệt"}
                >
                  {approveLoading ? "Đang xử lý..." : "Chấp nhận"}
                </button>
                {/* <button
                  type="button"
                  className="btn-outline btn-danger"
                  onClick={handleRejectApplication}
                >
                  Từ chối
                </button> */}
                {/* <button
                  type="button"
                  className="btn-outline btn-danger"
                  onClick={handleRejectApplication}
                  disabled={selectedApplication.status !== "Đang chờ duyệt"}
                >
                  Từ chối
                </button> */}
                <button
                  type="button"
                  className="btn-outline btn-danger"
                  onClick={handleRejectApplication}
                  disabled={rejectLoading || selectedApplication.status !== "Đang chờ duyệt"}
                >
                  {rejectLoading ? "Đang xử lý..." : "Từ chối"}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleStartSupplement}
                >
                  Yêu cầu bổ sung hồ sơ
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeApplicationDetail}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP HỒ SƠ GIA SƯ (EDIT) ===== */}
      {selectedTutor && (
        <div className="hr-modal" role="dialog" aria-modal="true">
          <div className="hr-modal-content">
            <div className="cv-panel">
              <h3>Hồ sơ gia sư</h3>

              <form className="cv-form" onSubmit={(e) => e.preventDefault()}>
                <label>Mã gia sư</label>
                <input
                  type="text"
                  name="code"
                  value={tutorForm.code}
                  disabled
                />

                <label>Họ và tên</label>
                <input
                  type="text"
                  name="fullname"
                  value={tutorForm.fullname}
                  onChange={handleTutorFormChange}
                  disabled={!isTutorEditMode}
                />

                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={tutorForm.email}
                  onChange={handleTutorFormChange}
                  disabled={!isTutorEditMode}
                />

                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={tutorForm.phone}
                  onChange={handleTutorFormChange}
                  disabled={!isTutorEditMode}
                />

                <label>Ghi chú / Kinh nghiệm</label>
                <textarea
                  name="notes"
                  rows="4"
                  value={tutorForm.notes}
                  onChange={handleTutorFormChange}
                  disabled={!isTutorEditMode}
                />

                <label>Trạng thái hợp đồng</label>
                {/* <input
                  type="text"
                  name="status"
                  value={tutorForm.status}
                  onChange={handleTutorFormChange}
                  disabled={!isTutorEditMode}
                /> */}
                <input
                  type="text"
                  name="status"
                  value={tutorForm.status}
                  disabled   // luôn disable, không cho sửa
                />
              </form>

              {/* Lịch sử chỉnh sửa */}
              {/* <h4 style={{ marginTop: '20px' }}>Lịch sử chỉnh sửa</h4>
              {currentTutorHistory.length === 0 ? (
                <p className="hv-muted">Chưa có lịch sử chỉnh sửa.</p>
              ) : (
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Người thay đổi</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTutorHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.time}</td>
                        <td>{h.user}</td>
                        <td>{h.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )} */}

              <div className="cv-actions-row">
                {!isTutorEditMode ? (
                  <>
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={handleTutorStartEdit}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={closeTutorDetail}
                    >
                      Đóng
                    </button>
                  </>
                ) : (
                  <>
                    {/* <button
                      type="button"
                      className="btn-outline"
                      onClick={() => handleTutorStatusUpdate('Tạm dừng')}
                    >
                      Tạm dừng
                    </button> */}
                    {/* <button
                      type="button"
                      className="btn-outline btn-danger"
                      onClick={() =>
                        handleTutorStatusUpdate('ended')
                      }
                    >
                      Kết thúc hợp đồng
                    </button> */}
                    <button
                      type="button"
                      className="btn-outline btn-danger"
                      onClick={() => handleTutorStatusUpdate('ended')}
                      disabled={tutorStatusLoading || tutorForm.status === "Đã kết thúc hợp đồng"}
                    >
                      {tutorStatusLoading ? "Đang xử lý..." : "Kết thúc hợp đồng"}
                    </button>
                    {/* <button
                      type="button"
                      className="btn-accent"
                      onClick={handleTutorSaveComplete}
                    >
                      Hoàn thành
                    </button> */}
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={handleTutorSaveComplete}
                      disabled={tutorSaveLoading}
                    >
                      {tutorSaveLoading ? "Đang xử lý..." : "Hoàn thành"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP HỒ SƠ HỌC VIÊN (EDIT) ===== */}
      {selectedStudent && (
        <div className="hr-modal" role="dialog" aria-modal="true">
          <div className="hr-modal-content">
            <div className="cv-panel">
              <h3>Hồ sơ học viên</h3>

              <form className="cv-form" onSubmit={(e) => e.preventDefault()}>
                <label>Mã học viên</label>
                <input
                  type="text"
                  name="code"
                  value={studentForm.code}
                  disabled
                />

                <label>Họ và tên</label>
                <input
                  type="text"
                  name="fullname"
                  value={studentForm.fullname}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Giới tính</label>
                <input
                  type="text"
                  name="gender"
                  value={studentForm.gender}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={studentForm.email}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={studentForm.phone}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  rows="4"
                  value={studentForm.notes}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Trạng thái hoạt động</label>
                <input
                  type="text"
                  name="status"
                  value={studentForm.status}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                />

                <label>Số khóa đang học</label>
                <input
                  type="number"
                  name="courses"
                  value={studentForm.courses}
                  onChange={handleStudentFormChange}
                  disabled={!isStudentEditMode}
                  min="0"
                />
              </form>

              {/* Lịch sử chỉnh sửa */}
              {/* <h4 style={{ marginTop: '20px' }}>Lịch sử chỉnh sửa</h4>
              {currentStudentHistory.length === 0 ? (
                <p className="hv-muted">Chưa có lịch sử chỉnh sửa.</p>
              ) : (
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Người thay đổi</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudentHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.time}</td>
                        <td>{h.user}</td>
                        <td>{h.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )} */}

              <div className="cv-actions-row">
                {!isStudentEditMode ? (
                  <>
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={handleStudentStartEdit}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={closeStudentDetail}
                    >
                      Đóng
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() =>
                        handleStudentStatusUpdate('Khóa tạm thời')
                      }
                    >
                      Khóa tạm thời
                    </button>
                    <button
                      type="button"
                      className="btn-outline btn-danger"
                      onClick={() =>
                        handleStudentStatusUpdate('Khóa vĩnh viễn')
                      }
                    >
                      Khóa vĩnh viễn
                    </button>
                    <button
                      type="button"
                      className="btn-accent"
                      onClick={handleStudentSaveComplete}
                      disabled={studentSaveLoading}
                    >
                      {studentSaveLoading ? "Đang lưu..." : "Hoàn thành"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP CHI TIẾT LỚP HỌC ===== */}
{selectedClass && (
  <div className="hr-modal" role="dialog" aria-modal="true">
    <div className="hr-modal-content">
      <div className="cv-panel">
        <h3>Chi tiết lớp học</h3>

        <div className="cv-view-grid">
          <div className="cv-view-label">Mã lớp học</div>
          <div className="cv-view-value">{selectedClass.classCode}</div>

          <div className="cv-view-label">Mã học viên</div>
          <div className="cv-view-value">{selectedClass.studentCode}</div>

          <div className="cv-view-label">Họ và tên học viên</div>
          <div className="cv-view-value">{selectedClass.studentName}</div>

          <div className="cv-view-label">Mã gia sư</div>
          <div className="cv-view-value">{selectedClass.tutorCode}</div>

          <div className="cv-view-label">Họ và tên gia sư</div>
          <div className="cv-view-value">{selectedClass.tutorName}</div>

          <div className="cv-view-label">Môn</div>
          <div className="cv-view-value">{selectedClass.subject}</div>


          <div className="cv-view-label">Lớp học</div>
          <div className="cv-view-value">{selectedClass.grade}</div>

          <div className="cv-view-label">Ngày đăng ký</div>
          <div className="cv-view-value">{selectedClass.registrationDate}</div>

          <div className="cv-view-label">Ngày nhận lớp</div>
          <div className="cv-view-value">{selectedClass.assignmentDate}</div>

          <div className="cv-view-label">Thời gian bắt đầu</div>
          <div className="cv-view-value">{selectedClass.startDate}</div>

          <div className="cv-view-label">Thời gian kết thúc</div>
          <div className="cv-view-value">{selectedClass.endDate}</div>

          <div className="cv-view-label">Thời gian học</div>
          <div className="cv-view-value">{selectedClass.schedule}</div>

          <div className="cv-view-label">Tổng số buổi học</div>
          <div className="cv-view-value">{selectedClass.totalSessions}</div>

          <div className="cv-view-label">Đã học</div>
          <div className="cv-view-value">{selectedClass.completedSessions}</div>

          <div className="cv-view-label">Còn lại</div>
          <div className="cv-view-value">{selectedClass.remainingSessions}</div>

          <div className="cv-view-label">Trạng thái</div>
          <div className="cv-view-value">{selectedClass.status}</div>

          {/* <div className="cv-view-label">Ghi chú</div> */}
          {/* <div className="cv-view-value">
            {selectedClass.note || '—'}
          </div> */}

          {/* <div className="cv-view-label">Link lớp học</div> */}
          {/* <div className="cv-view-value">
            {selectedClass.classLink ? (
              <a
                href={selectedClass.classLink}
                target="_blank"
                rel="noreferrer"
                className="hr-btn hr-btn-filter"
              >
                Mở lớp học
              </a>
            ) : (
              '—'
            )}
          </div> */}
        </div>

        <div className="cv-actions-row">
          <button
            type="button"
            className="btn-outline"
            onClick={closeClassDetail}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      <Footer />
    </>
  );
};

export default HR;
