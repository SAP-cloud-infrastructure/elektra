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
  Button,
} from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"
import { WorkerGroup } from "./types"

type WorkerGroupProps = {
  workerGroup: WorkerGroup
  index: number
  totalWorkers: number
  onChange: (updatedWorkerGroup: WorkerGroup) => void
  onDelete: () => void
}

const WorkerGroupSection = ({ workerGroup, index, totalWorkers, onChange, onDelete }: WorkerGroupProps) => {
  const { cloudProfiles, selectedCloudProfile, region, formErrors, validateSingleField } = useWizard()

  const availableMachineTypes = selectedCloudProfile?.machineTypes ?? []
  const availableMachineImages = selectedCloudProfile?.machineImages ?? []
  const selectedImage = availableMachineImages.find((img) => img.name === workerGroup.machineImage.name)
  const availableImageVersions = selectedImage?.versions ?? []
  const availableZones = selectedCloudProfile?.regions?.find((r) => r.name === region)?.zones || []
  const imageVersionDisabled = !workerGroup.machineImage.name
  // Do not show error if image version select is disabled
  const imageVersionErrorText = imageVersionDisabled
    ? undefined
    : (cloudProfiles.error instanceof Error && cloudProfiles.error.message) ||
      formErrors[`workers.${workerGroup.id}.machineImage.version`]?.[0]

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({
      ...workerGroup,
      [field]: value,
    })
  }

  return (
    <FormSection
      title={`Worker Group: ${workerGroup.name || "New Worker Group"}`}
      data-worker-id={workerGroup.id}
      aria-label={`Worker Group: ${workerGroup.name || "New Worker Group"}`}
    >
      {totalWorkers > 1 && index > 0 && (
        <Button
          variant="primary-danger"
          icon="deleteForever"
          size="small"
          onClick={onDelete}
          style={{ float: "right", marginTop: "-40px" }}
          aria-label={`Delete Worker Group ${workerGroup.name}`}
        />
      )}
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
                errortext={formErrors[`workers.${workerGroup.id}.name`]?.[0] || undefined}
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.name`)}
                maxLength={50}
              />
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
                helptext="Minimum number of nodes for auto-scaling."
                errortext={formErrors[`workers.${workerGroup.id}.minimum`]?.[0] || undefined}
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.minimum`)}
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
                label="Machine Type"
                id="machineType"
                name="machineType"
                loading={cloudProfiles.isLoading}
                value={workerGroup.machineType}
                onChange={(e) => handleFieldChange("machineType", e?.toString())}
                helptext="Select the machine type for the worker nodes."
                errortext={
                  cloudProfiles.error instanceof Error
                    ? cloudProfiles.error.message
                    : formErrors[`workers.${workerGroup.id}.machineType`]?.[0] || undefined
                }
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.machineType`)}
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
                label="Maximum Nodes"
                id="maxNodes"
                required
                type="number"
                value={workerGroup.maximum}
                onChange={(e) => handleFieldChange("maximum", Number(e.target.value))}
                helptext="Maximum number of nodes for auto-scaling."
                errortext={formErrors[`workers.${workerGroup.id}.maximum`]?.[0] || undefined}
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.maximum`)}
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
                helptext="Select the machine image for the worker nodes."
                errortext={
                  cloudProfiles.error instanceof Error
                    ? cloudProfiles.error.message
                    : formErrors[`workers.${workerGroup.id}.machineImage.name`]?.[0] || undefined
                }
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
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.machineImage.name`)}
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
              <Select
                required
                label="Availability Zones"
                id="availabilityZones"
                name="availabilityZones"
                loading={cloudProfiles.isLoading}
                errortext={
                  cloudProfiles.error instanceof Error
                    ? cloudProfiles.error.message
                    : formErrors[`workers.${workerGroup.id}.zones`]?.[0] || undefined
                }
                value={workerGroup.zones}
                onChange={(e) =>
                  onChange({
                    ...workerGroup,
                    zones: e ? [e.toString()] : [],
                  })
                }
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.zones`)}
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
        <GridRow>
          <GridColumn cols={6}>
            <FormRow>
              <Select
                required
                label="Image Version"
                id="imageVersion"
                name="imageVersion"
                loading={cloudProfiles.isLoading}
                helptext="Select the version of the machine image for the chosen image type."
                errortext={imageVersionErrorText}
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
                onBlur={() => validateSingleField(`workers.${workerGroup.id}.machineImage.version`)}
                disabled={imageVersionDisabled}
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
          <GridColumn cols={6}></GridColumn>
        </GridRow>
      </Grid>
    </FormSection>
  )
}

export default WorkerGroupSection
