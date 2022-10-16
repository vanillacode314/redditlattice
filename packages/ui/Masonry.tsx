import {
  JSXElement,
  Component,
  Accessor,
  createSignal,
  createMemo,
  createEffect,
  on,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import _ from 'lodash'

interface Item<T = any> {
  id: string
  data: T
}

export interface Props<T = any> {
  items: Array<Item<T>>
  maxWidth: number
  gap?: number
  children: (id: Item<T>['id'], data: T, width: Accessor<number>) => JSXElement
}

export const Masonry: Component<Props> = (props) => {
  type I = typeof props.items[number]
  const [el, setEl] = createSignal<HTMLElement>()
  const size = createElementSize(el)
  const cols = createMemo<number>(() =>
    size.width ? Math.ceil(size.width / props.maxWidth) : 1
  )
  const colWidth = createMemo<number>(() =>
    size.width ? size.width / cols() : 0
  )
  const [columns, setColumns] = createStore<Record<number, I[]>>()

  createEffect(
    on(
      () => props.items,
      (n, p) => {
        const deletedItems = (p || []).filter(
          (i) => !(n || []).some((j) => j.id === i.id)
        )

        const addedItems = n.filter(
          (i) => !(p || []).some((j) => j.id === i.id)
        )
        for (const [col, items] of Object.entries(columns)) {
          for (const [idx, item] of items.entries()) {
            if (deletedItems.some((i) => i.id === item.id)) items.splice(idx, 1)
          }
        }
        for (const [idx, chunk] of _.chunk(
          addedItems,
          Math.floor(addedItems.length / cols())
        ).entries()) {
          const old = columns[idx] || []
          setColumns({ [idx]: [...old, ...chunk] })
        }
      }
    )
  )

  createEffect(
    on(cols, () => {
      for (const [idx, chunk] of _.chunk(
        props.items,
        Math.floor(props.items.length / cols())
      ).entries()) {
        setColumns({ [idx]: chunk })
      }
    })
  )

  return (
    <div
      class="grid"
      style={{ 'grid-template-columns': `repeat(${cols()},1fr)` }}
      ref={setEl}
    >
      <Entries of={columns}>
        {(key, item) => (
          <div class="flex flex-col">
            <Key each={item()} by="id">
              {(item) => props.children(item().id, item().data, colWidth)}
            </Key>
          </div>
        )}
      </Entries>
    </div>
  )
}

export default Masonry
