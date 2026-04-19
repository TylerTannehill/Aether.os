export type DashboardLayout = {
  tiles: string[];
};

export const ADMIN_LAYOUT: DashboardLayout = {
  tiles: [
    "total_contacts",
    "urgent_tasks",
    "unassigned_contacts",
    "overdue_tasks",
    "team_summary",
    "fix_now",
    "do_next",
    "recent_activity",
    "recommendation",
  ],
};
export const DIRECTOR_LAYOUT: DashboardLayout = {
  tiles: [
    "urgent_tasks",
    "overdue_tasks",
    "team_summary",
    "fix_now",
    "do_next",
    "recent_activity",
    "recommendation",
  ],
};
export const USER_LAYOUT: DashboardLayout = {
  tiles: [
    "profile_card",
    "urgent_tasks",
    "fix_now",
    "do_next",
    "recent_activity",
    "recommendation",
  ],
};