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
