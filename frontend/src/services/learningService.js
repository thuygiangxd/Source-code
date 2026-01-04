// frontend/src/services/learningService.js
import api from './api';

// =========================
// SESSION RESOURCES
// =========================

/**
 * Lấy danh sách tài nguyên, có thể lọc theo session_id.
 * @param {string} sessionId - ID của buổi học để lọc tài nguyên.
 * @returns {Promise<Array>} - Danh sách các tài nguyên.
 */
export const getResources = async (sessionId) => {
  const params = {};
  if (sessionId) {
    params.session_id = sessionId;
  }
  const response = await api.get('/learning/resources', { params });
  return response.data;
};

/**
 * Lấy chi tiết một tài nguyên theo ID.
 * @param {string} resourceId - ID của tài nguyên.
 * @returns {Promise<Object>} - Chi tiết tài nguyên.
 */
export const getResourceById = async (resourceId) => {
  const response = await api.get(`/learning/resources/${resourceId}`);
  return response.data;
};

/**
 * Tạo một tài nguyên mới.
 * @param {Object} resourceData - Dữ liệu của tài nguyên mới.
 * @param {string} resourceData.session_id
 * @param {string} resourceData.resource_type - 'slide', 'exercise', etc.
 * @param {string} resourceData.title
 * @param {string} resourceData.url
 * @param {string|null} resourceData.description
 * @returns {Promise<Object>} - Tài nguyên vừa được tạo.
 */
export const createResource = async (resourceData) => {
  const response = await api.post('/learning/resources', resourceData);
  return response.data;
};

/**
 * Cập nhật một tài nguyên.
 * @param {string} resourceId - ID của tài nguyên cần cập nhật.
 * @param {Object} resourceData - Dữ liệu cần cập nhật.
 * @returns {Promise<Object>} - Tài nguyên sau khi cập nhật.
 */
export const updateResource = async (resourceId, resourceData) => {
  const response = await api.patch(`/learning/resources/${resourceId}`, resourceData);
  return response.data;
};

/**
 * Xóa một tài nguyên.
 * @param {string} resourceId - ID của tài nguyên cần xóa.
 * @returns {Promise<Object>} - Thông báo xác nhận.
 */
export const deleteResource = async (resourceId) => {
  const response = await api.delete(`/learning/resources/${resourceId}`);
  return response.data;
};