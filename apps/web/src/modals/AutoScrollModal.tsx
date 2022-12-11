import { Component, createSignal } from 'solid-js'
import { Button } from 'ui'
import { autoScroll } from '~/utils/scroller'

export const [speed, setSpeed] = createSignal<number>(150) // in pixels per second
let el!: HTMLDialogElement
let cancelScroll: () => void

export const showAutoScrollModal = () => {
  el.showModal()
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
        class="bg-transparent max-w-[30rem] w-full mx-auto px-5 backdrop:bg-white/10 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            el.close()
            onClose?.(false)
          }
        }}
      >
        <form
          onSubmit={(e) => {
            cancelScroll = autoScroll('#scroller', speed())
            window.addEventListener('touchstart', () => cancelScroll(), {
              once: true,
            })
            onClose?.(true)
          }}
          method="dialog"
          class="p-5 flex flex-col gap-3 bg-black rounded-lg text-white shadow"
        >
          <label class="bg-black border-purple-800 focus-within:border-purple-700 border-2 px-5 py-3 rounded-lg relative grid transition-colors">
            <span class="absolute uppercase tracking-wide text-xs top-0 -translate-y-1/2 bg-black font-bold left-5 text-gray-300">
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
            class="bg-pink-800 hover:bg-pink-700 focus:bg-pink-700 outline-none transition-colors self-end"
          >
            Start
          </Button>
        </form>
      </dialog>
    </>
  )
}

export default AutoScrollModal
