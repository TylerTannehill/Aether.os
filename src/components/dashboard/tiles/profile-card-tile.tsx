import { DEFAULT_USER_BADGES, UserBadge } from "@/lib/dashboard/badges";

type ProfileCardTileProps = {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  activeBadgeId?: string | null;
  badges?: UserBadge[];
  photoUrl?: string | null;
};

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
      {initials || "U"}
    </div>
  );
}
function ProfilePhoto({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${name} profile`}
        className="h-16 w-16 rounded-2xl object-cover"
      />
    );
  }

  return <InitialsAvatar name={name} />;
}

function getActiveBadge(
  badges: UserBadge[],
  activeBadgeId?: string | null
) {
  if (!badges.length) return null;

  if (!activeBadgeId) return badges[0];

  return badges.find((badge) => badge.id === activeBadgeId) || badges[0];
}
export function ProfileCardTile({
  name = "Tyler Tannehill",
  title = "Campaign Manager",
  email = "tyler@example.com",
  phone = "(555) 000-0000",
  activeBadgeId = null,
  badges = DEFAULT_USER_BADGES,
  photoUrl = null,
}: ProfileCardTileProps) {
  const activeBadge = getActiveBadge(badges, activeBadgeId);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <ProfilePhoto name={name} photoUrl={photoUrl} />

        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-sm text-slate-500">{title}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Contact
        </p>

        <div className="space-y-1 text-sm text-slate-600">
          <p className="truncate">{email}</p>
          <p>{phone}</p>
        </div>
      </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          Active Badge
        </p>
        <p className="mt-2 text-sm font-medium text-amber-900">
          {activeBadge?.label || "No active badge"}
        </p>
        {activeBadge?.description ? (
          <p className="mt-1 text-xs text-amber-800">
            {activeBadge.description}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Earned Badges
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {badges.length ? (
            badges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {badge.label}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No badges earned yet.</span>
          )}
        </div>
      </div>
            <button
        type="button"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Edit Profile
      </button>
    </div>
  );
}