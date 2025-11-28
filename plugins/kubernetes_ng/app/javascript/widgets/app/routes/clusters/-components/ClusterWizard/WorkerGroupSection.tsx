import React from "react"
import {
  Grid,
  GridRow,
  GridColumn,
  FormRow,
  Select,
  SelectOption,
  TextInput,
  FormSection,
} from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"
import { WorkerGroup } from "./types"

type WorkerGroupProps = {
  workerGroup: WorkerGroup
  onChange: (updatedWorkerGroup: WorkerGroup) => void
  onDelete: () => void
}

const WorkerGroupSection = ({ workerGroup, onChange, onDelete }: WorkerGroupProps) => {
  const { cloudProfiles, selectedCloudProfile, region } = useWizard()

  const availableMachineTypes = selectedCloudProfile?.machineTypes ?? []
  const availableMachineImages = selectedCloudProfile?.machineImages ?? []
  const selectedImage = availableMachineImages.find((img) => img.name === workerGroup.machineImage.name)
  const availableImageVersions = selectedImage?.versions ?? []
  const availableZones = selectedCloudProfile?.regions?.find((r) => r.name === region)?.zones || []

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...workerGroup,
      [field]: value,
    })
  }

  return (
    <FormSection title={`Worker Group: ${workerGroup.name || "New Worker Group"}`}>
      <Grid>
        <GridRow>
          <GridColumn cols={6}>
            <FormRow>
              <TextInput
                label="Name"
                id="workerGroupName"
                required
                type="text"
                value={workerGroup.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                maxLength={50}
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={6}></GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn cols={6}>
            <FormRow>
              <Select
                required
                label="Machine Type"
                id="machineType"
                name="machineType"
                loading={cloudProfiles.isLoading}
                errortext={cloudProfiles.error instanceof Error ? cloudProfiles.error.message : undefined}
                value={workerGroup.machineType}
                onChange={(e) => handleFieldChange("machineType", e?.toString())}
                truncateOptions
              >
                {availableMachineTypes.map((opt) => (
                  <SelectOption key={opt.name} value={opt.name}>
                    {opt.name}
                  </SelectOption>
                ))}
              </Select>
            </FormRow>
          </GridColumn>
          <GridColumn cols={6}>
            <FormRow>
              <TextInput
                label="Minimum Nodes"
                id="minNodes"
                required
                type="number"
                value={workerGroup.minimum}
                onChange={(e) => handleFieldChange("minimum", Number(e.target.value))}
                maxLength={4}
              />
            </FormRow>
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn cols={6}>
            <FormRow>
              <Select
                required
                label="Machine Image"
                id="machineImage"
                name="machineImage"
                loading={cloudProfiles.isLoading}
                errortext={cloudProfiles.error instanceof Error ? cloudProfiles.error.message : undefined}
                value={workerGroup?.machineImage?.name}
                onChange={(e) =>
                  onChange({
                    ...workerGroup,
                    machineImage: {
                      ...workerGroup.machineImage,
                      name: e?.toString() || "",
                      version: "", // reset version when image changes
                    },
                  })
                }
                truncateOptions
              >
                {availableMachineImages.map((opt) => (
                  <SelectOption key={opt.name} value={opt.name}>
                    {opt.name}
                  </SelectOption>
                ))}
              </Select>
            </FormRow>
          </GridColumn>
          <GridColumn cols={6}>
            <FormRow>
              <TextInput
                label="Maximum Nodes"
                id="maxNodes"
                required
                type="number"
                value={workerGroup.maximum}
                onChange={(e) => handleFieldChange("maximum", Number(e.target.value))}
                maxLength={4}
              />
            </FormRow>
          </GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn cols={6}>
            <FormRow>
              <Select
                required
                label="Image Version"
                id="imageVersion"
                name="imageVersion"
                loading={cloudProfiles.isLoading}
                errortext={cloudProfiles.error instanceof Error ? cloudProfiles.error.message : undefined}
                value={workerGroup?.machineImage?.version}
                onChange={(e) =>
                  onChange({
                    ...workerGroup,
                    machineImage: {
                      ...workerGroup.machineImage,
                      version: e?.toString() || "",
                    },
                  })
                }
                truncateOptions
              >
                {availableImageVersions.map((opt) => (
                  <SelectOption key={opt} value={opt}>
                    {opt}
                  </SelectOption>
                ))}
              </Select>
            </FormRow>
          </GridColumn>
          <GridColumn cols={6}>
            <FormRow>
              <Select
                required
                label="Availability Zones"
                id="availabilityZones"
                name="availabilityZones"
                loading={cloudProfiles.isLoading}
                errortext={cloudProfiles.error instanceof Error ? cloudProfiles.error.message : undefined}
                value={workerGroup.zones}
                onChange={(e) =>
                  onChange({
                    ...workerGroup,
                    zones: e ? [e.toString()] : [],
                  })
                }
                truncateOptions
              >
                {availableZones.map((opt) => (
                  <SelectOption key={opt} value={opt}>
                    {opt}
                  </SelectOption>
                ))}
              </Select>
            </FormRow>
          </GridColumn>
        </GridRow>
      </Grid>
    </FormSection>
  )
}

export default WorkerGroupSection
