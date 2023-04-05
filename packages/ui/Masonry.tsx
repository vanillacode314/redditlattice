import { Key } from '@solid-primitives/keyed'
import { createLazyMemo } from '@solid-primitives/memo'
import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy, throttle } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'

const BOUNDS: number = 1000

interface Item<T = any> {
  id: string
  data: T
}

export interface Props<T> {
  align?: 'start' | 'center' | 'end'
  items: Array<Item<T>>
  maxWidth: number
  maxColumns?: number
  gap?: number
  children: (data: {
    id: Item<T>['id']
    data: Props<T>['items'][number]['data']
    width: Accessor<number>
    lastHeight: Accessor<number | undefined>
    updateHeight: (rect: DOMRect) => void
    style: Accessor<Record<string, string>>
  }) => JSXElement
  attachScrollHandler?: (handler: (e: Event) => void) => () => void
}

interface State<T> {
  numberOfColumns: number
  columnWidth: number
  top: number
  bottom: number
  heights: number[][]
  topOffset: number[][]
  columns: T[][]
  visible: boolean[][]
  masonrySize: { readonly height: number | null; readonly width: number | null }
  renderingOffscreen: (T & { setHeight: (height: number) => void })[]
}

function get2DArray<T>(x: number, y: number) {
  return Array<T[]>(x)
    .fill(null as unknown as any)
    .map(() => [] as T[])
}

