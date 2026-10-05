"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  ContactRound,
  ListChecks,
  Package,
  Pencil,
  Plus,
  Search,
  Settings2,
  Truck,
} from "lucide-react";

type InventoryFieldType = "text" | "number" | "date" | "boolean";

type InventoryField = {
  id: string;
  name: string;
  field_type: InventoryFieldType;
  position: number;
};

type InventoryItem = {
  id: string;
  name: string;
  onHand: number;
  reserved: number;
  reorderPoint: number | null;
  attributes: Record<string, unknown>;
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
  notes: string | null;
  itemCount: number;
  totalQuantity: number;
  quantities: Record<string, number>;
  receivedQuantities: Record<string, number>;
};

type InventoryDelivery = {
  id: string;
  purchaseOrderId: string;
  trackingNumber: string | null;
  deliveryInstructions: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
};

type InventoryDeliveryItem = {
  deliveryId: string;
  inventoryItemId: string;
  quantityReceived: number;
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
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryFields, setInventoryFields] = useState<InventoryField[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveries, setDeliveries] = useState<InventoryDelivery[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<InventoryDeliveryItem[]>([]);
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showColumnForm, setShowColumnForm] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState<InventoryFieldType>("text");
  const [savingColumn, setSavingColumn] = useState(false);

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemName, setItemName] = useState("");
  const [onHand, setOnHand] = useState("0");
  const [reserved, setReserved] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string | boolean>>({});
  const [savingItem, setSavingItem] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOnHand, setEditOnHand] = useState("0");
  const [editReserved, setEditReserved] = useState("0");
  const [editReorderPoint, setEditReorderPoint] = useState("");
  const [editCustomValues, setEditCustomValues] = useState<Record<string, string | boolean>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false);
  const [purchaseOrderName, setPurchaseOrderName] = useState("");
  const [purchaseExpectedAt, setPurchaseExpectedAt] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, string>>({});
  const [savingPurchaseOrder, setSavingPurchaseOrder] = useState(false);

  const [editingPurchaseOrderId, setEditingPurchaseOrderId] = useState<string | null>(null);
  const [editPurchaseOrderName, setEditPurchaseOrderName] = useState("");
  const [editPurchaseExpectedAt, setEditPurchaseExpectedAt] = useState("");
  const [editPurchaseNotes, setEditPurchaseNotes] = useState("");
  const [editPurchaseQuantities, setEditPurchaseQuantities] = useState<Record<string, string>>({});
  const [savingPurchaseOrderEdit, setSavingPurchaseOrderEdit] = useState(false);
  const [placingPurchaseOrderId, setPlacingPurchaseOrderId] = useState<string | null>(null);

  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryPurchaseOrderId, setDeliveryPurchaseOrderId] = useState("");
  const [deliveryTrackingNumber, setDeliveryTrackingNumber] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [deliveryExpectedAt, setDeliveryExpectedAt] = useState("");
  const [savingDelivery, setSavingDelivery] = useState(false);

  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [editDeliveryPurchaseOrderId, setEditDeliveryPurchaseOrderId] = useState("");
  const [editDeliveryTrackingNumber, setEditDeliveryTrackingNumber] = useState("");
  const [editDeliveryInstructions, setEditDeliveryInstructions] = useState("");
  const [editDeliveryExpectedAt, setEditDeliveryExpectedAt] = useState("");
  const [savingDeliveryEdit, setSavingDeliveryEdit] = useState(false);

  const [receivingDeliveryId, setReceivingDeliveryId] = useState<string | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [finishingDeliveryId, setFinishingDeliveryId] = useState<string | null>(null);

  async function loadInventory() {
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

      const [fieldsResult, itemsResult, ordersResult, deliveriesResult] = await Promise.all([
        supabase
          .from("business_inventory_fields")
          .select("id,name,field_type,position")
          .eq("organization_id", activeOrganizationId)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("business_inventory_items")
          .select("id,name,on_hand,reserved,reorder_point,attributes")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_purchase_orders")
          .select("id,order_name,status,expected_at,notes")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("business_inventory_deliveries")
          .select("id,purchase_order_id,tracking_number,delivery_instructions,expected_at,received_at")
          .eq("organization_id", activeOrganizationId)
          .order("created_at", { ascending: false }),
      ]);

      if (fieldsResult.error) throw fieldsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (deliveriesResult.error) throw deliveriesResult.error;

      const orderIds = (ordersResult.data || []).map((order) => order.id);
      const orderItemsResult =
        orderIds.length > 0
          ? await supabase
              .from("business_purchase_order_items")
              .select("purchase_order_id,inventory_item_id,quantity_ordered,quantity_received")
              .in("purchase_order_id", orderIds)
          : { data: [], error: null };

      if (orderItemsResult.error) throw orderItemsResult.error;

      const deliveryIds = (deliveriesResult.data || []).map((delivery) => delivery.id);
      const deliveryItemsResult =
        deliveryIds.length > 0
          ? await supabase
              .from("business_inventory_delivery_items")
              .select("delivery_id,inventory_item_id,quantity_received")
              .in("delivery_id", deliveryIds)
          : { data: [], error: null };

      if (deliveryItemsResult.error) throw deliveryItemsResult.error;

      setInventoryFields((fieldsResult.data || []) as InventoryField[]);
      setInventoryItems(
        (itemsResult.data || []).map((item) => ({
          id: item.id,
          name: item.name,
          onHand: Number(item.on_hand || 0),
          reserved: Number(item.reserved || 0),
          reorderPoint:
            item.reorder_point === null ? null : Number(item.reorder_point),
          attributes:
            item.attributes && typeof item.attributes === "object"
              ? (item.attributes as Record<string, unknown>)
              : {},
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
            notes: order.notes,
            itemCount: lines.length,
            totalQuantity: lines.reduce(
              (sum, line) => sum + Number(line.quantity_ordered || 0),
              0
            ),
            quantities: lines.reduce<Record<string, number>>((result, line) => {
              result[line.inventory_item_id] = Number(line.quantity_ordered || 0);
              return result;
            }, {}),
            receivedQuantities: lines.reduce<Record<string, number>>((result, line) => {
              result[line.inventory_item_id] = Number(line.quantity_received || 0);
              return result;
            }, {}),
          };
        })
      );

      setDeliveries(
        (deliveriesResult.data || []).map((delivery) => ({
          id: delivery.id,
          purchaseOrderId: delivery.purchase_order_id,
          trackingNumber: delivery.tracking_number,
          deliveryInstructions: delivery.delivery_instructions,
          expectedAt: delivery.expected_at,
          receivedAt: delivery.received_at,
        }))
      );

      setDeliveryItems(
        (deliveryItemsResult.data || []).map((line) => ({
          deliveryId: line.delivery_id,
          inventoryItemId: line.inventory_item_id,
          quantityReceived: Number(line.quantity_received || 0),
        }))
      );
    } catch (loadError) {
      console.error("Unable to load Business inventory:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Business inventory."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inventoryItems;

    return inventoryItems.filter((item) =>
      [item.name, ...Object.values(item.attributes || {})]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [inventoryItems, search]);

  async function addColumn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = columnName.trim();
    if (!organizationId || !name || savingColumn) return;

    setSavingColumn(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const nextPosition =
        inventoryFields.length === 0
          ? 0
          : Math.max(...inventoryFields.map((field) => field.position)) + 1;

      const { error: insertError } = await supabase
        .from("business_inventory_fields")
        .insert({
          organization_id: organizationId,
          name,
          field_type: columnType,
          position: nextPosition,
        });

      if (insertError) throw insertError;

      setColumnName("");
      setColumnType("text");
      setShowColumnForm(false);
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to add inventory column:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add inventory column."
      );
    } finally {
      setSavingColumn(false);
    }
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = itemName.trim();
    if (!organizationId || !name || savingItem) return;

    const parsedOnHand = Number(onHand);
    const parsedReserved = Number(reserved);
    const parsedReorderPoint =
      reorderPoint.trim() === "" ? null : Number(reorderPoint);

    if (
      !Number.isFinite(parsedOnHand) ||
      !Number.isFinite(parsedReserved) ||
      (parsedReorderPoint !== null && !Number.isFinite(parsedReorderPoint)) ||
      parsedOnHand < 0 ||
      parsedReserved < 0 ||
      (parsedReorderPoint !== null && parsedReorderPoint < 0)
    ) {
      setError("Inventory quantities must be valid non-negative numbers.");
      return;
    }

    const attributes = inventoryFields.reduce<Record<string, unknown>>(
      (result, field) => {
        const value = customValues[field.id];

        if (field.field_type === "boolean") {
          result[field.id] = value === true;
        } else if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          result[field.id] =
            field.field_type === "number" ? Number(value) : String(value);
        }

        return result;
      },
      {}
    );

    setSavingItem(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from("business_inventory_items")
        .insert({
          organization_id: organizationId,
          name,
          on_hand: parsedOnHand,
          reserved: parsedReserved,
          reorder_point: parsedReorderPoint,
          attributes,
        });

      if (insertError) throw insertError;

      setItemName("");
      setOnHand("0");
      setReserved("0");
      setReorderPoint("");
      setCustomValues({});
      setShowItemForm(false);
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to add inventory item:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add inventory item."
      );
    } finally {
      setSavingItem(false);
    }
  }

  function beginEdit(item: InventoryItem) {
    const values = inventoryFields.reduce<Record<string, string | boolean>>(
      (result, field) => {
        const value = item.attributes?.[field.id];

        if (field.field_type === "boolean") {
          result[field.id] = value === true;
        } else if (value !== null && value !== undefined) {
          result[field.id] = String(value);
        }

        return result;
      },
      {}
    );

    setEditingItemId(item.id);
    setEditName(item.name);
    setEditOnHand(String(item.onHand));
    setEditReserved(String(item.reserved));
    setEditReorderPoint(item.reorderPoint === null ? "" : String(item.reorderPoint));
    setEditCustomValues(values);
    setError(null);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setEditName("");
    setEditOnHand("0");
    setEditReserved("0");
    setEditReorderPoint("");
    setEditCustomValues({});
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = editName.trim();
    if (!editingItemId || !organizationId || !name || savingEdit) return;

    const parsedOnHand = Number(editOnHand);
    const parsedReserved = Number(editReserved);
    const parsedReorderPoint =
      editReorderPoint.trim() === "" ? null : Number(editReorderPoint);

    if (
      !Number.isFinite(parsedOnHand) ||
      !Number.isFinite(parsedReserved) ||
      (parsedReorderPoint !== null && !Number.isFinite(parsedReorderPoint)) ||
      parsedOnHand < 0 ||
      parsedReserved < 0 ||
      (parsedReorderPoint !== null && parsedReorderPoint < 0)
    ) {
      setError("Inventory quantities must be valid non-negative numbers.");
      return;
    }

    const attributes = inventoryFields.reduce<Record<string, unknown>>(
      (result, field) => {
        const value = editCustomValues[field.id];

        if (field.field_type === "boolean") {
          result[field.id] = value === true;
        } else if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          result[field.id] =
            field.field_type === "number" ? Number(value) : String(value);
        }

        return result;
      },
      {}
    );

    setSavingEdit(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("business_inventory_items")
        .update({
          name,
          on_hand: parsedOnHand,
          reserved: parsedReserved,
          reorder_point: parsedReorderPoint,
          attributes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItemId)
        .eq("organization_id", organizationId);

      if (updateError) throw updateError;

      cancelEdit();
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to update inventory item:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update inventory item."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function addPurchaseOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const orderName = purchaseOrderName.trim();
    if (!organizationId || !orderName || savingPurchaseOrder) return;

    const lines = inventoryItems
      .map((item) => {
        const rawQuantity = purchaseQuantities[item.id]?.trim() || "";
        const quantity = rawQuantity === "" ? 0 : Number(rawQuantity);

        return {
          inventoryItemId: item.id,
          quantity,
        };
      })
      .filter((line) => line.quantity > 0);

    if (lines.length === 0) {
      setError("Add at least one inventory item with a quantity greater than zero.");
      return;
    }

    if (
      lines.some(
        (line) => !Number.isFinite(line.quantity) || line.quantity <= 0
      )
    ) {
      setError("Purchase quantities must be valid numbers greater than zero.");
      return;
    }

    setSavingPurchaseOrder(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: order, error: orderError } = await supabase
        .from("business_purchase_orders")
        .insert({
          organization_id: organizationId,
          order_name: orderName,
          status: "draft",
          expected_at:
            purchaseExpectedAt.trim() === ""
              ? null
              : new Date(`${purchaseExpectedAt}T12:00:00`).toISOString(),
          notes: purchaseNotes.trim() === "" ? null : purchaseNotes.trim(),
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      const { error: lineError } = await supabase
        .from("business_purchase_order_items")
        .insert(
          lines.map((line) => ({
            purchase_order_id: order.id,
            inventory_item_id: line.inventoryItemId,
            quantity_ordered: line.quantity,
            quantity_received: 0,
          }))
        );

      if (lineError) {
        await supabase
          .from("business_purchase_orders")
          .delete()
          .eq("id", order.id)
          .eq("organization_id", organizationId);

        throw lineError;
      }

      setPurchaseOrderName("");
      setPurchaseExpectedAt("");
      setPurchaseNotes("");
      setPurchaseQuantities({});
      setShowPurchaseOrderForm(false);
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to create purchase order:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create purchase order."
      );
    } finally {
      setSavingPurchaseOrder(false);
    }
  }

  function beginPurchaseOrderEdit(order: PurchaseOrder) {
    if (order.status !== "draft") return;

    setEditingPurchaseOrderId(order.id);
    setEditPurchaseOrderName(order.orderName);
    setEditPurchaseExpectedAt(
      order.expectedAt ? order.expectedAt.slice(0, 10) : ""
    );
    setEditPurchaseNotes(order.notes || "");
    setEditPurchaseQuantities(
      Object.entries(order.quantities).reduce<Record<string, string>>(
        (result, [inventoryItemId, quantity]) => {
          result[inventoryItemId] = String(quantity);
          return result;
        },
        {}
      )
    );
    setError(null);
  }

  function cancelPurchaseOrderEdit() {
    setEditingPurchaseOrderId(null);
    setEditPurchaseOrderName("");
    setEditPurchaseExpectedAt("");
    setEditPurchaseNotes("");
    setEditPurchaseQuantities({});
  }

  async function savePurchaseOrderEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const orderName = editPurchaseOrderName.trim();
    if (
      !organizationId ||
      !editingPurchaseOrderId ||
      !orderName ||
      savingPurchaseOrderEdit
    ) {
      return;
    }

    const lines = inventoryItems
      .map((item) => {
        const rawQuantity = editPurchaseQuantities[item.id]?.trim() || "";
        const quantity = rawQuantity === "" ? 0 : Number(rawQuantity);

        return {
          inventoryItemId: item.id,
          quantity,
        };
      })
      .filter((line) => line.quantity > 0);

    if (lines.length === 0) {
      setError("Keep at least one inventory item on the purchase order.");
      return;
    }

    if (
      lines.some(
        (line) => !Number.isFinite(line.quantity) || line.quantity <= 0
      )
    ) {
      setError("Purchase quantities must be valid numbers greater than zero.");
      return;
    }

    setSavingPurchaseOrderEdit(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: orderError } = await supabase
        .from("business_purchase_orders")
        .update({
          order_name: orderName,
          expected_at:
            editPurchaseExpectedAt.trim() === ""
              ? null
              : new Date(`${editPurchaseExpectedAt}T12:00:00`).toISOString(),
          notes:
            editPurchaseNotes.trim() === "" ? null : editPurchaseNotes.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPurchaseOrderId)
        .eq("organization_id", organizationId)
        .eq("status", "draft");

      if (orderError) throw orderError;

      const { error: deleteLinesError } = await supabase
        .from("business_purchase_order_items")
        .delete()
        .eq("purchase_order_id", editingPurchaseOrderId);

      if (deleteLinesError) throw deleteLinesError;

      const { error: insertLinesError } = await supabase
        .from("business_purchase_order_items")
        .insert(
          lines.map((line) => ({
            purchase_order_id: editingPurchaseOrderId,
            inventory_item_id: line.inventoryItemId,
            quantity_ordered: line.quantity,
            quantity_received: 0,
          }))
        );

      if (insertLinesError) throw insertLinesError;

      cancelPurchaseOrderEdit();
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to update purchase order:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update purchase order."
      );
    } finally {
      setSavingPurchaseOrderEdit(false);
    }
  }

  async function placePurchaseOrder(order: PurchaseOrder) {
    if (
      !organizationId ||
      order.status !== "draft" ||
      placingPurchaseOrderId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Place "${order.orderName}"? This marks the purchase order as Ordered and records the current time as the order date.`
    );

    if (!confirmed) return;

    setPlacingPurchaseOrderId(order.id);
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
        .eq("id", order.id)
        .eq("organization_id", organizationId)
        .eq("status", "draft");

      if (updateError) throw updateError;

      if (editingPurchaseOrderId === order.id) {
        cancelPurchaseOrderEdit();
      }

      await loadInventory();
    } catch (placeError) {
      console.error("Unable to place purchase order:", placeError);
      setError(
        placeError instanceof Error
          ? placeError.message
          : "Unable to place purchase order."
      );
    } finally {
      setPlacingPurchaseOrderId(null);
    }
  }

  async function addDelivery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !organizationId ||
      !deliveryPurchaseOrderId ||
      savingDelivery
    ) {
      return;
    }

    const connectedOrder = purchaseOrders.find(
      (order) => order.id === deliveryPurchaseOrderId
    );

    if (
      !connectedOrder ||
      (connectedOrder.status !== "ordered" &&
        connectedOrder.status !== "partially_received")
    ) {
      setError("Choose an ordered purchase order for this delivery.");
      return;
    }

    setSavingDelivery(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from("business_inventory_deliveries")
        .insert({
          organization_id: organizationId,
          purchase_order_id: deliveryPurchaseOrderId,
          tracking_number:
            deliveryTrackingNumber.trim() === ""
              ? null
              : deliveryTrackingNumber.trim(),
          delivery_instructions:
            deliveryInstructions.trim() === ""
              ? null
              : deliveryInstructions.trim(),
          expected_at:
            deliveryExpectedAt.trim() === ""
              ? null
              : new Date(`${deliveryExpectedAt}T12:00:00`).toISOString(),
        });

      if (insertError) throw insertError;

      setDeliveryPurchaseOrderId("");
      setDeliveryTrackingNumber("");
      setDeliveryInstructions("");
      setDeliveryExpectedAt("");
      setShowDeliveryForm(false);
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to create delivery:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create delivery."
      );
    } finally {
      setSavingDelivery(false);
    }
  }

  function beginDeliveryEdit(delivery: InventoryDelivery) {
    if (delivery.receivedAt) return;

    setEditingDeliveryId(delivery.id);
    setEditDeliveryPurchaseOrderId(delivery.purchaseOrderId);
    setEditDeliveryTrackingNumber(delivery.trackingNumber || "");
    setEditDeliveryInstructions(delivery.deliveryInstructions || "");
    setEditDeliveryExpectedAt(
      delivery.expectedAt ? delivery.expectedAt.slice(0, 10) : ""
    );
    setError(null);
  }

  function cancelDeliveryEdit() {
    setEditingDeliveryId(null);
    setEditDeliveryPurchaseOrderId("");
    setEditDeliveryTrackingNumber("");
    setEditDeliveryInstructions("");
    setEditDeliveryExpectedAt("");
  }

  async function saveDeliveryEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !organizationId ||
      !editingDeliveryId ||
      !editDeliveryPurchaseOrderId ||
      savingDeliveryEdit
    ) {
      return;
    }

    const connectedOrder = purchaseOrders.find(
      (order) => order.id === editDeliveryPurchaseOrderId
    );

    if (
      !connectedOrder ||
      (connectedOrder.status !== "ordered" &&
        connectedOrder.status !== "partially_received")
    ) {
      setError("Choose an ordered purchase order for this delivery.");
      return;
    }

    setSavingDeliveryEdit(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("business_inventory_deliveries")
        .update({
          purchase_order_id: editDeliveryPurchaseOrderId,
          tracking_number:
            editDeliveryTrackingNumber.trim() === ""
              ? null
              : editDeliveryTrackingNumber.trim(),
          delivery_instructions:
            editDeliveryInstructions.trim() === ""
              ? null
              : editDeliveryInstructions.trim(),
          expected_at:
            editDeliveryExpectedAt.trim() === ""
              ? null
              : new Date(`${editDeliveryExpectedAt}T12:00:00`).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingDeliveryId)
        .eq("organization_id", organizationId)
        .is("received_at", null);

      if (updateError) throw updateError;

      cancelDeliveryEdit();
      await loadInventory();
    } catch (saveError) {
      console.error("Unable to update delivery:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update delivery."
      );
    } finally {
      setSavingDeliveryEdit(false);
    }
  }

  function beginReceiveDelivery(delivery: InventoryDelivery) {
    if (delivery.receivedAt) return;

    const order = purchaseOrders.find(
      (purchaseOrder) => purchaseOrder.id === delivery.purchaseOrderId
    );

    if (!order) {
      setError("Unable to find the purchase order connected to this delivery.");
      return;
    }

    setReceivingDeliveryId(delivery.id);
    setReceiveQuantities({});
    setError(null);
  }

  function cancelReceiveDelivery() {
    setReceivingDeliveryId(null);
    setReceiveQuantities({});
  }

  useEffect(() => {
    if (loading || receivingDeliveryId) return;

    const deliveryId = new URLSearchParams(window.location.search).get("receive");
    if (!deliveryId) return;

    const delivery = deliveries.find(
      (item) => item.id === deliveryId && !item.receivedAt
    );
    if (!delivery) return;

    const order = purchaseOrders.find(
      (item) =>
        item.id === delivery.purchaseOrderId &&
        (item.status === "ordered" || item.status === "partially_received")
    );
    if (!order) return;

    beginReceiveDelivery(delivery);

    window.setTimeout(() => {
      document
        .getElementById(`delivery-receive-${delivery.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, [loading, deliveries, purchaseOrders, receivingDeliveryId]);

  async function receiveDelivery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !receivingDeliveryId || savingReceipt) return;

    const delivery = deliveries.find((item) => item.id === receivingDeliveryId);
    if (!delivery || delivery.receivedAt) {
      setError("This delivery is no longer available to receive.");
      return;
    }

    const order = purchaseOrders.find(
      (purchaseOrder) => purchaseOrder.id === delivery.purchaseOrderId
    );

    if (
      !order ||
      (order.status !== "ordered" && order.status !== "partially_received")
    ) {
      setError("This delivery is not connected to an active purchase order.");
      return;
    }

    const receiptLines = Object.keys(order.quantities)
      .map((inventoryItemId) => {
        const rawQuantity = receiveQuantities[inventoryItemId]?.trim() || "";
        const quantity = rawQuantity === "" ? 0 : Number(rawQuantity);
        return { inventoryItemId, quantity };
      })
      .filter((line) => line.quantity > 0);

    if (receiptLines.length === 0) {
      setError("Enter at least one received quantity greater than zero.");
      return;
    }

    if (
      receiptLines.some(
        (line) => !Number.isFinite(line.quantity) || line.quantity <= 0
      )
    ) {
      setError("Received quantities must be valid numbers greater than zero.");
      return;
    }

    const missingItem = receiptLines.find(
      (line) => !inventoryItems.some((item) => item.id === line.inventoryItemId)
    );

    if (missingItem) {
      setError("One of the purchase order items is no longer available in inventory.");
      return;
    }

    const confirmed = window.confirm(
      `Record these received quantities for "${order.orderName}"? This will add the entered quantities to On Hand. The delivery will remain Incoming until you explicitly finish it.`
    );

    if (!confirmed) return;

    setSavingReceipt(true);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const now = new Date().toISOString();

      const deliveryReceiptTotals = deliveryItems
        .filter((line) => line.deliveryId === delivery.id)
        .reduce<Record<string, number>>((result, line) => {
          result[line.inventoryItemId] = line.quantityReceived;
          return result;
        }, {});

      const { error: deliveryItemsError } = await supabase
        .from("business_inventory_delivery_items")
        .upsert(
          receiptLines.map((line) => ({
            delivery_id: delivery.id,
            inventory_item_id: line.inventoryItemId,
            quantity_received:
              (deliveryReceiptTotals[line.inventoryItemId] || 0) + line.quantity,
            updated_at: now,
          })),
          { onConflict: "delivery_id,inventory_item_id" }
        );

      if (deliveryItemsError) throw deliveryItemsError;

      for (const line of receiptLines) {
        const item = inventoryItems.find(
          (inventoryItem) => inventoryItem.id === line.inventoryItemId
        );
        if (!item) throw new Error("Unable to find an inventory item being received.");

        const previousReceived = order.receivedQuantities[line.inventoryItemId] || 0;

        const { error: inventoryUpdateError } = await supabase
          .from("business_inventory_items")
          .update({
            on_hand: item.onHand + line.quantity,
            updated_at: now,
          })
          .eq("id", line.inventoryItemId)
          .eq("organization_id", organizationId);

        if (inventoryUpdateError) throw inventoryUpdateError;

        const { error: orderLineUpdateError } = await supabase
          .from("business_purchase_order_items")
          .update({
            quantity_received: previousReceived + line.quantity,
            updated_at: now,
          })
          .eq("purchase_order_id", order.id)
          .eq("inventory_item_id", line.inventoryItemId);

        if (orderLineUpdateError) throw orderLineUpdateError;
      }

      const nextReceivedQuantities = { ...order.receivedQuantities };
      receiptLines.forEach((line) => {
        nextReceivedQuantities[line.inventoryItemId] =
          (nextReceivedQuantities[line.inventoryItemId] || 0) + line.quantity;
      });

      const orderComplete = Object.entries(order.quantities).every(
        ([inventoryItemId, quantityOrdered]) =>
          (nextReceivedQuantities[inventoryItemId] || 0) >= quantityOrdered
      );

      const { error: orderUpdateError } = await supabase
        .from("business_purchase_orders")
        .update({
          status: orderComplete ? "received" : "partially_received",
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("organization_id", organizationId);

      if (orderUpdateError) throw orderUpdateError;

      cancelReceiveDelivery();
      await loadInventory();
    } catch (receiveError) {
      console.error("Unable to receive inventory delivery:", receiveError);
      setError(
        receiveError instanceof Error
          ? receiveError.message
          : "Unable to receive inventory delivery."
      );
    } finally {
      setSavingReceipt(false);
    }
  }

  async function finishDelivery(delivery: InventoryDelivery) {
    if (!organizationId || delivery.receivedAt || finishingDeliveryId) return;

    const order = purchaseOrders.find(
      (purchaseOrder) => purchaseOrder.id === delivery.purchaseOrderId
    );

    const confirmed = window.confirm(
      `Finish this delivery${order ? ` for "${order.orderName}"` : ""}? This closes the shipment and prevents further receipt edits on this delivery.`
    );

    if (!confirmed) return;

    setFinishingDeliveryId(delivery.id);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("business_inventory_deliveries")
        .update({
          received_at: now,
          updated_at: now,
        })
        .eq("id", delivery.id)
        .eq("organization_id", organizationId)
        .is("received_at", null);

      if (updateError) throw updateError;

      if (receivingDeliveryId === delivery.id) {
        cancelReceiveDelivery();
      }

      await loadInventory();
    } catch (finishError) {
      console.error("Unable to finish inventory delivery:", finishError);
      setError(
        finishError instanceof Error
          ? finishError.message
          : "Unable to finish inventory delivery."
      );
    } finally {
      setFinishingDeliveryId(null);
    }
  }

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
        order.status === "draft" ||
        order.status === "ordered" ||
        order.status === "partially_received"
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
  const eligibleDeliveryOrders = purchaseOrders.filter(
    (order) =>
      order.status === "ordered" ||
      order.status === "partially_received"
  );
  const hasDeliveryData = deliveries.length > 0;

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

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/business/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ContactRound className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Contacts
            </Link>

            <Link
              href="/business/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 lg:rounded-xl lg:px-3 lg:py-2 lg:text-[11px]"
            >
              <ListChecks className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              Lists
            </Link>

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
            detail: "Open purchasing activity",
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

      {!loading && !hasInventoryData && !hasOrderData ? (
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
                No inventory items yet
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This organization has not created any inventory items yet. Define the
                columns this business uses, then add the first real item. Nothing
                has been estimated, generated, or filled with sample data.
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

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="relative block w-full sm:w-52">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory"
                  disabled={!hasInventoryData}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowColumnForm((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Settings2 className="h-4 w-4" />
                Define Column
              </button>

              <button
                type="button"
                onClick={() => setShowItemForm((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {showColumnForm ? (
            <form
              onSubmit={addColumn}
              className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">Define inventory column</p>
              <p className="mt-1 text-xs text-slate-500">
                Name the fields this business uses to describe its inventory.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                <input
                  value={columnName}
                  onChange={(event) => setColumnName(event.target.value)}
                  placeholder="Column name"
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />

                <select
                  value={columnType}
                  onChange={(event) =>
                    setColumnType(event.target.value as InventoryFieldType)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Yes / No</option>
                </select>

                <button
                  type="submit"
                  disabled={savingColumn || !columnName.trim()}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingColumn ? "Saving..." : "Add Column"}
                </button>
              </div>
            </form>
          ) : null}

          {showItemForm ? (
            <form
              onSubmit={addItem}
              className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">Add inventory item</p>
              <p className="mt-1 text-xs text-slate-500">
                Aether owns the stock math. This organization owns the inventory vocabulary.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Item Name</span>
                  <input
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">On Hand</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={onHand}
                    onChange={(event) => setOnHand(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Reserved</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={reserved}
                    onChange={(event) => setReserved(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Reorder Point</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={reorderPoint}
                    onChange={(event) => setReorderPoint(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                {inventoryFields.map((field) => (
                  <label key={field.id} className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">
                      {field.name}
                    </span>

                    {field.field_type === "boolean" ? (
                      <select
                        value={customValues[field.id] === true ? "true" : "false"}
                        onChange={(event) =>
                          setCustomValues((current) => ({
                            ...current,
                            [field.id]: event.target.value === "true",
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : (
                      <input
                        type={
                          field.field_type === "number"
                            ? "number"
                            : field.field_type === "date"
                              ? "date"
                              : "text"
                        }
                        step={field.field_type === "number" ? "any" : undefined}
                        value={String(customValues[field.id] ?? "")}
                        onChange={(event) =>
                          setCustomValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingItem || !itemName.trim()}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingItem ? "Saving..." : "Add Item"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-5">
            {loading ? (
              <EmptyState
                icon={Boxes}
                title="Loading inventory"
                body="Reading this organization's inventory records."
              />
            ) : !hasInventoryData ? (
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
                      {inventoryFields.map((field) => (
                        <th key={field.id} className="pb-3 font-semibold">
                          {field.name}
                        </th>
                      ))}
                      <th className="pb-3 text-right font-semibold">On Hand</th>
                      <th className="pb-3 text-right font-semibold">Reserved</th>
                      <th className="pb-3 text-right font-semibold">Available</th>
                      <th className="pb-3 text-right font-semibold">Reorder Point</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-4 font-medium text-slate-900">{item.name}</td>
                        {inventoryFields.map((field) => {
                          const value = item.attributes?.[field.id];

                          return (
                            <td key={field.id} className="py-4 text-slate-600">
                              {field.field_type === "boolean"
                                ? value === true
                                  ? "Yes"
                                  : "No"
                                : value === null || value === undefined || value === ""
                                  ? "—"
                                  : String(value)}
                            </td>
                          );
                        })}
                        <td className="py-4 text-right text-slate-700">{item.onHand}</td>
                        <td className="py-4 text-right text-slate-700">{item.reserved}</td>
                        <td className="py-4 text-right font-medium text-slate-900">
                          {Math.max(item.onHand - item.reserved, 0)}
                        </td>
                        <td className="py-4 text-right text-slate-700">
                          {item.reorderPoint === null ? "—" : item.reorderPoint}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editingItemId ? (
            <form
              onSubmit={saveEdit}
              className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Edit inventory item</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Update stock values and organization-defined fields.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={savingEdit}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Item Name</span>
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">On Hand</span>
                  <input type="number" min="0" step="any" value={editOnHand} onChange={(event) => setEditOnHand(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Reserved</span>
                  <input type="number" min="0" step="any" value={editReserved} onChange={(event) => setEditReserved(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Reorder Point</span>
                  <input type="number" min="0" step="any" value={editReorderPoint} onChange={(event) => setEditReorderPoint(event.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400" />
                </label>

                {inventoryFields.map((field) => (
                  <label key={field.id} className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">{field.name}</span>
                    {field.field_type === "boolean" ? (
                      <select
                        value={editCustomValues[field.id] === true ? "true" : "false"}
                        onChange={(event) =>
                          setEditCustomValues((current) => ({
                            ...current,
                            [field.id]: event.target.value === "true",
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : (
                      <input
                        type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                        step={field.field_type === "number" ? "any" : undefined}
                        value={String(editCustomValues[field.id] ?? "")}
                        onChange={(event) =>
                          setEditCustomValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : null}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            <button
              type="button"
              onClick={() => setShowPurchaseOrderForm((current) => !current)}
              disabled={!hasInventoryData}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </button>
          </div>

          {showPurchaseOrderForm ? (
            <form
              onSubmit={addPurchaseOrder}
              className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">Create purchase order</p>
              <p className="mt-1 text-xs text-slate-500">
                Build the order now. It will remain Draft until it is actually placed.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Order Name</span>
                  <input
                    value={purchaseOrderName}
                    onChange={(event) => setPurchaseOrderName(event.target.value)}
                    placeholder="October Restock"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Expected Date</span>
                  <input
                    type="date"
                    value={purchaseExpectedAt}
                    onChange={(event) => setPurchaseExpectedAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Inventory Items
                </p>
                <div className="mt-2 space-y-2">
                  {inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_130px] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {Math.max(item.onHand - item.reserved, 0)} available
                          {item.reorderPoint === null
                            ? ""
                            : ` · Reorder point ${item.reorderPoint}`}
                        </p>
                      </div>

                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Quantity
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={purchaseQuantities[item.id] ?? ""}
                          onChange={(event) =>
                            setPurchaseQuantities((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-4 block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Notes</span>
                <textarea
                  value={purchaseNotes}
                  onChange={(event) => setPurchaseNotes(event.target.value)}
                  rows={3}
                  placeholder="Optional purchasing notes"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPurchaseOrder || !purchaseOrderName.trim()}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPurchaseOrder ? "Saving..." : "Save Draft"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-5">
            {!hasOrderData ? (
              <EmptyState
                icon={ClipboardList}
                title="No purchase orders yet"
                body="Create the first real purchase order from this organization's inventory."
              />
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{order.orderName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                          {" · "}
                          {order.totalQuantity.toLocaleString()} ordered
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                          {order.status.replace("_", " ")}
                        </span>
                        {order.status === "draft" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => beginPurchaseOrderEdit(order)}
                              disabled={placingPurchaseOrderId === order.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void placePurchaseOrder(order)}
                              disabled={placingPurchaseOrderId !== null}
                              className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {placingPurchaseOrderId === order.id
                                ? "Placing..."
                                : "Place Order"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {order.expectedAt ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Expected{" "}
                        {new Date(order.expectedAt).toLocaleDateString()}
                      </p>
                    ) : null}

                    {order.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {order.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingPurchaseOrderId ? (
            <form
              onSubmit={savePurchaseOrderEdit}
              className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Edit draft purchase order</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Update the draft before it is placed. Set an item quantity to 0 to remove it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelPurchaseOrderEdit}
                  disabled={savingPurchaseOrderEdit}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Order Name</span>
                  <input
                    value={editPurchaseOrderName}
                    onChange={(event) => setEditPurchaseOrderName(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Expected Date</span>
                  <input
                    type="date"
                    value={editPurchaseExpectedAt}
                    onChange={(event) => setEditPurchaseExpectedAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Inventory Items
                </p>
                <div className="mt-2 space-y-2">
                  {inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_130px] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {Math.max(item.onHand - item.reserved, 0)} available
                          {item.reorderPoint === null
                            ? ""
                            : ` · Reorder point ${item.reorderPoint}`}
                        </p>
                      </div>

                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Quantity
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editPurchaseQuantities[item.id] ?? ""}
                          onChange={(event) =>
                            setEditPurchaseQuantities((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-4 block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Notes</span>
                <textarea
                  value={editPurchaseNotes}
                  onChange={(event) => setEditPurchaseNotes(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPurchaseOrderEdit || !editPurchaseOrderName.trim()}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPurchaseOrderEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-2xl lg:p-[18px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            <button
              type="button"
              onClick={() => setShowDeliveryForm((current) => !current)}
              disabled={eligibleDeliveryOrders.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create Delivery
            </button>
          </div>

          {showDeliveryForm ? (
            <form
              onSubmit={addDelivery}
              className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">Create delivery</p>
              <p className="mt-1 text-xs text-slate-500">
                Connect a real incoming shipment to an ordered purchase order.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Purchase Order
                  </span>
                  <select
                    value={deliveryPurchaseOrderId}
                    onChange={(event) =>
                      setDeliveryPurchaseOrderId(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option value="">Choose order</option>
                    {eligibleDeliveryOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Expected Date
                  </span>
                  <input
                    type="date"
                    value={deliveryExpectedAt}
                    onChange={(event) => setDeliveryExpectedAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Tracking Number
                  </span>
                  <input
                    value={deliveryTrackingNumber}
                    onChange={(event) =>
                      setDeliveryTrackingNumber(event.target.value)
                    }
                    placeholder="Optional shipment reference"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Delivery Instructions
                  </span>
                  <textarea
                    value={deliveryInstructions}
                    onChange={(event) =>
                      setDeliveryInstructions(event.target.value)
                    }
                    rows={3}
                    placeholder="Optional receiving or drop-off instructions"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingDelivery || !deliveryPurchaseOrderId}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingDelivery ? "Saving..." : "Save Delivery"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-5">
            {!hasDeliveryData ? (
              <EmptyState
                icon={Truck}
                title="No incoming deliveries"
                body={
                  eligibleDeliveryOrders.length > 0
                    ? "Create the first delivery for an ordered purchase order."
                    : "Place a purchase order before creating an incoming delivery."
                }
              />
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => {
                  const order = purchaseOrders.find(
                    (purchaseOrder) =>
                      purchaseOrder.id === delivery.purchaseOrderId
                  );

                  return (
                    <div
                      key={delivery.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {order?.orderName || "Purchase Order"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {delivery.trackingNumber
                              ? `Tracking ${delivery.trackingNumber}`
                              : "No tracking number recorded"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {delivery.receivedAt ? "Received" : "Incoming"}
                          </span>
                          {!delivery.receivedAt ? (
                            <>
                              <button
                                type="button"
                                onClick={() => beginDeliveryEdit(delivery)}
                                disabled={savingReceipt}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => beginReceiveDelivery(delivery)}
                                disabled={savingReceipt || finishingDeliveryId === delivery.id}
                                className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Receive Inventory
                              </button>
                              <button
                                type="button"
                                onClick={() => void finishDelivery(delivery)}
                                disabled={savingReceipt || finishingDeliveryId === delivery.id}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {finishingDeliveryId === delivery.id
                                  ? "Finishing..."
                                  : "Finish Delivery"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {delivery.expectedAt ? (
                        <p className="mt-3 text-sm text-slate-500">
                          Expected{" "}
                          {new Date(delivery.expectedAt).toLocaleDateString()}
                        </p>
                      ) : null}

                      {delivery.deliveryInstructions ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {delivery.deliveryInstructions}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {receivingDeliveryId ? (() => {
            const delivery = deliveries.find((item) => item.id === receivingDeliveryId);
            const order = delivery
              ? purchaseOrders.find((item) => item.id === delivery.purchaseOrderId)
              : null;

            if (!delivery || !order) return null;

            return (
              <form
                id={`delivery-receive-${delivery.id}`}
                onSubmit={receiveDelivery}
                className="mt-5 scroll-mt-6 rounded-2xl border border-slate-300 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">Receive inventory</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Record what physically arrived in this shipment for {order.orderName}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cancelReceiveDelivery}
                    disabled={savingReceipt}
                    className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {Object.entries(order.quantities).map(
                    ([inventoryItemId, quantityOrdered]) => {
                      const item = inventoryItems.find(
                        (inventoryItem) => inventoryItem.id === inventoryItemId
                      );
                      const alreadyReceived =
                        order.receivedQuantities[inventoryItemId] || 0;
                      const receivedOnThisDelivery = deliveryItems
                        .filter(
                          (line) =>
                            line.deliveryId === delivery.id &&
                            line.inventoryItemId === inventoryItemId
                        )
                        .reduce((sum, line) => sum + line.quantityReceived, 0);
                      const remaining = Math.max(
                        quantityOrdered - alreadyReceived,
                        0
                      );

                      return (
                        <div
                          key={inventoryItemId}
                          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(180px,1.6fr)_repeat(4,minmax(70px,0.65fr))_minmax(96px,112px)] md:items-end"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item?.name || "Inventory Item"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Record the quantity inside this delivery.
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500">Ordered</p>
                            <p className="mt-1 text-sm text-slate-800">{quantityOrdered}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500">Received</p>
                            <p className="mt-1 text-sm text-slate-800">{alreadyReceived}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500">This Delivery</p>
                            <p className="mt-1 text-sm text-slate-800">{receivedOnThisDelivery}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500">Remaining</p>
                            <p className="mt-1 text-sm text-slate-800">{remaining}</p>
                          </div>
                          <label className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Arrived Now
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={receiveQuantities[inventoryItemId] ?? ""}
                              onChange={(event) =>
                                setReceiveQuantities((current) => ({
                                  ...current,
                                  [inventoryItemId]: event.target.value,
                                }))
                              }
                              placeholder="0"
                              className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                            />
                          </label>
                        </div>
                      );
                    }
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Commit Receipt records another batch against this delivery and keeps the shipment open. Use Finish Delivery only when no more inventory will be recorded against this shipment. Aether does not cap receipt quantities at the remaining ordered amount.
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingReceipt}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingReceipt ? "Recording..." : "Commit Receipt"}
                  </button>
                </div>
              </form>
            );
          })() : null}

          {editingDeliveryId ? (
            <form
              onSubmit={saveDeliveryEdit}
              className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Edit delivery</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Update shipment details while this delivery is still incoming.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelDeliveryEdit}
                  disabled={savingDeliveryEdit}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Purchase Order
                  </span>
                  <select
                    value={editDeliveryPurchaseOrderId}
                    onChange={(event) =>
                      setEditDeliveryPurchaseOrderId(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option value="">Choose order</option>
                    {eligibleDeliveryOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Expected Date
                  </span>
                  <input
                    type="date"
                    value={editDeliveryExpectedAt}
                    onChange={(event) =>
                      setEditDeliveryExpectedAt(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Tracking Number
                  </span>
                  <input
                    value={editDeliveryTrackingNumber}
                    onChange={(event) =>
                      setEditDeliveryTrackingNumber(event.target.value)
                    }
                    placeholder="Optional shipment reference"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Delivery Instructions
                  </span>
                  <textarea
                    value={editDeliveryInstructions}
                    onChange={(event) =>
                      setEditDeliveryInstructions(event.target.value)
                    }
                    rows={3}
                    placeholder="Optional receiving or drop-off instructions"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    savingDeliveryEdit || !editDeliveryPurchaseOrderId
                  }
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingDeliveryEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
