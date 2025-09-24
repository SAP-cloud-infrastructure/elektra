import React from "react"
import { ContentHeading, Stack, Container } from "@cloudoperators/juno-ui-components"

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  [key: string]: any
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children, ...props }) => {
  return (
    <Container py px={false} {...props}>
      <Stack>
        <ContentHeading className="tw-w-full" data-pageheader="title">
          {title}
        </ContentHeading>
        <Stack gap="2" className="tw-whitespace-nowrap" distribution="center" data-pageheader="actions">
          {children}
        </Stack>
      </Stack>
      {subtitle && <p data-pageheader="subtitle">{subtitle}</p>}
    </Container>
  )
}

export default PageHeader
