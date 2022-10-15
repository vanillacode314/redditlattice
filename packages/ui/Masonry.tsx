import {
  batch,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  JSXElement,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { compareSet, compareMap, updateKey } from "@ui/utils";

export interface Props<T = any> {
  items: Map<string, T>;
  maxWidth: number;
  gap?: number;
  children: (item: T, width: number) => JSXElement;
}

function diffMap<K = any, V = any>(
  map1: Map<K, V>,
  map2: Map<K, V>
): Map<K, V> {
  return new Map([...map1.entries()].filter(([newId]) => !map2.has(newId)));
}

export const Masonry: Component<Props> = (props) => {
  type V = typeof props.items extends Map<any, infer I> ? I : never;
  type Item = { id: string; data: V };
  const merged = mergeProps({ gap: 0 }, props);
  const [cols, setCols] = createSignal<number>(0);
  const [distributedItems, setDistributedItems] = createSignal<Set<string>>(
    new Set(),
    { equals: (prev, next) => compareSet(prev, next) }
  );
  const [gridItems, setGridItems] = createSignal<Item[][]>([]);
  const propItems = createMemo(() => props.items, props.items, {
    equals: (prev, next) => compareMap(prev, next, () => true),
  });
  const [heights, setHeights] = createSignal<Map<number, number>>(new Map(), {
    equals: (prev, next) => compareMap(prev, next),
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

  createEffect(
    on(
      cols,
      () => {
        resetDistribution();
        setTimeout(() => {
          addItems(props.items);
        });
      },
      { defer: true }
    )
  );

  const getShortestColumnIndex: () => number = () => {
    let shortestColIndex = 0;
    let minHeight = Infinity;
    for (const n of new Array(cols()).keys()) {
      const colEl = document.querySelector(`#masonry-col-${n + 1}`)!;
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
        const data = items.get(key);
        addItem({ id: key, data });
        if (count < len) {
          requestAnimationFrame(handler);
        }
        resolve();
      });
    });
  };

  const addItem = (item: Item) => {
    if (distributedItems().has(item.id)) return;
    const idx = getShortestColumnIndex();
    setHeights((_) => updateKey(new Map(_), idx, (val) => val + 1));
    setDistributedItems((_) => _.add(item.id));
    setGridItems((_) => {
      _[idx] = [..._[idx], item];
      return [..._];
    });
  };

  const removeItems = (itemsToRemove: Map<string, V>) => {
    if (!itemsToRemove.size) return;
    setDistributedItems((_) => {
      for (const [id, __] of itemsToRemove) {
        _.delete(id);
      }
      return new Set(_);
    });
    for (const [x, row] of gridItems().entries()) {
      for (const item of row) {
        const shouldRemove = itemsToRemove.has(item.id);
        if (!shouldRemove) continue;
        setGridItems((grid) => {
          grid[x] = grid[x].filter((item) => !itemsToRemove.has(item.id));
          return [...grid];
        });
        setHeights((_) => updateKey(new Map(_), x, (val) => val - 1));
      }
    }
  };

  const updateCols = () => {
    const n = Math.ceil(window.innerWidth / props.maxWidth);
    if (cols() !== n) setCols(n);
  };

  const resetDistribution = () => {
    batch(() => {
      setHeights(new Map(Array.from(Array(cols()), (_, idx) => [idx, 0])));
      setDistributedItems(new Set<string>());
      setGridItems(Array.from(Array(cols()), () => []));
    });
  };

  let timer: any;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => updateCols(), 500);
  };

  onMount(() => {
    updateCols();
    window.addEventListener("resize", onResize);
    onCleanup(() => window.removeEventListener("resize", onResize));
  });

  return (
    <div
      class="grid items-start"
      style={{
        "grid-template-columns": `repeat(${cols()}, 1fr)`,
        gap: `${props.gap}px`,
        "--col-count": cols(),
      }}
    >
      <Index each={gridItems()}>
        {(row, colIndex) => (
          <div
            class="flex flex-col"
            id={`masonry-col-${colIndex + 1}`}
            style={{ gap: `${merged.gap}px` }}
          >
            <For each={row()}>
              {({ data }) => props.children(data, window.innerWidth / cols())}
            </For>
          </div>
        )}
      </Index>
    </div>
  );
};

export default Masonry;
