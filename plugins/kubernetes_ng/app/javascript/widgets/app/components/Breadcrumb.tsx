import React from "react"
import { Breadcrumb as BreadcrumbContainer, BreadcrumbItem } from "@cloudoperators/juno-ui-components"
import { isMatch, useMatches, useNavigate } from "@tanstack/react-router"

type BreadcrumbProps = {
  className?: string
}

export const Breadcrumb = ({ className = "", ...props }: BreadcrumbProps) => {
  const navigate = useNavigate()
  const matches = useMatches()
  const matchesWithCrumbs = matches.filter((match) => isMatch(match, "loaderData.crumb"))

  return (
    <BreadcrumbContainer
      className={`breadcrumb-container ${className}`}
      role="navigation"
      aria-label="Breadcrumb"
      {...props}
    >
      {matchesWithCrumbs.map((match, i) => {
        const { pathname, loaderData } = match

        // crumb information needs to be there
        if (!loaderData?.crumb) return null

        const { crumb } = loaderData

        return (
          <BreadcrumbItem
            key={i}
            label={crumb?.label}
            icon={"icon" in crumb ? crumb.icon : undefined}
            onClick={(e) => {
              e.preventDefault()
              navigate({
                to: pathname,
              })
            }}
            className="breadcrumb-item"
          />
        )
      })}
    </BreadcrumbContainer>
  )
}
