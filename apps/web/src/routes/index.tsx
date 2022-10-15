import {
  onMount,
  batch,
  createMemo,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import { useNavigate } from "solid-start";
import { trpc } from "~/client";
import { AsyncList, List, Spinner } from "ui";
import { TransitionFade } from "ui/transitions";
import { useAppState, useUserState } from "~/stores";

export default function Home() {
  const [userState, setUserState] = useUserState();
  const [appState, setAppState] = useAppState();

  onMount(() => setAppState("title", ""));

  const [subreddit, setSubreddit] = createSignal<string>("");
  const [searchTerm, setSearchTerm] = createSignal<string>("");
  const [focused, setFocused] = createSignal<boolean>(false);

  const query = createMemo<string>(() => {
    if (!subreddit()) return "";
    if (searchTerm()) {
      return `${subreddit().toLowerCase()}?${searchTerm().toLowerCase()}`;
    }
    return `${subreddit().toLowerCase()}`;
  });

  const navigate = useNavigate();

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!query().trim()) return;
    if (query().startsWith("?")) return;
    if (searchTerm()) {
      navigate(`/r/${subreddit()}?q=${searchTerm()}`);
    } else {
      navigate(`/r/${query()}`);
    }
  }

  function removeSubreddit(id: string) {
    setUserState((state) => {
      state.subreddits.delete(id);
      return { ...state };
    });
  }

  function removeSearchTerm(id: string) {
    setUserState((state) => {
      state.searchTerms.delete(id);
      return { ...state };
    });
  }

  return (
    <main pb-5 h-full flex flex-col-reverse overflow-hidden>
      <form
        class="grid grid-cols-[1fr_auto]"
        gap-3
        items-center
        px-5
        onSubmit={onSubmit}
      >
        <div
          ring="~ pink-800 hover:pink-700 focus:pink-700"
          transition-colors
          class="grid grid-cols-[auto_1fr_auto]"
          gap-3
          bg-black
          outline-none
          rounded-full
          py-2
          px-5
          items-center
        >
          <span font="bold" text="gray-500">
            /r/
          </span>
          <input
            value={query()}
            onInput={(e) => {
              const [sr, q] = e.currentTarget.value.split("?");
              batch(() => {
                setSubreddit(sr || "");
                setSearchTerm(q || "");
              });
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            type="text"
            id="search"
            name="subreddit"
            min-w-0
            bg-transparent
            outline-none
          />
          <TransitionFade blur duration={100}>
            <Show when={query()}>
              <button
                type="button"
                onClick={() => {
                  batch(() => {
                    setSubreddit("");
                    setSearchTerm("");
                  });
                }}
                onFocus={(e) => e.relatedTarget?.focus()}
                class="i-mdi-close-circle text-xl"
              >
                /r/
              </button>
            </Show>
          </TransitionFade>
        </div>
        <button
          text="white xl"
          rounded-full
          w-13
          h-13
          outline-none
          grid
          place-items-center
          bg="pink-800 hover:pink-700 focus:pink-700"
          ring="focus:~ focus:blue"
          transition-colors
          shrink-0
        >
          <div class="i-mdi-magnify"></div>
        </button>
      </form>
      <div
        id="scroller"
        flex="~ col-reverse"
        gap-2
        py-5
        grow
        shrink-1
        p="t-[70%]"
      >
        <Show
          when={!query() || !focused()}
          fallback={
            <Suspense
              fallback={
                <div class="p-5 grid place-items-center">
                  <Spinner></Spinner>
                </div>
              }
            >
              <AsyncList
                onClick={(id) => {
                  batch(() => {
                    setSubreddit(id);
                    setSearchTerm("");
                  });
                }}
                focusable={false}
                reverse
                title="subreddits"
                fetcher={async (query) =>
                  query
                    ? await trpc.subredditAutocomplete
                        .query(query)
                        .then(({ subreddits }) =>
                          subreddits.map(({ name }) => ({
                            id: name,
                            title: name,
                          }))
                        )
                    : []
                }
                key={query()}
              ></AsyncList>
            </Suspense>
          }
        >
          <List
            onClick={(id) => setSubreddit(id)}
            onRemove={(id) => removeSubreddit(id)}
            reverse
            title="subreddits"
            items={[...userState().subreddits].sort().map((sr) => ({
              id: sr,
              title: sr,
            }))}
          ></List>
          <div border="b gray-800"></div>
          <List
            onClick={(id) => {
              const sr = subreddit() || userState().searchTerms.get(id);
              if (sr) {
                batch(() => {
                  setSubreddit(sr);
                  setSearchTerm(id);
                });
              }
            }}
            onRemove={(id) => removeSearchTerm(id)}
            reverse
            title="searches"
            items={[...userState().searchTerms.keys()].sort().map((q) => ({
              id: q,
              title: q,
            }))}
          ></List>
        </Show>
      </div>
    </main>
  );
}
