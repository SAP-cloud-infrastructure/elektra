import React from "react"
import { useWizard } from "./WizzardProvider"
import {
  Button,
  JsonViewer,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Icon,
  Stack,
} from "@cloudoperators/juno-ui-components"
import { useMutation } from "@tanstack/react-query"
import InlineError from "../../../../components/InlineError"
import { STEP_DEFINITIONS } from "./constants"
import { StepId } from "./types"

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
  const { client, clusterFormData, formErrors, handleSetCurrentStep } = useWizard()

  const { isPending, error, data, mutate } = useMutation({
    mutationFn: client.gardener.createCluster,
    mutationKey: ["createCluster"],
  })

  const onSubmit = () => {
    // Implement form submission logic here
    return mutate(clusterFormData)
  }

  const goToStep = (stepId: StepId) => {
    const step = STEP_DEFINITIONS.find((s) => s.id === stepId)!
    return handleSetCurrentStep(step.index)
  }

  return (
    <div>
      <h2>Cluster Wizard Summary</h2>
      {error instanceof Error && <InlineError error={error} />}

      <h1 className="tw-text-lg tw-font-bold tw-m-4">Basic Info</h1>

      <DataGrid columns={1}>
        <DataGridRow>
          <DataGrid columns={2} gridColumnTemplate="35% auto">
            <SummaryRow label="Name" hasError={formErrors.name.length > 0}>
              {clusterFormData.name}
            </SummaryRow>
          </DataGrid>
        </DataGridRow>
        <DataGridRow>
          <DataGrid columns={2} gridColumnTemplate="35% auto">
            <SummaryRow label="Cloud Profile" hasError={formErrors?.cloudProfile?.length > 0}>
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
        <Button onClick={() => goToStep("step1")} size="small" progress={isPending} icon="edit" label="Edit Section" />
      </Stack>

      <h1 className="tw-text-lg tw-font-bold tw-m-4">Infrastructure</h1>

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
            <SummaryRow label="Pods CIDR" hasError={formErrors["networking.podsCIDR"]?.length > 0}>
              {clusterFormData.networking?.podsCIDR}
            </SummaryRow>
          </DataGrid>
        </DataGridRow>
        <DataGridRow>
          <DataGrid columns={2} gridColumnTemplate="35% auto">
            <SummaryRow label="Nodes CIDR" hasError={formErrors["networking.nodesCIDR"]?.length > 0}>
              {clusterFormData.networking?.nodesCIDR}
            </SummaryRow>
          </DataGrid>
        </DataGridRow>
        <DataGridRow>
          <DataGrid columns={2} gridColumnTemplate="35% auto">
            <SummaryRow label="Services CIDR" hasError={formErrors["networking.servicesCIDR"]?.length > 0}>
              {clusterFormData.networking?.servicesCIDR}
            </SummaryRow>
          </DataGrid>
        </DataGridRow>
      </DataGrid>
      <Stack distribution="end" className="tw-mt-4">
        <Button onClick={() => goToStep("step1")} size="small" progress={isPending} icon="edit" label="Edit Section" />
      </Stack>

      {clusterFormData.workers.map((wg, index) => (
        <div key={index}>
          <h1 className="tw-text-lg tw-font-bold tw-m-4">Worker Group {wg.name}</h1>
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
          </DataGrid>
        </div>
      ))}
      <Stack distribution="end" className="tw-mt-4">
        <Button onClick={() => goToStep("step2")} size="small" progress={isPending} icon="edit" label="Edit Section" />
      </Stack>

      <JsonViewer data={clusterFormData} />

      <Button onClick={onSubmit} variant="primary-danger" progress={isPending}>
        Submit
      </Button>
    </div>
  )
}

export default Summary
