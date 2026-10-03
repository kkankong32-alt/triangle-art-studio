// "Is this a real deployed website?" — a production build served over http(s) from a host
// that isn't loopback. This also excludes file:// (the standalone HTML) and the dev server.
// Shared by analytics (only report from a real deployment) and the quiz gate (only route
// through the online entry quiz when the quiz site is actually reachable).
export interface HostingEnv { prod?: boolean; protocol?: string; hostname?: string }
export function currentHostingEnv(): HostingEnv {
  return {
    prod: import.meta.env.PROD,
    protocol: typeof location === 'undefined' ? undefined : location.protocol,
    hostname: typeof location === 'undefined' ? undefined : location.hostname,
  };
}
export function isHostedDeployment(env: HostingEnv = currentHostingEnv()): boolean {
  if (!env.prod) return false;
  if (env.protocol !== 'http:' && env.protocol !== 'https:') return false;
  if (env.hostname === 'localhost' || env.hostname === '127.0.0.1' || env.hostname === '::1') return false;
  return true;
}
