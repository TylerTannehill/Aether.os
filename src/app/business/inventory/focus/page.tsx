"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ClipboardList,
  PackageCheck,
  Search,
  Truck,
  Zap,
} from "lucide-react";

type FocusPriority = "high" | "medium" | "low";

type ReorderFocusItem = {
  id: string;
  itemId: string;
  itemName: string;
  sku: string | null;
  location: string | null;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  priority: FocusPriority;
};

type PurchasingFocusItem = {
  id: string;
  itemId: string;
  itemName: string;
  vendor: string | null;
  requestedQuantity: number | null;
  status: "needs_order" | "draft";
  priority: FocusPriority;
};

type DeliveryFocusItem = {
  id: string;
  purchaseOrderId: string;
  vendor: string;
  expectedDelivery: string | null;
  status: "ordered" | "shipped";
  priority: FocusPriority;
};

function priorityTone(priority: FocusPriority) {
  switch (priority) {
    case "high":
      return "border-rose-200 bg-rose-100 text-rose-700";
    case "medium":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "low":
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function EmptyLane({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Boxes;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

export default function BusinessInventoryFocusPage() {
  // Focus Mode only acts on real operational records.
  // These collections remain empty until the Business inventory data layer
  // produces actual reorder, purchasing, or delivery work.
  const [reorderItems] = useState<ReorderFocusItem[]>([]);
  const [purchasingItems] = useState<PurchasingFocusItem[]>([]);
  const [deliveryItems] = useState<DeliveryFocusItem[]>([]);
  const [search, setSearch] = useState("");

  const totalActions =
    reorderItems.length + purchasingItems.length + deliveryItems.length;

  const highPriorityCount = useMemo(() => {
    return [
      ...reorderItems,
      ...purchasingItems,
      ...deliveryItems,
    ].filter((item) => item.priority === "high").length;
  }, [reorderItems, purchasingItems, deliveryItems]);

  const query = search.trim().toLowerCase();

  const filteredReorderItems = useMemo(() => {
    if (!query) return reorderItems;

    return reorderItems.filter((item) =>
      [item.itemName, item.sku, item.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [query, reorderItems]);

  const filteredPurchasingItems = useMemo(() => {
    if (!query) return purchasingItems;

    return purchasingItems.filter((item) =>
      [item.itemName, item.vendor]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [query, purchasingItems]);

  const filteredDeliveryItems = useMemo(() => {
    if (!query) return deliveryItems;

    return deliveryItems.filter((item) =>
      [item.vendor, item.purchaseOrderId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [query, deliveryItems]);

  const hasFocusWork = totalActions > 0;

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-4 lg:space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 lg:px-2.5 lg:text-[9px]">
              <Zap className="h-3.5 w-3.5" />
              Inventory Focus Mode
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                {hasFocusWork
                  ? "Inventory work needs attention."
                  : "Inventory is clear right now."}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Focus Mode turns real inventory pressure into executable work:
                replenish stock, move purchasing forward, and keep incoming
                deliveries from blocking operations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:gap-2">
            <Link
              href="/business/inventory"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              Back to Inventory
              <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Focus Actions",
            value: totalActions,
            detail: "Real actions currently queued",
          },
          {
            label: "High Priority",
            value: highPriorityCount,
            detail: "Actions requiring immediate attention",
          },
          {
            label: "Reorder",
            value: reorderItems.length,
            detail: "Stock protection actions",
          },
          {
            label: "Deliveries",
            value: deliveryItems.length,
            detail: "Incoming shipment actions",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {stat.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </section>

      {!hasFocusWork ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <PackageCheck className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Execution status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No inventory actions require attention
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Focus Mode has no real inventory work to surface yet. Actions
                will appear here only when connected inventory, purchasing, or
                delivery records create something that actually needs to be
                done.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Work queue
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Inventory execution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search the live execution queue once inventory work exists.
            </p>
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Focus work"
              disabled={!hasFocusWork}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3 lg:gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-5 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Reorder Lane
              </p>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Protect stock
              </h2>
            </div>
            <Boxes className="h-5 w-5 text-sky-600 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-3">
            {filteredReorderItems.length === 0 ? (
              <EmptyLane
                icon={Boxes}
                title="No reorder actions"
                body="Items will enter this lane only when real available stock reaches a recorded reorder point."
              />
            ) : (
              filteredReorderItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.itemName}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Available: {Math.max(item.onHand - item.reserved, 0)} ·
                    Reorder point: {item.reorderPoint}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.location || "No location recorded"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-5 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Purchasing Lane
              </p>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Move orders
              </h2>
            </div>
            <ClipboardList className="h-5 w-5 text-amber-600 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-3">
            {filteredPurchasingItems.length === 0 ? (
              <EmptyLane
                icon={ClipboardList}
                title="No purchasing actions"
                body="Purchasing work will appear only when real inventory records require an order or a draft order needs action."
              />
            ) : (
              filteredPurchasingItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.itemName}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.vendor || "No vendor recorded"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 capitalize">
                    {item.status.replace("_", " ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="mb-5 flex items-center justify-between lg:mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 lg:text-[11px]">
                Delivery Lane
              </p>
              <h2 className="text-xl font-semibold text-slate-900 lg:text-lg">
                Keep shipments moving
              </h2>
            </div>
            <Truck className="h-5 w-5 text-emerald-600 lg:h-4 lg:w-4" />
          </div>

          <div className="space-y-3">
            {filteredDeliveryItems.length === 0 ? (
              <EmptyLane
                icon={Truck}
                title="No delivery actions"
                body="Incoming shipment work will appear here only when real purchase orders or shipment records require follow-up."
              />
            ) : (
              filteredDeliveryItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.vendor}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    PO {item.purchaseOrderId}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.expectedDelivery
                      ? `Expected ${item.expectedDelivery}`
                      : "No delivery date recorded"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 lg:gap-3">
        {[
          {
            label: "Reorder Pressure",
            value: reorderItems.length,
            icon: Boxes,
            detail: "Stock protection moves",
          },
          {
            label: "Purchasing Queue",
            value: purchasingItems.length,
            icon: ClipboardList,
            detail: "Orders needing action",
          },
          {
            label: "Delivery Queue",
            value: deliveryItems.length,
            icon: Truck,
            detail: "Incoming shipment checks",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:rounded-xl lg:p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700 lg:text-[9px]">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-slate-500 lg:h-3.5 lg:w-3.5" />
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-900 lg:text-lg">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-600 lg:text-[9px]">
                {item.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Focus only acts on real operational state
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This page does not fabricate tasks, priorities, quantities,
              vendors, or delivery dates. Once the Business Inventory data layer
              is connected, Focus Mode can derive work from the records that
              actually exist.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
