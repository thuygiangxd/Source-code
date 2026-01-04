// // src/services/scheduleCacheService.js
// import { getTeachingSchedules } from "./academicService";

// const CACHE_KEY = "teachingSchedules";
// const CACHE_EXPIRE_MINUTES = 10;

// export async function fetchTeachingSchedulesWithCache(courseId = null) {
//   try {
//     // 🔍 Kiểm tra cache trong localStorage
//     const cacheStr = localStorage.getItem(CACHE_KEY);
//     if (cacheStr) {
//       const cache = JSON.parse(cacheStr);
//       const now = Date.now();

//       // Nếu cache chưa hết hạn
//       if (now - cache.timestamp < CACHE_EXPIRE_MINUTES * 60 * 1000) {
//         console.log("⚡ Dùng cache teaching schedules");
//         return cache.data;
//       }
//     }

//     // 🌐 Nếu chưa có cache hoặc hết hạn → gọi API
//     console.log("🌐 Gọi API teaching schedules");
//     const data = await getTeachingSchedules(courseId);

//     // 💾 Lưu cache mới
//     localStorage.setItem(
//       CACHE_KEY,
//       JSON.stringify({ data, timestamp: Date.now() })
//     );

//     return data;
//   } catch (error) {
//     console.error("❌ Lỗi khi fetch schedules:", error);
//     throw error;
//   }
// }
// src/services/scheduleCacheService.js
import { getTeachingSchedules } from "./academicService";

const CACHE_KEY_PREFIX = "teachingSchedules_";
const CACHE_EXPIRE_MINUTES = 10;

export async function fetchTeachingSchedulesWithCache(courseId = null) {
  if (!courseId) throw new Error("⚠️ Missing courseId khi fetch schedules!");

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${courseId}`;
    const cacheStr = localStorage.getItem(cacheKey);

    if (cacheStr) {
      const cache = JSON.parse(cacheStr);
      const now = Date.now();

      if (now - cache.timestamp < CACHE_EXPIRE_MINUTES * 60 * 1000) {
        console.log(`⚡ Dùng cache teaching schedules của course ${courseId}`);
        return cache.data;
      }
    }

    // 🌐 Nếu chưa có cache hoặc hết hạn → gọi API thật
    console.log(`🌐 Gọi API teaching schedules cho course ${courseId}`);
    const data = await getTeachingSchedules(courseId);

    // 💾 Lưu cache mới riêng từng course
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() })
    );

    return data;
  } catch (error) {
    console.error("❌ Lỗi khi fetch schedules:", error);
    throw error;
  }
}
