import { createIntersectionObserver } from '@solid-primitives/intersection-observer'
import { Key } from '@solid-primitives/keyed'
import { ReactiveWeakMap } from '@solid-primitives/map'
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
  JSX,
  JSXElement,
  mergeProps,
  onCleanup,
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
  }) => Exclude<JSXElement, JSX.ArrayElement>
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

  const [els, setEls] = createStore([] as HTMLElement[])
  createIntersectionObserver(
    () => els,
    (entries) =>
      entries.forEach((entry) =>
        visible.set(entry.target, entry.isIntersecting)
      ),
    {
      // rootMargin: `${VIRTUAL_MARGIN}px`,
      threshold: 0,
      root: scrollElement(),
      rootMargin: `${VIRTUAL_MARGIN}px 0px ${VIRTUAL_MARGIN}px 0px`,
    }
  )
  const visible = new ReactiveWeakMap<Element, boolean>()
  // const [visible, setVisible] = createStore([] as boolean[])

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
            const resolved = props.children({
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
                        {
                          from: index() + 1,
                          to: topOffsets().length - 1,
                        },
                        (value) => value + diff
                      )
                    }),
            })
            const el = children(() => resolved)

            queueMicrotask(() => {
              setEls(index(), el() as HTMLElement)
            })
            onCleanup(() => setEls((els) => els.filter(($el) => $el !== el())))
            return (
              <div
                style={{
                  visibility:
                    visible.get(el() as HTMLElement) === false
                      ? 'hidden'
                      : 'visible',
                }}
              >
                {el()}
              </div>
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
