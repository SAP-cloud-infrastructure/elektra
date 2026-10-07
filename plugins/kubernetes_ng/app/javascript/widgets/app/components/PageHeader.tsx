import React from "react"
import { ContentHeading, Container } from "@cloudoperators/juno-ui-components"

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  children?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children, ...props }) => {
  return (
    <Container py px={false} {...props}>
      <div className="tw-flex tw-flex-wrap tw-justify-between tw-items-center">
        <ContentHeading data-pageheader="title">{title}</ContentHeading>
        <div className="tw-flex tw-gap-2 tw-whitespace-nowrap tw-items-center tw-pb-2" data-pageheader="actions">
          {children}
        </div>
      </div>
      {subtitle && <div data-pageheader="subtitle">{subtitle}</div>}
    </Container>
  )
}

export default PageHeader
