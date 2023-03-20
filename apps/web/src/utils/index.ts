export function getKeys<
  T extends Record<any, any> = any,
  Key extends keyof T = any
>(obj: T, keys: readonly Key[]): Pick<T, (typeof keys)[number]> {
  return Object.fromEntries(
    keys.map((key) => [key, obj[key]]).filter(([, val]) => Boolean(val))
  )
}

export function sleep(duration: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

export function log(base: number, num: number): number {
  return Math.log(num) / Math.log(base)
}

export function round(num: number, precision: number = 2): number {
  const p = Math.pow(10, precision)
  return Math.round(num * p) / p
}

const byteMap = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatBytes(bytes: number, base: number = 1024): string {
  if (bytes === 0) return `0 B`
  const index = Math.min(Math.floor(log(base, bytes)), byteMap.length - 1)
  return `${round(bytes / Math.pow(base, index))} ${byteMap[index]}`
}

export function isEmpty(obj: object): boolean {
  return Object.values(obj).length === 0
}

export function difference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const diffSet = new Set<T>()
  for (const item of set1) {
    if (!set2.has(item)) diffSet.add(item)
  }
  return diffSet
}

export function compareMap<K = any, V = any>(
  map1: Map<K, V>,
  map2: Map<K, V>,
  equals: (val1: V, val2: V) => boolean = (val1, val2) => val1 === val2
): boolean {
  if (map1.size !== map2.size) return false
  for (const [key, val] of map1) {
    if (!map2.has(key)) return false
    if (!equals(val, map2.get(key)!)) return false
  }
  return true
}

export function compareSet<V = any>(set1: Set<V>, set2: Set<V>): boolean {
  if (set1.size !== set2.size) return false
  for (const val of set1) {
    if (!set2.has(val)) return false
  }
  return true
}

export function updateKey<K = any, V = any>(
  map: Map<K, V>,
  key: K,
  cb: (val: V | undefined) => V
) {
  const val = map.get(key)
  map.set(key, cb(val))
  return map
}

export function download(url: string, title?: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = title ?? url.substring(url.lastIndexOf('/') + 1)
  a.dispatchEvent(new MouseEvent('click'))
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (_e) => resolve(reader.result as string)
    reader.onerror = (_e) => reject(reader.error)
    reader.onabort = (_e) => reject(new Error('Read aborted'))
    reader.readAsDataURL(blob)
  })
}

export function parseSchema<R extends {}, S extends keyof R = keyof R>(
  schema: readonly S[],
  data: readonly R[S][][]
): R[] {
  return data.map((item) =>
    schema.reduce<R>(
      (obj, fieldName, idx) => ({ ...obj, [fieldName]: item[idx] }),
      {} as R
    )
  )
}

export const asyncFilter = async <T = unknown>(
  arr: T[],
  predicate: (val: T) => Promise<boolean>
): Promise<T[]> => {
  const results = await Promise.all(arr.map(predicate))
  return arr.filter((_v, index) => results[index])
}

export const nextFrame = (cb: FrameRequestCallback) =>
  requestAnimationFrame(() => requestAnimationFrame(cb))

export const getExtension = (path: string) =>
  path.slice(path.lastIndexOf('.') + 1)

export function filterStringKeys<T extends Record<any, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => typeof key === 'string')
  ) as T
}

export function setDifference<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  return new Set([...set1].filter((x) => !set2.has(x)))
}

export const getFile = (accept: string = '') =>
  new Promise<string | null>((resolve) => {
    const inp = document.createElement('input')
    inp.type = 'file'
    if (accept) inp.accept = accept

    inp.onchange = () => {
      const file = inp.files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      file.text().then((text) => {
        resolve(text)
      })
    }

    inp.click()
  })

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

export function getScrollTop(node: Element): number {
  let scrollTop = node.scrollTop
  if (getComputedStyle(node)['flex-direction'] === 'column-reverse')
    scrollTop += node.scrollHeight - node.clientHeight
  scrollTop = Math.floor(scrollTop)
  return scrollTop
}

export function inertialScroll(
  node: HTMLElement,
  velocity: number,
  deceleration: number = 0.97
) {
  let lastTimestamp: number
  let rafId = requestAnimationFrame(function step(timestamp: number) {
    if (Math.abs(velocity) <= 0.01) return
    const direction = Math.sign(velocity)
    const elapsed = timestamp - (lastTimestamp ?? timestamp)
    lastTimestamp = timestamp
    node.scrollTop -= Math.floor(velocity * elapsed)
    const scrollTop = getScrollTop(node)
    if (direction > 0 && scrollTop <= 10) return
    if (
      direction < 0 &&
      Math.abs(scrollTop + node.clientHeight - node.scrollHeight) <= 10
    )
      return
    velocity *= deceleration
    rafId = requestAnimationFrame(step)
  })
  return () => cancelAnimationFrame(rafId)
}
