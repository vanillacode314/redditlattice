import { batch, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { formatBytes } from "~/utils";
import { useUserState, useAppState } from "~/stores";
import { stringify, parse } from "devalue";
import { Button } from "ui";

export default function Settings() {
  let filesInput: HTMLInputElement;
  const [appState, setAppState] = useAppState();
  const [userState, setUserState] = useUserState();
  const [usageStats, setUsageStats] = createStore<{
    total: number;
    used: number;
  }>({ total: 1, used: 0 });

  const getUsageStats = async () => {
    const { quota, usage } = await navigator.storage.estimate();
    return {
      total: quota || 1,
      used: usage || 0,
    };
  };

  const clearCache = async () => {
    await caches.delete("images-assets");
    setUsageStats(await getUsageStats());
  };

  const handleImport = async () => {
    const file = filesInput.files[0];
    if (!file) {
      alert("Please select a file to import");
      return;
    }
    try {
      const content = await file.text();
      const data = parse(content) as ReturnType<typeof userState>;
      const { subreddits, sort, searchTerms } = data;
      batch(() => {
        if (subreddits) {
          const x = new Set([...subreddits, ...userState().subreddits]);
          setUserState((state) => ({ ...state, subreddits: x }));
        }
        if (sort) {
          const x = new Map([...sort, ...userState().sort]);
          setUserState((state) => ({ ...state, sort: x }));
        }
        if (searchTerms) {
          const x = new Map([...searchTerms, ...userState().searchTerms]);
          setUserState((state) => ({ ...state, searchTerms: x }));
        }
      });
    } catch (e) {
      alert("Selected file contains invalid data");
    }
  };

  const exportData = async () => {
    const data = stringify(userState());
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
    a.download = `redditlattice-${new Date().toLocaleDateString()}.dat`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  onMount(async () => {
    setUsageStats(await getUsageStats());
  });

  onMount(() => setAppState("title", "Settings"));
  return (
    <div p-5 flex flex-col-reverse h-full gap-5 id="scroller">
      <Button
        onClick={() => filesInput.click()}
        class="bg-green-800 hover:bg-green-700 transitions-colors"
      >
        Import Data
      </Button>
      <Button
        onClick={() => exportData()}
        class="bg-purple-800 hover:bg-purple-700 transitions-colors"
      >
        Export Data
      </Button>
      <Button
        onClick={() => clearCache()}
        class="bg-blue-800 hover:bg-red-700 relative overflow-hidden transitions-colors"
      >
        <div
          bg="red-800"
          absolute
          inset-y-0
          left-0
          style={{ width: `${100 * (usageStats.used / usageStats.total)}%` }}
        ></div>
        <span z-10 relative>
          Clear Cache ({formatBytes(usageStats.used)}/
          {formatBytes(usageStats.total)})
        </span>
      </Button>
      <input
        class="hidden"
        type="file"
        onInput={() => handleImport()}
        ref={filesInput}
      />
    </div>
  );
}
