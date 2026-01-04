
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 20000,
});

// Gắn JWT từ localStorage vào mọi request
api.interceptors.request.use((config) => {
  console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Request data:', config.data);
  
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Token attached:', token.substring(0, 20) + '...');
  }
  return config;
});

// Log response và errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
