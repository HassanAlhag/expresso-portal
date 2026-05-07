import { me as authMe } from "../../shared/api/auth.api";
import { api } from "../../shared/api/client";

export function getMe() {
  return authMe();
}

export async function updateMe(payload) {
  const { data } = await api.patch("/users/me", payload);
  return data;
}
