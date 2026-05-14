"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  ListChecks,
  Package,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";

type FocusLaneItem = {
  id: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  type: "approval" | "inventory" | "delivery";
  linkedTurf?: string;
  linkedUseCase?: string;
};

type ActiveApprovalExecution = {
  id: string;
  title: string;
  summary: string;
  assetName: string;
  owner: string;
  status: "candidate_review" | "design";
  linkedTurf?: string;
  linkedUseCase?: string;
};

type ActiveInventoryExecution = {
  id: string;
  title: string;
  summary: string;
  item: string;
  region: string;
  onHand: number;
  reserved: number;
  reorderAt: number;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type ActiveDeliveryExecution = {
  id: string;
  title: string;
  summary: string;
  item: string;
  vendor: string;
  eta: string;
  status: "shipped" | "in_production";
  linkedTurf?: string;
  linkedUseCase?: string;
};

type PrintReadyAsset = {
  id: string;
  assetName: string;
  status: "approved" | "ordered" | "delivered";
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintInventoryAction = {
  id: string;
  item: string;
  amount: number;
  region: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintDeliveryUnlock = {
  id: string;
  item: string;
  vendor: string;
  eta: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

function priorityTone(priority: FocusLaneItem["priority"]) {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function typeTone(type: FocusLaneItem["type"]) {
  switch (type) {
    case "approval":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "inventory":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "delivery":
    default:
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

export default function PrintFocusModePage() {
  const [activeApproval, setActiveApproval] =
    useState<ActiveApprovalExecution | null>(null);
  const [activeInventory, setActiveInventory] =
    useState<ActiveInventoryExecution | null>(null);
  const [activeDelivery, setActiveDelivery] =
    useState<ActiveDeliveryExecution | null>(null);

  const [approvalDecision, setApprovalDecision] = useState<
    "Approve" | "Request Revision"
  >("Approve");
  const [reorderAmount, setReorderAmount] = useState<string>("500");
  const [deliveryAction, setDeliveryAction] = useState<
    "Confirm Delivery" | "Update ETA"
  >("Confirm Delivery");

  const [approvalConfirmed, setApprovalConfirmed] = useState<string | null>(null);
  const [inventoryConfirmed, setInventoryConfirmed] = useState<string | null>(null);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState<string | null>(null);

  const [readyAssets, setReadyAssets] = useState<PrintReadyAsset[]>([]);
  const [inventoryActions, setInventoryActions] = useState<PrintInventoryAction[]>([]);
  const [deliveryUnlocks, setDeliveryUnlocks] = useState<PrintDeliveryUnlock[]>([]);

  const [roleLoading, setRoleLoading] = useState(true);
  const [hasPrintAccess, setHasPrintAccess] = useState(false);
  const [hasPrintDirector, setHasPrintDirector] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        const response = await fetch("/api/admin/org-members");
        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          setHasPrintAccess(false);
          setHasPrintDirector(false);
          return;
        }

        const currentMemberId = data?.currentMember?.id;
        const roles = Array.isArray(data?.roles) ? data.roles : [];

        const myRoles = roles.filter(
          (role: any) => role.organization_member_id === currentMemberId
        );

        const hasAdmin = myRoles.some(
          (role: any) =>
            String(role.department || "").toLowerCase() === "admin" ||
            String(role.role_level || "").toLowerCase() === "admin" ||
            String(role.role_level || "").toLowerCase() === "campaign_manager"
        );

        const hasPrint = myRoles.some(
          (role: any) => String(role.department || "").toLowerCase() === "print"
        );

        const isPrintDirector = myRoles.some(
          (role: any) =>
            String(role.department || "").toLowerCase() === "print" &&
            String(role.role_level || "").toLowerCase() === "director"
        );

        setHasPrintAccess(hasAdmin || hasPrint);
        setHasPrintDirector(hasAdmin || isPrintDirector);
      } catch (error) {
        console.error("Failed to load print role context:", error);

        if (!mounted) return;

        setHasPrintAccess(false);
        setHasPrintDirector(false);
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadRoleContext();

    return () => {
      mounted = false;
    };
  }, []);

  const nowLine = useMemo(() => {
    return {
      headline:
        "Stay in print flow.",
      body:
        "Clear approvals. Protect inventory. Keep deliveries moving.",
    };
  }, []);

  const systemPrintSignals = useMemo(() => {
    return [];
  }, []);

  const focusItems = useMemo<FocusLaneItem[]>(() => {
    return [];
  }, []);

  const grouped = useMemo(() => {
    return {
      approval: focusItems.filter((item) => item.type === "approval"),
      inventory: focusItems.filter((item) => item.type === "inventory"),
      delivery: focusItems.filter((item) => item.type === "delivery"),
    };
  }, [focusItems]);

  const materialReadiness = useMemo(() => {
    return {
      readyAssetCount: readyAssets.length,
      inventoryProtectionCount: inventoryActions.length,
      deliveryUnlockCount: deliveryUnlocks.length,
    };
  }, [readyAssets.length, inventoryActions.length, deliveryUnlocks.length]);

  function openApprovalPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveApprovalExecution> = {
      "focus-1": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        assetName: "Education contrast mailer",
        owner: "Maya",
        status: "candidate_review",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
      "focus-4": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        assetName: "Absentee chase lit piece",
        owner: "Avery",
        status: "design",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
    };

    setActiveApproval(
      mapped[item.id] ?? {
        id: item.id,
        title: item.title,
        summary: item.summary,
        assetName: "Active Asset",
        owner: "Assigned Owner",
        status: "candidate_review",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      }
    );
    setApprovalDecision("Approve");
    setApprovalConfirmed(null);
  }

  function confirmApprovalAction() {
    if (!activeApproval) return;

    if (approvalDecision === "Approve") {
      const nextReadyAsset: PrintReadyAsset = {
        id: `ready-asset-${Date.now()}`,
        assetName: activeApproval.assetName,
        status: "approved",
        linkedTurf: activeApproval.linkedTurf,
        linkedUseCase: activeApproval.linkedUseCase,
        updatedAt: new Date().toLocaleString(),
      };

      setReadyAssets((current) => [nextReadyAsset, ...current]);
    }

    setApprovalConfirmed(activeApproval.id);
  }

  function clearApprovalPanel() {
    setActiveApproval(null);
    setApprovalConfirmed(null);
  }

  function openInventoryPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveInventoryExecution> = {
      "focus-2": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Yard Signs",
        region: "Aurora",
        onHand: 420,
        reserved: 180,
        reorderAt: 150,
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
      "focus-5": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Mailer Stock",
        region: "Chicago",
        onHand: 3100,
        reserved: 2200,
        reorderAt: 1200,
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
    };

    setActiveInventory(
      mapped[item.id] ?? {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Tracked Inventory",
        region: "Active Region",
        onHand: 0,
        reserved: 0,
        reorderAt: 0,
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      }
    );
    setReorderAmount(item.id === "focus-2" ? "500" : "1000");
    setInventoryConfirmed(null);
  }

  function confirmInventoryAction() {
    if (!activeInventory) return;

    const nextInventoryAction: PrintInventoryAction = {
      id: `inventory-action-${Date.now()}`,
      item: activeInventory.item,
      amount: Number(reorderAmount),
      region: activeInventory.region,
      linkedTurf: activeInventory.linkedTurf,
      linkedUseCase: activeInventory.linkedUseCase,
      updatedAt: new Date().toLocaleString(),
    };

    setInventoryActions((current) => [nextInventoryAction, ...current]);
    setInventoryConfirmed(activeInventory.id);
  }

  function clearInventoryPanel() {
    setActiveInventory(null);
    setInventoryConfirmed(null);
  }

  function openDeliveryPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveDeliveryExecution> = {
      "focus-3": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Large yard signs",
        vendor: "Great Lakes Signs",
        eta: "2026-04-09",
        status: "shipped",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
      "focus-6": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Education contrast mailer",
        vendor: "Midwest Print House",
        eta: "2026-04-11",
        status: "in_production",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      },
    };

    setActiveDelivery(
      mapped[item.id] ?? {
        id: item.id,
        title: item.title,
        summary: item.summary,
        item: "Tracked Delivery",
        vendor: "Active Vendor",
        eta: "Not set",
        status: "shipped",
        linkedTurf: item.linkedTurf,
        linkedUseCase: item.linkedUseCase,
      }
    );
    setDeliveryAction("Confirm Delivery");
    setDeliveryConfirmed(null);
  }

  function confirmDeliveryAction() {
    if (!activeDelivery) return;
        const nextDeliveryUnlock: PrintDeliveryUnlock = {
      id: `delivery-unlock-${Date.now()}`,
      item: activeDelivery.item,
      vendor: activeDelivery.vendor,
      eta: activeDelivery.eta,
      linkedTurf: activeDelivery.linkedTurf,
      linkedUseCase: activeDelivery.linkedUseCase,
      updatedAt: new Date().toLocaleString(),
    };

    setDeliveryUnlocks((current) => [nextDeliveryUnlock, ...current]);
    setDeliveryConfirmed(activeDelivery.id);
  }

  function clearDeliveryPanel() {
    setActiveDelivery(null);
    setDeliveryConfirmed(null);
  }

  if (roleLoading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading print focus context...</p>
        </section>
      </div>
    );
  }

  if (!hasPrintAccess) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <Package className="h-5 w-5 text-slate-500" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            No Print Role Assigned
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            You are not currently assigned to Print. Ask your campaign admin to
            add a Print Director or Print User role if you need access to print
            execution work.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Zap className="h-3.5 w-3.5" />
              Print Focus Mode
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
              {hasPrintDirector ? "Print Director Access" : "Print User Access"}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {nowLine.headline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {nowLine.body}
              </p>
              <p className="text-sm font-medium text-slate-200">
                Approvals lead everything in print.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/print"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Print
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ListChecks className="h-4 w-4" />
              Lists
            </Link>
          </div>
        </div>
      </section>

      

      {(readyAssets.length > 0 ||
        inventoryActions.length > 0 ||
        deliveryUnlocks.length > 0) && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">
                Material Readiness
              </p>
              <h2 className="text-xl font-semibold text-indigo-950">
                Print → Field activation state
              </h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-800">
              {materialReadiness.readyAssetCount} ready asset
              {materialReadiness.readyAssetCount === 1 ? "" : "s"} •{" "}
              {materialReadiness.inventoryProtectionCount} inventory move
              {materialReadiness.inventoryProtectionCount === 1 ? "" : "s"} •{" "}
              {materialReadiness.deliveryUnlockCount} delivery unlock
              {materialReadiness.deliveryUnlockCount === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Ready Assets
              </p>
              <div className="mt-3 space-y-3">
                {readyAssets.length === 0 ? (
                  <p className="text-sm text-slate-500">No assets cleared yet.</p>
                ) : (
                  readyAssets.map((asset) => (
                    <div key={asset.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{asset.assetName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {asset.linkedTurf || "No turf link"} • {asset.linkedUseCase || "No use case"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Inventory Actions
              </p>
              <div className="mt-3 space-y-3">
                {inventoryActions.length === 0 ? (
                  <p className="text-sm text-slate-500">No reorders queued yet.</p>
                ) : (
                  inventoryActions.map((action) => (
                    <div key={action.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">
                        {action.item} · {action.amount.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {action.region} • {action.linkedUseCase || "No use case"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Delivery Unlocks
              </p>
              <div className="mt-3 space-y-3">
                {deliveryUnlocks.length === 0 ? (
                  <p className="text-sm text-slate-500">No delivery unlocks yet.</p>
                ) : (
                  deliveryUnlocks.map((unlock) => (
                    <div key={unlock.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{unlock.item}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {unlock.vendor} • {unlock.linkedTurf || "No turf link"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr_0.9fr]">
        <div className="rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Approval Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Clear approvals
              </h2>
            </div>
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
          </div>

          <div className="space-y-4">
            {grouped.approval.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No live print approval actions are available yet.
              </div>
            ) : null}

            {grouped.approval.map((item) => {
              const isActive = activeApproval?.id === item.id;
              const isConfirmed = approvalConfirmed === item.id;

              if (isActive && activeApproval) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                      {isConfirmed && (
                        <span className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                          completed
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activeApproval.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeApproval.summary}
                    </p>

                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Linked turf: {activeApproval.linkedTurf || "None"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Use case: {activeApproval.linkedUseCase || "None"}
                      </p>
                    </div>
                                        <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-900">
                          Decision
                        </label>
                        <select
                          value={approvalDecision}
                          onChange={(e) =>
                            setApprovalDecision(
                              e.target.value as "Approve" | "Request Revision"
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                        >
                          <option>Approve</option>
                          <option>Request Revision</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={confirmApprovalAction}
                          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                        >
                          Confirm Decision
                        </button>
                        <button
                          onClick={clearApprovalPanel}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-2 text-xs text-slate-500">
                    {item.linkedTurf || "No turf link"} •{" "}
                    {item.linkedUseCase || "No use case"}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => openApprovalPanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Open Approval
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {hasPrintDirector ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Inventory Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Protect Materials
              </h2>
            </div>
            <Boxes className="h-5 w-5 text-sky-600" />
          </div>

          <div className="space-y-4">
            {grouped.inventory.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No live print inventory actions are available yet.
              </div>
            ) : null}

            {grouped.inventory.map((item) => {
              const isActive = activeInventory?.id === item.id;
              const isConfirmed = inventoryConfirmed === item.id;

              if (isActive && activeInventory) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-sky-300 bg-sky-50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                      {isConfirmed && (
                        <span className="inline-flex rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                          completed
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activeInventory.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeInventory.summary}
                    </p>

                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                      {activeInventory.region} •{" "}
                      {activeInventory.linkedUseCase || "No use case"}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-900">
                          Reorder Amount
                        </label>
                        <input
                          value={reorderAmount}
                          onChange={(e) => setReorderAmount(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={confirmInventoryAction}
                          className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700"
                        >
                          Confirm Reorder
                        </button>
                        <button
                          onClick={clearInventoryPanel}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-2 text-xs text-slate-500">
                    {item.linkedTurf || "No turf link"} •{" "}
                    {item.linkedUseCase || "No use case"}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => openInventoryPanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Open Inventory
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Delivery Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Confirm delivery
              </h2>
            </div>
            <Truck className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {grouped.delivery.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No live print delivery actions are available yet.
              </div>
            ) : null}

            {grouped.delivery.map((item) => {
              const isActive = activeDelivery?.id === item.id;
              const isConfirmed = deliveryConfirmed === item.id;

              if (isActive && activeDelivery) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                      {isConfirmed && (
                        <span className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                          completed
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activeDelivery.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeDelivery.summary}
                    </p>

                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                      {activeDelivery.vendor} • ETA {activeDelivery.eta}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-900">
                          Action
                        </label>
                        <select
                          value={deliveryAction}
                          onChange={(e) =>
                            setDeliveryAction(
                              e.target.value as
                                | "Confirm Delivery"
                                | "Update ETA"
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option>Confirm Delivery</option>
                          <option>Update ETA</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={confirmDeliveryAction}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          Confirm Delivery
                        </button>
                        <button
                          onClick={clearDeliveryPanel}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-2 text-xs text-slate-500">
                    {item.linkedTurf || "No turf link"} •{" "}
                    {item.linkedUseCase || "No use case"}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => openDeliveryPanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Open Delivery
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

<section
        className={`grid gap-4 ${
          hasPrintDirector ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            grouped.approval.length > 0
              ? "border-rose-200 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium ${
                grouped.approval.length > 0 ? "text-rose-800" : "text-slate-700"
              }`}
            >
              Approval Priority
            </p>
            <ClipboardCheck
              className={`h-4 w-4 ${
                grouped.approval.length > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            />
          </div>
          <p
            className={`mt-2 text-xl font-semibold ${
              grouped.approval.length > 0 ? "text-rose-900" : "text-slate-900"
            }`}
          >
            {grouped.approval.length}
          </p>
          <p
            className={`mt-1 text-xs ${
              grouped.approval.length > 0 ? "text-rose-800" : "text-slate-600"
            }`}
          >
            Immediate approval actions
          </p>
        </div>

        {hasPrintDirector ? (
          <div
            className={`rounded-2xl border p-4 shadow-sm ${
              grouped.inventory.length > 0
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-xs font-medium ${
                  grouped.inventory.length > 0
                    ? "text-rose-800"
                    : "text-slate-700"
                }`}
              >
                Inventory Pressure
              </p>
              <Boxes
                className={`h-4 w-4 ${
                  grouped.inventory.length > 0
                    ? "text-rose-700"
                    : "text-slate-500"
                }`}
              />
            </div>
            <p
              className={`mt-2 text-xl font-semibold ${
                grouped.inventory.length > 0
                  ? "text-rose-900"
                  : "text-slate-900"
              }`}
            >
              {grouped.inventory.length}
            </p>
            <p
              className={`mt-1 text-xs ${
                grouped.inventory.length > 0
                  ? "text-rose-800"
                  : "text-slate-600"
              }`}
            >
              Protection moves
            </p>
          </div>
        ) : null}

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            grouped.delivery.length > 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium ${
                grouped.delivery.length > 0
                  ? "text-emerald-800"
                  : "text-slate-700"
              }`}
            >
              Delivery Queue
            </p>
            <Truck
              className={`h-4 w-4 ${
                grouped.delivery.length > 0
                  ? "text-emerald-700"
                  : "text-slate-500"
              }`}
            />
          </div>
          <p
            className={`mt-2 text-xl font-semibold ${
              grouped.delivery.length > 0
                ? "text-emerald-900"
                : "text-slate-900"
            }`}
          >
            {grouped.delivery.length}
          </p>
          <p
            className={`mt-1 text-xs ${
              grouped.delivery.length > 0
                ? "text-emerald-800"
                : "text-slate-600"
            }`}
          >
            ETA checks
          </p>
        </div>
      </section>

      <section className="hidden" aria-hidden="true">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Print Operating Pattern
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Clear approvals first, protect inventory second, and confirm
              deliveries third. Print should always be enabling execution in the
              field, not slowing it down.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}