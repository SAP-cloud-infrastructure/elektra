import React from "react"
import WorkerGroupSection from "./WorkerGroupSection"
import { WorkerGroup } from "./types"
import { useWizard, DEFAULT_WORKER_GROUP } from "./WizzardProvider"
import { Stack, Button } from "@cloudoperators/juno-ui-components"

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

      <Stack distribution="end">
        <Button label=" Add Worker Group" variant="primary" size="small" onClick={onAddWorkerGroup} />
      </Stack>
    </>
  )
}

export default Step2
