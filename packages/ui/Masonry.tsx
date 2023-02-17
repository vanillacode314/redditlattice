import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy, minBy, range, throttle } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  Component,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'

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
    width: Accessor<number>,
    lastHeight: Accessor<number>,
    updateHeight: (rect: DOMRect) => void
  ) => JSXElement
  attachScrollHandler?: (handler: (e: Event) => void) => () => void
}

function getColumnHeight(idx: number): number {
  const columnElement = document.getElementById(`__masonry-col-${idx}`)
  const height = columnElement?.getBoundingClientRect().height ?? 0
  return height
}

export const Masonry: <T>(props: Props<T>) => JSXElement = (props) => {
  type TItem = (typeof props.items)[number]

  const merged = mergeProps({ gap: 0 }, props)

  const [masonryRef, setMasonryRef] = createSignal<HTMLElement>()
  const masonrySize = createElementSize(masonryRef)
  const numberOfColumns = createMemo<number>(() =>
    masonrySize.width ? Math.ceil(masonrySize.width / props.maxWidth) : 1
  )
  const columnWidth = createMemo<number>(
    () =>
      (masonrySize.width ? masonrySize.width / numberOfColumns() : 0) -
      (merged.gap * (numberOfColumns() - 1)) / 2
  )
  const [columnToItemsMap, setColumnsToItemsMap] =
    createStore<Record<number, TItem[]>>()
  const [aMap, setAMap] = createStore<Record<`${string}-${string}`, DOMRect>>()
  const [top, setTop] = createSignal<number>()
  const [bottom, setBottom] = createSignal<number>()

  onMount(() => {
    const detach = props.attachScrollHandler?.(
      throttle((e) => {
        const el = e.target as HTMLElement
        batch(() => {
          setTop(el.scrollTop + el.offsetTop)
          setBottom(el.scrollTop + el.offsetTop + el.offsetHeight)
        })
      }, 16)
    )
    onCleanup(() => detach?.())
  })

  const appendToColumn = (idx: number, ...val: TItem[]) => {
    const old = columnToItemsMap[idx] || []
    setColumnsToItemsMap(idx, [...old, ...val])
  }

  function getShortestColumnIndex(): number {
    return minBy(
      range(numberOfColumns()).map((index) => [index, getColumnHeight(index)]),
      ([, height]) => height
    )![0]
  }

  function addItems(...items: Item[]) {
    if (numberOfColumns() === 1) {
      appendToColumn(0, ...items)
      return
    }

    const length = items.length
    let index = 0
    requestAnimationFrame(function handler() {
      if (index === length) return
      appendToColumn(getShortestColumnIndex(), items[index])
      index++
      requestAnimationFrame(handler)
    })
  }

  function deleteItems(...itemsToRemove: Item[]) {
    batch(() => {
      for (const [columnIndex, items] of Object.entries(columnToItemsMap)) {
        const remainingItems = differenceBy(items, itemsToRemove, (v) => v.id)
        setColumnsToItemsMap({
          [columnIndex]: remainingItems || undefined,
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

  createEffect(on(numberOfColumns, () => resetGrid(), { defer: true }))

  return (
    <div
      class="grid place-items-start"
      ref={setMasonryRef}
      style={{
        'column-gap': `${props.gap}px`,
        'grid-template-columns': `repeat(${numberOfColumns()},1fr)`,
      }}
    >
      {/* COLUMNS */}
      <Entries of={columnToItemsMap}>
        {(columnIndex, items) => (
          <div
            id={`__masonry-col-${columnIndex}`}
            class="flex w-full flex-col"
            style={{
              'row-gap': `${props.gap}px`,
            }}
          >
            {/* ROWS */}
            <Key each={items()} by="id">
              {(item, rowIndex) => {
                const _item = item()
                return (
                  <div
                    class="grid"
                    id={`__masonry-col-${columnIndex}-row-${rowIndex()}`}
                    ref={(el) => {
                      queueMicrotask(() => {
                        const rect = el.getBoundingClientRect().toJSON()
                        setAMap(`${columnIndex}-${rowIndex()}`, {
                          ...rect,
                          top: el.offsetTop,
                          bottom: el.offsetTop + el.offsetHeight,
                          height: el.offsetHeight,
                          width: columnWidth(),
                        })
                      })
                    }}
                  >
                    <Show
                      when={
                        aMap[`${columnIndex}-${rowIndex()}`] === undefined ||
                        ((top() ?? 0) <=
                          aMap[`${columnIndex}-${rowIndex()}`].bottom + 5000 &&
                          (bottom() ?? Infinity) >=
                            aMap[`${columnIndex}-${rowIndex()}`].top - 5000)
                      }
                      fallback={
                        <div
                          class="bg-red"
                          style={{
                            height: `${
                              aMap[`${columnIndex}-${rowIndex()}`].height
                            }px`,
                            width: `${
                              aMap[`${columnIndex}-${rowIndex()}`].width
                            }px`,
                          }}
                        ></div>
                      }
                    >
                      {props.children(
                        _item.id,
                        _item.data,
                        columnWidth,
                        () => aMap[`${columnIndex}-${rowIndex()}`]?.height,
                        (rect) => {
                          const diff =
                            rect.height -
                            (aMap[`${columnIndex}-${rowIndex()}`].height ?? 0)

                          if (diff === 0) return
                          for (const [key, value] of Object.entries(aMap)) {
                            const [column, row] = key.split('-').map(Number)
                            if (column !== +columnIndex) continue
                            if (row > rowIndex()) {
                              setAMap(`${column}-${row}`, {
                                top: value.top + diff,
                                bottom: value.bottom + diff,
                              })
                            }
                          }
                          setAMap(`${columnIndex}-${rowIndex()}`, (value) => ({
                            height: rect.height,
                            bottom: value.bottom + diff,
                            top: value.top + diff,
                          }))
                        }
                      )}
                    </Show>
                  </div>
                )
              }}
            </Key>
          </div>
        )}
      </Entries>
    </div>
  )
}

export default Masonry
