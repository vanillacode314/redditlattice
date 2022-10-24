export function outsideclick(node: HTMLElement, callback: (e: Event) => void) {
  const onClick = (e: Event) => e.target !== node && callback(e)
  window.addEventListener('mousedown', onClick)
  return () => window.removeEventListener('mousedown', onClick)
}
