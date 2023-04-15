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
            hard: im || immediate(),
          })
        : store.update(value, {
            hard: im || immediate(),
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
    value && set(value, prev === undefined)
    return value
  }, deps())
  return createMemo(() => (deps() === undefined ? undefined : s()))
}
