import React from "react"
import { Form, FormRow, Select, SelectOption, TextInput } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"
import { regionOptions } from "./constants"
import { RegionValue } from "./types"

const BasicInfoStep = () => {
  const {
    basicInfoData: formData,
    setBasicInfoData,
    availableKubernetesVersions,
    cloudProfiles,
    isLoading,
    formErrors,
  } = useWizard()

  return (
    <Form>
      <FormRow key={"clusterName"}>
        <TextInput
          label={`Cluster Name`}
          required
          type={"text"}
          value={formData.name}
          disabled={isLoading}
          onChange={(e) => setBasicInfoData((prev) => ({ ...prev, name: e.target.value }))}
          helptext="Starts with a letter, followed by lowercase alphanumeric characters or dashes ('-')"
          errortext={formErrors.name ? formErrors.name.join(", ") : undefined}
          maxLength={200}
        />
      </FormRow>

      <FormRow key={"kubeVersion"}>
        <Select
          required
          label="Kubernetes Version"
          id="kubeVersion"
          name="kubeVersion"
          disabled={isLoading}
          value={formData.kubernetesVersion}
          onChange={(e) => setBasicInfoData((prev) => ({ ...prev, kubernetesVersion: e?.toString() || "" }))}
          truncateOptions
        >
          {availableKubernetesVersions.map((version) => (
            <SelectOption key={version} value={version}>
              {version}
            </SelectOption>
          ))}
        </Select>
      </FormRow>

      <FormRow key={"region"}>
        <Select
          required
          id="region"
          name="region"
          label="Region"
          value={formData.region}
          disabled={isLoading}
          onChange={(e) => setBasicInfoData((prev) => ({ ...prev, region: (e?.toString() as RegionValue) || "" }))}
          truncateOptions
        >
          {regionOptions.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>
      </FormRow>

      <FormRow key={"cloudProfile"}>
        <Select
          required
          label="Cloud Profile"
          id="cloudProfile"
          name="cloudProfile"
          loading={isLoading}
          value={formData.cloudProfileName}
          onChange={(e) => setBasicInfoData((prev) => ({ ...prev, cloudProfileName: e?.toString() || "" }))}
          truncateOptions
        >
          {cloudProfiles &&
            cloudProfiles.map((opt) => (
              <SelectOption key={opt.uid} value={opt.name}>
                {opt.name}
              </SelectOption>
            ))}
        </Select>
      </FormRow>
    </Form>
  )
}

export default BasicInfoStep
