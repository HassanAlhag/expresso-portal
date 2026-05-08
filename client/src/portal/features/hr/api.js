import { api } from "../../shared/api/client";

/* Expenses */
export const listExpenses = (params = {}) =>
  api.get("/hr/expenses", { params }).then((res) => res.data);

export const getExpense = (id) =>
  api.get(`/hr/expenses/${id}`).then((res) => res.data);

export const createExpense = (payload) =>
  api.post("/hr/expenses", payload).then((res) => res.data);

export const updateExpense = (id, payload) =>
  api.patch(`/hr/expenses/${id}`, payload).then((res) => res.data);

export const deleteExpense = (id) =>
  api.delete(`/hr/expenses/${id}`).then((res) => res.data);

export const approveExpense = (id) =>
  api.post(`/hr/expenses/${id}/approve`).then((res) => res.data);

export const rejectExpense = (id, reason = "") =>
  api.post(`/hr/expenses/${id}/reject`, { reason }).then((res) => res.data);

export const registerExpense = (id, registeredMonth) =>
  api
    .post(`/hr/expenses/${id}/register`, { registeredMonth })
    .then((res) => res.data);

export const markExpensePaid = (id) =>
  api.post(`/hr/expenses/${id}/mark-paid`).then((res) => res.data);

export const getExpenseStats = () =>
  api.get("/hr/expenses/stats").then((res) => res.data);

export const getMonthlyExpenses = () =>
  api.get("/hr/expenses/monthly").then((res) => res.data);

export const getMonthlyExpenseDetails = (month) =>
  api.get(`/hr/expenses/monthly/${month}`).then((res) => res.data);

/* Staff */
export const listStaff = (params = {}) =>
  api.get("/hr/staff", { params }).then((res) => res.data);

export const getStaffStats = () =>
  api.get("/hr/staff/stats").then((res) => res.data);

export const getStaff = (id) =>
  api.get(`/hr/staff/${id}`).then((res) => res.data);

export const createStaff = (payload) =>
  api.post("/hr/staff", payload).then((res) => res.data);

export const updateStaff = (id, payload) =>
  api.patch(`/hr/staff/${id}`, payload).then((res) => res.data);

export const deleteStaff = (id) =>
  api.delete(`/hr/staff/${id}`).then((res) => res.data);

/* Staff sub-resources */
export const updateStaffSkills = (staffId, skills) =>
  api.put(`/hr/staff/${staffId}/skills`, { skills }).then((res) => res.data);

export const addStaffScorecard = (staffId, payload) =>
  api.post(`/hr/staff/${staffId}/scorecards`, payload).then((res) => res.data);

export const removeStaffScorecard = (staffId, scId) =>
  api.delete(`/hr/staff/${staffId}/scorecards/${scId}`).then((res) => res.data);

export const addStaffLearningGoal = (staffId, payload) =>
  api.post(`/hr/staff/${staffId}/learning-goals`, payload).then((res) => res.data);

export const updateStaffLearningGoal = (staffId, goalId, payload) =>
  api
    .patch(`/hr/staff/${staffId}/learning-goals/${goalId}`, payload)
    .then((res) => res.data);

export const removeStaffLearningGoal = (staffId, goalId) =>
  api
    .delete(`/hr/staff/${staffId}/learning-goals/${goalId}`)
    .then((res) => res.data);

/* Leaves */
export const listLeaves = (params = {}) =>
  api.get("/hr/leaves", { params }).then((res) => res.data);

export const getLeaveStats = () =>
  api.get("/hr/leaves/stats").then((res) => res.data);

export const createLeave = (payload) =>
  api.post("/hr/leaves", payload).then((res) => res.data);

export const updateLeave = (id, payload) =>
  api.patch(`/hr/leaves/${id}`, payload).then((res) => res.data);

export const deleteLeave = (id) =>
  api.delete(`/hr/leaves/${id}`).then((res) => res.data);

export const approveLeave = (id) =>
  api.post(`/hr/leaves/${id}/approve`).then((res) => res.data);

export const rejectLeave = (id, reason = "") =>
  api.post(`/hr/leaves/${id}/reject`, { reason }).then((res) => res.data);

export const cancelLeave = (id) =>
  api.post(`/hr/leaves/${id}/cancel`).then((res) => res.data);

export const getStaffBenchmark = (staffId) =>
  api.get(`/hr/staff/${staffId}/benchmark`).then((res) => res.data);

/* Scorecard Templates */
export const listScorecardTemplates = () =>
  api.get("/hr/scorecard-templates").then((res) => res.data);

export const createScorecardTemplate = (payload) =>
  api.post("/hr/scorecard-templates", payload).then((res) => res.data);

export const updateScorecardTemplate = (id, payload) =>
  api.patch(`/hr/scorecard-templates/${id}`, payload).then((res) => res.data);

export const deleteScorecardTemplate = (id) =>
  api.delete(`/hr/scorecard-templates/${id}`).then((res) => res.data);
