import { Department } from "../auth/permissions";
import { UserRole } from "../auth/roles";
import { DashboardLayout } from "./layouts";
import { TILE_REGISTRY } from "./tiles";
export function getVisibleTiles(
  role: UserRole,
  layout: DashboardLayout,
  department: Department
) {
  return TILE_REGISTRY.filter((tile) => {
    const roleAllowed = layout.tiles.includes(tile.id) && tile.allowedRoles.includes(role);

    if (!roleAllowed) return false;

    if (role === "admin") return true;

    if (!tile.departments || tile.departments.length === 0) return true;

    return tile.departments.includes(department) || tile.departments.includes("overview");
  });
}