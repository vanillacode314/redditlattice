import {
  batch,
  Component,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  JSXElement,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Accessor,
} from "solid-js";
import { compareMap } from "@ui/utils";
import { ReactiveSet } from "@solid-primitives/set";
import { ReactiveMap } from "@solid-primitives/map";
import { Entries } from "@solid-primitives/keyed";

export interface Props<T = any> {
  items: Map<string, T>;
  maxWidth: number;
  gap?: number;
  children: (item: T, width: Accessor<number>) => JSXElement;
}

function diffMap<K = any, V = any>(
  map1: Map<K, V>,
  map2: Map<K, V>
): Map<K, V> {
  const diff = new Map<K, V>();
  for (const [key1, val1] of map1) {
    if (!map2.has(key1)) diff.set(key1, val1);
  }
  return diff;
}

export const Masonry: Component<Props> = (props) => {
  let masonryEl: HTMLDivElement;
  type V = typeof props.items extends Map<any, infer I> ? I : never;
  type K = typeof props.items extends Map<infer K, V> ? K : never;
  const merged = mergeProps({ gap: 0 }, props);
  const [width, setWidth] = createSignal<number>(1);
  const cols = createMemo<number>(() => Math.ceil(width() / props.maxWidth));
  const colWidth = createMemo<number>(() => width() / cols());
  const distributedItems = new ReactiveSet<K>();
  const columns = new ReactiveMap<number, ReactiveMap<K, V>>();
  /* const [gridItems, setGridItems] = createSignal<Item[][]>([]); */
  const propItems = createMemo(() => props.items, props.items, {
    equals: (prev, next) => compareMap(prev, next, () => true),
  });

  createEffect(
    on(propItems, (newItems, oldItems) => {
      if (!oldItems) oldItems = new Map();
      let addedItems = diffMap(newItems, oldItems),
        deletedItems = diffMap(oldItems, newItems);
      /* console.group(); */
      /* console.log("NEW", newItems); */
      /* console.log("OLD", oldItems); */
      /* console.log("ADDED", addedItems); */
      /* console.log("DELETED", deletedItems); */
      /* console.groupEnd(); */
      addItems(addedItems).then(() => removeItems(deletedItems));
    })
  );

  const getShortestColumnIndex: () => number = () => {
    let shortestColIndex = 0;
    let minHeight = Infinity;
    for (const n of new Array(cols()).keys()) {
      const colEl = document.getElementById("masonry-col-" + (n + 1))!;
      const { height } = colEl.getBoundingClientRect();
      if (height >= minHeight) continue;
      minHeight = height;
      shortestColIndex = n;
    }
    return shortestColIndex;
  };

  const addItems = async (items: Map<string, V>) => {
    if (!items.size) return;
    const keys = [...items.keys()];
    return await new Promise<void>((resolve) => {
      let count = 0;
      const len = keys.length;

      requestAnimationFrame(function handler() {
        count++;
        const key = keys[count - 1];
        const item = items.get(key);
        addItem([key, item]);
        if (count < len) {
          requestAnimationFrame(handler);
        }
        resolve();
      });
    });
  };

  const addItem = ([id, val]: [K, V]) => {
    if (distributedItems.has(id)) return;
    const idx = getShortestColumnIndex();
    distributedItems.add(id);
    const map = columns.get(idx)!;
    map.set(id, val);
    columns.set(idx, map);
  };

  const removeItems = (itemsToRemove: Map<K, V>) => {
    if (!itemsToRemove.size) return;
    for (const [id, __] of itemsToRemove) {
      distributedItems.delete(id);
    }
    for (const [, items] of columns) {
      for (const [key] of items) {
        if (itemsToRemove.has(key)) items.delete(key);
      }
    }
  };

  const resetDistribution = () => {
    batch(() => {
      distributedItems.clear();
      for (const n of Array(cols()).keys()) {
        const oldMap = columns.get(n) || new ReactiveMap();
        columns.set(n, oldMap);
      }
    });
  };

  createRenderEffect(
    on(cols, () => {
      resetDistribution();
      addItems(props.items);
    })
  );

  let timer: any;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => setWidth(masonryEl.clientWidth), 100);
  };

  onMount(() => {
    setWidth(masonryEl.clientWidth);
    window.addEventListener("resize", onResize, { passive: true });
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  return (
    <div
      ref={masonryEl!}
      class="grid items-start"
      style={{
        "grid-template-columns": `repeat(${cols()}, 1fr)`,
        gap: `${props.gap}px`,
        "--col-count": cols(),
      }}
    >
      <Entries of={Object.fromEntries(columns)}>
        {(key, items) => (
          <div
            class="flex flex-col"
            id={`masonry-col-${+key + 1}`}
            style={{ gap: `${merged.gap}px` }}
          >
            <Entries of={Object.fromEntries(items())}>
              {(_, val) => props.children(val(), colWidth)}
            </Entries>
          </div>
        )}
      </Entries>
    </div>
  );
};

export default Masonry;
