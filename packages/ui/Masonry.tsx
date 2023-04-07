import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy } from 'lodash-es'
import {
  Accessor,
  batch,
  createEffect,
  createMemo,
  createSignal,
  Index,
  JSXElement,
  mergeProps,
  untrack,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import VirtualColumn, { OffScreenRenderer } from './VirtualColumn'

interface Item<T = any> {
  id: string
  data: T
}

export interface MasonryProps<T> {
  align?: 'start' | 'center' | 'end'
  items: Array<Item<T>>
  maxWidth: number
  maxColumns?: number
  gap?: number
  scrollingElement?: string | HTMLElement
  children: (data: {
    id: Accessor<Item<T>['id']>
    data: Accessor<Item<T>['data']>
    width: Accessor<number>
    lastHeight: Accessor<number | undefined>
    updateHeight: (height: number) => void
  }) => JSXElement
}

interface State<T> {
  numberOfColumns: number
  renderingOffscreen: (Item<T> & { setHeight: (height: number) => void })[]
  columnWidth: number
  columnHeights: number[]
  heights: number[][]
  topOffsets: number[][]
  columns: Item<T>[][]
  masonrySize: { readonly height: number | null; readonly width: number | null }
}

function get2DArray<T>(x: number, _: number) {
  return Array<T[]>(x)
    .fill(null as unknown as any)
    .map(() => [] as T[])
}

export function Masonry<T>(props: MasonryProps<T>): JSXElement {
  const merged = mergeProps(
    { align: 'center', gap: 0, maxColumns: Infinity, scrollingElement: 'body' },
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

  function renderOffscreen(item: Item<T>): Promise<number> {
    return new Promise((resolve) => {
      setState('renderingOffscreen', state.renderingOffscreen.length, {
        ...item,
        setHeight: resolve,
      })
    })
  }
  const [state, setState] = createStore<State<T>>(
    {
      columns: get2DArray(numberOfColumns(), 1),
      topOffsets: get2DArray(numberOfColumns(), 1),
      heights: get2DArray(numberOfColumns(), 1),
      columnHeights: Array(numberOfColumns()),
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
      const columnHeight = state.columnHeights[columnIndex] ?? 0
      if (columnHeight === undefined) return columnIndex
      if (columnHeight >= shortestColumnHeight) continue
      shortestColumnIndex = columnIndex
      shortestColumnHeight = columnHeight
    }
    return shortestColumnIndex
  }

  const gridMap = new Map<Item<T>['id'], [number, number]>()
  function addItem(item: Item<T>, height: number) {
    const columnIndex = getShortestColumnIndex()
    const rowIndex = state.columns[columnIndex].length
    const lastTopOffset = state.topOffsets[columnIndex][rowIndex - 1]
    const lastHeight = state.heights[columnIndex][rowIndex - 1]
    const newTopOffset =
      typeof lastTopOffset === 'number' ? lastTopOffset + lastHeight : 0

    batch(() => {
      setState('heights', columnIndex, rowIndex, height)
      setState('topOffsets', columnIndex, rowIndex, newTopOffset)
      setState('columns', columnIndex, rowIndex, item)
    })
    gridMap.set(item.id, [columnIndex, rowIndex])
  }

  function removeItem(item: Item<T>) {
    const [columnIndex, rowIndex] = gridMap.get(item.id)!
    const height = state.heights[columnIndex][rowIndex]
    batch(() => {
      setState('heights', columnIndex, (rows) =>
        rows.slice(0, rowIndex).concat(rows.slice(rowIndex + 1))
      )
      setState('topOffsets', columnIndex, (rows) =>
        rows
          .slice(0, rowIndex)
          .concat(rows.slice(rowIndex + 1).map((row) => row - height))
      )
      setState('columns', columnIndex, (row) =>
        row.filter(($item) => item.id !== $item.id)
      )
    })
  }

  createEffect<Promise<[Item<T>[], number]>>(async (lastPromise) => {
    const newItems = props.items
    const currentNumberOfColumns = numberOfColumns()
    const [oldItems, lastNumberOfColumns] = await lastPromise
    let addedItems: Item<T>[], removedItems: Item<T>[]
    if (currentNumberOfColumns !== lastNumberOfColumns) {
      gridMap.clear()
      batch(() => {
        setState('heights', get2DArray(currentNumberOfColumns, 1))
        setState('topOffsets', get2DArray(currentNumberOfColumns, 1))
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
        setState('topOffsets', columnIndex, (value) => value ?? [])
        setState('columns', columnIndex, (value) => value ?? [])
      })
    }

    return await untrack(() =>
      batch(async () => {
        removedItems.forEach(removeItem)
        requestAnimationFrame(async function handler() {
          const item = addedItems.shift()!
          if (!item) return

          const height = await renderOffscreen(item)
          setState('renderingOffscreen', [])
          addItem(item, height)

          requestAnimationFrame(handler)
        })
        return [newItems, currentNumberOfColumns]
      })
    )
  }, Promise.resolve([[], numberOfColumns()]))

  function updateHeight(height: number, columnIndex: number, rowIndex: number) {
    if (!state.columns[columnIndex]?.[rowIndex]) return
    const diff = height - state.heights[columnIndex][rowIndex]
    batch(() => {
      setState('heights', columnIndex, rowIndex, height)
      setState(
        'topOffsets',
        columnIndex,
        {
          from: rowIndex + 1,
          to: state.topOffsets[columnIndex].length - 1,
        },
        (value) => value + diff
      )
    })
  }

  return (
    <>
      <div class="opacity-0 absolute">
        <OffScreenRenderer
          items={state.renderingOffscreen}
          width={state.columnWidth}
        >
          {props.children}
        </OffScreenRenderer>
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
        <Index each={state.columns}>
          {(rows, columnIndex) => (
            <VirtualColumn
              heights={state.heights[columnIndex]}
              topOffsets={state.topOffsets[columnIndex]}
              onHeightUpdate={(height) =>
                setState('columnHeights', columnIndex, height)
              }
              items={rows()}
              scrollingElement={props.scrollingElement}
              gap={props.gap}
              width={state.columnWidth}
              updateHeight={(height, rowIndex) =>
                updateHeight(height, columnIndex, rowIndex)
              }
            >
              {props.children}
            </VirtualColumn>
          )}
        </Index>
      </div>
    </>
  )
}

export default Masonry
