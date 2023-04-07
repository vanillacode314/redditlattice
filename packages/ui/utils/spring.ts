import {
  Accessor,
  createComputed,
  createEffect,
  from,
  Setter,
  untrack,
} from 'solid-js'
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
  options: SpringOpts = {}
): [Accessor<number>, Setter<number>] {
  const store = spring(initialValue, options)
  const signal = from<number>(store.subscribe)
  return [
    () => signal() ?? initialValue,
    (value) => {
      typeof value === 'number'
        ? store.set(value, {
            hard: immediate(),
          })
        : store.update(value)
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
  deps: Accessor<number | undefined | false | null>,
  immediate: Accessor<boolean> = () => false,
  options: SpringOpts = {}
): Accessor<number | undefined> {
  const store = spring(deps(), options)
  const signal = from<number>(store.subscribe)
  createComputed(() => {
    const v = deps()
    if (!v) return
    untrack(() => store.set(v, { hard: immediate() }))
  })
  return () => signal() ?? (deps() || undefined)
}
