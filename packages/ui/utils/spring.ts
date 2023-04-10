import { Accessor, createMemo, createRenderEffect, from } from 'solid-js'
import { spring } from 'svelte/motion'

interface SpringOpts {
  stiffness?: number
  damping?: number
  precision?: number
}

/**
 * @param initialValue - intialValue of the signal
 * @param immediate - a signal indicating whether the change should be immediate or not
 * @param options - options object containing values for stiffness, precision and damping
 * @returns a tuple of an accessor and a setter
 */
export function createSpring(
  initialValue: number,
  immediate: Accessor<boolean> = () => false,
  options: Accessor<SpringOpts> = () => ({})
): [
  Accessor<number>,
  (value: number | ((prev: number) => number), immediate?: boolean) => void
] {
  const store = spring(initialValue, options())
  const signal = from<number>(store.subscribe)
  createRenderEffect(() => {
    store.damping = options().damping ?? store.damping
    store.stiffness = options().stiffness ?? store.stiffness
    store.precision = options().precision ?? store.precision
  })
  return [
    () => signal() ?? initialValue,
    (value, im) => {
      typeof value === 'number'
        ? store.set(value, {
            hard: im ?? immediate(),
          })
        : store.update(value, {
            hard: im ?? immediate(),
          })
      return typeof value === 'number' ? value : value(signal()!)
    },
  ]
}

/**
 * @param deps - value of the signal
 * @param immediate - a signal indicating whether the change should be immediate or not
 * @param options - options object containing values for stiffness, precision and damping
 * @returns an accessor containing the derived value
 */
export function createDerivedSpring(
  deps: Accessor<number | undefined>,
  immediate: Accessor<boolean> = () => false,
  options: Accessor<SpringOpts> = () => ({})
): Accessor<number | undefined> {
  const [s, set] = createSpring(deps() ?? 0, immediate, options)
  createRenderEffect((prev: number | undefined) => {
    const value = deps()
    if (prev === undefined) {
      if (value) set(value, true)
    }
    if (value) set(value)
    return value
  }, deps())
  return createMemo(() => (deps() === undefined ? undefined : s()))
}

// export function springEasing(
//   from: number,
//   to: number,
//   {
//     stiffness = 0.1,
//     damping = 0.2,
//     precision = 0.01,
//   }: Partial<{
//     stiffness: number
//     damping: number
//     precision: number
//   }> = {}
// ): number[] {
//   const fps = 60
//   const secondsPerFrame = 1 / fps
//   let velocity = 0
//   let distances = [] as number[]
//   while (velocity + from < to) {
//     break
//     const dx = (to - from) / fps
//     const Fm = stiffness * dx
//     const Fv = -damping * velocity
//     const F = Fm + Fv
//     console.log(Fm, Fv, F)
//     velocity += F
//     distances.push(velocity + from)
//   }
//   return distances
// }
