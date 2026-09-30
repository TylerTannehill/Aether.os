"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Package,
  Search,
  Truck,
} from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  location: string | null;
  onHand: number;
  reserved: number;
  reorderPoint: number | null;
  unitCost: number | null;
  vendor: string | null;
};

type PurchaseOrder = {
  id: string;
  vendor: string;
  status: "draft" | "ordered" | "shipped" | "delivered" | "cancelled";
  expectedDelivery: string | null;
  itemCount: number;
};

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Boxes;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

export default function BusinessInventoryPage() {
  // Business Inventory begins with truthful empty state.
  // These arrays will be replaced by the real Business data layer as it is built.
  const [inventoryItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return inventoryItems;

    return inventoryItems.filter((item) =>
      [
        item.name,
        item.sku,
        item.category,
        item.location,
        item.vendor,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [inventoryItems, search]);

  const summary = useMemo(() => {
    const onHand = inventoryItems.reduce((sum, item) => sum + item.onHand, 0);
    const reserved = inventoryItems.reduce((sum, item) => sum + item.reserved, 0);
    const available = inventoryItems.reduce(
      (sum, item) => sum + Math.max(item.onHand - item.reserved, 0),
      0
    );

    const lowStock = inventoryItems.filter((item) => {
      if (item.reorderPoint === null) return false;
      return item.onHand - item.reserved <= item.reorderPoint;
    }).length;

    const activeOrders = purchaseOrders.filter(
      (order) =>
        order.status === "ordered" ||
        order.status === "shipped"
    ).length;

    return {
      itemCount: inventoryItems.length,
      onHand,
      reserved,
      available,
      lowStock,
      activeOrders,
    };
  }, [inventoryItems, purchaseOrders]);

  const hasInventoryData = inventoryItems.length > 0;
  const hasOrderData = purchaseOrders.length > 0;

  return (
    <div className="space-y-8 lg:space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:rounded-2xl lg:p-[18px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="space-y-3 lg:space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-[11px]">
              <Boxes className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Inventory operations center
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-2xl">
                Inventory Command Center
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Track stock, reservations, reorder pressure, purchasing, vendors,
                and incoming deliveries from one operational surface.
              </p>
            </div>
          </div>

          <Link
            href="/business/inventory/focus"
            className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:text-[9px]">
              Focus Mode
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200 transition group-hover:text-white lg:text-[11px]">
              Open Inventory Focus
            </p>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Items",
            value: summary.itemCount.toLocaleString(),
            detail: "Tracked inventory records",
          },
          {
            label: "On Hand",
            value: summary.onHand.toLocaleString(),
            detail: "Physical stock recorded",
          },
          {
            label: "Reserved",
            value: summary.reserved.toLocaleString(),
            detail: "Committed stock",
          },
          {
            label: "Available",
            value: summary.available.toLocaleString(),
            detail: "Unreserved stock",
          },
          {
            label: "Active Orders",
            value: summary.activeOrders.toLocaleString(),
            detail: "Ordered or in transit",
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
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </section>

      {!hasInventoryData && !hasOrderData ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Package className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Inventory status
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                No inventory data connected yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This organization does not have inventory records or purchase
                orders available to this Business module yet. Nothing has been
                estimated, generated, or filled with sample data.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Stock
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Inventory
              </h2>
            </div>

            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search inventory"
                disabled={!hasInventoryData}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-5">
            {!hasInventoryData ? (
              <EmptyState
                icon={Boxes}
                title="No inventory items yet"
                body="Inventory records will appear here once a real Business inventory data source or entry workflow is connected."
              />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching inventory"
                body="No inventory records match the current search."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <th className="pb-3 font-semibold">Item</th>
                      <th className="pb-3 font-semibold">SKU</th>
                      <th className="pb-3 font-semibold">Location</th>
                      <th className="pb-3 text-right font-semibold">On Hand</th>
                      <th className="pb-3 text-right font-semibold">Reserved</th>
                      <th className="pb-3 text-right font-semibold">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-4 font-medium text-slate-900">{item.name}</td>
                        <td className="py-4 text-slate-600">{item.sku || "—"}</td>
                        <td className="py-4 text-slate-600">{item.location || "—"}</td>
                        <td className="py-4 text-right text-slate-700">{item.onHand}</td>
                        <td className="py-4 text-right text-slate-700">{item.reserved}</td>
                        <td className="py-4 text-right font-medium text-slate-900">
                          {Math.max(item.onHand - item.reserved, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Pressure
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Reorder Watch
            </h2>
          </div>

          <div className="mt-5">
            {summary.lowStock === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title={
                  hasInventoryData
                    ? "No reorder pressure detected"
                    : "No reorder data yet"
                }
                body={
                  hasInventoryData
                    ? "No connected inventory record is currently at or below its reorder point."
                    : "Reorder pressure will be calculated from real stock and reorder-point records once inventory is connected."
                }
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-950">
                  {summary.lowStock} item{summary.lowStock === 1 ? "" : "s"} need attention
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Available stock is at or below the recorded reorder point.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-slate-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Purchasing
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Purchase Orders
              </h2>
            </div>
          </div>

          <div className="mt-5">
            {!hasOrderData ? (
              <EmptyState
                icon={ClipboardList}
                title="No purchase orders yet"
                body="Purchase orders will appear here after the Business purchasing workflow is connected."
              />
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{order.vendor}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      {order.expectedDelivery
                        ? ` · Expected ${order.expectedDelivery}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-slate-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Incoming
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Deliveries
              </h2>
            </div>
          </div>

          <div className="mt-5">
            <EmptyState
              icon={Truck}
              title="No incoming deliveries"
              body={
                hasOrderData
                  ? "No connected purchase order is currently reporting an incoming delivery."
                  : "Incoming deliveries will be derived from real purchase-order and shipment records."
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
