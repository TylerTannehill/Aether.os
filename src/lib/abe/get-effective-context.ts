type Role = "admin" | "director" | "general_user";

export function getEffectiveContext({
  realRole,
  realDepartment,
  demoRole,
  demoDepartment,
}: {
  realRole?: string | null;
  realDepartment?: string | null;
  demoRole?: Role;
  demoDepartment?: string;
}) {
  const isAdmin = realRole === "admin";

  if (isAdmin && demoRole && demoDepartment) {
    return {
      role: demoRole,
      department: demoDepartment,
      isPreview: true,
    };
  }

  return {
    role: (realRole as Role) || "general_user",
    department: realDepartment || "outreach",
    isPreview: false,
  };
}