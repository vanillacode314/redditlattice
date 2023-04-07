import { Accessor, from } from 'solid-js'
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
