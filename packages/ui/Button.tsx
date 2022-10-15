import { Component, JSX, JSXElement } from "solid-js";

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: JSXElement;
}

export const Button: Component<Props> = (props) => {
  return (
    <button
      class={props.class}
      uppercase
      tracking-wide
      text="sm"
      font="bold"
      px-4
      py-2
      rounded
      transition-colors
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export default Button;
