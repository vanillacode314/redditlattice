import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { ImageRouter } from "image-server/src/router";
import { IMAGE_SERVER_BASE_PATH } from "./consts";

export const imageTrpc = createTRPCProxyClient<ImageRouter>({
  links: [
    httpBatchLink({
      url: IMAGE_SERVER_BASE_PATH + "/trpc",
    }),
  ],
});
