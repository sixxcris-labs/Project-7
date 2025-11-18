import { apiPost } from "../../lib/api";

export async function toggleMarketDataIngestion(enabled: boolean) {
  return apiPost("/api/admin/md/toggle", { enabled });
}
