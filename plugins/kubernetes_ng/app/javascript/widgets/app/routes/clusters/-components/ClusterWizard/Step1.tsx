import React, { useState } from "react"
import { FormRow, Select, SelectOption, TextInput, Stack, Icon } from "@cloudoperators/juno-ui-components"
import Collapse from "../../../../components/Collapse"
import { useWizard } from "./WizzardProvider"

const sectionHeaderStyle = `
  tw-text-lg
  tw-font-bold
  tw-mb-4
`
// Do not show validation errors if cloud profiles are still loading
function getErrorText<T extends { error?: unknown; isLoading?: boolean }>(
  resource: T,
  fieldError?: string
): string | undefined {
  if (resource.error instanceof Error) return resource.error.message
  // if resource has finished loading, return field error (if any)
  if (!resource.isLoading) return fieldError
  return undefined
}

const Step1 = () => {
  const {
    clusterFormData,
    setClusterFormData,
    formErrors,
    cloudProfiles,
    selectedCloudProfile,
    extNetworks,
    updateCloudProfile,
    updateNetworkingField,
    validateSingleField,
  } = useWizard()

  // Check if there are any network-related errors, if so, show advanced network settings by default
  const networkErrorsPresent =
    formErrors["networking.pods"]?.length > 0 ||
    formErrors["networking.nodes"]?.length > 0 ||
    formErrors["networking.services"]?.length > 0 ||
    formErrors["infrastructure.networkWorkers"]?.length > 0

  const [showAdvanceNetworkSettings, setShowAdvanceNetworkSettings] = useState(networkErrorsPresent)
  const availableKubernetesVersions = selectedCloudProfile?.kubernetesVersions ?? []

  return (
    <div className="cluster-form">
      <section aria-labelledby="basicInformation">
        <h1 id="basicInformation" className={sectionHeaderStyle}>
          Basic Information
        </h1>
        <FormRow>
          <TextInput
            label="Name"
            id="clusterName"
            required
            type="text"
            value={clusterFormData.name}
            onBlur={() => validateSingleField("name")}
            onChange={(e) => setClusterFormData((prev) => ({ ...prev, name: e.target.value }))}
            helptext="Must start with a letter and may contain lowercase letters, numbers, or dashes (‘-’). The name can be at most 11 characters long."
            errortext={formErrors?.name?.[0] || undefined}
            maxLength={20}
          />
        </FormRow>

        <FormRow>
          <Select
            required
            label="Cloud Profile"
            id="cloudProfile"
            name="cloudProfile"
            loading={cloudProfiles.isLoading}
            errortext={getErrorText(cloudProfiles, formErrors?.cloudProfileName?.[0])}
            helptext="Cloud profiles define the infrastructure settings for your cluster. Changing the cloud profile will reset certain fields."
            value={clusterFormData.cloudProfileName}
            onChange={(e) =>
              setClusterFormData((prev) => updateCloudProfile(prev, e?.toString() || "", cloudProfiles.data || []))
            }
            truncateOptions
          >
            {cloudProfiles.data &&
              cloudProfiles.data.length > 0 &&
              cloudProfiles.data.map((opt) => (
                <SelectOption key={opt.uid} value={opt.name}>
                  {opt.name}
                </SelectOption>
              ))}
          </Select>
        </FormRow>

        <FormRow>
          <Select
            required
            label="Kubernetes Version"
            id="kubeVersion"
            name="kubeVersion"
            disabled={cloudProfiles.isLoading}
            value={clusterFormData.kubernetesVersion}
            onChange={(e) => setClusterFormData((prev) => ({ ...prev, kubernetesVersion: e?.toString() || "" }))}
            errortext={getErrorText(cloudProfiles, formErrors?.kubernetesVersion?.[0])}
            truncateOptions
          >
            {availableKubernetesVersions.map((version) => (
              <SelectOption key={version} value={version}>
                {version}
              </SelectOption>
            ))}
          </Select>
        </FormRow>
      </section>

      <section aria-labelledby="infrastructure">
        <h1 id="infrastructure" className={sectionHeaderStyle}>
          Infrastructure
        </h1>
        <FormRow>
          <Select
            required
            id="floatingPool"
            label="Floating IP Pool"
            name="floatingPool"
            loading={extNetworks.isLoading}
            errortext={getErrorText(extNetworks, formErrors?.["infrastructure.floatingPoolName"]?.[0])}
            value={clusterFormData.infrastructure?.floatingPoolName}
            onChange={(e) =>
              setClusterFormData((prev) => ({
                ...prev,
                infrastructure: {
                  ...prev.infrastructure,
                  floatingPoolName: e?.toString() || "",
                },
              }))
            }
          >
            {extNetworks.data &&
              extNetworks.data.length > 0 &&
              extNetworks.data.map((network) => (
                <SelectOption key={network.id} value={network.name}>
                  {network.name}
                </SelectOption>
              ))}
          </Select>
        </FormRow>
      </section>

      <Stack className=" tw-mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanceNetworkSettings((prev) => !prev)}
          className="tw-text-lg tw-font-bold tw-cursor-pointer hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
          aria-expanded={showAdvanceNetworkSettings}
          aria-controls="advanced-network-settings"
        >
          {showAdvanceNetworkSettings ? "Hide advanced network options" : "Show advanced network options"}
          <Icon color="global-text" icon={showAdvanceNetworkSettings ? "expandLess" : "expandMore"} />
        </button>
      </Stack>
      <Collapse className="tw-mt-2" innerClassName="tw-p-0.5" isOpen={showAdvanceNetworkSettings}>
        <FormRow>
          <TextInput
            label="Pods CIDR"
            id="pods"
            type="text"
            value={clusterFormData?.networking?.pods || ""}
            onChange={(e) => setClusterFormData(updateNetworkingField(clusterFormData, "pods", e.target.value.trim()))}
            onBlur={() => validateSingleField("networking.pods")}
            errortext={formErrors["networking.pods"] ? formErrors["networking.pods"][0] : undefined}
            helptext="CIDR notation for pod IP addresses. Example: 10.44.0.0/16"
            maxLength={32}
          />
        </FormRow>
        <FormRow>
          <TextInput
            label="Nodes CIDR"
            id="nodes"
            type="text"
            value={clusterFormData?.networking?.nodes || ""}
            onChange={(e) => setClusterFormData(updateNetworkingField(clusterFormData, "nodes", e.target.value.trim()))}
            onBlur={() => validateSingleField("networking.nodes")}
            errortext={formErrors["networking.nodes"] ? formErrors["networking.nodes"][0] : undefined}
            helptext="CIDR notation for node IP addresses. Example: 10.180.24.0/24"
            maxLength={32}
          />
        </FormRow>
        <FormRow>
          <TextInput
            label="Services CIDR"
            id="services"
            type="text"
            value={clusterFormData?.networking?.services || ""}
            onChange={(e) =>
              setClusterFormData(updateNetworkingField(clusterFormData, "services", e.target.value.trim()))
            }
            onBlur={() => validateSingleField("networking.services")}
            errortext={formErrors["networking.services"] ? formErrors["networking.services"][0] : undefined}
            helptext="CIDR notation for service IP addresses. Example: 10.45.0.0/16"
            maxLength={32}
          />
        </FormRow>
        <FormRow>
          <TextInput
            label="Workers CIDR"
            id="workers"
            type="text"
            value={clusterFormData?.infrastructure?.networkWorkers || ""}
            onChange={(e) =>
              setClusterFormData((prev) => ({
                ...prev,
                infrastructure: {
                  ...prev.infrastructure,
                  networkWorkers: e.target.value.trim(),
                },
              }))
            }
            onBlur={() => validateSingleField("infrastructure.networkWorkers")}
            errortext={
              formErrors["infrastructure.networkWorkers"] ? formErrors["infrastructure.networkWorkers"][0] : undefined
            }
            helptext="CIDR notation for worker IP addresses. Example: 10.180.24.0/24"
            maxLength={32}
          />
        </FormRow>
      </Collapse>
    </div>
  )
}

export default Step1
