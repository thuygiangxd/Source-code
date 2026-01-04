import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Kiểm tra đã login chưa
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = getUserRole();
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect về trang tương ứng với role
      if (userRole === 'student') {
        return <Navigate to="/student" replace />;
      } else if (userRole === 'tutor') {
        return <Navigate to="/tutor" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
