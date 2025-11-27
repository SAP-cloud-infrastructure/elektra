import { useRef, useState, useEffect } from "react"

interface CollapseProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string // optional wrapper classes
}

export default function Collapse({ isOpen, children, className }: CollapseProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(isOpen ? "auto" : "0px")

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (isOpen) {
      const fullHeight = el.scrollHeight + "px"
      setHeight(fullHeight)
    } else {
      setHeight("0px")
    }
  }, [isOpen])

  return (
    <div
      ref={ref}
      style={{ height }}
      className={`tw-overflow-hidden tw-transition-[height] tw-duration-300 tw-ease-in-out ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
