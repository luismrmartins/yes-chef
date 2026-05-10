// Thin wrapper around the Plausible global. Safe to call when Plausible is
// not configured: it no-ops if window.plausible is missing or we're SSR'ing.
//
// The Plausible init script defines a queue, so calls made before the analytics
// script loads are still captured.

export function track(eventName, props) {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible !== 'function') return;
  try {
    if (props) window.plausible(eventName, { props });
    else window.plausible(eventName);
  } catch {
    // Never let analytics break user flow.
  }
}
