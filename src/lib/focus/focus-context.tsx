"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FocusDomain =
  | "finance"
  | "field"
  | "outreach"
  | "digital"
  | "print";

export type FocusBucket =
  | "immediate"
  | "fixNow"
  | "followUp"
  | "routing"
  | "owner"
  | "pipeline";

export type FocusContextValue = {
  domain?: FocusDomain;
  bucket?: FocusBucket;
  trigger?: string;
  source?: "dashboard" | "admin";
};

type FocusRoutingContextValue = {
  focusContext: FocusContextValue | null;
  setFocusContext: (value: FocusContextValue | null) => void;
  clearFocusContext: () => void;
};

const FocusRoutingContext = createContext<FocusRoutingContextValue | null>(null);

export function FocusContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [focusContext, setFocusContextState] =
    useState<FocusContextValue | null>(null);

  const setFocusContext = useCallback((value: FocusContextValue | null) => {
    setFocusContextState(value);
  }, []);

  const clearFocusContext = useCallback(() => {
    setFocusContextState(null);
  }, []);

  const value = useMemo<FocusRoutingContextValue>(() => {
    return {
      focusContext,
      setFocusContext,
      clearFocusContext,
    };
  }, [focusContext, setFocusContext, clearFocusContext]);

  return (
    <FocusRoutingContext.Provider value={value}>
      {children}
    </FocusRoutingContext.Provider>
  );
}

export function useFocusContext() {
  const context = useContext(FocusRoutingContext);

  if (!context) {
    throw new Error(
      "useFocusContext must be used within a FocusContextProvider"
    );
  }

  return context;
}