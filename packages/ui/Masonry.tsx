import {
  JSXElement,
  Component,
  Accessor,
  createSignal,
  createMemo,
  Index,
} from 'solid-js'
import { Key } from '@solid-primitives/keyed'
import { createElementSize } from '@solid-primitives/resize-observer'
import _ from 'lodash'

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
  const [el, setEl] = createSignal<HTMLElement>()
  const size = createElementSize(el)
  const cols = createMemo<number>(() =>
    size.width ? Math.ceil(size.width / props.maxWidth) : 1
  )
  const colWidth = createMemo<number>(() =>
    size.width ? size.width / cols() : 0
  )
  const columns = createMemo<Item[][]>(() =>
    _.chunk(props.items, Math.floor(props.items.length / cols()))
  )

  return (
    <div
      class="grid"
      style={{ 'grid-template-columns': `repeat(${cols()}, 1fr)` }}
      ref={setEl}
    >
      <Index each={Array(cols()).fill(0)}>
        {(item, index) => (
          <div class="flex flex-col">
            <Key each={columns()[index]} by="id">
              {(item) => props.children(item().id, item().data, colWidth)}
            </Key>
          </div>
        )}
      </Index>
    </div>
  )
}

export default Masonry
