import { createIntersectionObserver } from '@solid-primitives/intersection-observer'
import { Key } from '@solid-primitives/keyed'
import { ReactiveWeakMap } from '@solid-primitives/map'
import { differenceBy } from 'lodash-es'
import {
  Accessor,
  batch,
  children,
  createComputed,
  createEffect,
  createMemo,
  JSX,
  JSXElement,
  mergeProps,
  onCleanup,
  untrack,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
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

  const scrollElement = createMemo(
    () =>
      (typeof merged.scrollingElement === 'string'
        ? document.querySelector(merged.scrollingElement)!
        : merged.scrollingElement) as HTMLElement
  )

  const totalHeight = createMemo(() => sum(heights()))
  createComputed(() => onHeightUpdate?.(totalHeight()))

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
      threshold: 0,
      root: scrollElement(),
      rootMargin: `${VIRTUAL_MARGIN}px 0px ${VIRTUAL_MARGIN}px 0px`,
    }
  )
  const visible = new ReactiveWeakMap<Element, boolean>()

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
      setInternalHeights(produce((rows) => rows.splice(rowIndex, 1)))
      setInternalTopOffsets(
        produce((rows) => {
          rows.splice(rowIndex, 1)
          for (let i = rowIndex; i < rows.length; i++) rows[i] -= height
        })
      )
    })
  }

  createEffect<Item<T>[]>((prev) => {
    const newItems = [...props.items]
    if (props.heights) return newItems
    const oldItems = prev
    const addedItems = differenceBy(newItems, oldItems, (item) => item.id)
    const removedItems = differenceBy(oldItems, newItems, (item) => item.id)

    return untrack(() =>
      batch(() => {
        removedItems.forEach(removeItem)
        addedItems.forEach((item, i) => addItem(item, oldItems.length + i))
        return newItems
      })
    )
  }, [])

  return (
    <main
      class="relative contain-strict"
      style={{
        width: props.width + 'px',
        height: totalHeight() + merged.gap * (props.items.length - 1) + 'px',
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

          setEls(index(), el() as HTMLElement)
          onCleanup(() => setEls(produce((els) => els.splice(index(), 1))))
          return (
            <div
              style={{
                visibility: visible.get(el() as HTMLElement)
                  ? 'visible'
                  : 'hidden',
              }}
            >
              {el()}
            </div>
          )
        }}
      </Key>
      {/* </Index> */}
    </main>
  )
}

export default VirtualColumn
