// import Homepage from './pages/Home/Homepage';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './pages/Login/Login';
// import Signup from './pages/SignUp/Signup';
// import HomePage_Student from './pages/Student/HomePage_Student';
// import Course from './pages/Course/Course';
// import Tutor from './pages/Tutor/Tutor';
// import Student from './pages/Student/Student';
// import Job from './pages/Student/Job';
// import ProtectedRoute from './components/ProtectedRoute';
// import ListTutor from './pages/Student/ListTutor';
// import FeePage from './pages/Student/FeePage';
// import Job_Guest from './pages/Home/Job_Guest';
// import StudentSupport from './pages/Student/Support';
// import RequestPaymentFlow from './pages/Student/RequestPaymentFlow';

// import HR from './pages/HR/HR';
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Homepage />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         {/* <Route path="/home" element={<Homepage />} /> */}
//         <Route path="/guest" element={<Homepage />} />
//         <Route path="/tutor" element={<Tutor />} />
//         <Route path="/student" element={<HomePage_Student/>} />
//         <Route path="/mypage" element={<Student/>} />
//         <Route path="/job" element={<Job />} />
//         <Route path="/job-guest" element={<Job_Guest />} />
//         <Route path="/hr" element={<HR />} />
//         <Route path="/listtutor" element={<ListTutor />} />
//         <Route path="/hocphi" element={<FeePage />} />
//         <Route path="/support" element={<StudentSupport />} />
//         <Route path="/request-payment" element={<RequestPaymentFlow />} />



        
//         {/* Public route - guest có thể xem */}
//         <Route path="/courses" element={<Course />} />
        
//         {/* Protected routes - chỉ student mới vào được */}
//         {/* <Route 
//           path="/student" 
//           element={
//             <ProtectedRoute allowedRoles={['student']}>
//               <HomePage_Student />
//             </ProtectedRoute>
//           } 
//         /> */}
        
//         {/* Protected route - chỉ tutor mới vào được */}
//         {/* <Route 
//           path="/tutor" 
//           element={
//             <ProtectedRoute allowedRoles={['tutor']}>
//               <Tutor />
//             </ProtectedRoute>
//           } 
//         /> */}
//       </Routes>
//     </Router>
//   );
// }

// export default App;


import Homepage from './pages/Home/Homepage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Signup from './pages/SignUp/Signup';
import HomePage_Student from './pages/Student/HomePage_Student';
import Course from './pages/Course/Course';
import Tutor from './pages/Tutor/Tutor';
import Student from './pages/Student/Student';
import Job from './pages/Student/Job';
import ProtectedRoute from './components/ProtectedRoute';
import ListTutor from './pages/Student/ListTutor';
import FeePage from './pages/Student/FeePage';
import Job_Guest from './pages/Home/Job_Guest';
import StudentSupport from './pages/Student/Support';
import RequestPaymentFlow from './pages/Student/RequestPaymentFlow';
import HR from './pages/HR/HR';
import Act from './pages/Act/Act';

// import HR from './pages/HR/HR';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* <Route path="/home" element={<Homepage />} /> */}
        <Route path="/guest" element={<Homepage />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/student" element={<HomePage_Student/>} />
        <Route path="/mypage" element={<Student/>} />
        <Route path="/job" element={<Job />} />
        <Route path="/job-guest" element={<Job_Guest />} />
        {/* <Route path="/hr" element={<HR />} /> */}
        <Route path="/listtutor" element={<ListTutor />} />
        <Route path="/hocphi" element={<FeePage />} />
        <Route path="/support" element={<StudentSupport />} />
        <Route path="/request-payment" element={<RequestPaymentFlow />} />
        <Route path="/hr" element={<HR />} />
        <Route path="/act" element={<Act />} />



        
        {/* Public route - guest có thể xem */}
        <Route path="/courses" element={<Course />} />
        
        {/* Protected routes - chỉ student mới vào được */}
        {/* <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <HomePage_Student />
            </ProtectedRoute>
          } 
        /> */}
        
        {/* Protected route - chỉ tutor mới vào được */}
        {/* <Route 
          path="/tutor" 
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <Tutor />
            </ProtectedRoute>
          } 
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
