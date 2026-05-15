export type OrgContextMode = "default" | "democrat" | "republican";

export type OrgContextTheme = {
  mode: OrgContextMode;
  label: string;
  sidebarGradient: string;
  heroGradient: string;
  accentBorder: string;
  accentText: string;
  accentSoftBg: string;
  accentRing: string;
};

const defaultTheme: OrgContextTheme = {
  mode: "default",
  label: "Default",
  sidebarGradient: "from-slate-950 via-slate-900 to-blue-950",
  heroGradient: "from-slate-950 via-slate-950 to-slate-900",
  accentBorder: "border-slate-200",
  accentText: "text-slate-700",
  accentSoftBg: "bg-slate-50",
  accentRing: "ring-slate-200",
};

const democratTheme: OrgContextTheme = {
  mode: "democrat",
  label: "Democratic",
  sidebarGradient: "from-slate-950 via-blue-950 to-indigo-950",
  heroGradient: "from-slate-950 via-blue-950 to-indigo-950",
  accentBorder: "border-blue-200",
  accentText: "text-blue-800",
  accentSoftBg: "bg-blue-50",
  accentRing: "ring-blue-100",
};

const republicanTheme: OrgContextTheme = {
  mode: "republican",
  label: "Republican",
  sidebarGradient: "from-slate-950 via-slate-900 to-rose-950",
  heroGradient: "from-slate-950 via-slate-900 to-rose-950",
  accentBorder: "border-rose-200",
  accentText: "text-rose-800",
  accentSoftBg: "bg-rose-50",
  accentRing: "ring-rose-100",
};

export function normalizeOrgContextMode(
  mode?: string | null
): OrgContextMode {
  if (mode === "democrat") return "democrat";
  if (mode === "republican") return "republican";

  return "default";
}

export function getOrgContextTheme(
  mode?: string | null
): OrgContextTheme {
  const normalizedMode = normalizeOrgContextMode(mode);

  if (normalizedMode === "democrat") return democratTheme;
  if (normalizedMode === "republican") return republicanTheme;

  return defaultTheme;
}