import React, { useState } from "react"
import {
  JsonViewer,
  Container,
  DataGrid,
  DataGridRow,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Grid,
  GridRow,
  GridColumn,
  Icon,
  Stack,
} from "@cloudoperators/juno-ui-components"
import ClusterDetailRow from "./DetailRow"
import { Cluster } from "../../../../types/cluster"
import ClipboardText from "../../../../components/ClipboardText"
import ReadinessConditions from "../../../../components/ReadinessConditions"
import LastErrors from "./LastErrors"
import Collapse from "../../../../components/Collapse"
import Box from "../../../../components/Box"
import WorkerList from "./WorkerList"

const sectionHeaderStyles = "details-section tw-text-lg tw-font-bold tw-mb-4"

const DetailsContent = ({ cluster, updatedAt }: { cluster: Cluster; updatedAt?: number }) => {
  const [showLastOperation, setShowLastOperation] = useState(false)
  return (
    <Container px={false} py>
      <div className="tw-relative">
        <div className="tw-absolute tw-right-0 tw-top-6 tw-text-sm">
          {updatedAt && <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>}
        </div>
        <Tabs>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>JSON</Tab>
          </TabList>
          <TabPanel>
            {/* Basic info */}
            <Container py px={false}>
              <h2 className={sectionHeaderStyles}>Basic Information</h2>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <ClusterDetailRow label="Name">{cluster.name}</ClusterDetailRow>
                <ClusterDetailRow label="ID">
                  <ClipboardText text={cluster.uid} />
                </ClusterDetailRow>
                <ClusterDetailRow label="Cluster Status">{cluster.status}</ClusterDetailRow>
                <ClusterDetailRow label="Kubernetes Version">{cluster.version}</ClusterDetailRow>
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
              <h2 className={sectionHeaderStyles}>Worker Groups</h2>
              <WorkerList workers={cluster.workers} />
            </Container>

            {/* Maintenance and auto update */}
            <DataGrid columns={2} gridColumnTemplate="50% 50%">
              <DataGridRow>
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Maintenance Window</h2>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Start Time">{cluster.maintenance?.startTime}</ClusterDetailRow>
                    <ClusterDetailRow label="Window Time">{cluster.maintenance?.windowTime}</ClusterDetailRow>
                    <ClusterDetailRow label="Timezone">{cluster.maintenance?.timezone}</ClusterDetailRow>
                  </DataGrid>
                </Container>
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Auto Update</h2>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="OS Updates">{cluster.autoUpdate?.os}</ClusterDetailRow>
                    <ClusterDetailRow label="Kubernetes Updates">{cluster.autoUpdate?.kubernetes}</ClusterDetailRow>
                  </DataGrid>
                </Container>
              </DataGridRow>
            </DataGrid>
          </TabPanel>
          <TabPanel>
            <Container py px={false}>
              <JsonViewer expanded={2} data={cluster.raw} toolbar />
            </Container>
          </TabPanel>
        </Tabs>
      </div>
    </Container>
  )
}

export default DetailsContent
