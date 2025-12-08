import React from "react"

type ConditionVariant = "success" | "error" | "warning" | "default"

const VARIANT_CLASSES: Record<ConditionVariant, string> = {
  success: "tw-bg-theme-success tw-border-theme-success",
  error: "tw-bg-theme-error tw-border-theme-error",
  warning: "tw-bg-theme-warning tw-border-theme-warning",
  default: "tw-bg-theme-box-default tw-border-theme-box-default",
}

const getBoxClasses = (variant: ConditionVariant = "default"): string =>
  VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.warning

type BoxProps = React.PropsWithChildren<{
  children?: React.ReactNode
  className?: string
  variant?: ConditionVariant
}>

const Box: React.FC<BoxProps> = ({ variant = "warning", className = "", children, ...props }) => {
  return (
    <div className={`${getBoxClasses(variant)} tw-bg-opacity-25 tw-border tw-rounded tw-p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Box
