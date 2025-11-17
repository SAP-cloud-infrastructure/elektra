import React from "react"
import { Form, FormRow, Select, SelectOption, TextInput, FormSection } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"
import { useQuery } from "@tanstack/react-query"
import { DEFAULT_CLOUD_PROFILE_NAME } from "./constants"

const getLatestVersion = (versions: string[] = []) => {
  return versions
    .map((v) => v.split(".").map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    .join(".")
}

const BasicInfoStep = () => {
  const { client, basicAndInfraData: formData, setBasicAndInfraData, formErrors } = useWizard()

  const { isLoading, data: cloudProfiles } = useQuery({
    queryKey: ["cloudProfiles"],
    queryFn: () => client.gardener.getCloudProfiles(),
    enabled: !!client.gardener.getCloudProfiles,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    onSuccess: (profiles) => {
      // set cloud profile to default if available, else first one
      const defaultCloudProfile = profiles.find((profile) => profile.name === DEFAULT_CLOUD_PROFILE_NAME) || profiles[0]
      // select latest kubernetes version from the selected cloud profile
      const latestKubernetesVersion = getLatestVersion(defaultCloudProfile?.kubernetesVersions ?? [])
      setBasicAndInfraData((prev) => ({
        ...prev,
        cloudProfileName: defaultCloudProfile.name,
        kubernetesVersion: latestKubernetesVersion || "",
      }))
    },
  })

  const selectedCloudProfile = cloudProfiles?.find((cp) => cp.name === formData.cloudProfileName)

  const availableKubernetesVersions = selectedCloudProfile?.kubernetesVersions ?? []

  return (
    <Form>
      <FormSection title="Basic Information">
        <FormRow key={"clusterName"}>
          <TextInput
            label={`Cluster Name`}
            required
            type={"text"}
            value={formData.name}
            disabled={isLoading}
            onChange={(e) => setBasicAndInfraData((prev) => ({ ...prev, name: e.target.value }))}
            helptext="Must start with a letter and may contain lowercase letters, numbers, or dashes (‘-’). The name can be at most 11 characters long."
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
            onChange={(e) => setBasicAndInfraData((prev) => ({ ...prev, kubernetesVersion: e?.toString() || "" }))}
            truncateOptions
          >
            {availableKubernetesVersions.map((version) => (
              <SelectOption key={version} value={version}>
                {version}
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
            onChange={(e) => setBasicAndInfraData((prev) => ({ ...prev, cloudProfileName: e?.toString() || "" }))}
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
      </FormSection>
      <FormSection title="Infrastructure"></FormSection>
    </Form>
  )
}

export default BasicInfoStep
