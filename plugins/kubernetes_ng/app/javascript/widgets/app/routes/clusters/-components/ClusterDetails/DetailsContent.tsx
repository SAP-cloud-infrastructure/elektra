import React, { useState } from "react"
import {
  Container,
  DataGrid,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Grid,
  GridRow,
  GridColumn,
  Icon,
  Stack,
  Button,
  Spinner,
} from "@cloudoperators/juno-ui-components"
import ClusterDetailRow from "./DetailRow"
import { Cluster } from "../../../../types/cluster"
import { Permissions } from "../../../../types/permissions"
import ClipboardText from "../../../../components/ClipboardText"
import ReadinessConditions from "../../../../components/ReadinessConditions"
import LastErrors from "./LastErrors"
import Collapse from "../../../../components/Collapse"
import Box from "../../../../components/Box"
import WorkerList from "./WorkerList"
import YamlEditor from "../../../../components/YamlEditor"
import WorkerGroupEditModal from "./WorkerGroupEditModal"
import MaintenanceWindowEditModal from "./MaintenanceWindowEditModal"
import InlineError from "../../../../components/InlineError"
import { useRouteContext, useNavigate, useSearch, useParams } from "@tanstack/react-router"
import { RouterContext } from "../../../__root"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { normalizeError } from "../../../../components/InlineError"
import { CLUSTER_DETAIL_ROUTE_ID, ClusterDetailTab } from "../../$clusterName"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "../../../../hooks/queryKeys"
import DisableableButton from "../../../../components/DisableableButton"
import { KubernetesVersionDisplay } from "./KubernetesVersionDisplay"
import { VersionUpdateDialog } from "./VersionUpdateDialog"
import { useUpdateClusterMutation } from "../../../../hooks/useClusterQueries"
import { normalizeDisplayValue } from "../../../../utils/valueHelpers"

const sectionHeaderStyles = "details-section tw-text-lg tw-font-bold tw-mb-4"

