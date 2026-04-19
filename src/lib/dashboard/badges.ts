export type UserBadge = {
  id: string;
  label: string;
  description: string;
  isPublic?: boolean;
};

export const BADGE_LIBRARY: UserBadge[] = [
  {
    id: "ten_tasks_one_day",
    label: "10 Tasks in a Day",
    description: "Completed 10 tasks in a single day.",
    isPublic: true,
  },
  {
    id: "top_raiser",
    label: "Top Raiser",
    description: "Top fundraising performer.",
    isPublic: true,
  },
    {
    id: "outreach_streak",
    label: "Outreach Streak",
    description: "Maintained a strong outreach streak.",
    isPublic: true,
  },
  {
    id: "focus_mode_finisher",
    label: "Focus Mode Finisher",
    description: "Cleared a focus queue with consistency.",
    isPublic: false,
  },
];
export const DEFAULT_USER_BADGES: UserBadge[] = [
  BADGE_LIBRARY[0],
  BADGE_LIBRARY[2],
];
export function getBadgeById(id?: string | null) {
  if (!id) return null;
  return BADGE_LIBRARY.find((badge) => badge.id === id) || null;
}