import init_json_editor from "lib/jsoneditor"
import styles from "../styles.scss?inline"
import React from "react"
import { AppShellProvider, CodeBlock } from "@cloudoperators/juno-ui-components"

class JsonEditor extends React.Component {
  componentDidMount() {
    // eslint-disable-next-line no-undef
    init_json_editor()
  }

  render() {
    return (
      <AppShellProvider theme="theme-light">
        <style>{styles}</style>
        <CodeBlock heading="Metadata" content={this?.props?.details || null} lang="json" className="tw-mt-6" />
      </AppShellProvider>
    )
  }
}

export default JsonEditor
