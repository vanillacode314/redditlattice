type WeightedItem<T = unknown> = [T, number]

const randint = (n: number) => Math.floor(Math.random() * n)

export function chooseFromWeighted<T>(
  items: Array<WeightedItem<T>>
): WeightedItem<T>[0] {
  const minWeight = Math.min(...items.map(([, weight]) => weight))
  let totalWeight: number = 0
  for (const item of items) {
    item[1] -= minWeight
    totalWeight += item[1]
  }
  let rand = Math.random() * totalWeight
  if (totalWeight === 0)
    return items[Math.floor(Math.random() * items.length)][0]
  for (const [item, weight] of items) {
    rand -= weight
    if (rand < 0) return item
  }
  throw new Error(
    `"This state should be unreachable", rand: ${rand},  totalWeight: ${totalWeight}`
  )
}

export function randn_bm(): number {
  let u = 0,
    v = 0
  while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random()
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  num = num / 10.0 + 0.5 // Translate to 0 -> 1
  if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
  return num
}

export function getItems<T = unknown>(arr: T[], id: number): T[] {
  id = Math.round(Math.pow(2, id * arr.length))
  return arr.filter((_, idx) => (id >> idx) & 1)
}

export function genPermutationNumber(arr: unknown[]): number {
  let result = 0
  for (let i = 0; i < arr.length; i++) {
    if (Math.random() < 0.5) {
      result += Math.pow(2, i)
    }
  }
  return result / arr.length
}
