export type UserRole = "admin" | "director" | "general_user";

export function isAdmin(role: UserRole) {
  return role === "admin";
}

export function isDirector(role: UserRole) {
  return role === "director";
}

export function isGeneralUser(role: UserRole) {
  return role === "general_user";
}