export const Masonry: <T>(props: Props<T>) => JSXElement = (props) => {
  type TItem = (typeof props.items)[number]
  const merged = mergeProps(
    { align: 'center', gap: 0, maxColumns: Infinity },
    props
  )
  const [masonryRef, setMasonryRef] = createSignal<HTMLDivElement>()
  const masonrySize = createElementSize(masonryRef)

  const numberOfColumns = createMemo(() =>
    Math.min(
      masonrySize.width ? Math.ceil(masonrySize.width / props.maxWidth) : 1,
      merged.maxColumns
    )
  )

  const columnWidth = createMemo(() => {
    const cols = numberOfColumns()
    const gaps = merged.gap * (cols - 1)
    const width = masonrySize.width
    return Math.min(
      Math.floor(width ? (width - gaps) / cols : 0),
      merged.maxWidth
    )
  })

  const [state, setState] = createStore<State<TItem>>(
    {
      top: 0,
      bottom: Infinity,
      heights: get2DArray(numberOfColumns(), 1),
      topOffset: get2DArray(numberOfColumns(), 1),
      columns: get2DArray(numberOfColumns(), 1),
      get visible() {
        return visible()
      },
      renderingOffscreen: [],
      get numberOfColumns(): number {
        return numberOfColumns()
      },
      get columnWidth(): number {
        return columnWidth()
      },
      get masonrySize(): {
        readonly height: number | null
        readonly width: number | null
      } {
        return masonrySize
      },
    },
    {
      name: 'masonry-state',
    }
  )

  function getShortestColumnIndex() {
    if (state.numberOfColumns === 1) return 0
    let shortestColumnIndex = 0
    let shortestColumnHeight = Infinity
    for (
      let columnIndex = 0;
      columnIndex < state.numberOfColumns;
      columnIndex++
    ) {
      const columnHeight = state.topOffset[columnIndex].at(-1)
      if (columnHeight === undefined) return columnIndex
      if (columnHeight >= shortestColumnHeight) continue
      shortestColumnIndex = columnIndex
      shortestColumnHeight = columnHeight
    }
    return shortestColumnIndex
  }

  function renderOffscreen(item: TItem): Promise<number> {
    return new Promise((resolve) => {
      setState('renderingOffscreen', state.renderingOffscreen.length, {
        ...item,
        setHeight: resolve,
      })
    })
  }

  const visible = createLazyMemo(
    () => {
      const visible = [] as boolean[][]
      for (let i = 0; i < state.columns.length; i++) {
        function getBounds(
          condition: (data: { itemBottom: number; itemTop: number }) => boolean
        ) {
          let low = 0
          let high = state.columns[i].length - 1
          let mid = Math.floor((low + high) / 2)
          while (low <= high) {
            mid = Math.floor((low + high) / 2)
            const itemTop = state.topOffset[i][mid] + merged.gap * mid
            const itemBottom = itemTop + state.heights[i][mid]
            condition({ itemBottom, itemTop })
              ? (high = mid - 1)
              : (low = mid + 1)
          }
          return mid
        }

        const getTop = () =>
          getBounds(({ itemBottom }) => itemBottom > state.top - BOUNDS)
        const getBottom = () =>
          getBounds(({ itemTop }) => !(itemTop < state.bottom + BOUNDS))

        visible[i] = Array(state.columns[i].length).fill(false)
        visible[i].fill(true, getTop(), getBottom() + 1)
      }
      return visible
    },
    [],
    { name: 'visible' }
  )

  onMount(() => {
    const detach = props.attachScrollHandler?.(
      throttle((e) => {
        const el = e.target as HTMLElement
        if (!el) return
        const paddingTop = +el.style.paddingTop.replace('px', '')
        setState({
          top: el.scrollTop - paddingTop,
          bottom: el.scrollTop + el.clientHeight - paddingTop,
        })
      }, 100)
    )
    onCleanup(() => detach?.())
  })

  const gridMap = new Map<TItem['id'], [number, number]>()

  function addItem(item: TItem, height: number) {
    const columnIndex = getShortestColumnIndex()
    const rowIndex = state.columns[columnIndex].length
    const lastTopOffset = state.topOffset[columnIndex][rowIndex - 1]
    const lastHeight = state.heights[columnIndex][rowIndex - 1]
    const newTopOffset =
      typeof lastTopOffset === 'number' ? lastTopOffset + lastHeight : 0

    batch(() => {
      setState('heights', columnIndex, rowIndex, height)
      setState('topOffset', columnIndex, rowIndex, newTopOffset)
      setState('columns', columnIndex, rowIndex, item)
    })
    gridMap.set(item.id, [columnIndex, rowIndex])
  }

  function removeItem(item: TItem) {
    const [columnIndex, rowIndex] = gridMap.get(item.id)!
    const height = state.heights[columnIndex][rowIndex]
    batch(() => {
      setState('heights', columnIndex, rowIndex, -1)
      setState('topOffset', columnIndex, rowIndex, -1)
      setState(
        'topOffset',
        columnIndex,
        { from: rowIndex + 1, to: state.topOffset.length - 1 },
        (value) => (value === -1 ? value : value - height)
      )
      setState('columns', columnIndex, (row) =>
        row.filter(($item) => item.id !== $item.id)
      )
    })
  }

  createEffect<Promise<[TItem[], number]>>(async (lastPromise) => {
    const newItems = props.items
    const currentNumberOfColumns = numberOfColumns()
    const [oldItems, lastNumberOfColumns] = await lastPromise
    let addedItems: TItem[], removedItems: TItem[]
    if (currentNumberOfColumns !== lastNumberOfColumns) {
      gridMap.clear()
      batch(() => {
        setState('heights', get2DArray(currentNumberOfColumns, 1))
        setState('topOffset', get2DArray(currentNumberOfColumns, 1))
        setState('columns', get2DArray(currentNumberOfColumns, 1))
      })
      removedItems = []
      addedItems = newItems
    } else {
      addedItems = differenceBy(newItems, oldItems, (item) => item.id)
      removedItems = differenceBy(oldItems, newItems, (item) => item.id)
    }

    for (
      let columnIndex = 0;
      columnIndex < currentNumberOfColumns;
      columnIndex++
    ) {
      batch(() => {
        setState('heights', columnIndex, (value) => value ?? [])
        setState('topOffset', columnIndex, (value) => value ?? [])
        setState('columns', columnIndex, (value) => value ?? [])
      })
    }

    return await untrack(async () => {
      batch(() => {
        removedItems.forEach(removeItem)
        setState(
          'heights',
          { from: 0, to: currentNumberOfColumns - 1 },
          (row) => (row ?? []).filter((value) => value >= 0)
        )
        setState(
          'topOffset',
          { from: 0, to: currentNumberOfColumns - 1 },
          (row) => (row ?? []).filter((value) => value >= 0)
        )
      })

      const heights = await Promise.all(addedItems.map(renderOffscreen))
      setState('renderingOffscreen', [])
      batch(() => {
        heights.forEach((height, index) => addItem(addedItems[index], height))
      })
      return [newItems, currentNumberOfColumns]
    })
  }, Promise.resolve([[], numberOfColumns()]))

  return (
    <>
      <div class="opacity-0 absolute">
        <For each={state.renderingOffscreen}>
          {(item) => {
            const resolved = children(() =>
              props.children({
                id: item.id,
                data: item.data,
                style: () => ({}),
                lastHeight: () => undefined,
                updateHeight: () => {},
                width: columnWidth,
              })
            )
            const list = resolved.toArray() as HTMLElement[]
            requestAnimationFrame(() => {
              for (const child of list) {
                if (!child) continue
                const { height } = child.getBoundingClientRect()
                item.setHeight(height)
                break
              }
            })
            return resolved()
          }}
        </For>
      </div>
      <div
        class="grid items-start"
        ref={setMasonryRef}
        style={{
          'column-gap': `${merged.gap}px`,
          'grid-template-columns': `repeat(${state.numberOfColumns},auto)`,
          'justify-content': merged.align,
        }}
      >
        <Key each={[...state.columns.entries()]} by={([index]) => index}>
          {(entries, columnIndex) => (
            <div
              class="relative"
              style={{
                width: state.columnWidth + 'px',
                height: `${
                  (state.topOffset[columnIndex()].at(-1) ?? 0) +
                  (state.heights[columnIndex()].at(-1) ?? 0) +
                  state.columns[columnIndex()].length * merged.gap
                }px`,
              }}
            >
              <Key each={entries()[1]} by="id">
                {(item, rowIndex) => (
                  <Show when={state.visible[columnIndex()][rowIndex()]}>
                    {props.children({
                      id: item().id,
                      data: item().data,
                      style: () => ({
                        position: 'absolute',
                        width: `${state.columnWidth}px`,
                        left: '0px',
                        top: `${Math.floor(
                          state.topOffset[columnIndex()][rowIndex()] +
                            merged.gap * rowIndex()
                        )}px`,
                      }),
                      lastHeight: () =>
                        state.heights[columnIndex()][rowIndex()],
                      updateHeight: (rect) => {
                        if (!state.columns[columnIndex()]?.[rowIndex()]) return
                        const diff =
                          rect.height - state.heights[columnIndex()][rowIndex()]
                        batch(() => {
                          setState(
                            'heights',
                            columnIndex(),
                            rowIndex(),
                            rect.height
                          )
                          setState(
                            'topOffset',
                            columnIndex(),
                            {
                              from: rowIndex() + 1,
                              to: state.topOffset[columnIndex()].length - 1,
                            },
                            (value) => value + diff
                          )
                        })
                      },
                      width: () => state.columnWidth,
                    })}
                  </Show>
                )}
              </Key>
            </div>
          )}
        </Key>
      </div>
    </>
  )
}

export default Masonry
