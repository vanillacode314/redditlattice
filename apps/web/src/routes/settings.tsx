import { Show, batch, For, onMount, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { download, formatBytes } from '~/utils'
import { useUserState, useAppState } from '~/stores'
import { stringify, parse } from 'devalue'
import { Button } from 'ui'

export default function Settings() {
  let filesInput: HTMLInputElement
  const [, setAppState] = useAppState()
  const [userState, setUserState] = useUserState()
  const [usageStats, setUsageStats] = createStore<{
    total: number
    used: number
  }>({ total: 1, used: 0 })

  const getUsageStats = async () => {
    const { quota, usage } = await navigator.storage.estimate()
    return {
      total: quota || 1,
      used: usage || 0,
    }
  }

  const clearCache = async () => {
    await caches.delete('images-assets')
    setUsageStats(await getUsageStats())
  }

  const handleImport = async () => {
    const file = filesInput.files[0]
    if (!file) {
      alert('Please select a file to import')
      return
    }
    try {
      const content = await file.text()
      const data = parse(content) as ReturnType<typeof userState>
      const { subreddits, sort, searchTerms } = data
      batch(() => {
        if (subreddits) {
          const x = new Set([...subreddits, ...userState().subreddits])
          setUserState((state) => ({ ...state, subreddits: x }))
        }
        if (sort) {
          const x = new Map([...sort, ...userState().sort])
          setUserState((state) => ({ ...state, sort: x }))
        }
        if (searchTerms) {
          const x = new Map([...searchTerms, ...userState().searchTerms])
          setUserState((state) => ({ ...state, searchTerms: x }))
        }
      })
    } catch (e) {
      alert('Selected file contains invalid data')
    }
  }

  const exportData = async () => {
    const data = stringify(userState())
    download(
      `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`,
      `redditlattice-${new Date().toLocaleDateString()}.dat`
    )
  }

  onMount(async () => {
    setUsageStats(await getUsageStats())
  })

  onMount(() => setAppState('title', 'Settings'))

  const setImageSizeMultiplier = (n: number) =>
    setUserState((_) => ({ ..._, imageSizeMultiplier: n }))
  const setImageFormat = (format: string) =>
    setUserState((_) => ({ ..._, prefferedImageFormat: format }))
  const setProcessImages = (processImages: boolean) =>
    setUserState((_) => ({ ..._, processImages }))
  const setHideNSFW = (hideNSFW: boolean) =>
    setUserState((_) => ({ ..._, hideNSFW }))

  const resetState = () =>
    setAppState({
      images: {
        key: '',
        after: '',
        data: new Set(),
      },
    })

  onCleanup(() => resetState())

  return (
    <div p-5 flex flex-col-reverse h-full gap-5 id="scroller">
      <Button
        onClick={() => filesInput.click()}
        class="bg-green-800 hover:bg-green-700 transitions-colors"
      >
        Import Data
      </Button>{' '}
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
      <Show when={userState()!.processImages}>
        <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg relative grid transition-colors">
          <span class="absolute uppercase tracking-wide text-xs top-0 -translate-y-1/2 bg-black font-bold left-5 text-gray-300">
            Image Size Multiplier (relative to width)
          </span>
          <input
            class="bg-black outline-none"
            min="1"
            step="0.1"
            type="number"
            value={userState()!.imageSizeMultiplier}
            onChange={(e) => setImageSizeMultiplier(+e.currentTarget.value)}
          />
        </label>
        <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg relative grid transition-colors">
          <span class="absolute uppercase tracking-wide text-xs top-0 -translate-y-1/2 bg-black font-bold left-5 text-gray-300">
            Preffered Image Format
          </span>
          <select
            value={userState()!.prefferedImageFormat}
            onChange={(e) => setImageFormat(e.currentTarget.value)}
            class="bg-black outline-none"
          >
            <For each={['webp', 'avif', 'jpeg', 'png']}>
              {(val) => <option>{val}</option>}
            </For>
          </select>
        </label>
      </Show>
      <input
        class="hidden"
        type="file"
        onInput={() => handleImport()}
        ref={filesInput!}
      />
      <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg flex items-center justify-between transition-colors">
        <span class="uppercase text-sm tracking-wide font-bold text-gray-300">
          Process Images
        </span>
        <input
          type="checkbox"
          checked={userState()!.processImages}
          onChange={(e) => setProcessImages(e.currentTarget.checked)}
        />
      </label>
      <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg flex items-center justify-between transition-colors">
        <span class="uppercase text-sm tracking-wide font-bold text-gray-300">
          Hide NSFW
        </span>
        <input
          type="checkbox"
          checked={userState()!.hideNSFW}
          onChange={(e) => setHideNSFW(e.currentTarget.checked)}
        />
      </label>
    </div>
  )
}
