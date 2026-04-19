"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type OwnerContextValue = {
  ownerFilter: string;
  savedHomeOwner: string;
  setOwnerFilter: (value: string) => void;
  saveHomeOwner: (value: string) => void;
  clearHomeOwner: () => void;
  applyMyDashboard: () => void;
};

const DASHBOARD_HOME_OWNER_KEY = "dashboard_home_owner";
const DASHBOARD_ACTIVE_OWNER_KEY = "dashboard_active_owner";

const OwnerContext = createContext<OwnerContextValue | null>(null);

export function DashboardOwnerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ownerFilter, setOwnerFilterState] = useState("");
  const [savedHomeOwner, setSavedHomeOwner] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedHome = window.localStorage.getItem(DASHBOARD_HOME_OWNER_KEY) || "";
    const storedActive =
      window.localStorage.getItem(DASHBOARD_ACTIVE_OWNER_KEY) || storedHome || "";

    setSavedHomeOwner(storedHome);
    setOwnerFilterState(storedActive);
  }, []);

  function setOwnerFilter(value: string) {
    const nextValue = value.trim();

    setOwnerFilterState(nextValue);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DASHBOARD_ACTIVE_OWNER_KEY, nextValue);
    }
  }

  function saveHomeOwner(value: string) {
    const nextValue = value.trim();

    setSavedHomeOwner(nextValue);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DASHBOARD_HOME_OWNER_KEY, nextValue);
    }
  }

  function clearHomeOwner() {
    setSavedHomeOwner("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DASHBOARD_HOME_OWNER_KEY);
    }
  }

  function applyMyDashboard() {
    setOwnerFilter(savedHomeOwner);
  }

  const value = useMemo<OwnerContextValue>(
    () => ({
      ownerFilter,
      savedHomeOwner,
      setOwnerFilter,
      saveHomeOwner,
      clearHomeOwner,
      applyMyDashboard,
    }),
    [ownerFilter, savedHomeOwner]
  );

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
}

export function useDashboardOwner() {
  const context = useContext(OwnerContext);

  if (!context) {
    throw new Error("useDashboardOwner must be used inside DashboardOwnerProvider");
  }

  return context;
}