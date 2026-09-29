import React, { useState } from "react"
import { CodeBlock, Icon } from "@cloudoperators/juno-ui-components"
import Collapse from "../../../components/Collapse"
import Card from "../../../components/Card"
import { parseMarkdown } from "./markdownParser"
import { useRouteContext } from "@tanstack/react-router"
import { RouterContext } from "../../__root"
import { useScikubeInstructions } from "../../../hooks/useScikubeInstructions"
import InlineError from "../../../components/InlineError"
import { Status } from "../../../components/Status"

export default function HeadingInfo() {
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext
  const [showInstructions, setShowInstructions] = useState(false)
  const { data: instructions, error, isLoading } = useScikubeInstructions(apiClient)

  return (
    <Card>
      <button
        type="button"
        onClick={() => setShowInstructions((prev) => !prev)}
        className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
        aria-expanded={showInstructions}
        aria-controls="instructions"
        id="instructions-toggle"
      >
        {showInstructions ? "Hide kubectl Setup Instructions" : "Show kubectl Setup Instructions"}
        <Icon color="global-text" icon={showInstructions ? "expandLess" : "expandMore"} />
      </button>
      <Collapse isOpen={showInstructions} id="instructions" aria-labelledby="instructions-toggle">
        <div className="info tw-mt-4">
          {isLoading ? (
            <Status status="progress" title="Loading instructions..." />
          ) : error ? (
            <InlineError error={error} />
          ) : (
            instructions && parseMarkdown(instructions, CodeBlock)
          )}
        </div>
      </Collapse>
    </Card>
  )
}
