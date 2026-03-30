import React from "react"
import { Stack, Button, Container, Message } from "@cloudoperators/juno-ui-components"
import WorkerGroupSection from "./WorkerGroupSection"
import { WorkerGroup } from "./types"
import { DEFAULT_WORKER_GROUP, generateRandomSuffix } from "./defaults"
import { MachineType, MachineImage } from "../../../../types/cloudProfiles"

type WorkerGroupEditorProps = {
  workers: WorkerGroup[]
  onChange: (workers: WorkerGroup[]) => void
  availableMachineTypes: MachineType[]
  availableMachineImages: MachineImage[]
  availableZones: string[]
  cloudProfileIsLoading?: boolean
  cloudProfileError?: Error | null
  formErrors?: Record<string, string[]>
  validateSingleField?: (field: string) => void
}

const WorkerGroupEditor: React.FC<WorkerGroupEditorProps> = ({
  workers,
  onChange,
  availableMachineTypes,
  availableMachineImages,
  availableZones,
  cloudProfileIsLoading = false,
  cloudProfileError = null,
  formErrors = {},
  validateSingleField = () => {},
}) => {
  const onAddWorkerGroup = () => {
    const randomSuffix = generateRandomSuffix()
    onChange([
      ...workers,
      {
        ...DEFAULT_WORKER_GROUP,
        id: `worker-${Date.now()}`,
        name: `worker-${randomSuffix}`,
      },
    ])
  }

  const onDeleteWorkerGroup = (index: number) => {
    onChange(workers.filter((_, i) => i !== index))
  }

  const onChangeWorkerGroup = (index: number, updated: WorkerGroup) => {
    const updatedWorkers = [...workers]
    updatedWorkers[index] = updated
    onChange(updatedWorkers)
  }

  return (
    <>
      <Message
        variant="info"
        title="Node Auto-scaling"
        text="Each worker nodes will automatically scale between its minimum and maximum node counts based on workload demands. Ensure your maximum node counts align with your resource quotas."
      />
      <Container px={false} py>
        <p>
          Configure the worker nodes for your cluster. These settings determine the compute resources available for
          your workloads.
        </p>
      </Container>
      <div className="cluster-form">
        {workers.map((wg, index) => {
          const showSeparator = workers.length > 1 && index < workers.length - 1
          return (
            <div key={wg.id}>
              <WorkerGroupSection
                workerGroup={wg}
                index={index}
                totalWorkers={workers.length}
                onChange={(updatedWorkerGroup) => onChangeWorkerGroup(index, updatedWorkerGroup)}
                onDelete={() => onDeleteWorkerGroup(index)}
                availableMachineTypes={availableMachineTypes}
                availableMachineImages={availableMachineImages}
                availableZones={availableZones}
                cloudProfileIsLoading={cloudProfileIsLoading}
                cloudProfileError={cloudProfileError}
                formErrors={formErrors}
                validateSingleField={validateSingleField}
              />
              {showSeparator && <hr className="tw-border-theme-background-lvl-4 tw-mb-8" />}
            </div>
          )
        })}
      </div>
      <Stack distribution="end">
        <Button label="Add Worker Group" variant="primary" size="small" onClick={onAddWorkerGroup} />
      </Stack>
    </>
  )
}

export default WorkerGroupEditor
