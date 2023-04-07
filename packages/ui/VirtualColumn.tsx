import { createEventListener } from '@solid-primitives/event-listener'
import { Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import { createStaticStore } from '@solid-primitives/static-store'
import { differenceBy } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  Component,
  createComputed,
  createEffect,
  createMemo,
  For,
  Index,
  JSXElement,
  mergeProps,
  Show,
  untrack,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { isServer } from 'solid-js/web'
import { sum } from './utils'

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
  // const [renderingOffscreen, setRenderingOffscreen] = createStore(
  //   [] as (Item<T> & { setHeight: (height: number) => void })[]
  // )

  const scrollElement = createMemo(
    () =>
      (typeof merged.scrollingElement === 'string'
        ? document.querySelector(merged.scrollingElement)!
        : merged.scrollingElement) as HTMLElement
  )

  const [scrollPos, setScrollPos] = createStaticStore({
    x: 0,
    y: 0,
  })
  createEventListener(
    scrollElement,
    'scroll',
    () => {
      setScrollPos({
        x: scrollElement().scrollLeft,
        y: scrollElement().scrollTop,
      })
    },
    {
      passive: true,
    }
  )
  const scrollSize = createElementSize(scrollElement)

  const totalHeight = createMemo(() => sum(heights()))
  createComputed(() => onHeightUpdate?.(totalHeight()))

  // function renderOffscreen(item: Item<T>): Promise<number> {
  //   return new Promise((resolve) => {
  //     setRenderingOffscreen(renderingOffscreen.length, {
  //       ...item,
  //       setHeight: resolve,
  //     })
  //   })
  // }

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

  const [visible, setVisible] = createStore([] as boolean[])
  createEffect(() => {
    const gap = merged.gap
    const $heights = heights()
    const $topOffsets = topOffsets()
    for (let i = 0; i < props.items.length; i++) {
      const height = $heights[i] ?? 0
      if (height === 0) {
        setVisible(i, true)
        continue
      }
      const topOffset = ($topOffsets[i] ?? 0) + gap * i
      const newState =
        topOffset + height > pos().top && topOffset < pos().bottom
      if (visible[i] === newState) continue
      setVisible(i, newState)
    }
  })

  // const firstVisibleIndex = createMemo(() => Math.max(0, visible.indexOf(true)))
  // const numberOfVisibleItems = createMemo(() => visible.filter(Boolean).length)

  const columnMap = new Map<Item<T>['id'], number>()
  function addItem(item: Item<T>, rowIndex: number) {
    const lastTopOffset = topOffsets().at(-1)
    const lastHeight = heights().at(-1)
    const height = props.getInitialHeight(item.id, props.width)
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
        addedItems.forEach((item, i) => addItem(item, oldItems.length + i))
        return newItems
      })
    )
  }, Promise.resolve([]))

  return (
    <>
      {/* <OffScreenRenderen items={renderingOffscreen} width={props.width}> */}
      {/*   {props.children} */}
      {/* </OffScreenRenderer> */}
      <main
        class="relative"
        style={{
          width: props.width + 'px',
          height: totalHeight() + merged.gap * props.items.length + 'px',
        }}
      >
        {/* <Index */}
        {/*   each={[...props.items.entries()].slice( */}
        {/*     firstVisibleIndex(), */}
        {/*     numberOfVisibleItems() */}
        {/*   )} */}
        {/* > */}
        <Key each={props.items} by="id">
          {(_, index) => {
            // const index = () => firstVisibleIndex() + i
            const data = createMemo(() => props.items[index()], undefined, {
              equals: (a, b) => a.id === b.id,
            })
            const height = createMemo(() => heights()[index()])
            const topOffset = createMemo(
              () => topOffsets()[index()] + merged.gap * index()
            )

            return (
              <Show when={visible[index()]}>
                {props.children({
                  id: () => data().id,
                  data: () => data().data,
                  width: () => props.width,
                  lastHeight: height,
                  y: topOffset,
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
                })}
              </Show>
            )
          }}
        </Key>
        {/* </Index> */}
      </main>
    </>
  )
}

export const OffScreenRenderer: Component<{
  items: (Item<unknown> & { setHeight: (height: number) => void })[]
  children: VirtualColumnProps<any>['children']
  width: number
}> = (props) => {
  return (
    <div class="opacity-0 absolute">
      <For each={props.items}>
        {(item) => {
          const resolved = children(() =>
            props.children({
              id: () => item.id,
              data: () => item.data,
              lastHeight: () => undefined,
              updateHeight: () => {},
              width: () => props.width,
              y: () => 0,
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
  )
}

export default VirtualColumn
