export function getKeys(obj: Object, keys: string[]): Object {
  const retval = {};
  keys.forEach((key) => {
    if (Object.hasOwn(obj, key)) retval[key] = obj[key];
  });
  return retval;
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
