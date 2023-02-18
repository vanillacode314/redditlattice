import { Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import { cloneDeep, differenceBy } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  createComputed,
  createEffect,
  createMemo,
  createRenderEffect,
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
  items: Array<Item<T>>
  maxWidth: number
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
  const merged = mergeProps({ gap: 0 }, props)
  const [masonryRef, setMasonryRef] = createSignal<HTMLDivElement>()
  const masonrySize = createElementSize(masonryRef)
  const numberOfColumns = createMemo(() =>
    masonrySize.width ? Math.ceil(masonrySize.width / props.maxWidth) : 1
  )
  const columnWidth = createMemo(() => {
    const cols = numberOfColumns()
    const gaps = merged.gap * (cols - 1)
    const width = masonrySize.width
    return Math.floor(width ? (width - gaps) / cols : 0)
  })
  const [state, setState] = createStore<State<TItem>>({
    busy: false,
    top: 0,
    bottom: 0,
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
        state.columns.forEach((column, i) => {
          column.forEach((item, j) => {
            const itemTop = state.topOffset[i][j] + merged.gap * j
            const itemHeight = state.heights[i][j]
            const itemBottom = itemTop + itemHeight
            value[i][j] =
              itemTop <= state.bottom + BOUNDS &&
              itemBottom >= state.top - BOUNDS
          })
        })
        return value
      })
    )
  })

  onMount(() => {
    const detach = props.attachScrollHandler?.((e) => {
      const el = e.target as HTMLElement
      if (!el) return
      setState({
        top: el.scrollTop,
        bottom: el.scrollTop + el.clientHeight,
      })
    })
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
        }
      }
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

  createRenderEffect(
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
        class="grid place-items-start"
        ref={setMasonryRef}
        style={{
          'column-gap': `${merged.gap}px`,
          'grid-template-columns': `repeat(${state.numberOfColumns},1fr)`,
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
