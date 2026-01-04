// import api from "./api";
// import { getMe } from "./userService";

// export async function login({ username, password }) {
//   const { data } = await api.post("/auth/login", { username, password });
//   localStorage.setItem("token", data.access_token);
  
//   // Decode JWT token để lấy role và fetch đầy đủ thông tin user
//   try {
//     const tokenParts = data.access_token.split('.');
//     const payload = JSON.parse(atob(tokenParts[1]));
    
//     // Fetch full user details
//     const userDetails = await getMe();
    
//     const userInfo = {
//       username: payload.username || username,
//       role: payload.role || 'student',
//       name: userDetails.name || '',
//       balance: userDetails.balance || 0
//     };
    
//     localStorage.setItem("user", JSON.stringify(userInfo));
//     console.log('User info from token & API:', userInfo);
//   } catch (e) {
//     console.error('Failed to decode token or fetch user info:', e);
//   }
  
//   return data;
// }

// export async function signup({ username, email, name, password, phone }) {
//   console.log('📡 authService.signup called');
//   console.log('Request payload:', { username, email, name, phone, password: '***' });
  
//   try {
//     const { data } = await api.post("/auth/signup", { 
//       username, 
//       email, 
//       name, 
//       password, 
//       phone 
//     });
    
//     console.log('API response received:', data);
//     return data; // { message, username }
//   } catch (error) {
//     console.error('authService.signup error:', error);
//     console.error('Error response:', error?.response?.data);
//     throw error;
//   }
// }

// export function logout() {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
// }

// export function isAuthenticated() {
//   return !!localStorage.getItem("token");
// }

// export function getUserRole() {
//   const userStr = localStorage.getItem("user");
//   if (!userStr) return null;
//   try {
//     const user = JSON.parse(userStr);
//     return user.role || null;
//   } catch (e) {
//     return null;
//   }
// }

// export function getCurrentUser() {
//   const userStr = localStorage.getItem("user");
//   if (!userStr) return null;
//   try {
//     return JSON.parse(userStr);
//   } catch (e) {
//     return null;
//   }
// }



import api from "./api";
import { getMe } from "./userService";

export async function login({ username, password }) {
  const { data } = await api.post("/auth/login", { username, password });
  localStorage.setItem("token", data.access_token);
  
  // Decode JWT token để lấy role và fetch đầy đủ thông tin user
  try {
    const tokenParts = data.access_token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Fetch full user details
    const userDetails = await getMe();
    
    const userInfo = {
      username: payload.username || username,
      role: payload.role || 'student',
      name: userDetails.name || '',
      balance: userDetails.balance || 0
    };
    
    localStorage.setItem("user", JSON.stringify(userInfo));
    console.log('User info from token & API:', userInfo);
  } catch (e) {
    console.error('Failed to decode token or fetch user info:', e);
  }
  
  return data;
}

export async function signup({ username, email, name, password, phone }) {
  console.log('📡 authService.signup called');
  console.log('Request payload:', { username, email, name, phone, password: '***' });
  
  try {
    const { data } = await api.post("/auth/signup", { 
      username, 
      email, 
      name, 
      password, 
      phone 
    });
    
    console.log('API response received:', data);
    return data; // { message, username }
  } catch (error) {
    console.error('authService.signup error:', error);
    console.error('Error response:', error?.response?.data);
    throw error;
  }
}

export async function changePassword(current_password, new_password) {
  console.log('🔐 changePassword called');

  const token = localStorage.getItem("token"); // dùng cùng key với hàm login
  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  try {
    const { data } = await api.patch(
      "/auth/password",
      {
        current_password,
        new_password,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Change password response:", data);
    return data; // { message: "Password updated successfully" }
  } catch (error) {
    console.error("Change password error:", error);
    throw error;
  }
}


export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export function getUserRole() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.role || null;
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}