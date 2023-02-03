import { throttle } from 'lodash-es'

type Pos = { x: number; y: number }

export interface Options {
  callback?: () => any
  duration?: number
  moveCancelThreshold?: number
}

function distance(pos1: Pos, pos2: Pos): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
}

export const longpress = (
  el: HTMLElement,
  {
    callback = () => {},
    duration = 1000,
    moveCancelThreshold = 50,
  }: Options = {}
) => {
  let timer: ReturnType<typeof setTimeout>
  let startPos: Pos = { x: -1, y: -1 }
  let touchId: number = -1

  const onTouchStart = (e: TouchEvent) => {
    if (touchId > -1) return
    const touch = e.changedTouches[0]
    touchId = touch.identifier
    startPos = { x: touch.screenX, y: touch.screenY }
    timer = setTimeout(() => callback(), duration)
  }

  const onTouchMove = throttle((e: TouchEvent) => {
    if (touchId < 0) return
    const touch = e.changedTouches[0]
    if (touchId != touch.identifier) return
    if (
      distance(startPos, { x: touch.screenX, y: touch.screenY }) >=
      moveCancelThreshold
    ) {
      clearTimeout(timer)
    }
  }, duration / 4)

  const onTouchEnd = () => {
    touchId = -1
    clearTimeout(timer)
  }

  const onContextMenu = (e: Event) => {
    touchId > -1 && e.preventDefault()
  }

  el.addEventListener('contextmenu', onContextMenu)
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: true })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
  el.addEventListener('touchcancel', onTouchEnd, { passive: true })

  return () => {
    el.removeEventListener('contextmenu', onContextMenu)
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  }
}
