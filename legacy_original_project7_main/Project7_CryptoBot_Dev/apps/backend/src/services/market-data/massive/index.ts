import { MassiveWebSocketClient } from "./MassiveWebSocketClient";
import { MASSIVE_DEFAULT_SUBSCRIPTIONS } from "./MassiveSubscriptions";

export function createMassiveRealtimeClient(overrides: {
  apiKey?: string;
  url?: string;
  subscriptions?: string[];
} = {}): MassiveWebSocketClient {
  const apiKey =
    overrides.apiKey ?? process.env.MASSIVE_API_KEY ?? "";
  const url =
    overrides.url ?? process.env.MASSIVE_WS_URL_REALTIME ?? "";

  const subscriptions =
    overrides.subscriptions ?? MASSIVE_DEFAULT_SUBSCRIPTIONS;

  return new MassiveWebSocketClient({
    url,
    apiKey,
    subscriptions,
  });
}

export function createMassiveDelayedClient(overrides: {
  apiKey?: string;
  url?: string;
  subscriptions?: string[];
} = {}): MassiveWebSocketClient {
  const apiKey =
    overrides.apiKey ?? process.env.MASSIVE_API_KEY ?? "";
  const url =
    overrides.url ?? process.env.MASSIVE_WS_URL_DELAYED ?? "";

  const subscriptions =
    overrides.subscriptions ?? MASSIVE_DEFAULT_SUBSCRIPTIONS;

  return new MassiveWebSocketClient({
    url,
    apiKey,
    subscriptions,
  });
}

export { normalizeMassiveEvent } from "./MassiveParser";
