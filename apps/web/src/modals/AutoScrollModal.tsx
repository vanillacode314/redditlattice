import { Component, createSignal } from 'solid-js'
import { Button } from 'ui'
import { useAppState } from '~/stores'
import { autoScroll } from '~/utils/scroller'

const [speed, setSpeed] = createSignal<number>(150) // in pixels per second
let cancelScroll: () => void
let el!: HTMLDialogElement

const [appState, setAppState] = useAppState()
export const startScroll = () => {
  if (!appState.scrollElement) return
  cancelScroll = autoScroll(appState.scrollElement, speed())
}

let submitResolve: () => void
let submitReject: () => void

export const showAutoScrollModal = async () => {
  el.showModal()

  /* wait for modal to be closed, resolves on submit and rejects on cancel */
  await new Promise<void>((resolve, reject) => {
    submitResolve = resolve
    submitReject = () => reject(new Error('Cancelled auto scrolling'))
  })
  return () => cancelScroll()
}

interface Props {
  onClose?: (success: boolean) => void
}

export const AutoScrollModal: Component<Props> = (props) => {
  const { onClose } = props

  return () => (
    <>
      <dialog
        ref={el}
        class="mx-auto w-full max-w-[30rem] bg-transparent px-5 backdrop:bg-white/10 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return

          el.close()
          onClose?.(false)
          submitReject?.()
        }}
      >
        <form
          onSubmit={() => {
            submitResolve?.()
            startScroll()
            const scroller = appState.scrollElement
            if (!scroller) return
            for (const eventType of ['touchstart', 'mousedown']) {
              scroller.addEventListener(
                eventType,
                () => {
                  setAppState('autoScrolling', false)
                  cancelScroll?.()
                },
                {
                  once: true,
                }
              )
            }
            window.addEventListener(
              'keydown',
              (e) => {
                if (e.key !== 'Escape') return
                setAppState('autoScrolling', false)
                cancelScroll?.()
              },
              {
                once: true,
              }
            )
            onClose?.(true)
          }}
          method="dialog"
          class="flex flex-col gap-3 rounded-lg bg-black p-5 text-white shadow"
        >
          <label class="relative grid rounded-lg border-2 border-purple-800 bg-black px-5 py-3 transition-colors focus-within:border-purple-700">
            <span class="absolute top-0 left-5 -translate-y-1/2 bg-black text-xs font-bold uppercase tracking-wide text-gray-300">
              AutoScroll Speed (in pixels per second)
            </span>
            <input
              class="bg-black outline-none"
              min="0"
              step="10"
              type="number"
              value={speed()}
              onChange={(e) => setSpeed(+e.currentTarget.value)}
            />
          </label>
          <Button
            type="submit"
            class="self-end bg-pink-800 outline-none transition-colors hover:bg-pink-700 focus:bg-pink-700"
          >
            Start
          </Button>
        </form>
      </dialog>
    </>
  )
}

export default AutoScrollModal
