import React from "react"
import { useWizard } from "./WizzardProvider"
import {
  Button,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Icon,
  Stack,
  Message,
} from "@cloudoperators/juno-ui-components"
import { normalizeError } from "../../../../components/InlineError"
import { STEP_DEFINITIONS } from "./constants"
import { StepId } from "./types"

const sectionStyle = `
  tw-mt-4
`

function SummaryRow({ label, children, hasError }: { label: string; children?: React.ReactNode; hasError?: boolean }) {
  let value = children

  // Normalize booleans
  if (typeof value === "boolean") {
    value = value ? "true" : "false"
  }

  // Detect emptiness after normalization
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)

  const displayValue = isEmpty ? "-" : value
  const color = hasError ? "tw-text-theme-danger" : ""

  return (
    <DataGridRow>
      <DataGridHeadCell className={color}>
        <Stack gap="2" alignment="center">
          {hasError && <Icon icon="cancel" color="tw-text-theme-danger" size="20" />}
          {label}
        </Stack>
      </DataGridHeadCell>
      <DataGridCell>{displayValue}</DataGridCell>
    </DataGridRow>
  )
}

const Summary = () => {
  const { clusterFormData, formErrors, handleSetCurrentStep, createMutation } = useWizard()

  const goToStep = (stepId: StepId) => {
    const step = STEP_DEFINITIONS.find((s) => s.id === stepId)!
    return handleSetCurrentStep(step.index)
  }

  return (
    <div>
      {createMutation.error instanceof Error && (
        <div className="tw-mb-4">
          <Message
            variant="error"
            text={normalizeError(createMutation.error).title + normalizeError(createMutation.error).message}
          />
        </div>
      )}

      <h1 className="tw-text-lg tw-font-bold tw-mb-4">Summary</h1>

      <section aria-labelledby="basic-info" className={sectionStyle}>
        <h1 id="basic-info" className="tw-text-lg tw-font-bold tw-mb-4">
          Basic Info
        </h1>
        <DataGrid columns={1}>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Name" hasError={formErrors?.name?.length > 0}>
                {clusterFormData.name}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Cloud Profile" hasError={formErrors?.cloudProfileName?.length > 0}>
                {clusterFormData.cloudProfileName}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Kubernetes Version" hasError={formErrors?.kubernetesVersion?.length > 0}>
                {clusterFormData.kubernetesVersion}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
        </DataGrid>
        <Stack distribution="end" className="tw-mt-4">
          <Button onClick={() => goToStep("step1")} size="small" icon="edit" label="Edit Basic Info" />
        </Stack>
      </section>

      <section aria-labelledby="infrastructure" className={sectionStyle}>
        <h1 id="infrastructure" className="tw-text-lg tw-font-bold tw-mb-4">
          Infrastructure
        </h1>
        <DataGrid columns={1}>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Floating IP Pool" hasError={formErrors["infrastructure.floatingPoolName"]?.length > 0}>
                {clusterFormData.infrastructure?.floatingPoolName}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Pods CIDR" hasError={formErrors["networking.pods"]?.length > 0}>
                {clusterFormData.networking?.pods}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Nodes CIDR" hasError={formErrors["networking.nodes"]?.length > 0}>
                {clusterFormData.networking?.nodes}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Services CIDR" hasError={formErrors["networking.services"]?.length > 0}>
                {clusterFormData.networking?.services}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
          <DataGridRow>
            <DataGrid columns={2} gridColumnTemplate="35% auto">
              <SummaryRow label="Workers CIDR" hasError={formErrors["infrastructure.networkWorkers"]?.length > 0}>
                {clusterFormData.infrastructure?.networkWorkers}
              </SummaryRow>
            </DataGrid>
          </DataGridRow>
        </DataGrid>
        <Stack distribution="end" className="tw-mt-4">
          <Button onClick={() => goToStep("step1")} size="small" icon="edit" label="Edit Infrastructure" />
        </Stack>
      </section>

      {clusterFormData.workers.map((wg) => (
        <section
          aria-labelledby={`worker-group-${wg.id}`}
          id={`worker-group-${wg.id}`}
          className={sectionStyle}
          key={wg.id}
        >
          <h1 id={`worker-group-${wg.id}`} className="tw-text-lg tw-font-bold tw-m-4">
            Worker Group {wg.name}
          </h1>
          <DataGrid columns={1}>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow label="Name" hasError={formErrors[`workers.${wg.id}.name`]?.length > 0}>
                  {wg.name}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow label="Machine Type" hasError={formErrors[`workers.${wg.id}.machineType`]?.length > 0}>
                  {wg.machineType}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow
                  label="Machine Image"
                  hasError={formErrors[`workers.${wg.id}.machineImage.name`]?.length > 0}
                >
                  {wg.machineImage.name}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow
                  label="Image Version"
                  hasError={formErrors[`workers.${wg.id}.machineImage.version`]?.length > 0}
                >
                  {wg.machineImage.version}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow label="Minimum Nodes" hasError={formErrors[`workers.${wg.id}.minimum`]?.length > 0}>
                  {wg.minimum}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow label="Maximum Nodes" hasError={formErrors[`workers.${wg.id}.maximum`]?.length > 0}>
                  {wg.maximum}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
            <DataGridRow>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <SummaryRow label="Availability Zones" hasError={formErrors[`workers.${wg.id}.zones`]?.length > 0}>
                  {wg.zones.join(", ")}
                </SummaryRow>
              </DataGrid>
            </DataGridRow>
          </DataGrid>
        </section>
      ))}
      <Stack distribution="end" className="tw-mt-4">
        <Button onClick={() => goToStep("step2")} size="small" icon="edit" label="Edit Worker Groups" />
      </Stack>
    </div>
  )
}

export default Summary
