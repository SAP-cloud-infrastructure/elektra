import { useRef, useState, useEffect } from "react"

interface CollapseProps {
  id?: string
  isOpen: boolean
  children: React.ReactNode
  className?: string // optional wrapper classes
}

/**
 * A component that smoothly collapses or expands its children based on the isOpen prop.
 *
 * @component
 * @param {string} [id] - Optional id for the collapse container.
 * @param {boolean} isOpen - Whether the collapse is open or closed.
 * @param {React.ReactNode} children - The content to be collapsed/expanded.
 * @param {string} [id] - Optional id for the collapse container to link with aria-controls.
 * @param {string} [className] - Optional additional class names for styling.
 */
export default function Collapse({ id, isOpen, children, className, ...props }: CollapseProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(isOpen ? "auto" : "0px")

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (isOpen) {
      const fullHeight = el.scrollHeight + "px"
      setHeight(fullHeight)

      const timeout = setTimeout(() => setHeight("auto"), 300)
      return () => clearTimeout(timeout)
    } else {
      if (height === "auto") {
        // set to full height first to enable transition
        setHeight(el.scrollHeight + "px")
        const timeout = setTimeout(() => {
          setHeight("0px")
        }, 100)
        return () => clearTimeout(timeout)
      }
      // before collapsing, set to full height to enable transition
      setHeight("0px")
    }
  }, [isOpen, height])

  return (
    <div
      id={id}
      ref={ref}
      style={{ height }}
      className={`tw-overflow-hidden tw-transition-[height] tw-duration-300 tw-ease-in-out ${className ?? ""}`}
      role="region"
      {...props}
    >
      {children}
    </div>
  )
}
