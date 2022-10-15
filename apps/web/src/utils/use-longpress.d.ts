import { Options } from "./use-longpress.ts";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      longpress: Options;
    }
  }
}
