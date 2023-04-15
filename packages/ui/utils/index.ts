export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

export const sum = (arr: number[]) => {
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum
}

export const isObject = <T extends Record<string, unknown>>(
  input: unknown
): input is T =>
  typeof input === 'object' && input !== null && !Array.isArray(input)
