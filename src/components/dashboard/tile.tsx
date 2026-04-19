import { TileDefinition } from "@/lib/dashboard/tiles";

type TileProps = {
  tile: TileDefinition;
  data: Record<string, any>;
};

const sizeClasses = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-2 xl:col-span-3",
};

export function DashboardTileCard({ tile, data }: TileProps) {
  const wrapper =
    "rounded-2xl border border-white/10 bg-neutral-950/80 p-4 shadow-sm";

  if (tile.type === "kpi" || tile.type === "alert") {
    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "sm"]}`}>
        <div className="text-sm text-neutral-400">{tile.title}</div>
        <div className="mt-2 text-3xl font-semibold text-white">
          {tile.metricKey ? data?.[tile.metricKey] ?? 0 : 0}
        </div>
      </div>
    );
  }
    if (tile.type === "tasks") {
    const tasks = data?.tasks ?? [];

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "md"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        <div className="space-y-2">
          {tasks.length ? (
            tasks.slice(0, 5).map((task: any) => (
              <div
                key={task.id}
                className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-neutral-400">
                  {task.priority} • {task.status}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">No tasks yet.</div>
          )}
        </div>
      </div>
    );
  }

  if (tile.type === "actions" || tile.type === "recommendation") {
    const actions = data?.actions ?? [];

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "lg"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        <div className="space-y-2">
          {actions.length ? (
            actions.slice(0, 5).map((action: any) => (
              <div
                key={action.id}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              >
                {action.title}
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">
              No suggested actions yet.
            </div>
          )}
        </div>
      </div>
    );
  }
    if (tile.type === "queue") {
    const queueItems = data?.queueItems ?? [];

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "md"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        <div className="space-y-2">
          {queueItems.length ? (
            queueItems.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-500/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
              >
                <div className="font-medium">{item.title}</div>
                {item.subtitle ? (
                  <div className="text-xs text-amber-100/70">{item.subtitle}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">No queue items yet.</div>
          )}
        </div>
      </div>
    );
  }
    if (tile.type === "activity") {
    const recentActivity = data?.recentActivity ?? [];

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "lg"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        <div className="space-y-2">
          {recentActivity.length ? (
            recentActivity.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <div className="font-medium">
                  {item.contacts?.first_name || "Unknown"}{" "}
                  {item.contacts?.last_name || ""}
                </div>
                <div className="text-xs text-neutral-400">
                  {item.channel} • {item.result}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">
              No recent activity yet.
            </div>
          )}
        </div>
      </div>
    );
  }
    if (tile.type === "team") {
    const teamSummary = data?.teamSummary ?? [];

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "lg"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        <div className="space-y-2">
          {teamSummary.length ? (
            teamSummary.slice(0, 5).map((member: any) => (
              <div
                key={member.owner}
                className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <div className="font-medium">{member.owner}</div>
                <div className="text-xs text-neutral-400">
                  {member.open} open • {member.urgent} urgent • {member.overdue} overdue
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">No team summary yet.</div>
          )}
        </div>
      </div>
    );
  }

  if (tile.type === "profile") {
    const profile = data?.profile ?? null;

    return (
      <div className={`${wrapper} ${sizeClasses[tile.size ?? "md"]}`}>
        <div className="mb-3 text-sm text-neutral-400">{tile.title}</div>
        {profile ? (
          <div className="space-y-2 text-sm text-white">
            <div className="text-lg font-semibold">{profile.name}</div>
            <div className="text-neutral-400">{profile.role}</div>
            <div className="text-neutral-400">{profile.email}</div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500">No profile loaded yet.</div>
        )}
      </div>
    );
  }
    return (
    <div className={`${wrapper} ${sizeClasses[tile.size ?? "sm"]}`}>
      <div className="text-sm text-neutral-400">{tile.title}</div>
    </div>
  );
}