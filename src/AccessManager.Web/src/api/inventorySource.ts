export type InventorySource = 'contoso' | 'sandbox';

const listeners = new Set<(source: InventorySource) => void>();
let source: InventorySource = 'contoso';

export function getInventorySource(): InventorySource {
  return source;
}

export function setInventorySource(next: InventorySource) {
  if (source === next) {
    return;
  }
  source = next;
  for (const listener of listeners) {
    listener(source);
  }
}

export function subscribeInventorySource(listener: (next: InventorySource) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
