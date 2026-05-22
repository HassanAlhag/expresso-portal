import { api } from "../../shared/api/client";

export const listMessages = (params = {}) =>
  api.get("/messaging", { params }).then((r) => r.data);

export const sendMessage = (payload) =>
  api.post("/messaging", payload).then((r) => r.data);

export const markMessagesRead = (customerId) =>
  api.patch(`/messaging/read/${customerId}`).then((r) => r.data);

export const getUnreadCount = (customerId) =>
  api.get(`/messaging/unread/${customerId}`).then((r) => r.data);

export const getNotificationCounts = () =>
  api.get("/messaging/notifications/counts").then((r) => r.data);
