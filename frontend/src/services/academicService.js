import api from './api';

// ========== STUDENT REGISTRATIONS ==========
export const getMyRegistrations = async () => {
  const response = await api.get('/academic/my-registrations');
  return response.data;
};

export const createMyRegistration = async (registrationData) => {
  const response = await api.post('/academic/registrations', registrationData);
  return response.data;
};

export const cancelMyRegistration = async (regId) => {
  const response = await api.patch(`/academic/registrations/${regId}/cancel`);
  return response.data;
};

// Lấy danh sách registrations với các filter (dùng cho admin/staff/tutor)
export const getRegistrations = async (filters = {}) => {
  const response = await api.get('/academic/registrations', {
    params: filters // status, student_id
  });
  return response.data;
};

export const getRegistrationById = async (regId) => {
  const response = await api.get(`/academic/registrations/${regId}`);
  return response.data;
};

// ========== TUTOR CLAIMS & ASSIGNMENTS ==========
export const claimAssignments = async (regId) => {
  const response = await api.post(`/academic/my-assignments/${regId}/claim`);
  return response.data;
};

export const getMyAssignments = async () => {
  const response = await api.get('/academic/my-assignments');
  return response.data;
};

export const releaseMyAssignment = async (assignId) => {
  const response = await api.patch(`/academic/my-assignments/${assignId}/release`);
  return response.data;
};

// ========== CLASSES ==========
export const getClasses = async (filters = {}) => {
  const response = await api.get('/academic/classes', {
    params: filters
  });
  return response.data;
};

export const getClassById = async (classId) => {
  const response = await api.get(`/academic/classes/${classId}`);
  return response.data;
};

// ========== CLASS SESSIONS ==========
export const getClassSessions = async (filters = {}) => {
  const response = await api.get('/academic/class-sessions', {
    params: filters
  });
  return response.data;
};

export const getSessionById = async (sessionId) => {
  const response = await api.get(`/academic/class-sessions/${sessionId}`);
  return response.data;
};

export const completeSession = async (sessionId) => {
  const response = await api.patch(`/academic/class-sessions/${sessionId}/complete`);
  return response.data;
};

export const processSession = async (sessionId) => {
  const response = await api.patch(`/academic/class-sessions/${sessionId}/processing`);
  return response.data;
};

// ========== ADMIN/STAFF - REGISTRATIONS ==========
export const getAllRegistrations = async (filters = {}) => {
  const response = await api.get('/academic/registrations', {
    params: filters
  });
  return response.data;
};

export const updateRegistration = async (regId, data) => {
  const response = await api.patch(`/academic/registrations/${regId}`, data);
  return response.data;
};

export const deleteRegistration = async (regId) => {
  const response = await api.delete(`/academic/registrations/${regId}`);
  return response.data;
};

// ========== ADMIN/STAFF - ASSIGNMENTS ==========
export const staffAssignTutor = async (regId, tutorUserId) => {
  const response = await api.post(
    `/academic/assignments/${regId}/assign-tutor`,
    null,
    { params: { tutor_user_id: tutorUserId } }
  );
  return response.data;
};

export const getAllAssignments = async (filters = {}) => {
  const response = await api.get('/academic/assignments', {
    params: filters
  });
  return response.data;
};

export const getAssignmentById = async (assignId) => {
  const response = await api.get(`/academic/assignments/${assignId}`);
  return response.data;
};

export const updateAssignment = async (assignId, data) => {
  const response = await api.patch(`/academic/assignments/${assignId}`, data);
  return response.data;
};

export const releaseAssignment = async (assignId) => {
  const response = await api.patch(`/academic/assignments/${assignId}/release`);
  return response.data;
};

// ========== PAYROLL ==========
export const getPaidStatusesForMonth = async (month) => {
  const response = await api.get(`/academic/payrolls/paid-status/${month}`);
  return response.data; // returns List[str] of tutor_ids
};

export const markAsPaid = async (tutorId, month) => {
  const response = await api.post('/academic/payrolls/mark-as-paid', { tutor_id: tutorId, month: month });
  return response.data;
};



// ========== TUTORS ==========
export const createTutorProfile = async (formData) => {
  return await api.post("/academic/tutor-profiles", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const getTutorProfiles = async (filters = {}) => {
  const response = await api.get('/academic/tutor-profiles', {
    params: filters
  });
  return response.data;
};

export const updateTutorProfile = async (profileId, data) => {
  return api.patch(`/academic/tutor-profiles/${profileId}`, data);
};




                                                                                     