const DetailsContent = ({
  cluster,
  updatedAt,
  shootPermissions,
  error,
  isLoading = false,
  isFetching = false,
}: {
  cluster?: Cluster
  updatedAt?: number
  shootPermissions?: Permissions
  error?: Error
  isLoading?: boolean
  isFetching?: boolean
}) => {
  const [showLastOperation, setShowLastOperation] = useState(false)
  const [isEditingWorkers, setIsEditingWorkers] = useState(false)
  const [isEditingMaintenance, setIsEditingMaintenance] = useState(false)
  const [showVersionUpdateDialog, setShowVersionUpdateDialog] = useState(false)
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext
  const params = useParams({ from: CLUSTER_DETAIL_ROUTE_ID })
  const navigate = useNavigate({ from: CLUSTER_DETAIL_ROUTE_ID })
  const { tab } = useSearch({ from: CLUSTER_DETAIL_ROUTE_ID })
  const { addMessage, resetMessages } = useActions()
  const queryClient = useQueryClient()
  const updateClusterMutation = useUpdateClusterMutation(apiClient)

  // Handle tab change via URL navigation
  const tabIndex = tab === "yaml" ? 1 : 0
  const handleTabChange = (index: number) => {
    const newTab: ClusterDetailTab = index === 1 ? "yaml" : "overview"
    navigate({
      search: { tab: newTab },
    })
  }

  // Helper to refresh cluster data - uses clusterName from URL params
  // This works even when cluster is undefined (during loading or error states)
  const refreshCluster = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cluster(params.clusterName) })
  }

  const handleSaveCluster = async (resource: Record<string, unknown>): Promise<void> => {
    if (!cluster) return
    return apiClient.gardener
      .replaceCluster(cluster.name, resource)
      .then(() => {
        refreshCluster()
        resetMessages()
        addMessage({ text: "Cluster updated successfully", variant: "success" })
      })
      .catch((error) => {
        resetMessages()
        const errText = normalizeError(error)
        addMessage({ text: `${errText.title}${errText.message}`, variant: "danger" })
      })
  }

  const handleYamlError = (error: Error) => {
    resetMessages()
    const errText = normalizeError(error)
    addMessage({ text: `${errText.title}${errText.message}`, variant: "danger" })
  }

  const handleEditClick = () => {
    resetMessages()
  }

  const handleRefreshCluster = async (): Promise<Record<string, unknown>> => {
    if (!cluster) throw new Error("Cluster not available")
    // Invalidate the query to trigger a refresh in the background
    refreshCluster()
    // Fetch the latest cluster resource directly from the API for the YAML editor
    const latestCluster = await apiClient.gardener.getClusterByName(cluster.name)
    // Return the raw cluster resource
    return latestCluster.raw
  }

  const handleWorkersSuccess = () => {
    setIsEditingWorkers(false)
    resetMessages()
    addMessage({ text: "Worker groups updated successfully", variant: "success" })
  }

  const handleMaintenanceSuccess = () => {
    setIsEditingMaintenance(false)
    resetMessages()
    addMessage({ text: "Maintenance window updated successfully", variant: "success" })
  }

  const handleVersionUpdate = (targetVersion: string) => {
    if (!cluster) return

    updateClusterMutation.mutate(
      {
        clusterName: cluster.name,
        data: { kubernetesVersion: targetVersion },
      },
      {
        onSuccess: () => {
          setShowVersionUpdateDialog(false)
          resetMessages()
          addMessage({
            text: `Kubernetes version update to ${targetVersion} initiated successfully`,
            variant: "success",
          })
        },
        onError: (error) => {
          setShowVersionUpdateDialog(false)
          resetMessages()
          const errText = normalizeError(error)
          addMessage({ text: `Version update failed: ${errText.title}${errText.message}`, variant: "danger" })
        },
      }
    )
  }

  // Determine disabled state and message for YamlEditor
  const getYamlEditorDisabledState = () => {
    if (!cluster) {
      return {
        disabled: true,
        disabledMessage: "Cluster not available",
      }
    }
    if (cluster.isDeleted) {
      return {
        disabled: true,
        disabledMessage: "Cluster is deleted and cannot be edited",
      }
    }
    if (!shootPermissions?.update) {
      return {
        disabled: true,
        disabledMessage: "You don't have permission to edit this cluster",
      }
    }
    return {
      disabled: false,
      disabledMessage: undefined,
    }
  }

  const yamlEditorState = getYamlEditorDisabledState()

  // Check if Kubernetes version updates are available
  const hasVersionUpdatesAvailable =
    cluster?.versionUpdates &&
    (!!cluster.versionUpdates.patch?.length ||
      !!cluster.versionUpdates.minor?.length ||
      !!cluster.versionUpdates.major?.length)

  // Determine disabled message for version update button
  const versionUpdateDisabledMessage = cluster?.isDeleted
    ? "Cluster is deleted and actions are disabled"
    : !shootPermissions?.update
      ? "You don't have permission to update this cluster"
      : !hasVersionUpdatesAvailable
        ? "No updates available"
        : undefined

  // Content rendered in both tabs during loading/error states
  const loadingContent = (
    <Container py px={false}>
      <Stack gap="2">
        <Spinner variant="primary" size="small" aria-label="Loading cluster details" />
        <span>Loading cluster details...</span>
      </Stack>
    </Container>
  )

  const errorContent = (
    <Container py px={false}>
      <InlineError error={error} />
    </Container>
  )

  return (
    <Container px={false} py>
      <div className="tw-relative">
        <div className="tw-absolute tw-right-0 tw-top-2 tw-text-sm tw-flex tw-items-center tw-gap-4">
          {updatedAt && <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>}
          <Button
            size="small"
            variant="subdued"
            onClick={refreshCluster}
            progress={isFetching}
            disabled={isFetching}
            label="Refresh"
            title="Refresh cluster data"
          />
        </div>
        <Tabs selectedIndex={tabIndex} onSelect={handleTabChange}>
          <TabList>
            <Tab disabled={isLoading || !!error}>Overview</Tab>
            <Tab disabled={isLoading || !!error}>YAML</Tab>
          </TabList>
          {isLoading && (
            <>
              <TabPanel>{loadingContent}</TabPanel>
              <TabPanel>{loadingContent}</TabPanel>
            </>
          )}
          {error && (
            <>
              <TabPanel>{errorContent}</TabPanel>
              <TabPanel>{errorContent}</TabPanel>
            </>
          )}
          {!isLoading && !error && cluster && (
            <>
              <TabPanel>
                {/* Basic info */}
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Basic Information</h2>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Name">{cluster.name}</ClusterDetailRow>
                    <ClusterDetailRow label="ID">
                      <ClipboardText text={cluster.uid} />
                    </ClusterDetailRow>
                    <ClusterDetailRow label="Cluster Status">{`${cluster.status} ${cluster.isDeleted ? "(deleted)" : ""}`}</ClusterDetailRow>
                    <ClusterDetailRow label="Kubernetes Version">
                      <Stack gap="2" alignment="center">
                        <KubernetesVersionDisplay
                          version={cluster.version}
                          versionUpdates={cluster.versionUpdates}
                          className="tw-w-full"
                        />
                        <DisableableButton
                          size="small"
                          variant="subdued"
                          onClick={() => setShowVersionUpdateDialog(true)}
                          label="Update"
                          title="Update Kubernetes version"
                          disabled={cluster.isDeleted || !shootPermissions?.update || !hasVersionUpdatesAvailable}
                          disabledMessage={versionUpdateDisabledMessage}
                        />
                      </Stack>
                    </ClusterDetailRow>
                    <ClusterDetailRow label="Namespace">
                      <ClipboardText text={cluster.namespace} />
                    </ClusterDetailRow>
                    <ClusterDetailRow label="Purpose">{cluster.purpose}</ClusterDetailRow>
                    <ClusterDetailRow label="Add ons">{cluster.addOns?.join(", ")}</ClusterDetailRow>
                    <ClusterDetailRow label="Created by">{cluster.createdBy}</ClusterDetailRow>
                  </DataGrid>
                </Container>

                {/* Readiness Conditions */}
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Readiness</h2>
                  {cluster?.readiness?.conditions?.length > 0 ? (
                    <DataGrid columns={2} gridColumnTemplate="17.5% auto">
                      <ClusterDetailRow label="Readiness">
                        <ReadinessConditions conditions={cluster?.readiness?.conditions} showDetails />
                      </ClusterDetailRow>
                    </DataGrid>
                  ) : (
                    <p>No readiness conditions found.</p>
                  )}
                </Container>

                {/* Latest Operation & Errors */}
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Latest Operation & Errors</h2>
                  <DataGrid columns={2} gridColumnTemplate="17.5% auto">
                    {cluster.lastErrors && cluster.lastErrors.length > 0 && (
                      <ClusterDetailRow label="Errors">
                        <LastErrors errors={cluster?.lastErrors} />
                      </ClusterDetailRow>
                    )}
                    {cluster.lastOperation && (
                      <>
                        <ClusterDetailRow label="Operation">
                          <Stack direction="vertical" gap="1">
                            <button
                              type="button"
                              onClick={() => setShowLastOperation((prev) => !prev)}
                              className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
                              aria-expanded={showLastOperation}
                              aria-controls="last-operation"
                              id="last-operation-toggle"
                            >
                              {showLastOperation ? "Hide last operation" : "Show last operation"}
                              <Icon color="global-text" icon={showLastOperation ? "expandLess" : "expandMore"} />
                            </button>
                            <Collapse
                              isOpen={showLastOperation}
                              id="last-operation"
                              aria-labelledby="last-operation-toggle"
                            >
                              <Box variant="default">
                                <Grid>
                                  <GridRow>
                                    <GridColumn cols={2} className="tw-text-right">
                                      <strong>Description</strong>
                                    </GridColumn>
                                    <GridColumn cols={10}>{cluster.lastOperation?.description}</GridColumn>
                                  </GridRow>
                                  <GridRow>
                                    <GridColumn cols={2} className="tw-text-right">
                                      <strong>Progress</strong>
                                    </GridColumn>
                                    <GridColumn cols={10}>{cluster.lastOperation?.progress}</GridColumn>
                                  </GridRow>
                                  <GridRow>
                                    <GridColumn cols={2} className="tw-text-right">
                                      <strong>State</strong>
                                    </GridColumn>
                                    <GridColumn cols={10}>{cluster.lastOperation?.state}</GridColumn>
                                  </GridRow>
                                  <GridRow>
                                    <GridColumn cols={2} className="tw-text-right">
                                      <strong>Type</strong>
                                    </GridColumn>
                                    <GridColumn cols={10}>{cluster.lastOperation?.type}</GridColumn>
                                  </GridRow>
                                  <GridRow>
                                    <GridColumn cols={2} className="tw-text-right">
                                      <strong>Update Time</strong>
                                    </GridColumn>
                                    <GridColumn cols={10}>
                                      {new Date(cluster.lastOperation?.lastUpdateTime).toLocaleString()}
                                    </GridColumn>
                                  </GridRow>
                                </Grid>
                              </Box>
                            </Collapse>
                          </Stack>
                        </ClusterDetailRow>
                      </>
                    )}
                  </DataGrid>
                </Container>

                {/* Workers */}
                <Container py px={false}>
                  <Stack direction="horizontal" alignment="center">
                    <h2 className={sectionHeaderStyles + " tw-w-full"}>Worker Groups</h2>
                    <DisableableButton
                      size="small"
                      variant="subdued"
                      onClick={() => setIsEditingWorkers(true)}
                      label="Edit Worker Groups"
                      className="tw-whitespace-nowrap"
                      disabled={!shootPermissions?.update || cluster.isDeleted}
                      disabledMessage={
                        cluster.isDeleted
                          ? "Cluster is deleted and cannot be edited"
                          : !shootPermissions?.update
                            ? "You don't have permission to edit worker groups"
                            : undefined
                      }
                    />
                  </Stack>
                  <WorkerList workers={cluster.workers} />
                </Container>

                {isEditingWorkers && (
                  <WorkerGroupEditModal
                    open={true}
                    clusterName={cluster.name}
                    workers={cluster.workers}
                    cloudProfileName={cluster.cloudProfileName}
                    region={cluster.region}
                    onSuccess={handleWorkersSuccess}
                    onCancel={() => setIsEditingWorkers(false)}
                  />
                )}

                {/* Maintenance and auto update */}
                <Stack direction="horizontal" alignment="center">
                  <h2 className={sectionHeaderStyles + " tw-w-full"}>Maintenance</h2>
                  <DisableableButton
                    size="small"
                    className="tw-whitespace-nowrap"
                    variant="subdued"
                    onClick={() => setIsEditingMaintenance(true)}
                    label="Edit Maintenance"
                    disabled={!shootPermissions?.update || cluster.isDeleted}
                    disabledMessage={
                      cluster.isDeleted
                        ? "Cluster is deleted and cannot be edited"
                        : !shootPermissions?.update
                          ? "You don't have permission to edit maintenance settings"
                          : undefined
                    }
                  />
                </Stack>

                {/* responsive grid, it changes from 2 columns to 1 column on smaller screens */}
                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2">
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Window">
                      <Grid>
                        <GridRow>
                          <GridColumn cols={4} className="tw-text-right tw-break-words">
                            <strong>Start Time</strong>
                          </GridColumn>
                          <GridColumn cols={8}>{cluster.maintenance.startTime}</GridColumn>
                        </GridRow>
                        <GridRow>
                          <GridColumn cols={4} className="tw-text-right">
                            <strong>End Time</strong>
                          </GridColumn>
                          <GridColumn cols={8}>{cluster.maintenance.endTime}</GridColumn>
                        </GridRow>
                        <GridRow>
                          <GridColumn cols={4} className="tw-text-right">
                            <strong>Timezone</strong>
                          </GridColumn>
                          <GridColumn cols={8}>{cluster.maintenance.timezone}</GridColumn>
                        </GridRow>
                      </Grid>
                    </ClusterDetailRow>
                  </DataGrid>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Auto Update">
                      <Grid>
                        <GridRow>
                          <GridColumn cols={4} className="tw-text-right tw-break-words">
                            <strong>OS</strong>
                          </GridColumn>
                          <GridColumn cols={8}>{normalizeDisplayValue(cluster.autoUpdate?.os)}</GridColumn>
                        </GridRow>
                        <GridRow>
                          <GridColumn cols={4} className="tw-text-right">
                            <strong>Kubernetes</strong>
                          </GridColumn>
                          <GridColumn cols={8}>{normalizeDisplayValue(cluster.autoUpdate?.kubernetes)}</GridColumn>
                        </GridRow>
                      </Grid>
                    </ClusterDetailRow>
                  </DataGrid>
                </div>
              </TabPanel>
              <TabPanel>
                <Container py px={false}>
                  <YamlEditor
                    resource={cluster.raw}
                    onSave={handleSaveCluster}
                    onError={handleYamlError}
                    onEdit={handleEditClick}
                    onRefresh={handleRefreshCluster}
                    disabled={yamlEditorState.disabled}
                    disabledMessage={yamlEditorState.disabledMessage}
                  />
                </Container>
              </TabPanel>
            </>
          )}
        </Tabs>

        {cluster && isEditingMaintenance && (
          <MaintenanceWindowEditModal
            open={true}
            clusterName={cluster.name}
            maintenance={cluster.maintenance}
            autoUpdate={cluster.autoUpdate}
            hasWorkers={cluster.workers && cluster.workers.length > 0}
            onSuccess={handleMaintenanceSuccess}
            onCancel={() => setIsEditingMaintenance(false)}
          />
        )}

        {cluster && showVersionUpdateDialog && (
          <VersionUpdateDialog
            isOpen={showVersionUpdateDialog}
            onClose={() => setShowVersionUpdateDialog(false)}
            onConfirm={handleVersionUpdate}
            currentVersion={cluster.version}
            versionUpdates={cluster.versionUpdates}
            isUpdating={updateClusterMutation.isPending}
          />
        )}
      </div>
    </Container>
  )
}

export default DetailsContent
