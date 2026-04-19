"use client";

import { AutoModePolicy } from "@/lib/brain";

type AutoModePolicyPanelProps = {
  policy: AutoModePolicy;
  onChange: (next: AutoModePolicy) => void;
};

const DEPARTMENT_OPTIONS = [
  "overview",
  "outreach",
  "field",
  "digital",
  "finance",
  "print",
];

const ACTION_TYPE_OPTIONS = [
  "reduce_owner_pressure",
  "rebalance_queue",
  "fix_contact_data",
  "follow_up_contact",
  "route_contact",
  "close_task",
  "send_reminder",
];

const TASK_TYPE_OPTIONS = [
  "fallback",
  "call",
  "follow_up",
  "routing",
  "owner",
  "pipeline",
];

function toggleArrayValue(values: string[], value: string): string[] {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AutoModePolicyPanel({
  policy,
  onChange,
}: AutoModePolicyPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <div className="text-sm font-medium text-slate-500">
          Auto Mode Policy
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Configure when Auto Mode is allowed to run and what it must never run.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">
            Allowed Hours
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500">
              Start
              <input
                type="number"
                min={0}
                max={23}
                value={policy.allowedHoursStart}
                onChange={(event) =>
                  onChange({
                    ...policy,
                    allowedHoursStart: Math.max(
                      0,
                      Math.min(23, Number(event.target.value) || 0)
                    ),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
              />
            </label>

            <label className="text-xs text-slate-500">
              End
              <input
                type="number"
                min={0}
                max={23}
                value={policy.allowedHoursEnd}
                onChange={(event) =>
                  onChange({
                    ...policy,
                    allowedHoursEnd: Math.max(
                      0,
                      Math.min(23, Number(event.target.value) || 0)
                    ),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={policy.allowWeekends}
              onChange={(event) =>
                onChange({
                  ...policy,
                  allowWeekends: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Allow weekends
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
          <div className="text-sm font-medium text-slate-700">
            Allowed Departments
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEPARTMENT_OPTIONS.map((department) => {
              const active = policy.allowedDepartments.includes(department);

              return (
                <button
                  key={department}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...policy,
                      allowedDepartments: toggleArrayValue(
                        policy.allowedDepartments,
                        department
                      ),
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatLabel(department)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 text-sm font-medium text-slate-700">
            Manual-Only Departments
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEPARTMENT_OPTIONS.map((department) => {
              const active = policy.manualOnlyDepartments.includes(department);

              return (
                <button
                  key={`manual-${department}`}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...policy,
                      manualOnlyDepartments: toggleArrayValue(
                        policy.manualOnlyDepartments,
                        department
                      ),
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatLabel(department)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">
            Blocked Action Types
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACTION_TYPE_OPTIONS.map((actionType) => {
              const active = policy.blockedActionTypes.includes(actionType);

              return (
                <button
                  key={actionType}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...policy,
                      blockedActionTypes: toggleArrayValue(
                        policy.blockedActionTypes,
                        actionType
                      ),
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-rose-100 text-rose-900 border border-rose-200"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatLabel(actionType)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">
            Blocked Task Types
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TASK_TYPE_OPTIONS.map((taskType) => {
              const active = policy.blockedTaskTypes.includes(taskType);

              return (
                <button
                  key={taskType}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...policy,
                      blockedTaskTypes: toggleArrayValue(
                        policy.blockedTaskTypes,
                        taskType
                      ),
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-rose-100 text-rose-900 border border-rose-200"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formatLabel(taskType)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-700">
          Current Policy Summary
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Hours
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {policy.allowedHoursStart}:00 - {policy.allowedHoursEnd}:00
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Weekends
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {policy.allowWeekends ? "Allowed" : "Blocked"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Allowed Depts
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {policy.allowedDepartments.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              Hard Blocks
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {policy.blockedActionTypes.length + policy.blockedTaskTypes.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}