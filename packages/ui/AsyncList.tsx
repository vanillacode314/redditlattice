import { Component, createResource } from "solid-js";
import List from "./List";

interface Item {
  id: string;
  title: string;
}

interface Props<T = any> {
  key: T;
  fetcher: (key: T) => Promise<Item[]>;
  onClick: (id: Item["id"]) => void;
  onRemove?: (id: Item["id"]) => void;
  title?: string;
  reverse?: boolean;
  focusable?: boolean;
}

export const AsyncList: Component<Props> = (props) => {
  type Params = typeof props.key;
  const [items] = createResource<
    Awaited<ReturnType<typeof props.fetcher>>,
    Params
  >(() => props.key, props.fetcher);

  return (
    <List
      items={items() || []}
      onClick={props.onClick}
      focusable={props.focusable}
      title={props.title}
      reverse={props.reverse}
      onRemove={props.onRemove}
    />
  );
};

export default AsyncList;
