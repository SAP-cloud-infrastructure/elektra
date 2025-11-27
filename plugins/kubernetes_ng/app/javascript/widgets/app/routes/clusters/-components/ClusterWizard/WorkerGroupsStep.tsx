import React from "react"
import WorkerGroupSection from "./WorkerGroupSection"
import { WorkerGroup } from "./types"
import { useWizard, DEFAULT_WORKER_GROUP } from "./WizzardProvider"
import { Stack, Button } from "@cloudoperators/juno-ui-components"

const WorkerGroupsStep = () => {
  const { clusterFormData, setClusterFormData } = useWizard()

  const onAddWorkerGroup = () => {
    setClusterFormData((prev) => ({
      ...prev,
      workers: [
        ...prev.workers,
        { ...DEFAULT_WORKER_GROUP }, // clone a new empty worker group
      ],
    }))
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
      {clusterFormData.workers.map((wg, index) => (
        <WorkerGroupSection
          key={index}
          workerGroup={wg}
          onChange={(updated) => onChangeWorkerGroup(index, updated)}
          onDelete={() => onDeleteWorkerGroup(index)}
        />
      ))}

      <Stack distribution="end">
        <Button label=" Add Worker Group" variant="primary" size="small" onClick={onAddWorkerGroup} />
      </Stack>
    </>
  )
}

export default WorkerGroupsStep
