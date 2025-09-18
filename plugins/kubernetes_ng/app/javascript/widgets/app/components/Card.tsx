import React from "react"

const cardStyles = `
tw-bg-white 
tw-border 
tw-border-[#e9e9e9] 
tw-rounded-lg 
tw-shadow-sm 
tw-text-[#4c4c4c] 
tw-block
`

const cardPadding = "tw-p-4"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Components or elements to be rendered as content.
   */
  children?: React.ReactNode
  /**
   * Optional padding.
   */
  padding?: boolean
  /**
   * Additional CSS styles.
   */
  className?: string
}

const Card: React.FC<CardProps> = ({ children, padding = false, className = "", ...props }) => {
  const combinedClassName = `gardener-card ${cardStyles} ${padding ? cardPadding : ""} ${className}`
  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  )
}

export default Card
