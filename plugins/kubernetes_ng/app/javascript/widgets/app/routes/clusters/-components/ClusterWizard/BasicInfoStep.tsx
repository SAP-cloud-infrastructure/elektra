import React, { useState } from "react"
import {
  Form,
  FormRow,
  Select,
  SelectOption,
  TextInput,
  FormSection,
  Stack,
  Icon,
  Container,
} from "@cloudoperators/juno-ui-components"
import Collapse from "../../../../components/Collapse"
import { useWizard } from "./WizzardProvider"

const BasicInfoStep = () => {
  const { clusterFormData, setClusterFormData, formErrors, cloudProfiles, selectedCloudProfile, extNetworks } =
    useWizard()
  const [showAdvanceNetworkSettings, setShowAdvanceNetworkSettings] = useState<boolean>(false)

  // TODO: reset kubernetesVersion when cloud profile changes
  const availableKubernetesVersions = selectedCloudProfile?.kubernetesVersions ?? []

  return (
    <Form>
      <FormSection title="Basic Information">
        <FormRow>
          <TextInput
            label="Cluster Name"
            id="clusterName"
            required
            type="text"
            value={clusterFormData.name}
            onChange={(e) => setClusterFormData((prev) => ({ ...prev, name: e.target.value }))}
            helptext="Must start with a letter and may contain lowercase letters, numbers, or dashes (‘-’). The name can be at most 11 characters long."
            errortext={formErrors.name ? formErrors.name.join(", ") : undefined}
            maxLength={50}
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
            value={clusterFormData.cloudProfileName}
            onChange={(e) => setClusterFormData((prev) => ({ ...prev, cloudProfileName: e?.toString() || "" }))}
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

        <Stack distribution="end" className="tw-mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanceNetworkSettings((prev) => !prev)}
            className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
            aria-expanded={showAdvanceNetworkSettings}
            aria-controls="readiness-details"
          >
            {showAdvanceNetworkSettings ? "Hide advanced network options" : "Show advanced network options"}
            <Icon color="global-text" icon={showAdvanceNetworkSettings ? "expandLess" : "expandMore"} />
          </button>
        </Stack>

        <Collapse className="tw-mt-2" isOpen={showAdvanceNetworkSettings}>
          <Container py className="tw-mt-2 tw-bg-theme-background-lvl-1">
            <p className="tw-font-bold tw-mb-2">Advanced network options</p>
            <FormRow key={"podsCIDR"}>
              <TextInput
                label="Pods CIDR"
                id="podsCIDR"
                type="text"
                value={clusterFormData?.networking?.podsCIDR || ""}
                onChange={(e) =>
                  setClusterFormData((prev) => ({
                    ...prev,
                    networking: {
                      ...prev.networking,
                      podsCIDR: e.target.value,
                    },
                  }))
                }
                maxLength={200}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Nodes CIDR"
                id="nodesCIDR"
                type="text"
                value={clusterFormData?.networking?.nodesCIDR || ""}
                onChange={(e) =>
                  setClusterFormData((prev) => ({
                    ...prev,
                    networking: {
                      ...prev.networking,
                      nodesCIDR: e.target.value,
                    },
                  }))
                }
                maxLength={200}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Services CIDR"
                id="servicesCIDR"
                type="text"
                value={clusterFormData?.networking?.servicesCIDR || ""}
                onChange={(e) =>
                  setClusterFormData((prev) => ({
                    ...prev,
                    networking: {
                      ...prev.networking,
                      servicesCIDR: e.target.value,
                    },
                  }))
                }
                maxLength={200}
              />
            </FormRow>
          </Container>
        </Collapse>
      </FormSection>
    </Form>
  )
}

export default BasicInfoStep
