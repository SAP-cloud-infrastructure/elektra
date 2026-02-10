import { useEffect, useState } from "react"
import { Editor, EditorProps } from "@monaco-editor/react"
import { loader } from "@monaco-editor/react"
import yaml from "js-yaml"
import Box from "./Box"

// Configure Monaco loader globally
loader.config({
  paths: {
    vs: "/assets/monaco/vs",
  },
})

const editorOptions = {
  alwaysConsumeMouseWheel: true,
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
}

interface MonacoEditorProps extends Omit<EditorProps, "value" | "language"> {
  jsonValue: object
}

export default function MonacoEditor({ jsonValue }: MonacoEditorProps) {
  const [yamlContent, setYamlContent] = useState<string>("")

  useEffect(() => {
    if (!jsonValue) {
      setYamlContent("")
      return
    }

    const yamlString = yaml.dump(jsonValue, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    })
    setYamlContent(yamlString)
  }, [jsonValue])

  return (
    <Box variant="default" className="tw-p-2">
      <div style={{ height: "100vh" }}>
        <Editor height="100%" language="yaml" value={yamlContent} theme="light" options={editorOptions} />
      </div>
    </Box>
  )
}
