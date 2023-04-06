import { createElementSize } from '@solid-primitives/resize-observer'
import { createScrollPosition } from '@solid-primitives/scroll'
import { differenceBy, sum } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  Component,
  createComputed,
  createEffect,
  createMemo,
  For,
  JSXElement,
  mergeProps,
  Show,
  untrack,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { isServer } from 'solid-js/web'

interface Item<T = unknown> {
  id: string
  data: T
}

const VIRTUAL_MARGIN = isServer ? 1000 : innerHeight

export interface VirtualColumnProps<T> {
  items: Array<Item<T>>
  width: number
  gap?: number
  scrollingElement?: string | HTMLElement
  onHeightUpdate?: (height: number) => void
  updateHeight?: (height: number, index: number) => void
  heights?: number[]
  topOffsets?: number[]
  children: (data: {
    id: Accessor<Item<T>['id']>
    data: Accessor<Item<T>['data']>
    width: Accessor<number>
    lastHeight: Accessor<number | undefined>
    style: Accessor<Record<string, string>>
    updateHeight: (height: number) => void
  }) => JSXElement
}

export function VirtualColumn<T>(props: VirtualColumnProps<T>): JSXElement {
  const { onHeightUpdate, updateHeight } = props

  const merged = mergeProps({ gap: 0 }, props)
  const [internalHeights, setInternalHeights] = createStore(
    Array(props.items.length) as number[]
  )
  const heights = createMemo(
    () => props.heights ?? internalHeights,
    undefined,
    { equals: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]) }
  )
  const [renderingOffscreen, setRenderingOffscreen] = createStore(
    [] as (Item<T> & { setHeight: (height: number) => void })[]
  )

  const scrollElement = createMemo(
    () =>
      (typeof merged.scrollingElement === 'string'
        ? document.querySelector(merged.scrollingElement)!
        : merged.scrollingElement) as HTMLElement
  )
  const scrollPos = createScrollPosition(scrollElement)
  const scrollSize = createElementSize(scrollElement)

  const totalHeight = createMemo(() => sum(heights()))
  createComputed(() => onHeightUpdate?.(totalHeight()))

  function renderOffscreen(item: Item<T>): Promise<number> {
    return new Promise((resolve) => {
      setRenderingOffscreen(renderingOffscreen.length, {
        ...item,
        setHeight: resolve,
      })
    })
  }

  const pos = createMemo<{
    top: number
    bottom: number
  }>(
    () => {
      const paddingTop = +scrollElement().style.paddingTop.replace('px', '')
      const top = scrollPos.y - paddingTop - VIRTUAL_MARGIN
      const bottom = scrollSize.height
        ? top + scrollSize.height + 2 * VIRTUAL_MARGIN
        : Infinity
      return {
        top,
        bottom,
      }
    },
    {
      top: 0,
      bottom: Infinity,
    },
    {
      equals: (a, b) => a.top === b.top && a.bottom === b.bottom,
    }
  )

  const [internalTopOffsets, setInternalTopOffsets] = createStore(
    [] as number[]
  )
  const topOffsets = createMemo(
    () => props.topOffsets ?? internalTopOffsets,
    undefined,
    {
      equals: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
    }
  )

  const [s, set] = createStore([] as boolean[])
  const visible = createMemo(() => {
    const gap = merged.gap
    for (let i = 0; i < props.items.length; i++) {
      const height = heights()[i] ?? 0
      if (height === 0) {
        set(i, true)
        continue
      }
      const topOffset = (topOffsets()[i] ?? 0) + gap * i
      set(i, topOffset + height > pos().top && topOffset < pos().bottom)
    }
    return untrack(() => s)
  })

  // const firstVisibleIndex = createMemo(() =>
  //   Math.max(0, visible().indexOf(true))
  // )

  const columnMap = new Map<Item<T>['id'], number>()
  function addItem(item: Item<T>, height: number, rowIndex: number) {
    const lastTopOffset = topOffsets().at(-1)
    const lastHeight = heights().at(-1)
    batch(() => {
      setInternalHeights(rowIndex, height)
      setInternalTopOffsets(
        rowIndex,
        lastTopOffset !== undefined ? lastTopOffset + lastHeight! : 0
      )
    })
    columnMap.set(item.id, rowIndex)
  }

  function removeItem(item: Item<T>) {
    const rowIndex = columnMap.get(item.id)!
    const height = heights()[rowIndex]
    batch(() => {
      setInternalHeights((rows) =>
        rows.slice(0, rowIndex).concat(rows.slice(rowIndex + 1))
      )
      setInternalTopOffsets((rows) =>
        rows
          .slice(0, rowIndex)
          .concat(rows.slice(rowIndex + 1).map((row) => row - height))
      )
    })
  }

  createEffect<Promise<Item<T>[]>>(async (lastPromise) => {
    const newItems = [...props.items]
    if (props.heights) return newItems
    const oldItems = await lastPromise
    const addedItems = differenceBy(newItems, oldItems, (item) => item.id)
    const removedItems = differenceBy(oldItems, newItems, (item) => item.id)

    return await untrack(() =>
      batch(async () => {
        removedItems.forEach(removeItem)
        const heights = await Promise.all(addedItems.map(renderOffscreen))
        setRenderingOffscreen([])
        heights.forEach((height, i) =>
          addItem(addedItems[i], height, oldItems.length + i)
        )
        return newItems
      })
    )
  }, Promise.resolve([]))

  return (
    <>
      <OffScreenRenderer items={renderingOffscreen} width={props.width}>
        {props.children}
      </OffScreenRenderer>
      <main
        class="relative"
        style={{
          width: props.width + 'px',
          height: totalHeight() + merged.gap * props.items.length + 'px',
        }}
      >
        <For each={props.items}>
          {(_, index) => {
            const data = createMemo(() => props.items[index()], undefined, {
              equals: (a, b) => a.id === b.id,
            })
            const height = createMemo(() => heights()[index()])
            const topOffset = createMemo(
              () => topOffsets()[index()] + merged.gap * index()
            )

            return (
              <Show when={visible()[index()]}>
                {props.children({
                  id: () => data().id,
                  data: () => data().data,
                  width: () => props.width,
                  lastHeight: height,
                  updateHeight: updateHeight
                    ? (height) => updateHeight(height, index())
                    : (newHeight: number) =>
                        batch(() => {
                          const diff = newHeight - height()
                          setInternalHeights(index(), newHeight)
                          setInternalTopOffsets(
                            { from: index() + 1, to: topOffsets().length - 1 },
                            (value) => value + diff
                          )
                        }),
                  style: () => ({
                    position: 'absolute',
                    top: topOffset() + 'px',
                    height: height() + 'px',
                  }),
                })}
              </Show>
            )
          }}
        </For>
      </main>
    </>
  )
}

const OffScreenRenderer: Component<{
  items: (Item<unknown> & { setHeight: (height: number) => void })[]
  children: VirtualColumnProps<any>['children']
  width: number
}> = (props) => {
  return (
    <For each={props.items}>
      {(item) => {
        const resolved = children(() =>
          props.children({
            id: () => item.id,
            data: () => item.data,
            style: () => ({}),
            lastHeight: () => undefined,
            updateHeight: () => {},
            width: () => props.width,
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
  )
}

export default VirtualColumn
