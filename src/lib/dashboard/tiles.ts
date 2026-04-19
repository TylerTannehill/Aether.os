import { UserRole } from "../auth/roles";
import { Department } from "../auth/permissions";

export type TileType =
  | "kpi"
  | "alert"
  | "queue"
  | "activity"
  | "team"
  | "recommendation"
  | "profile"
  | "tasks"
  | "actions"
  | "custom";

export type TileSize = "sm" | "md" | "lg";

export type TileDefinition = {
  id: string;
  title: string;
  type: TileType;
  allowedRoles: UserRole[];
  departments?: Department[];
  size?: TileSize;
  order?: number;
  metricKey?: string;
};
export const TILE_REGISTRY: TileDefinition[] = [
  {
    id: "total_contacts",
    title: "Total Contacts",
    type: "kpi",
    allowedRoles: ["admin", "director"],
    departments: ["overview", "contacts"],
    size: "sm",
    order: 1,
    metricKey: "totalContacts",
  },
  {
    id: "urgent_tasks",
    title: "Urgent Tasks",
    type: "kpi",
    allowedRoles: ["admin", "director", "general_user"],
    departments: [
      "overview",
      "tasks",
      "outreach",
      "field",
      "digital",
      "print",
      "finance",
    ],
    size: "sm",
    order: 2,
    metricKey: "urgentTaskCount",
  },
  {
    id: "unassigned_contacts",
    title: "Unassigned Contacts",
    type: "alert",
    allowedRoles: ["admin", "director"],
    departments: ["overview", "contacts", "outreach"],
    size: "sm",
    order: 3,
    metricKey: "unassignedContactCount",
  },
  {
    id: "overdue_tasks",
    title: "Overdue Tasks",
    type: "alert",
    allowedRoles: ["admin", "director"],
    departments: [
      "overview",
      "tasks",
      "outreach",
      "field",
      "digital",
      "print",
      "finance",
    ],
    size: "sm",
    order: 4,
    metricKey: "overdueTaskCount",
  },
    {
    id: "fix_now",
    title: "Fix Now",
    type: "queue",
    allowedRoles: ["admin", "director", "general_user"],
    departments: [
      "overview",
      "tasks",
      "outreach",
      "field",
      "digital",
      "print",
      "finance",
    ],
    size: "md",
    order: 5,
  },
  {
    id: "do_next",
    title: "Do Next",
    type: "queue",
    allowedRoles: ["admin", "director", "general_user"],
    departments: [
      "overview",
      "tasks",
      "outreach",
      "field",
      "digital",
      "print",
      "finance",
    ],
    size: "md",
    order: 6,
  },
  {
    id: "recent_activity",
    title: "Recent Activity",
    type: "activity",
    allowedRoles: ["admin", "director", "general_user"],
    departments: ["overview", "outreach", "field", "digital", "print", "finance"],
    size: "lg",
    order: 7,
  },
  {
    id: "team_summary",
    title: "Team Summary",
    type: "team",
    allowedRoles: ["admin", "director"],
    departments: ["overview", "field", "digital", "outreach", "print", "finance"],
    size: "lg",
    order: 8,
  },
    {
    id: "recommendation",
    title: "Recommendation",
    type: "recommendation",
    allowedRoles: ["admin", "director", "general_user"],
    departments: [
      "overview",
      "tasks",
      "outreach",
      "field",
      "digital",
      "print",
      "finance",
    ],
    size: "lg",
    order: 9,
  },
  {
    id: "profile_card",
    title: "My Profile",
    type: "profile",
    allowedRoles: ["admin", "director", "general_user"],
    departments: ["overview"],
    size: "md",
    order: 10,
  },
  {
    id: "open_tasks",
    title: "Open Tasks",
    type: "tasks",
    allowedRoles: ["admin", "director", "general_user"],
    departments: ["overview", "tasks"],
    size: "md",
    order: 11,
    metricKey: "openTaskCount",
  },
  {
    id: "suggested_actions",
    title: "Suggested Actions",
    type: "actions",
    allowedRoles: ["admin", "director"],
    departments: ["overview", "tasks", "outreach", "field", "digital", "print", "finance"],
    size: "lg",
    order: 12,
  },
];
export function getTilesForRoleAndDepartment(
  role: UserRole,
  department: Department = "overview"
) {
  return TILE_REGISTRY.filter((tile) => {
    const roleMatch = tile.allowedRoles.includes(role);
    const departmentMatch =
      !tile.departments || tile.departments.includes(department);

    return roleMatch && departmentMatch;
  }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}