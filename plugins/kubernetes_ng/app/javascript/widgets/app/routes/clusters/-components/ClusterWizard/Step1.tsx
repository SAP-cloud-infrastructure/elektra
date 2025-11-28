import React, { useState, useEffect } from "react"
import { FormRow, Select, SelectOption, TextInput, FormSection, Stack, Icon } from "@cloudoperators/juno-ui-components"
import Collapse from "../../../../components/Collapse"
import { useWizard } from "./WizzardProvider"

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
  const [showAdvanceNetworkSettings, setShowAdvanceNetworkSettings] = useState(false)
  const [networkErrorsPresent, setNetworkErrorsPresent] = useState(false)

  const availableKubernetesVersions = selectedCloudProfile?.kubernetesVersions ?? []

  // TODO: close manually not working
  useEffect(() => {
    const hasErrors =
      formErrors["networking.podsCIDR"]?.length > 0 ||
      formErrors["networking.nodesCIDR"]?.length > 0 ||
      formErrors["networking.servicesCIDR"]?.length > 0

    if (hasErrors) {
      setNetworkErrorsPresent(true) // remember that there were errors
    }
  }, [formErrors])

  return (
    <>
      <FormSection title="Basic Information">
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
            errortext={formErrors.name ? formErrors.name[0] : undefined}
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
            errortext={cloudProfiles.error instanceof Error ? cloudProfiles.error.message : undefined}
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
            truncateOptions
          >
            {availableKubernetesVersions.map((version) => (
              <SelectOption key={version} value={version}>
                {version}
              </SelectOption>
            ))}
          </Select>
        </FormRow>
      </FormSection>
      <FormSection title="Infrastructure">
        <FormRow>
          <Select
            required
            id="floatingPool"
            label="Floating IP Pool"
            name="floatingPool"
            loading={extNetworks.isLoading}
            errortext={extNetworks.error instanceof Error ? extNetworks.error.message : undefined}
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
      </FormSection>

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
      <Collapse className="tw-mt-2" isOpen={showAdvanceNetworkSettings || networkErrorsPresent}>
        <FormRow key={"podsCIDR"}>
          <TextInput
            label="Pods CIDR"
            id="podsCIDR"
            type="text"
            value={clusterFormData?.networking?.podsCIDR || ""}
            onChange={(e) =>
              setClusterFormData(updateNetworkingField(clusterFormData, "podsCIDR", e.target.value.trim()))
            }
            onBlur={() => validateSingleField("networking.podsCIDR")}
            errortext={formErrors["networking.podsCIDR"] ? formErrors["networking.podsCIDR"][0] : undefined}
            maxLength={32}
          />
        </FormRow>
        <FormRow>
          <TextInput
            label="Nodes CIDR"
            id="nodesCIDR"
            type="text"
            value={clusterFormData?.networking?.nodesCIDR || ""}
            onChange={(e) =>
              setClusterFormData(updateNetworkingField(clusterFormData, "nodesCIDR", e.target.value.trim()))
            }
            onBlur={() => validateSingleField("networking.nodesCIDR")}
            errortext={formErrors["networking.nodesCIDR"] ? formErrors["networking.nodesCIDR"][0] : undefined}
            maxLength={32}
          />
        </FormRow>
        <FormRow>
          <TextInput
            label="Services CIDR"
            id="servicesCIDR"
            type="text"
            value={clusterFormData?.networking?.servicesCIDR || ""}
            onChange={(e) =>
              setClusterFormData(updateNetworkingField(clusterFormData, "servicesCIDR", e.target.value.trim()))
            }
            onBlur={() => validateSingleField("networking.servicesCIDR")}
            errortext={formErrors["networking.servicesCIDR"] ? formErrors["networking.servicesCIDR"][0] : undefined}
            maxLength={32}
          />
        </FormRow>
      </Collapse>
    </>
  )
}

export default Step1
