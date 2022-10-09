export function getKeys<
  Key extends string | number | symbol,
  T extends Record<Key, any>
>(obj: T, keys: Key[]): Partial<T> {
  const newObject: Partial<T> = {};
  keys.forEach((key) => {
    if (Object.hasOwn(obj, key)) newObject[key] = obj[key];
  });
  return newObject;
}

export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function log(base: number, num: number): number {
  return Math.log(num) / Math.log(base);
}

export function round(num: number, precision: number = 2): number {
  const p = Math.pow(10, precision);
  return Math.round(num * p) / p;
}

const byteMap = ["B", "KB", "MB", "GB", "TB", "PB"];

export function formatBytes(bytes: number, base: number = 1024): string {
  const index = Math.min(Math.floor(log(base, bytes)), byteMap.length - 1);
  return `${round(bytes / Math.pow(base, index))} ${byteMap[index]}`;
}

export function isEmpty(obj: object): boolean {
  return Object.values(obj).length === 0;
}

export function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const diffSet = new Set<T>();
  for (const item of set1) {
    if (!set2.has(item)) diffSet.add(item);
  }
  return diffSet;
}
