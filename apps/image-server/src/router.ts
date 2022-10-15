import { initTRPC } from "@trpc/server";
export * from "@trpc/server";
import { z } from "zod";
import { getTransformer } from "@image-server/transform";
import undici from "undici";

const t = initTRPC.create();

export const imageRouter = t.router({
  transformImage: t.procedure
    .input(
      z.object({
        url: z.string(),
        width: z.number().optional(),
        format: z.union([z.literal("webp"), z.literal("avif")]),
      })
    )
    .query(async ({ input }) => {
      const { width, url, format } = input;
      const isGif = url.endsWith(".gif");
      const { statusCode, body } = await undici.request(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
        },
        maxRedirections: 3,
      });
      if (isGif) return body;
      const transformer = getTransformer(width, format);
      return body.pipe(transformer);
    }),
});

export type ImageRouter = typeof imageRouter;
