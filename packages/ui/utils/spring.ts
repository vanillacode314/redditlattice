import { Accessor, createComputed, createEffect, from, untrack } from 'solid-js'
import { spring } from 'svelte/motion'

interface SpringOpts {
  stiffness?: number
  damping?: number
  precision?: number
}
export function createSpring(
  initialValue: number,
  immediate: Accessor<boolean> = () => false,
  options: SpringOpts = {}
): [Accessor<number>, (value: number) => void] {
  const store = spring(initialValue, options)
  const signal = from<number>(store.subscribe)
  return [
    () => signal() ?? initialValue,
    (value) =>
      store.set(value, {
        hard: immediate(),
      }),
  ]
}

export function createDerivedSpring(
  value: Accessor<number | undefined | false | null>,
  immediate: Accessor<boolean> = () => false,
  options: SpringOpts = {}
): Accessor<number | undefined> {
  const store = spring(value(), options)
  const signal = from<number>(store.subscribe)
  createComputed(() => {
    const v = value()
    if (!v) return
    untrack(() => store.set(v, { hard: immediate() }))
  })
  return () => signal() ?? (value() || undefined)
}
