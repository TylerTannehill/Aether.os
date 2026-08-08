import { AnalyticsProvider } from "./types";

import { MetaProvider } from "./providers/meta";
import { XProvider } from "./providers/x";
import { TikTokProvider } from "./providers/tiktok";
import { YouTubeProvider } from "./providers/youtube";

const providers: Record<string, AnalyticsProvider> = {
  meta: new MetaProvider(),
  x: new XProvider(),
  tiktok: new TikTokProvider(),
  youtube: new YouTubeProvider(),
};

export function getProvider(platform: string): AnalyticsProvider {
  const provider = providers[platform.toLowerCase()];

  if (!provider) {
    throw new Error(`No analytics provider registered for "${platform}".`);
  }

  return provider;
}

export function getProviders(): AnalyticsProvider[] {
  return Object.values(providers);
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(providers);
}