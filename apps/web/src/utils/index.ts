export function log(base: number, num: number): number {
  return Math.log(num) / Math.log(base)
}

export function round(num: number, precision: number = 2): number {
  const p = Math.pow(10, precision)
  return Math.round(num * p) / p
}

const BYTE_MAP = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const
export function formatBytes(bytes: number, base: number = 1024): string {
  if (bytes === 0) return `0 B`
  const index = Math.min(Math.floor(log(base, bytes)), BYTE_MAP.length - 1)
  return `${round(bytes / Math.pow(base, index))} ${BYTE_MAP[index]}`
}

export async function download(url: string, title?: string) {
  const dataURL = await fetch(url)
    .then((response) => {
      return response.blob()
    })
    .then((blob) => {
      return URL.createObjectURL(blob)
    })
  const a = document.createElement('a')
  a.href = dataURL
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

export const nextFrame = (cb: FrameRequestCallback) =>
  requestAnimationFrame(() => requestAnimationFrame(cb))

export const getExtension = (path: string) =>
  path.slice(path.lastIndexOf('.') + 1)

export function filterStringKeys<T extends Record<any, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => typeof key === 'string')
  ) as T
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

export const asyncFilter = async <T = unknown>(
  arr: T[],
  predicate: (val: T) => Promise<boolean>
): Promise<T[]> => {
  const results = await Promise.all(arr.map(predicate))
  return arr.filter((_v, index) => results[index])
}
