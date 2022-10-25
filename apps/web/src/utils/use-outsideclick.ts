export function outsideclick(node: HTMLElement, callback: (e: Event) => any) {
  const onMouseDown = (e: MouseEvent) => {
    if (!e.target) return
    node.contains(e.target as HTMLElement) || callback(e)
  }
  window.addEventListener('mousedown', onMouseDown, { passive: true })
  return () => window.removeEventListener('mousedown', onMouseDown)
}
