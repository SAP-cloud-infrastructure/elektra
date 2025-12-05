import React, { useState } from "react"
import { Badge, Stack, Grid, GridRow, GridColumn, Icon } from "@cloudoperators/juno-ui-components"
import { LastError } from "../../../types/cluster"
import Box from "../../../components/Box"
import Collapse from "../../../components/Collapse"

type LastErrorsProps = {
  errors: LastError[]
}

const LastErrors: React.FC<LastErrorsProps> = ({ errors, ...props }) => {
  const [showAll, setShowAll] = useState(false)
  if (!errors || errors.length === 0) return null

  const firstError = errors[0]
  const otherErrors = errors.slice(1)

  return (
    <Stack direction="vertical" gap="1" {...props}>
      {otherErrors.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
          aria-expanded={showAll}
          aria-controls="last-errors"
          id="last-errors-toggle"
        >
          {showAll ? "Hide all errors" : "Show all errors"}
          <Icon color="global-text" icon={showAll ? "expandLess" : "expandMore"} />
        </button>
      )}
      {/* Always show the first error */}
      <Box variant="error">
        <Badge icon variant="danger" />
        <Grid>
          <GridRow>
            <GridColumn cols={2} className="tw-text-right">
              <strong>Description</strong>
            </GridColumn>
            <GridColumn cols={10}>{firstError.description}</GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn cols={2} className="tw-text-right">
              <strong>Task ID</strong>
            </GridColumn>
            <GridColumn cols={10}>{firstError.taskID}</GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn cols={2} className="tw-text-right">
              <strong>Update Time</strong>
            </GridColumn>
            <GridColumn cols={10}>{new Date(firstError.lastUpdateTime).toLocaleString()}</GridColumn>
          </GridRow>
        </Grid>
      </Box>
      {/* Show remaining errors if toggled */}
      <Collapse isOpen={showAll && otherErrors.length > 0} id="last-errors" aria-labelledby="last-errors-toggle">
        <Stack direction="vertical" gap="2" className="tw-mt-2">
          {otherErrors.map((error, index) => {
            return (
              <Box key={index} variant="error">
                <Badge icon variant="danger" />
                <Grid>
                  <GridRow>
                    <GridColumn cols={2} className="tw-text-right">
                      <strong>Description</strong>
                    </GridColumn>
                    <GridColumn cols={10}>{error.description}</GridColumn>
                  </GridRow>
                  <GridRow>
                    <GridColumn cols={2} className="tw-text-right">
                      <strong>Task ID</strong>
                    </GridColumn>
                    <GridColumn cols={10}>{error.taskID}</GridColumn>
                  </GridRow>
                  <GridRow>
                    <GridColumn cols={2} className="tw-text-right">
                      <strong>Update Time</strong>
                    </GridColumn>
                    <GridColumn cols={10}>{new Date(error.lastUpdateTime).toLocaleString()}</GridColumn>
                  </GridRow>
                </Grid>
              </Box>
            )
          })}
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default LastErrors
