import { UserRole } from "./roles";

export type Department =
  | "overview"
  | "contacts"
  | "tasks"
  | "outreach"
  | "field"
  | "digital"
  | "print"
  | "finance";

export type UserPermissions = {
  role: UserRole;
  departments: Department[];
};

export function canAccess(
  permissions: UserPermissions,
  department: Department
) {
  if (permissions.role === "admin") return true;
  return permissions.departments.includes(department);
}