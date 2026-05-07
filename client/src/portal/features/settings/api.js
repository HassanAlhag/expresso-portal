import { api } from "../../shared/api/client";

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.patch("/auth/change-password", { currentPassword, newPassword });
  return data;
}

export async function updateNotifications(preferences) {
  const { data } = await api.patch("/users/me/notifications", { preferences });
  return data;
}
