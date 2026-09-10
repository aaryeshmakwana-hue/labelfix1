/**
 * Internal developer & debug mode detection.
 * By default, normal users will see a clean customer UI with all internal
 * validation, coordinate overlays, audit tables, and test runners hidden.
 *
 * Internal team members / developers can enable debug mode via:
 * - URL query parameter: ?debug=true or ?dev=true
 * - Window flag: window.__DEV_MODE__ = true
 */
export const isDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Strictly disable internal debug inspection, test suite, and coordinate overlays in production builds
  if (import.meta.env.PROD) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('debug') === 'true' ||
      params.get('dev') === 'true' ||
      Boolean((window as any).__DEV_MODE__)
    );
  } catch {
    return false;
  }
};
