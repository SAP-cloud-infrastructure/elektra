import React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
}

/**
 * A reusable Card component that wraps content with consistent styling. It represents
 * the juno-ui-components Card style and will be replaced with the official Card component from juno-ui-components once it is available.
 *
 * @remarks
 * The shadow CSS style is applied using `tw-shadow-[...]` inline syntax because
 * the current version of juno-ui-component does not yet provide dedicated shadow
 * style variables for this specific use case.
 */
export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`tw-text-sm
  tw-rounded-lg
  tw-border
  tw-p-4
  tw-bg-color-white
  tw-border-juno-grey-light-7
  tw-shadow-[0_1px_2px_0_rgba(34,54,73,0.3)] ${className}`.trim()}
    >
      {children}
    </div>
  )
}
