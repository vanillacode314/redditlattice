import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { getImages } from "@api/lib/get-images";
import { getAutocompleteSubreddits } from "@api/lib/get-autocomplete-subreddits";

const t = initTRPC.create();

export const appRouter = t.router({
  getImages: t.procedure
    .input(
      z.object({
        subreddit: z.string(),
        q: z.string().optional(),
        after: z.string().optional(),
        sort: z.string().optional(),
      })
    )
    .query(({ input }) => getImages(input)),
  subredditAutocomplete: t.procedure
    .input(z.string())
    .query(({ input }) => getAutocompleteSubreddits(input)),
});

export type AppRouter = typeof appRouter;
