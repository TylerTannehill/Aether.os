export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskType =
  | "follow_up"
  | "call"
  | "text"
  | "list_review"
  | "data_cleanup"
  | "other";

export type Contact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  party?: string | null;
  owner_name?: string | null;
};

export type CampaignList = {
  id: string;
  name: string;
  created_at?: string | null;
  default_owner_name?: string | null;
};

export type ListContactRow = {
  contact_id: string;
  contacts?: Contact | null;
};

export type OutreachLog = {
  id: string;
  contact_id: string;
  list_id?: string | null;
  channel: "call" | "text";
  result: string;
  notes?: string | null;
  created_at?: string | null;
  contacts?: Contact | null;
  lists?: CampaignList | null;
};
export type ContactIntelligence = {
  lastLog: OutreachLog | null;
  statusLabel: string;
  statusClasses: string;
  nextAction: string;
  nextActionClasses: string;
  priority: number;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  task_type: TaskType;
  due_date?: string | null;
  completed_at?: string | null;
  contact_id?: string | null;
  list_id?: string | null;
  owner_name?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
export type TopListMetric = {
  id: string;
  name: string;
  activity: number;
  engaged: number;
  attempted: number;
  default_owner_name?: string | null;
};

export type OwnerSegment = {
  owner: string;
  contactCount: number;
  withPhone: number;
  engaged: number;
  attempted: number;
  unreached: number;
};

export type DashboardMetrics = {
  totalContacts: number;
  totalLists: number;
  totalLogs: number;
  callLogs: number;
  textLogs: number;
  engagedCount: number;
  attemptedCount: number;
  doNotContactCount: number;
  unreachedCount: number;
  assignedContactCount: number;
  unassignedContactCount: number;
  topLists: TopListMetric[];
  recentActivity: OutreachLog[];
  ownerSegments: OwnerSegment[];
};
export type DashboardData = {
  contacts: Contact[];
  lists: CampaignList[];
  logs: OutreachLog[];
  tasks: Task[];
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  owner_name?: string | null;
  priority: Priority;
  task_type: TaskType;
  due_date?: string | null;
};

export type TaskCounts = {
  open: number;
  in_progress: number;
  done: number;
  urgent: number;
};

export type ContactCounts = {
  total: number;
  filtered: number;
  withPhone: number;
  withEmail: number;
};
export type AutoTaskOutcome = {
  created: boolean;
  skipped: boolean;
  error?: string;
};

export type ListCounts = {
  total: number;
  filtered: number;
  ready: number;
};

export type CreateListInput = {
  name: string;
};

export type ListDetailData = {
  list: CampaignList | null;
  assignedContacts: Contact[];
  allContacts: Contact[];
};
export type FocusItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  priority: Priority;
  type: "task" | "callback" | "follow_up";
};

export type TodaySnapshot = {
  urgentTasks: Task[];
  dueTodayTasks: Task[];
  overdueTasks: Task[];
  callbackQueue: OutreachLog[];
  followUpQueue: OutreachLog[];
  focusItems: FocusItem[];
};

export type OwnerQueue = {
  owner: string;
  total: number;
  open: number;
  in_progress: number;
  urgent: number;
  due_today: number;
  overdue: number;
  tasks: Task[];
};
export type OwnerDashboardSignal = {
  busiestOwner: OwnerQueue | null;
  unassignedQueue: OwnerQueue | null;
  overdueOwnerQueues: OwnerQueue[];
  dueTodayOwnerQueues: OwnerQueue[];
};

export type UpdateTaskOwnerInput = {
  taskId: string;
  owner_name?: string | null;
};

export type UpdateListDefaultOwnerInput = {
  listId: string;
  default_owner_name?: string | null;
};
// ===============================
// DASHBOARD TILE SYSTEM
// ===============================

export type TileType =
  | "metric"
  | "actions"
  | "tasks"
  | "chart"
  | "custom";

export type DashboardTile = {
  id: string;
  title: string;
  type: TileType;
  metricKey?: string;
  size: "sm" | "md" | "lg";
  roleVisibility: ("admin" | "director" | "user")[];
  order: number;
};
export type ContributionRecord = {
  id: string;
  contact_id: string;
  amount: number;
  method: "online" | "check" | "cash";
  date: string;
  compliant: boolean;
  employer?: string | null;
  occupation?: string | null;
  notes?: string | null;
};

export type PledgeRecord = {
  id: string;
  contact_id: string;
  amount: number;
  status: "pledged" | "follow_up" | "converted";
  created_at: string;
  converted_at?: string | null;
  notes?: string | null;
};
