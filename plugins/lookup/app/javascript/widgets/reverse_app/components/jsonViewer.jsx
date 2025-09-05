import React from "react"
import { AppShellProvider, CodeBlock } from "@cloudoperators/juno-ui-components"

class JsonViewer extends React.Component {
  render() {
    return (
      <AppShellProvider theme="theme-light">
        <CodeBlock
          heading="Metadata"
          content={this?.props?.details || null}
          lang="json"
          className="mt-6"
          style={{ marginTop: "1.5rem" }}
        />
      </AppShellProvider>
    )
  }
}

export default JsonViewer
