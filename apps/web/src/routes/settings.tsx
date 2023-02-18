import { parse, stringify } from 'devalue'
import { clear } from 'idb-keyval'
import { minBy } from 'lodash-es'
import { batch, For, onCleanup, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Button, Input } from 'ui'
import { useAppState, userStateSchema, useUserState } from '~/stores'
import { download, filterStringKeys, formatBytes, getFile } from '~/utils'

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
    await clear() // IDBKeyVal
    setUsageStats(await getUsageStats())
  }

  const handleImport = async () => {
    const content = await getFile('application/json')

    if (!content) {
      alert('Please select a file to import')
      return
    }

    try {
      function appendKey(key: any, value: any) {
        if (value instanceof Set) {
          const newValue = new Set([...value, ...userState[key]])
          setUserState(key, newValue)
        } else if (value instanceof Map) {
          const newValue = new Map([...value, ...userState[key]])
          setUserState(key, newValue)
        } else {
          setUserState(key, value)
        }
      }

      batch(() => {
        for (const [key, value] of Object.entries(
          userStateSchema.parse(parse(content))
        )) {
          appendKey(key, value)
        }
      })
    } catch (e) {
      alert('Selected file contains invalid data')
    }
  }

  const exportData = async () => {
    const data = stringify(userStateSchema.parse(userState))
    download(
      `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`,
      `redditlattice-${new Date().toLocaleDateString()}.json`
    )
  }

  onMount(async () => {
    setUsageStats(await getUsageStats())
  })

  onMount(() => setAppState('title', 'Settings'))

  const resetState = () =>
    setAppState({
      images: {
        key: '',
        after: '',
        data: new Set(),
      },
    })

  onCleanup(() => {
    /* Update Recents */
    setUserState((state) => {
      while (state.redditRecents.size > state.recentsLimit) {
        const [q, _] = minBy(
          [...state.redditRecents],
          ([_, timestamp]) => timestamp
        )!
        state.redditRecents.delete(q)
      }
      return { ...state }
    })
    resetState()
  })

  return (
    <div
      class="p-5 flex flex-col-reverse h-full gap-3 max-w-xl mx-auto w-full"
      ref={(el) => setAppState('scrollElement', el)}
    >
      <Button
        onClick={() => filesInput.click()}
        class="transitions-colors bg-green-800 hover:bg-green-700"
      >
        Import Data
      </Button>{' '}
      <Button
        onClick={() => exportData()}
        class="transitions-colors bg-purple-800 hover:bg-purple-700"
      >
        Export Data
      </Button>
      <Button
        onClick={() => clearCache()}
        class="transitions-colors relative overflow-hidden bg-blue-800 hover:bg-red-700"
      >
        <div
          class="bg-red-800 absolute inset-y-0 left-0"
          style={{ width: `${100 * (usageStats.used / usageStats.total)}%` }}
        ></div>
        <span z-10 relative>
          Clear Cache ({formatBytes(usageStats.used)}/
          {formatBytes(usageStats.total)})
        </span>
      </Button>
      <Input
        min="100"
        step="10"
        type="number"
        value={userState.columnMaxWidth}
        onChange={(e) => setUserState('columnMaxWidth', +e.currentTarget.value)}
        label="Column Max Width (in pixels)"
      />
      <Input
        class="bg-black outline-none"
        label="Border Radius (in pixels)"
        min="0"
        step="1"
        type="number"
        value={userState.borderRadius}
        onChange={(e) => setUserState('borderRadius', +e.currentTarget.value)}
      />
      <Input
        class="bg-black outline-none"
        label="Gaps (in pixels)"
        min="0"
        step="1"
        type="number"
        value={userState.gap}
        onChange={(e) => setUserState('gap', +e.currentTarget.value)}
      />
      {/* <Show when={userState.processImages}> */}
      {/*   <Input */}
      {/*     class="bg-black outline-none" */}
      {/*     label="Image Size Multiplier (relative to width)" */}
      {/*     min="1" */}
      {/*     step="0.1" */}
      {/*     type="number" */}
      {/*     value={userState.imageSizeMultiplier} */}
      {/*     onChange={(e) => */}
      {/*       setUserState('imageSizeMultiplier', +e.currentTarget.value) */}
      {/*     } */}
      {/*   /> */}
      {/*   <label class="relative grid rounded-lg border-2 border-purple-800 bg-black px-5 py-3 transition-colors focus-within:border-purple-700"> */}
      {/*     <span class="absolute top-0 left-5 -translate-y-1/2 bg-black text-xs font-bold uppercase tracking-wide text-gray-300"> */}
      {/*       Preffered Image Format */}
      {/*     </span> */}
      {/*     <select */}
      {/*       value={userState.prefferedImageFormat} */}
      {/*       onChange={(e) => */}
      {/*         setUserState( */}
      {/*           'prefferedImageFormat', */}
      {/*           userStateSchema.shape.prefferedImageFormat.parse( */}
      {/*             e.currentTarget.value */}
      {/*           ) */}
      {/*         ) */}
      {/*       } */}
      {/*       class="bg-black outline-none" */}
      {/*     > */}
      {/*       <For each={['webp', 'avif', 'jpeg', 'png']}> */}
      {/*         {(val) => <option>{val}</option>} */}
      {/*       </For> */}
      {/*     </select> */}
      {/*   </label> */}
      {/* </Show> */}
      <input
        class="hidden"
        type="file"
        onInput={() => handleImport()}
        ref={filesInput!}
      />
      {/* <Input */}
      {/*   type="checkbox" */}
      {/*   label="Process Images (Experimental)" */}
      {/*   checked={userState.processImages} */}
      {/*   onChange={(e) => setUserState('processImages', e.currentTarget.checked)} */}
      {/* /> */}
      {/* <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg flex items-center justify-between transition-colors"> */}
      {/*   <span class="uppercase text-sm tracking-wide font-bold text-gray-300"> */}
      {/*     Hide NSFW */}
      {/*   </span> */}
      {/*   <input */}
      {/*     type="checkbox" */}
      {/*     checked={userState.hideNSFW} */}
      {/*     onChange={(e) => setUserState('hideNSFW', e.currentTarget.checked)} */}
      {/*   /> */}
      {/* </label> */}
      <Input
        class="bg-black outline-none"
        label="Recents Limit"
        min="0"
        step="1"
        type="number"
        value={userState.recentsLimit}
        onChange={(e) =>
          setUserState('recentsLimit', Number(e.currentTarget.value))
        }
      />
    </div>
  )
}
