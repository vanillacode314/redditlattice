import { Key } from '@solid-primitives/keyed'
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
  on,
  onCleanup,
  onMount,
  Show,
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
  busy: boolean
  numberOfColumns: number
  columnWidth: number
  columns: T[][]
  top: number
  bottom: number
  heights: number[][]
  topOffset: number[][]
  visible: boolean[][]
  masonrySize: { readonly height: number | null; readonly width: number | null }
  renderingOffscreen: (T & { setHeight: (height: number) => void })[]
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
  const [state, setState] = createStore<State<TItem>>({
    busy: false,
    top: 0,
    bottom: Infinity,
    heights: Array(numberOfColumns())
      .fill(null)
      .map(() => []),
    topOffset: Array(numberOfColumns())
      .fill(null)
      .map(() => []),
    visible: Array(numberOfColumns())
      .fill(null)
      .map(() => []),
    columns: [],
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
  })

  createEffect(() => {
    setState(
      'visible',
      produce((value) => {
        for (let i = 0; i < state.columns.length; i++) {
          function getTop() {
            let low = 0
            let high = state.columns[i].length - 1
            let mid = Math.floor((low + high) / 2)
            while (low <= high) {
              mid = Math.floor((low + high) / 2)
              const itemTop = state.topOffset[i][mid] + merged.gap * mid
              const itemHeight = state.heights[i][mid]
              const itemBottom = itemTop + itemHeight
              if (itemBottom > state.top - BOUNDS) {
                high = mid - 1
              } else {
                low = mid + 1
              }
            }
            return mid
          }

          function getBottom() {
            let low = 0
            let high = state.columns[i].length - 1
            let mid = Math.floor((low + high) / 2)
            while (low <= high) {
              mid = Math.floor((low + high) / 2)
              const itemTop = state.topOffset[i][mid] + merged.gap * mid
              if (itemTop < state.bottom + BOUNDS) {
                low = mid + 1
              } else {
                high = mid - 1
              }
            }
            return mid
          }
          value[i].fill(false)
          value[i].fill(true, getTop(), getBottom() + 1)
        }
        return value
      })
    )
  })

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

  function getShortestColumnIndex() {
    let shortestColumnIndex = 0
    let shortestColumnHeight = Infinity
    for (let i = 0; i < state.numberOfColumns; i++) {
      const height = state.topOffset[i]?.at(-1) ?? 0
      if (height >= shortestColumnHeight) continue
      shortestColumnIndex = i
      shortestColumnHeight = height
    }
    return shortestColumnIndex
  }

  function addItem(item: TItem): Promise<void> {
    return new Promise((resolve) => {
      const index = state.renderingOffscreen.length
      setState('renderingOffscreen', index, {
        ...item,
        setHeight(height: number) {
          setState('renderingOffscreen', (value) =>
            value.filter((i) => i.id !== item.id)
          )
          const columnIndex = getShortestColumnIndex()
          batch(() => {
            setState('heights', columnIndex, (value) =>
              value ? [...value, height] : [height]
            )
            setState('topOffset', columnIndex, (value) =>
              value && value.length > 0
                ? [
                    ...value,
                    value[value.length - 1] +
                      state.heights[columnIndex][value.length - 1],
                  ]
                : [0]
            )
            setState('visible', columnIndex, (value) =>
              value ? [...value, true] : [true]
            )
            setState('columns', columnIndex, (value) =>
              value ? [...value, item] : [item]
            )
          })
          resolve()
        },
      })
    })
  }

  function deleteItem(item: TItem) {
    let i!: number
    let j!: number
    for (const [columnIndex, column] of state.columns.entries()) {
      for (const [rowIndex, row] of column.entries()) {
        if (row.id === item.id) {
          i = columnIndex
          j = rowIndex
          break
        }
      }
    }
    if (!i || !j) {
      console.error('item with id:', item.id, 'not found')
      return
    }
    const height = state.heights[i][j]
    batch(() => {
      setState(
        'columns',
        produce((value) => {
          value[i].splice(j, 1)
          if (value[i].length === 0) value.splice(i, 1)
          return value
        })
      )
      setState(
        'heights',
        produce((value) => {
          value[i].splice(j, 1)
          if (value[i].length === 0) value.splice(i, 1)
          return value
        })
      )
      setState(
        'visible',
        produce((value) => {
          value[i].splice(j, 1)
          if (value[i].length === 0) value.splice(i, 1)
          return value
        })
      )
      setState(
        'topOffset',
        produce((value) => {
          for (let k = j + 1; k < value.length; k++) {
            if (value[i][k]) value[i][k] -= height
          }
          value[i].splice(j, 1)
          if (value[i].length === 0) value.splice(i, 1)
          return value
        })
      )
    })
  }

  async function addItems(...items: TItem[]): Promise<void> {
    for (const item of items) {
      await addItem(item)
    }
  }

  function deleteItems(...items: TItem[]): void {
    for (const item of items) {
      deleteItem(item)
    }
  }

  createEffect(
    on(
      () => props.items,
      async (newItems, oldItems) => {
        oldItems = oldItems || []
        const deletedItems = differenceBy(oldItems, newItems, (v) => v.id)
        const addedItems = differenceBy(newItems, oldItems, (v) => v.id)
        setState('busy', true)
        deleteItems(...deletedItems)
        await addItems(...addedItems)
        setState('busy', false)
      }
    )
  )

  const resetGrid = async () => {
    if (state.busy) return
    setState('busy', true)
    deleteItems(...props.items)
    await addItems(...props.items)
    setState('busy', false)
  }

  createEffect(
    on(
      () => state.numberOfColumns,
      () => resetGrid(),
      { defer: true }
    )
  )

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
                width: () => state.columnWidth,
              })
            )
            requestAnimationFrame(() => {
              const list = resolved.toArray() as HTMLElement[]
              for (const child of list) {
                if (child) {
                  const { height } = child.getBoundingClientRect()
                  item.setHeight(height)
                  break
                }
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
                            produce((value) => {
                              for (
                                let i = rowIndex() + 1;
                                i < value.length;
                                i++
                              ) {
                                value[i] += diff
                              }
                              return value
                            })
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
