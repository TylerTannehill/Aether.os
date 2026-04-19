import { AlertTile } from "@/components/dashboard/tiles/alert-tile";
import { KpiTile } from "@/components/dashboard/tiles/kpi-tile";
import { ProfileCardTile } from "@/components/dashboard/tiles/profile-card-tile";
import { DEFAULT_USER_BADGES } from "@/lib/dashboard/badges";
import { TileDefinition } from "@/lib/dashboard/tiles";

type TileRendererData = {
  totalContacts?: number;
  urgentTasks?: number;
  overdueTasks?: number;
  unassignedContacts?: number;
  openTasks?: number;
  fixNowCount?: number;
  doNextCount?: number;
  recentActivityCount?: number;
  teamSummaryCount?: number;
  recommendationText?: string;
};

type TileRendererProps = {
  tile: TileDefinition;
  data?: TileRendererData;
};

function getKpiTone(tileId: string): "default" | "success" | "danger" | "warning" {
  if (tileId === "urgent_tasks") {
    return "warning";
  }

  return "default";
}

function getAlertTone(tileId: string): "warning" | "danger" | "neutral" {
  if (tileId === "unassigned_contacts" || tileId === "overdue_tasks") {
    return "danger";
  }

  return "warning";
}
function getKpiValue(tile: TileDefinition, data?: TileRendererData) {
  switch (tile.id) {
    case "total_contacts":
      return data?.totalContacts ?? "--";
    case "urgent_tasks":
      return data?.urgentTasks ?? "--";
    default:
      return "--";
  }
}

function getKpiHelperText(tile: TileDefinition) {
  switch (tile.id) {
    case "total_contacts":
      return "Contacts in current view";
    case "urgent_tasks":
      return "Highest priority items";
    default:
      return "KPI tile";
  }
}

function renderKpiTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <KpiTile
      label={tile.title}
      value={getKpiValue(tile, data)}
      helperText={getKpiHelperText(tile)}
      tone={getKpiTone(tile.id)}
    />
  );
}

function getAlertValue(tile: TileDefinition, data?: TileRendererData) {
  switch (tile.id) {
    case "unassigned_contacts":
      return data?.unassignedContacts ?? "--";
    case "overdue_tasks":
      return data?.overdueTasks ?? "--";
    default:
      return "--";
  }
}
function getAlertHelperText(tile: TileDefinition) {
  switch (tile.id) {
    case "unassigned_contacts":
      return "Contacts still needing routing";
    case "overdue_tasks":
      return "Tasks past due and needing attention";
    default:
      return "Alert tile";
  }
}

function renderAlertTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <AlertTile
      label={tile.title}
      value={getAlertValue(tile, data)}
      helperText={getAlertHelperText(tile)}
      tone={getAlertTone(tile.id)}
    />
  );
}

function getQueueValue(tile: TileDefinition, data?: TileRendererData) {
  switch (tile.id) {
    case "fix_now":
      return data?.fixNowCount ?? 0;
    case "do_next":
      return data?.doNextCount ?? 0;
    default:
      return 0;
  }
}

function getQueueHelperText(tile: TileDefinition) {
  switch (tile.id) {
    case "fix_now":
      return "Overdue and urgent work";
    case "do_next":
      return "Open work ready to move";
    default:
      return "Queue tile";
  }
}

function renderQueueTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <KpiTile
      label={tile.title}
      value={getQueueValue(tile, data)}
      helperText={getQueueHelperText(tile)}
      tone={tile.id === "fix_now" ? "danger" : "default"}
    />
  );
}
function renderActivityTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <KpiTile
      label={tile.title}
      value={data?.recentActivityCount ?? 0}
      helperText="Recent logged activity in current view"
      tone="default"
    />
  );
}

function renderTeamTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <KpiTile
      label={tile.title}
      value={data?.teamSummaryCount ?? 0}
      helperText="Visible owner lanes in current view"
      tone="default"
    />
  );
}

function renderRecommendationTile(tile: TileDefinition, data?: TileRendererData) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{tile.title}</p>
        <p className="mt-1 text-sm text-slate-500">Suggested next move</p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          {data?.recommendationText ?? "Queues look healthy."}
        </p>
      </div>
    </div>
  );
}

function renderProfileTile() {
  return (
    <ProfileCardTile
      badges={DEFAULT_USER_BADGES}
      activeBadgeId="ten_tasks_one_day"
    />
  );
}
export function TileRenderer({ tile, data }: TileRendererProps) {
  switch (tile.type) {
    case "kpi":
      return renderKpiTile(tile, data);
    case "alert":
      return renderAlertTile(tile, data);
    case "queue":
      return renderQueueTile(tile, data);
    case "activity":
      return renderActivityTile(tile, data);
    case "team":
      return renderTeamTile(tile, data);
    case "recommendation":
      return renderRecommendationTile(tile, data);
    case "profile":
      return renderProfileTile();
    default:
      return null;
  }
}