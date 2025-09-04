import React from "react"
import { Stack, Spinner } from "@cloudoperators/juno-ui-components"

const Loading = ({ text, className }) => {
  return (
    <Stack alignment="center" className={className}>
      <Spinner variant="primary" />
      {text ? <span>{text}</span> : <span>Loading...</span>}
    </Stack>
  )
}

export default Loading
