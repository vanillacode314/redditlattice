import {
  JSXElement,
  Component,
  Accessor,
  createSignal,
  createMemo,
  createEffect,
  on,
  mergeProps,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import * as _ from 'lodash-es'

interface Item<T = any> {
  id: string
  data: T
}

export interface Props<T> {
  items: Array<Item<T>>
  maxWidth: number
  gap?: number
  children: (
    id: Item<T>['id'],
    data: Props<T>['items'][number]['data'],
    width: Accessor<number>
  ) => JSXElement
}

export const Masonry: <T>(props: Props<T>) => JSXElement = (props) => {
  const merged = mergeProps({ gap: 0 }, props)
  type I = typeof props.items[number]
  const [el, setEl] = createSignal<HTMLElement>()
  const size = createElementSize(el)
  const cols = createMemo<number>(() =>
    size.width ? Math.ceil(size.width / props.maxWidth) : 1
  )
  const colWidth = createMemo<number>(
    () =>
      (size.width ? size.width / cols() : 0) - (merged.gap * (cols() - 1)) / 2
  )
  const [columns, setColumns] = createStore<Record<number, I[]>>()

  function getShortestColumnIndex(): number {
    let minIndex = 0
    let minHeight = Infinity
    for (const x of _.range(cols())) {
      const colEl = document.getElementById(`__masonry-col-${x}`)
      const { height } = colEl ? colEl.getBoundingClientRect() : { height: 0 }
      if (height <= minHeight) {
        minIndex = x
        minHeight = height
      }
    }
    return minIndex
  }

  function addItems(...items: Item[]) {
    let len = items.length
    let i = 0
    requestAnimationFrame(function handler() {
      if (i === len) return
      const item = items[i]
      const idx = getShortestColumnIndex()
      const old = columns[idx] || []
      setColumns(idx, [...old, item])
      i++
      requestAnimationFrame(handler)
    })
  }

  function deleteItems(...itemsToRemove: Item[]) {
    for (const [idx, items] of Object.entries(columns)) {
      const filteredItems = _.differenceBy(items, itemsToRemove, (v) => v.id)
      setColumns({
        [idx]: filteredItems.length ? filteredItems : undefined,
      })
    }
  }

  createEffect(
    on(
      () => props.items,
      (n, p) => {
        p = p || []
        const deletedItems = _.differenceBy(p, n, (v) => v.id)
        const addedItems = _.differenceBy(n, p, (v) => v.id)
        deleteItems(...deletedItems)
        addItems(...addedItems)
      }
    )
  )

  createEffect(
    on(
      cols,
      () => {
        deleteItems(...props.items)
        addItems(...props.items)
      },
      { defer: true }
    )
  )

  return (
    <div
      class="grid place-items-start"
      ref={setEl}
      style={{
        padding: `${props.gap}px`,
        'column-gap': `${props.gap}px`,
        'grid-template-columns': `repeat(${cols()},1fr)`,
      }}
    >
      <Entries of={columns}>
        {(key, items) => (
          <div
            class="flex flex-col w-full"
            id={`__masonry-col-${key}`}
            style={{
              'row-gap': `${props.gap}px`,
              'grid-column': `${cols() - +key} / span 1`,
              'grid-row': `1 / span 1`,
            }}
          >
            <Key each={items()} by="id">
              {(item) => {
                const i = item()
                return props.children(i.id, i.data, colWidth)
              }}
            </Key>
          </div>
        )}
      </Entries>
    </div>
  )
}

export default Masonry
