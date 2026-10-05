"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type InventoryItem = {
  id: string;
  name: string;
  onHand: number;
  reserved: number;
  reorderPoint: number | null;
};

type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

type PurchaseOrder = {
  id: string;
  orderName: string;
  status: PurchaseOrderStatus;
  expectedAt: string | null;
  quantities: Record<string, number>;
  receivedQuantities: Record<string, number>;
};

type InventoryDelivery = {
  id: string;
  purchaseOrderId: string;
  trackingNumber: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
};

type ReorderFocusItem = {
  id: string;
  itemName: string;
  available: number;
  reorderPoint: number;
  uncoveredNeed: number;
};

type PurchasingFocusItem = {
  id: string;
  orderName: string;
  itemCount: number;
  totalQuantity: number;
};

type DeliveryFocusItem = {
  id: string;
  purchaseOrderId: string;
  orderName: string;
  trackingNumber: string | null;
  expectedAt: string | null;
};

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

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export default function BusinessInventoryFocusPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveries, setDeliveries] = useState<InventoryDelivery[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [placingPurchaseOrderId, setPlacingPurchaseOrderId] = useState<string | null>(null);

  async function loadFocus() {
    setLoading(true);
    setError(null);

    try {
      const contextResponse = await fetch("/api/auth/current-context", {
        cache: "no-store",
      });

      if (!contextResponse.ok) {
        throw new Error("Unable to load the active organization.");
      }

      const context = await contextResponse.json();
      const activeOrganizationId =
        context?.organization?.id ||
        context?.organization_id ||
        context?.organizationId ||
        null;

      if (!activeOrganizationId) {
        throw new Error("No active organization found.");
      }

      setOrganizationId(activeOrganizationId);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const [itemsResult, ordersResult, deliveriesResult] = await Promise.all([
        supabase
          .from("business_inventory_items")
          .select("id,name,on_hand,reserved,reorder_point")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_purchase_orders")
          .select("id,order_name,status,expected_at")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_inventory_deliveries")
          .select("id,purchase_order_id,tracking_number,expected_at,received_at")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (deliveriesResult.error) throw deliveriesResult.error;

      const orderIds = (ordersResult.data || []).map((order) => order.id);
      const orderItemsResult =
        orderIds.length > 0
          ? await supabase
              .from("business_purchase_order_items")
              .select(
                "purchase_order_id,inventory_item_id,quantity_ordered,quantity_received"
              )
              .in("purchase_order_id", orderIds)
          : { data: [], error: null };

      if (orderItemsResult.error) throw orderItemsResult.error;

      setInventoryItems(
        (itemsResult.data || []).map((item) => ({
          id: item.id,
          name: item.name,
          onHand: Number(item.on_hand || 0),
          reserved: Number(item.reserved || 0),
          reorderPoint:
            item.reorder_point === null ? null : Number(item.reorder_point),
        }))
      );

      setPurchaseOrders(
        (ordersResult.data || []).map((order) => {
          const lines = (orderItemsResult.data || []).filter(
            (line) => line.purchase_order_id === order.id
          );

          return {
            id: order.id,
            orderName: order.order_name,
            status: order.status as PurchaseOrderStatus,
            expectedAt: order.expected_at,
            quantities: lines.reduce<Record<string, number>>((result, line) => {
              result[line.inventory_item_id] = Number(line.quantity_ordered || 0);
              return result;
            }, {}),
            receivedQuantities: lines.reduce<Record<string, number>>(
              (result, line) => {
                result[line.inventory_item_id] = Number(line.quantity_received || 0);
                return result;
              },
              {}
            ),
          };
        })
      );

      setDeliveries(
        (deliveriesResult.data || []).map((delivery) => ({
          id: delivery.id,
          purchaseOrderId: delivery.purchase_order_id,
          trackingNumber: delivery.tracking_number,
          expectedAt: delivery.expected_at,
          receivedAt: delivery.received_at,
        }))
      );
    } catch (loadError) {
      console.error("Unable to load Inventory Focus:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Inventory Focus."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFocus();
  }, []);

  const activeOrderedCoverage = useMemo(() => {
    const coverage: Record<string, number> = {};

    purchaseOrders
      .filter(
        (order) =>
          order.status === "ordered" || order.status === "partially_received"
      )
      .forEach((order) => {
        Object.entries(order.quantities).forEach(([itemId, ordered]) => {
          const received = order.receivedQuantities[itemId] || 0;
          coverage[itemId] = (coverage[itemId] || 0) + Math.max(ordered - received, 0);
        });
      });

    return coverage;
  }, [purchaseOrders]);

  const reorderItems = useMemo<ReorderFocusItem[]>(() => {
    return inventoryItems.flatMap((item) => {
      if (item.reorderPoint === null) return [];

      const available = Math.max(item.onHand - item.reserved, 0);
      if (available > item.reorderPoint) return [];

      const neededToClearPoint = Math.max(item.reorderPoint - available + 1, 0);
      const covered = activeOrderedCoverage[item.id] || 0;
      const uncoveredNeed = Math.max(neededToClearPoint - covered, 0);

      if (uncoveredNeed <= 0) return [];

      return [
        {
          id: item.id,
          itemName: item.name,
          available,
          reorderPoint: item.reorderPoint,
          uncoveredNeed,
        },
      ];
    });
  }, [inventoryItems, activeOrderedCoverage]);

  const purchasingItems = useMemo<PurchasingFocusItem[]>(() => {
    return purchaseOrders
      .filter((order) => order.status === "draft")
      .map((order) => ({
        id: order.id,
        orderName: order.orderName,
        itemCount: Object.keys(order.quantities).length,
        totalQuantity: Object.values(order.quantities).reduce(
          (sum, quantity) => sum + quantity,
          0
        ),
      }));
  }, [purchaseOrders]);

  const deliveryItems = useMemo<DeliveryFocusItem[]>(() => {
    return deliveries.flatMap((delivery) => {
      if (delivery.receivedAt) return [];

      const order = purchaseOrders.find(
        (purchaseOrder) => purchaseOrder.id === delivery.purchaseOrderId
      );

      if (
        !order ||
        (order.status !== "ordered" && order.status !== "partially_received")
      ) {
        return [];
      }

      return [
        {
          id: delivery.id,
          purchaseOrderId: delivery.purchaseOrderId,
          orderName: order.orderName,
          trackingNumber: delivery.trackingNumber,
          expectedAt: delivery.expectedAt,
        },
      ];
    });
  }, [deliveries, purchaseOrders]);

  async function placePurchaseOrder(orderId: string, orderName: string) {
    if (!organizationId || placingPurchaseOrderId) return;

    const confirmed = window.confirm(
      `Place "${orderName}"? This marks the purchase order as Ordered and records the current time as the order date.`
    );

    if (!confirmed) return;

    setPlacingPurchaseOrderId(orderId);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("business_purchase_orders")
        .update({
          status: "ordered",
          ordered_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("organization_id", organizationId)
        .eq("status", "draft");

      if (updateError) throw updateError;
      await loadFocus();
    } catch (placeError) {
      console.error("Unable to place purchase order from Focus:", placeError);
      setError(
        placeError instanceof Error
          ? placeError.message
          : "Unable to place purchase order."
      );
    } finally {
      setPlacingPurchaseOrderId(null);
    }
  }

  const totalActions =
    reorderItems.length + purchasingItems.length + deliveryItems.length;

  const query = search.trim().toLowerCase();

  const filteredReorderItems = useMemo(() => {
    if (!query) return reorderItems;
    return reorderItems.filter((item) =>
      item.itemName.toLowerCase().includes(query)
    );
  }, [query, reorderItems]);

  const filteredPurchasingItems = useMemo(() => {
    if (!query) return purchasingItems;
    return purchasingItems.filter((item) =>
      item.orderName.toLowerCase().includes(query)
    );
  }, [query, purchasingItems]);

  const filteredDeliveryItems = useMemo(() => {
    if (!query) return deliveryItems;
    return deliveryItems.filter((item) =>
      [item.orderName, item.trackingNumber]
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
                {loading
                  ? "Reading inventory reality."
                  : hasFocusWork
                    ? "Inventory work needs attention."
                    : "Inventory is clear right now."}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 lg:text-[11px]">
                Focus Mode turns real inventory pressure into executable work:
                replenish stock, move purchasing forward, and receive incoming
                deliveries.
              </p>
            </div>
          </div>

          <Link
            href="/business/inventory"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
          >
            Back to Inventory
            <ArrowRight className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          </Link>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Focus Actions",
            value: totalActions,
            detail: "Real actions currently queued",
          },
          {
            label: "Purchasing",
            value: purchasingItems.length,
            detail: "Draft orders needing placement",
          },
          {
            label: "Reorder",
            value: reorderItems.length,
            detail: "Uncovered stock pressure",
          },
          {
            label: "Deliveries",
            value: deliveryItems.length,
            detail: "Incoming shipments to receive",
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

      {!loading && !hasFocusWork ? (
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
                Current inventory, purchasing, and delivery records do not create
                any executable Focus work.
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
              Search the live execution queue.
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
                body="Items appear here when available stock reaches its reorder point and active purchasing does not already cover the pressure."
              />
            ) : (
              filteredReorderItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{item.itemName}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Available: {item.available} · Reorder point: {item.reorderPoint}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Uncovered need: {item.uncoveredNeed}
                  </p>
                  <Link
                    href="/business/inventory"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-slate-800"
                    style={{ color: "#ffffff" }}
                  >
                    Open Purchasing
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
                body="Draft purchase orders appear here until somebody places them."
              />
            ) : (
              filteredPurchasingItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{item.orderName}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.itemCount} {item.itemCount === 1 ? "item" : "items"} ·{" "}
                    {item.totalQuantity.toLocaleString()} ordered
                  </p>
                  <button
                    type="button"
                    onClick={() => void placePurchaseOrder(item.id, item.orderName)}
                    disabled={placingPurchaseOrderId === item.id}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {placingPurchaseOrderId === item.id ? "Placing..." : "Place Order"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
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
                body="Incoming deliveries appear here until the shipment is received and finished."
              />
            ) : (
              filteredDeliveryItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{item.orderName}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.trackingNumber
                      ? `Tracking ${item.trackingNumber}`
                      : "No tracking number recorded"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(item.expectedAt)
                      ? `Expected ${formatDate(item.expectedAt)}`
                      : "No delivery date recorded"}
                  </p>
                  <Link
                    href={`/business/inventory?receive=${encodeURIComponent(item.id)}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-slate-800"
                    style={{ color: "#ffffff" }}
                  >
                    Receive Inventory
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
            detail: "Uncovered stock moves",
          },
          {
            label: "Purchasing Queue",
            value: purchasingItems.length,
            icon: ClipboardList,
            detail: "Draft orders needing placement",
          },
          {
            label: "Delivery Queue",
            value: deliveryItems.length,
            icon: Truck,
            detail: "Incoming shipments to receive",
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
              Focus acts on real operational state
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Reorder pressure comes from real stock math, purchasing work comes
              from draft purchase orders, and delivery work comes from real
              incoming shipments. Focus does not create a second task system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
