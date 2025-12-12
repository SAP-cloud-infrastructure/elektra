import React from "react"
import WorkerGroupSection from "./WorkerGroupSection"
import { WorkerGroup } from "./types"
import { useWizard } from "./WizzardProvider"
import { Stack, Button, Container, Message } from "@cloudoperators/juno-ui-components"
import { DEFAULT_WORKER_GROUP } from "./defaults"

const Step2 = () => {
  const { clusterFormData, setClusterFormData } = useWizard()

  const onAddWorkerGroup = () => {
    setClusterFormData((prev) => {
      const nextNumber = prev.workers.length + 1

      return {
        ...prev,
        workers: [
          ...prev.workers,
          {
            ...DEFAULT_WORKER_GROUP,
            id: `worker-${Date.now()}`,
            name: `worker${nextNumber}`,
          },
        ],
      }
    })
  }

  const onDeleteWorkerGroup = (index: number) => {
    setClusterFormData((prev) => ({
      ...prev,
      workers: prev.workers.filter((_, i) => i !== index),
    }))
  }

  const onChangeWorkerGroup = (index: number, updated: WorkerGroup) => {
    setClusterFormData((prev) => {
      const workers = [...prev.workers]
      workers[index] = updated
      return { ...prev, workers }
    })
  }

  return (
    <>
      <Message
        variant="info"
        title="Node Auto-scaling"
        text="Each worker nodes will automatically scale between its minimum and maximum node counts based on workload demands. Ensure your maximum node counts align with your resource quotas."
      />
      <Container px={false} py>
        Configure the worker nodes for your cluster. These settings determine the compute resources available for your
        workloads.
      </Container>
      <div className="cluster-form">
        {clusterFormData.workers.map((wg, index) => {
          const showSeparator = clusterFormData.workers.length > 1 && index < clusterFormData.workers.length - 1
          return (
            <div key={index}>
              <WorkerGroupSection
                workerGroup={wg}
                index={index}
                totalWorkers={clusterFormData.workers.length}
                onChange={(updatedWorkerGroup) => onChangeWorkerGroup(index, updatedWorkerGroup)}
                onDelete={() => onDeleteWorkerGroup(index)}
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

export default Step2
