// src/services/userService.js
import api from "./api";

export async function getMe() {
  const { data } = await api.get("/user/me");
  return data; // { username, email, name, balance, ... }
}

// Thêm để tìm thanh toán hộ
export async function findUserByUsername(username) {
  const { data } = await api.get(`/user/by-username/${username}`);
  return data;
}

// Lấy thông tin user theo ID
export async function getUserById(userId) {
  const { data } = await api.get(`/user/by-id/${userId}`);
  return data;
}

export async function deposit(userId, amount) {
  const res = await api.post(`/user/${userId}/deposit`, { amount });
  return res.data;
}




export async function updateUser(userId, payload) {
  const res = await api.patch(`/user/${userId}/update`, payload);
  return res.data;
}
