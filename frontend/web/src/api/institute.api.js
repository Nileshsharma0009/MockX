import api from "./api";

/* ==========================================================================
   SUPER ADMIN APIs
   ========================================================================== */
export const createInstituteApi = (data) => api.post("/institutes", data);
export const getAllInstitutesApi = () => api.get("/institutes");
export const updateInstituteApi = (id, data) => api.put(`/institutes/${id}`, data);

/* ==========================================================================
   INSTITUTE ADMIN APIs (Strictly Isolated by instituteId on backend)
   ========================================================================== */
// Dashboard
export const getInstituteDashboardStatsApi = () => api.get("/institutes/my/dashboard");

// Batches
export const getBatchesApi = () => api.get("/institutes/my/batches");
export const createBatchApi = (data) => api.post("/institutes/my/batches", data);
export const deleteBatchApi = (batchId) => api.delete(`/institutes/my/batches/${batchId}`);

// Students
export const getStudentsApi = (params) => api.get("/institutes/my/students", { params });
export const createStudentApi = (data) => api.post("/institutes/my/students", data);
export const bulkCreateStudentsApi = (students) => api.post("/institutes/my/students/bulk", { students });
export const updateStudentApi = (studentId, data) => api.put(`/institutes/my/students/${studentId}`, data);
export const toggleStudentStatusApi = (studentId) => api.put(`/institutes/my/students/${studentId}/status`);
export const deleteStudentApi = (studentId) => api.delete(`/institutes/my/students/${studentId}`);
export const getStudentPerformanceApi = (studentId) => api.get(`/institutes/my/students/${studentId}/performance`);

// Question Bank
export const getQuestionBankApi = (params) => api.get("/institutes/my/questions", { params });
export const createQuestionApi = (data) => api.post("/institutes/my/questions", data);
export const deleteQuestionApi = (id) => api.delete(`/institutes/my/questions/${id}`);

// Custom Mocks
export const createCustomMockApi = (data) => api.post("/institutes/my/mocks", data);
export const getInstituteMocksApi = () => api.get("/institutes/my/mocks");
export const getInstituteMockByIdApi = (mockId) => api.get(`/institutes/my/mocks/${mockId}`);
export const deleteCustomMockApi = (mockId) => api.delete(`/institutes/my/mocks/${mockId}`);

// Test Assignments
export const createAssignmentApi = (data) => api.post("/institutes/my/assignments", data);
export const getAssignmentsApi = () => api.get("/institutes/my/assignments");
export const deleteAssignmentApi = (id) => api.delete(`/institutes/my/assignments/${id}`);

// Multi-Dimensional Analytics
export const getStudentWiseAnalyticsApi = (params) => api.get("/institutes/my/analytics/students", { params });
export const getTestWiseAnalyticsApi = () => api.get("/institutes/my/analytics/tests");
export const getQuestionWiseAnalyticsApi = (mockId) => api.get(`/institutes/my/analytics/tests/${mockId}/questions`);

/* ==========================================================================
   STUDENT INSTITUTE APIs
   ========================================================================== */
export const getMyAssignedTestsApi = () => api.get("/institute-student/my-tests");
export const getMyInstituteResultsApi = () => api.get("/institute-student/my-results");
export const getMyInstituteStatsApi = () => api.get("/institute-student/my-stats");
