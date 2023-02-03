import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy, minBy, range } from 'lodash-es'
import {
  Accessor,
  batch,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  mergeProps,
  on,
} from 'solid-js'
import { createStore } from 'solid-js/store'

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

function getColumnHeight(idx: number): number {
  const colEl = document.getElementById(`__masonry-col-${idx}`)
  const height = colEl?.getBoundingClientRect().height ?? 0
  return height
}

export const Masonry: <T>(props: Props<T>) => JSXElement = (props) => {
  type I = (typeof props.items)[number]

  const merged = mergeProps({ gap: 0 }, props)

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

  const appendToColumn = (idx: number, ...val: I[]) => {
    const old = columns[idx] || []
    setColumns(idx, [...old, ...val])
  }

  function getShortestColumnIndex(): number {
    return minBy(
      range(cols()).map((idx) => [idx, getColumnHeight(idx)]),
      ([, height]) => height
    )![0]
  }

  function addItems(...items: Item[]) {
    if (cols() === 1) {
      appendToColumn(0, ...items)
      return
    }

    const len = items.length
    let idx = 0
    requestAnimationFrame(function handler() {
      if (idx === len) return
      appendToColumn(getShortestColumnIndex(), items[idx])
      idx++
      requestAnimationFrame(handler)
    })
  }

  function deleteItems(...itemsToRemove: Item[]) {
    batch(() => {
      for (const [idx, items] of Object.entries(columns)) {
        const remainingItems = differenceBy(items, itemsToRemove, (v) => v.id)
        setColumns({
          [idx]: remainingItems || undefined,
        })
      }
    })
  }

  createEffect(
    on(
      () => props.items,
      (newItems, oldItems) => {
        oldItems = oldItems || []
        const deletedItems = differenceBy(oldItems, newItems, (v) => v.id)
        const addedItems = differenceBy(newItems, oldItems, (v) => v.id)
        deleteItems(...deletedItems)
        addItems(...addedItems)
      }
    )
  )

  const resetGrid = () => {
    deleteItems(...props.items)
    addItems(...props.items)
  }

  createEffect(on(cols, () => resetGrid(), { defer: true }))

  return (
    <div
      class="grid place-items-start"
      ref={setEl}
      style={{
        'column-gap': `${props.gap}px`,
        'grid-template-columns': `repeat(${cols()},1fr)`,
      }}
    >
      {/* COLUMNS */}
      <Entries of={columns}>
        {(key, items) => (
          <div
            class="flex w-full flex-col"
            id={`__masonry-col-${key}`}
            style={{
              'row-gap': `${props.gap}px`,
            }}
          >
            {/* ROWS */}
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
