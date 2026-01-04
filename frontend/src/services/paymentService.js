// src/services/paymentService.js
import api from "./api";

// 1️⃣ Tạo payment intent
export async function createPaymentIntent(registration_id) {
  const token = localStorage.getItem("access_token");
  const { data } = await api.post(
    "/payment/intents",
    { registration_id },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

// 2️⃣ Gửi OTP tới email
export async function requestOtp(intent_id) {
  const { data } = await api.post("/payment/intents/request-otp", {
    intent_id,
  });
  return data;
}

// 3️⃣ Xác nhận thanh toán bằng OTP
export async function confirmPayment(intent_id, otp_code) {
  const token = localStorage.getItem("access_token");
  const { data } = await api.post(
    "/payment/intents/confirm",
    { intent_id, otp_code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}
// 4️⃣ Đánh dấu OTP thất bại (failed)
export async function failPaymentOtp(intent_id) {
  const token = localStorage.getItem("access_token");
  const { data } = await api.post(
    "/payment/intents/fail",
    { intent_id },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}
