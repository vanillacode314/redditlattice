import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy, throttle } from 'lodash-es'
import {
  Accessor,
  batch,
  createEffect,
  JSXElement,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { sum } from './utils'

const BOUNDS: number = 1000

interface Item<T = any> {
  id: string
  data: T
}

export interface Props<T> {
  items: Array<Item<T>>
  maxWidth: number
  gap?: number
  children: (data: {
    id: Item<T>['id']
    data: Props<T>['items'][number]['data']
    width: Accessor<number>
    lastHeight: Accessor<number>
    updateHeight: (rect: DOMRect) => void
    style: Accessor<Record<string, string>>
    ref: (el: HTMLElement) => void | HTMLElement
  }) => JSXElement
  attachScrollHandler?: (handler: (e: Event) => void) => () => void
}

interface State<T> {
  numberOfColumns: number
  columnWidth: number
  columnToItemsMap: Record<number, T[]>
  masonryRef?: HTMLDivElement
  top: number
  bottom: number
  masonrySize: { readonly height: number | null; readonly width: number | null }
  heightMap: number[][]
  visibleItems: boolean[][]
  offsets: number[]
}

export const Masonry: <T>(props: Props<T>) => JSXElement = (props) => {
  type TItem = (typeof props.items)[number]
  const merged = mergeProps({ gap: 0 }, props)
  const masonrySize = createElementSize(() => state.masonryRef)
  const [state, setState] = createStore<State<TItem>>({
    offsets: [],
    top: 0,
    bottom: 0,
    heightMap: [],
    visibleItems: [],
    columnToItemsMap: {},
    get numberOfColumns(): number {
      return state.masonrySize.width
        ? Math.ceil(state.masonrySize.width / props.maxWidth)
        : 1
    },
    get columnWidth(): number {
      const gaps = merged.gap * (state.numberOfColumns - 1)
      const width = state.masonrySize.width
      return width ? (width - gaps) / state.numberOfColumns : 0
    },
    get masonrySize(): {
      readonly height: number | null
      readonly width: number | null
    } {
      return masonrySize
    },
  })

  createEffect(
    () => {
      const top = state.top
      const bottom = state.bottom
      untrack(() => {
        const offsets: number[] = []
        batch(() => {
          setState('visibleItems', (value) => {
            value = new Array(state.numberOfColumns).fill(Array)
            state.heightMap.forEach((column, i) => {
              offsets[i] = 0
              let heightAccumulator = 0
              column.forEach((itemHeight, j) => {
                heightAccumulator += itemHeight
                if (heightAccumulator <= top) {
                  // offsets[i] = heightAccumulator
                }
                value[i][j] =
                  heightAccumulator >= top - BOUNDS &&
                  heightAccumulator - itemHeight <= bottom + BOUNDS
              })
            })
            return value
          })
          setState('offsets', offsets)
        })
        // console.log(unwrap(state.offsets))
      })
    },
    { immediate: true }
  )

  onMount(() => {
    const detach = props.attachScrollHandler?.(
      throttle((e) => {
        setState({
          top: e.target.scrollTop,
          bottom: e.target.scrollTop + e.target.clientHeight,
        })
      }, 16)
    )
    onCleanup(() => detach?.())
  })

  const appendToColumn = (idx: number, ...val: TItem[]) => {
    const old = state.columnToItemsMap[idx] || []
    setState('columnToItemsMap', idx, [...old, ...val])
  }

  function getShortestColumnIndex(): number {
    let minIndex = state.numberOfColumns - 1
    for (let i = minIndex - 1; i >= 0; i--) {
      if (
        sum(state.heightMap[i] || []) < sum(state.heightMap[minIndex] || [])
      ) {
        minIndex = i
      }
    }
    return minIndex
  }

  function addItems(...items: Item[]) {
    if (state.numberOfColumns === 1) {
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
      for (const [columnIndex, items] of Object.entries(
        state.columnToItemsMap
      )) {
        const remainingItems = differenceBy(items, itemsToRemove, (v) => v.id)
        setState('columnToItemsMap', {
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
    setState({
      heightMap: [],
      visibleItems: [],
      columnToItemsMap: {},
      offsets: [],
      top: 0,
      bottom: 0,
    })
    deleteItems(...props.items)
    addItems(...props.items)
  }

  createEffect(
    on(
      () => state.numberOfColumns,
      () => resetGrid(),
      { defer: true }
    )
  )

  return (
    <div
      class="grid place-items-start"
      ref={(el) => setState('masonryRef', el)}
      style={{
        'column-gap': `${merged.gap}px`,
        'grid-template-columns': `repeat(${state.numberOfColumns},1fr)`,
      }}
    >
      {/* COLUMNS */}
      <Entries of={state.columnToItemsMap}>
        {(columnIndex, items) => (
          <div
            class="relative"
            style={{
              width: state.columnWidth + 'px',
              height: `${
                sum(state.heightMap[+columnIndex] ?? []) +
                ((state.heightMap[+columnIndex] ?? []).length - 0) * merged.gap
              }px`,
            }}
          >
            <Key each={items()} by="id">
              {(item, rowIndex) => {
                const _item = item()
                return (
                  <Show
                    when={
                      state.visibleItems[+columnIndex]?.[rowIndex()] ===
                        undefined ||
                      state.visibleItems[+columnIndex][rowIndex()]
                    }
                  >
                    {props.children({
                      ref: (el) => {
                        setState(
                          'heightMap',
                          +columnIndex,
                          (value) => value || []
                        )
                        queueMicrotask(() => {
                          const rect = el.getBoundingClientRect()
                          setState(
                            'heightMap',
                            +columnIndex,
                            rowIndex(),
                            rect.height
                          )
                        })
                      },
                      id: _item.id,
                      data: _item.data,
                      style: () => ({
                        position: 'absolute',
                        left: '0px',
                        width: state.columnWidth + 'px',
                        top:
                          sum(
                            (state.heightMap[+columnIndex] ?? []).slice(
                              0,
                              rowIndex()
                            )
                          ) +
                          merged.gap * rowIndex() +
                          (state.offsets[+columnIndex] ?? 0) +
                          'px',
                      }),
                      width: () => state.columnWidth,
                      lastHeight: () =>
                        state.heightMap[+columnIndex]?.[rowIndex()] ??
                        undefined,
                      updateHeight: (rect) => {
                        setState(
                          'heightMap',
                          +columnIndex,
                          rowIndex(),
                          rect.height
                        )
                      },
                    })}
                  </Show>
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
