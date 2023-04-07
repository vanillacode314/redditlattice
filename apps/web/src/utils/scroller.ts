export function autoScroll(
  elementSelector: string | HTMLElement,
  speed: number
): () => void {
  const element = (
    typeof elementSelector === 'string'
      ? document.querySelector(elementSelector)
      : elementSelector
  ) as HTMLElement

  if (!element) {
    throw new Error('Element not found')
  }

  const startY = element.scrollTop
  const targetY = element.scrollHeight - element.offsetTop
  const diff = targetY - startY
  const duration = (diff / speed) * 1000
  let start: DOMHighResTimeStamp
  let id = window.requestAnimationFrame(step)

  function step(timestamp: DOMHighResTimeStamp) {
    if (!start) start = timestamp
    const progress = timestamp - start
    const time = Math.min(1, progress / duration)
    element.scrollTop = startY + time * diff
    if (time < 1) id = window.requestAnimationFrame(step)
  }

  // return a function that cancels the scroll animation when called
  return () => window.cancelAnimationFrame(id)
}
