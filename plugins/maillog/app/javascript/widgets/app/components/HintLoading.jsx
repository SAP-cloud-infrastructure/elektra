import React from "react"
import { Stack, Spinner } from "@cloudoperators/juno-ui-components";

const HintLoading = ({ text }) => {
  return (
    <Stack
      alignment="center"
      distribution="center"
      style={{ height: "100%", fontSize: "1.3rem" }}
    >
      <Spinner variant="primary" />
      {text ? <span>{text}</span> : <span>Loading...</span>}
    </Stack>
  )
}

export default HintLoading
