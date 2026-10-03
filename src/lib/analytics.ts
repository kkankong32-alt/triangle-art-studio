// Minimal GA4 wrapper. Loads gtag.js exactly once and configures two GA4 properties (the
// personal account and 킹수학's account) so they both receive the same anonymous, feature-
// usage events. Every exported function is safe to call in any environment — dev, file://,
// with an ad blocker, offline — and never throws or blocks the app.
export const GA_DESTINATIONS = ['G-DC7N6KQBG0', 'G-5YW0T2C109'] as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface AnalyticsEnv { prod?: boolean; protocol?: string; hostname?: string }
function currentEnv(): AnalyticsEnv {
  return {
    prod: import.meta.env.PROD,
    protocol: typeof location === 'undefined' ? undefined : location.protocol,
    hostname: typeof location === 'undefined' ? undefined : location.hostname,
  };
}

// Test-only escape hatch (see tests/browser-analytics.mjs and analytics.test.ts): production
// code never calls this. It lets tests exercise the enabled path without ever running on an
// actual public, non-localhost deployment.
let testOverride: boolean | null = null;
export function __setAnalyticsTestOverride(value: boolean | null): void { testOverride = value; }

// GA is only ever active for a real deployed site: a production build, served over http(s),
// and not localhost/127.0.0.1/::1 — which also excludes file:// (protocol check) and the dev
// server / npm run preview / the standalone HTML opened directly (all covered by one rule).
export function isAnalyticsEnabled(env: AnalyticsEnv = currentEnv()): boolean {
  if (testOverride !== null) return testOverride;
  if (!env.prod) return false;
  if (env.protocol !== 'http:' && env.protocol !== 'https:') return false;
  if (env.hostname === 'localhost' || env.hostname === '127.0.0.1' || env.hostname === '::1') return false;
  return true;
}

// Calling an unknown/throwing gtag must never break the app — this is the one place that
// actually touches window.gtag, so every caller below funnels through it.
function safeGtagCall(gtag: Window['gtag'], ...args: unknown[]): void {
  try { gtag?.(...args); } catch { /* analytics must never break the app */ }
}

let initialized = false;
export function initializeAnalytics(): void {
  if (initialized || !isAnalyticsEnabled()) return;
  initialized = true;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_DESTINATIONS[0]}`;
    document.head.appendChild(script);
    safeGtagCall(window.gtag, 'js', new Date());
    for (const id of GA_DESTINATIONS) {
      safeGtagCall(window.gtag, 'config', id, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
  } catch { /* analytics must never break the app */ }
}

// Every event goes to both GA4 properties in one call via send_to, so there is exactly one
// gtag('event', ...) per call site — never one per destination.
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
  if (!isAnalyticsEnabled()) return;
  const gtag = typeof window === 'undefined' ? undefined : window.gtag;
  safeGtagCall(gtag, 'event', eventName, { ...params, send_to: [...GA_DESTINATIONS] });
}
