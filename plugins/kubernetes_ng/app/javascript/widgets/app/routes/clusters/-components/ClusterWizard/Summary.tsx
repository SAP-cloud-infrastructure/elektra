import React from "react"
import { useWizard } from "./WizzardProvider"
import { Button, JsonViewer } from "@cloudoperators/juno-ui-components"
import { ClusterFormData } from "./types"
import { useMutation } from "@tanstack/react-query"
import InlineError from "../../../../components/InlineError"

const submitData: ClusterFormData = {
  name: "test-1",
  cloudProfileName: "openstack",
  kubernetesVersion: "1.32.5",
  workers: [
    {
      machineType: "g_c2_m4",
      minimum: 1,
      maximum: 2,
      zones: ["qa-de-1a"],
    },
  ],
}

const Summary = () => {
  const { client } = useWizard()

  const { isPending, error, data, mutate } = useMutation({
    mutationFn: client.gardener.createCluster,
    mutationKey: ["createCluster"],
  })

  const onSubmit = () => {
    // Implement form submission logic here
    return mutate(submitData)
  }

  return (
    <div>
      <h2>Cluster Wizard Summary</h2>
      {error instanceof Error && <InlineError error={error} />}

      <JsonViewer data={submitData} />

      <Button onClick={onSubmit} variant="primary-danger" progress={isPending}>
        Submit
      </Button>
    </div>
  )
}

export default Summary
