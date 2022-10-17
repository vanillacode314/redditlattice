import {
  JSXElement,
  Component,
  Accessor,
  createSignal,
  createMemo,
  createEffect,
  on,
  For,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Entries, Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import _, { range } from 'lodash'

interface Item<T = any> {
  id: string
  data: T
}

export interface Props<T = any> {
  items: Array<Item<T>>
  maxWidth: number
  gap?: number
  children: (id: Item<T>['id'], data: T, width: Accessor<number>) => JSXElement
}

export const Masonry: Component<Props> = (props) => {
  type I = typeof props.items[number]
  const [el, setEl] = createSignal<HTMLElement>()
  const size = createElementSize(el)
  const cols = createMemo<number>(() =>
    size.width ? Math.ceil(size.width / props.maxWidth) : 1
  )
  const colWidth = createMemo<number>(() =>
    size.width ? size.width / cols() : 0
  )
  const [columns, setColumns] = createStore<Record<number, I[]>>()

  function getShortestColumnIndex(): number {
    let minIndex = 0
    let minHeight = Infinity
    for (const x of range(cols())) {
      const colEl = document.getElementById(`__masonry-col-${x}`)
      const { height } = colEl ? colEl.getBoundingClientRect() : { height: 0 }
      if (height <= minHeight) {
        minIndex = x
        minHeight = height
      }
    }
    return minIndex
  }

  createEffect(
    on(
      () => props.items,
      (n, p) => {
        p = p || []
        const deletedItems = _.difference(p, n)
        const addedItems = _.difference(n, p)
        for (const [idx, items] of Object.entries(columns)) {
          setColumns({
            [idx]: items.filter((item) =>
              deletedItems.some((i) => item.id === i.id)
            ),
          })
        }

        let len = addedItems.length
        let i = 0
        requestAnimationFrame(function handler() {
          if (i === len) return
          const item = addedItems[i]
          const idx = getShortestColumnIndex()
          const old = columns[idx] || []
          setColumns({ [idx]: [...old, item] })
          i++
          requestAnimationFrame(handler)
        })
      }
    )
  )

  createEffect(
    on(cols, () => {
      for (const [idx, chunk] of _.chunk(
        props.items,
        Math.floor(props.items.length / cols())
      ).entries()) {
        setColumns({ [idx]: chunk })
      }
    })
  )

  return (
    <div
      class="grid"
      style={{
        'grid-template-columns': `repeat(${cols()},1fr)`,
        'align-items': 'start',
      }}
      ref={setEl}
    >
      <Key each={Object.entries(columns)} by={([, v]) => v}>
        {(value) => {
          const [idx, items] = value()
          return (
            <div class="flex flex-col" id={`__masonry-col-${idx}`}>
              <Key each={items} by="id">
                {(item) => props.children(item().id, item().data, colWidth)}
              </Key>
            </div>
          )
        }}
      </Key>
    </div>
  )
}

export default Masonry
