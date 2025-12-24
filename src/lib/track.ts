export type TrackEvent = {
  name: string;
  props?: Record<string, unknown>;
};

// Stub: reemplazar por GA4/Segment/Heap/etc.
export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line no-console
  console.log("[track]", event.name, event.props ?? {});
}
