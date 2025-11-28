import React from "react"
import { useWizard } from "./WizzardProvider"
import { Button, JsonViewer } from "@cloudoperators/juno-ui-components"
import { useMutation } from "@tanstack/react-query"
import InlineError from "../../../../components/InlineError"

const Summary = () => {
  const { client, clusterFormData } = useWizard()

  const { isPending, error, data, mutate } = useMutation({
    mutationFn: client.gardener.createCluster,
    mutationKey: ["createCluster"],
  })

  const onSubmit = () => {
    // Implement form submission logic here
    return mutate(clusterFormData)
  }

  return (
    <div>
      <h2>Cluster Wizard Summary</h2>
      {error instanceof Error && <InlineError error={error} />}

      <JsonViewer data={clusterFormData} expanded />

      <Button onClick={onSubmit} variant="primary-danger" progress={isPending}>
        Submit
      </Button>
    </div>
  )
}

export default Summary
