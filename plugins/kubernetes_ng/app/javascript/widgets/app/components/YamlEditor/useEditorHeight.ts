import { useEffect, useRef, useState } from "react"

const TOOLBAR_HEIGHT = 50

export function useEditorHeight(containerRef: React.RefObject<HTMLDivElement>) {
  const [editorHeight, setEditorHeight] = useState<string>("100%")
  const timeoutIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateHeight = () => {
      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const bottomMargin = 12
      const availableHeight = viewportHeight - rect.top - TOOLBAR_HEIGHT - bottomMargin
      setEditorHeight(`${Math.max(availableHeight, 100)}px`)
    }

    const debouncedCalculateHeight = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      timeoutIdRef.current = window.setTimeout(calculateHeight, 100)
    }

    // Initial calculation without debounce
    calculateHeight()

    // Use ResizeObserver to detect when the layout changes
    const resizeObserver = new ResizeObserver(() => {
      debouncedCalculateHeight()
    })

    // Observe the container itself
    resizeObserver.observe(container)

    // Fallback for window resize (for viewport changes)
    window.addEventListener("resize", debouncedCalculateHeight)

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", debouncedCalculateHeight)
    }
  }, [containerRef])

  return editorHeight
}
