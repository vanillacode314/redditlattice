import { createElementSize } from '@solid-primitives/resize-observer'
import { differenceBy } from 'lodash-es'
import {
  Accessor,
  batch,
  createEffect,
  createMemo,
  createSignal,
  Index,
  JSX,
  JSXElement,
  mergeProps,
  untrack,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { sum } from './utils'
import VirtualColumn from './VirtualColumn'

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
  getInitialHeight: (id: Item['id'], width: number) => number
  children: (data: {
    id: Accessor<Item<T>['id']>
    data: Accessor<Item<T>['data']>
    width: Accessor<number>
    y: Accessor<number>
    lastHeight: Accessor<number | undefined>
    updateHeight: (height: number) => void
  }) => JSXElement
}

interface State<T> {
  numberOfColumns: number
  columnWidth: number
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
      width ? Math.floor((width - gaps) / cols) : 0,
      merged.maxWidth
    )
  })

  const [state, setState] = createStore<State<T>>(
    {
      columns: get2DArray(numberOfColumns(), 1),
      topOffsets: get2DArray(numberOfColumns(), 1),
      heights: get2DArray(numberOfColumns(), 1),
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
      const columnHeight = state.topOffsets[columnIndex].at(-1) ?? 0
      if (columnHeight === undefined) return columnIndex
      if (columnHeight >= shortestColumnHeight) continue
      shortestColumnIndex = columnIndex
      shortestColumnHeight = columnHeight
    }
    return shortestColumnIndex
  }

  const gridMap = new Map<Item<T>['id'], [number, number]>()
  function addItem(item: Item<T>) {
    const columnIndex = getShortestColumnIndex()
    const rowIndex = state.columns[columnIndex].length
    const lastTopOffset = state.topOffsets[columnIndex][rowIndex - 1]
    const lastHeight = state.heights[columnIndex][rowIndex - 1]
    const newTopOffset =
      typeof lastTopOffset === 'number' ? lastTopOffset + lastHeight : 0
    const height = props.getInitialHeight(item.id, state.columnWidth)

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
      setState(
        'heights',
        columnIndex,
        produce((row) => row.splice(0, rowIndex))
      )
      setState(
        'topOffsets',
        columnIndex,
        produce((rows) => {
          rows.splice(rowIndex, 1)
          for (let i = rowIndex; i < rows.length; i++) rows[i] -= height
        })
      )
      setState('columns', columnIndex, (row) => row.splice(rowIndex, 1))
    })
  }

  createEffect<[Item<T>[], number]>(
    (prev) => {
      if (!masonrySize.width) return prev
      const newItems = props.items
      const currentNumberOfColumns = numberOfColumns()
      const [oldItems, lastNumberOfColumns] = prev
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

      return untrack(() =>
        batch(() => {
          removedItems.forEach(removeItem)
          addedItems.forEach(addItem)
          return [newItems, currentNumberOfColumns]
        })
      )
    },
    [[], numberOfColumns()]
  )

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

  const getColumnHeight = (index: number) => {
    const heights = state.heights[index]
    const gaps = (heights.length - 1) * merged.gap
    return sum(state.heights[index]) + gaps
  }

  return (
    <div
      class="grid items-start contain-strict"
      ref={setMasonryRef}
      style={{
        height: `${Math.max(
          ...state.columns.map((_, index) => getColumnHeight(index))
        )}px`,
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
            items={rows()}
            scrollingElement={props.scrollingElement}
            gap={props.gap}
            width={state.columnWidth}
            getInitialHeight={props.getInitialHeight}
            updateHeight={(height, rowIndex) =>
              updateHeight(height, columnIndex, rowIndex)
            }
          >
            {props.children}
          </VirtualColumn>
        )}
      </Index>
    </div>
  )
}

export default Masonry
