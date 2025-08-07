import React from "react"

import {
  Message,
  SearchInput,
  IntroBox,
  Spinner,
  Button,
  Panel,
  PanelBody,
  JsonViewer,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  ContentAreaToolbar,
  Icon,
} from "@cloudoperators/juno-ui-components"
import { apiClient } from "./lib/apiClient"

import DeleteConfirm from "./DeleteConfirm"

export default function ProjectResourceCheck({ opened, onClose }) {
  // This state is used to store the data fetched from the API
  const [data, setData] = React.useState(null)
  // This state is used to store the loading state of the component
  const [loading, setLoading] = React.useState(false)
  // This is a ref to keep track of the mounted state of the component
  const mounted = React.useRef(true)
  // This state is used to store the search text entered by the user
  const [searchText, setSearchText] = React.useState("")
  const [apiError, setApiError] = React.useState(null)

  // This is a memoized value that filters the data based on the search text
  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter((entry) => {
      if (!searchText) return true
      let id = String(entry.resource?.id)
      return (
        // Check if the search text is present in the resource name, id, type or service type
        entry.resource?.name?.includes(searchText) ||
        id?.includes(searchText) ||
        entry.type?.includes(searchText) ||
        entry.service_type?.includes(searchText)
      )
    })
  }, [data, searchText])

  const onConfirm = () => {
    console.log("Deleting project...")
    setLoading(true)
    apiClient
      .osApi("prodel")
      .delete(`/api/v1/projects/${window.scopedProjectId}`)
      .then(() => {
        setLoading(false)
        // after success
        var scopedDomainName = window.location.pathname.split("/")[1]
        var url = window.location.protocol + "//" + window.location.host + "/" + scopedDomainName
        console.log("Redirecting to: " + url)
        window.location.href = url
      })
      .catch((error) => {
        setLoading(false)
        setApiError(error.data)
        console.error(error.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const fetchData = React.useCallback(() => {
    // https://prodel.qa-de-1.cloud.sap/ui
    // https://prodel.qa-de-1.cloud.sap/swagger-ui
    setLoading(true)
    apiClient
      .osApi("prodel")
      .get(`/api/v1/projects/${window.scopedProjectId}/resources/`)
      .then((response) => {
        if (!mounted.current) return
        //console.log(response.data)
        setData(response.data?.resources)
        setLoading(false)
      })
      .catch((error) => {
        if (!mounted.current) return
        setData(null)
        setLoading(false)
        setApiError(error.data)
        console.error(error.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  React.useEffect(() => {
    // If the panel is not opened, do not fetch data
    if (!opened) return
    fetchData()
  }, [fetchData, opened])

  const calculateResourceType = (resourceType, serviceType) => {
    //console.log("R-Type:" + resourceType, "Type:" + serviceType)
    let typeHref = undefined
    if (
      (resourceType === "default_security_group_rules" || resourceType === "security_groups") &&
      serviceType === "network"
    ) {
      typeHref = "/networking/widget/security-groups/"
    } else if (resourceType === "floating_ips" && serviceType === "network") {
      typeHref = "/networking/floating_ips/"
    } else if ((resourceType === "servers" || resourceType === "server_groups") && serviceType === "compute") {
      typeHref = "/compute/instances/"
    } else if (
      (resourceType === "load_balancer_listeners" || resourceType === "load_balancer_pools") &&
      serviceType === "load-balancer"
    ) {
      typeHref = "/lbaas2/?r=/loadbalancers"
    } else if ((resourceType === "recordsets" || resourceType === "zones") && serviceType === "dns") {
      typeHref = "/dns-service/zones"
    } else if (resourceType === "volume_snapshots" && serviceType === "block-storage") {
      typeHref = "/block-storage/?r=/snapshots"
    } else if (resourceType === "volumes" && serviceType === "block-storage") {
      typeHref = "/image/ng?r=/os-images/volumes"
    } else if (resourceType === "keppel_accounts" && serviceType === "keppel") {
      typeHref = "/keppel/#/accounts"
    } else if (resourceType === "manila_shares" && serviceType === "shared-file-system") {
      typeHref = "/shared-filesystem-storage/?r=/shares"
    } else if (resourceType === "manila_share_networks" && serviceType === "shared-file-system") {
      typeHref = "/shared-filesystem-storage/?r=/share-networks"
    } else if (resourceType === "manila_security_services" && serviceType === "shared-file-system") {
      typeHref = "/shared-filesystem-storage/?r=/security-services"
    } else if (resourceType === "manila_snapshots" && serviceType === "shared-file-system") {
      typeHref = "/shared-filesystem-storage/?r=/manila_snapshots"
    } else if (resourceType === "manila_replicas") {
      typeHref = "/shared-filesystem-storage/?r=/replicas"
    } else if (resourceType === "images" && serviceType === "image") {
      typeHref = "/image/ng?r=/os-images/available"
    } else if (
      (resourceType === "network_ports" ||
        resourceType === "routers" ||
        resourceType === "subnets" ||
        resourceType === "networks") &&
      serviceType === "network"
    ) {
      typeHref = "/networking/networks/external"
    } else if (resourceType === "object_store_containers" && serviceType === "object-store") {
      typeHref = "/object-storage/containers"
    } else if (resourceType === "key_manager_containers") {
      typeHref = "/keymanagerng/containers"
    } else if (resourceType === "key_manager_secrets") {
      typeHref = "/keymanagerng/secrets"
    } else if (resourceType === "load_balancers" && serviceType === "load-balancer") {
      typeHref = "/lbaas2/?r=/loadbalancers"
    } else if (resourceType === "cronus_nebula_aws" || resourceType === "cronus_nebula_int") {
      typeHref = "/email-service"
    } else if (
      (resourceType === "lyra_automations" && serviceType === "automation") ||
      (resourceType === "arc_agents" && serviceType === "arc")
    ) {
      typeHref = "/automation"
    } else if (resourceType === "kubernikus_clusters" && serviceType === "kubernikus") {
      typeHref = "/kubernetes"
    } else if (resourceType === "commitments" && serviceType === "resources") {
      typeHref = "/resources/v2/project"
    }

    if (!typeHref) return <div className="tw-text-gray-400">n/a</div>
    typeHref = `/_/${window.scopedProjectId}${typeHref}`
    return (
      <Icon color="jn-global-text" icon="openInNew" href={typeHref} target="_blank" title={`Jump to ${serviceType}`} />
    )
  }

  const checkProjectCanNotBeDeleted = () => {
    //return false
    if (loading) return true
    if (data?.length === 0) return false
    return true
  }

  return (
    <div>
      <Panel
        className="tw-z-[1050]"
        heading="Delete Project Resources Check"
        onClose={onClose}
        opened={opened}
        size="large"
      >
        <PanelBody>
          <ContentAreaToolbar className="tw-space-x-2">
            <div className="tw-flex tw-w-full">
              <SearchInput
                onChange={(e) => setSearchText(e.target.value)}
                onClear={() => setSearchText("")}
                variant="default"
              />
            </div>
            {loading && <Spinner />}
            <Button disabled={loading} onClick={fetchData} variant="primary">
              Refresh
            </Button>
            <DeleteConfirm
              onConfirm={() => {
                onConfirm()
              }}
              disabled={checkProjectCanNotBeDeleted()}
            />
            <Button
              href="https://documentation.global.cloud.sap/docs/customer/getting-started/tutorials/others/faq-delete-project/"
              target="blank"
              variant="default"
            >
              Help
            </Button>
          </ContentAreaToolbar>
          {data && !loading ? (
            <>
              {apiError && (
                <Message
                  onDismiss={function noRefCheck() {}}
                  text={`An error occurred: ${apiError.error.message}`}
                  variant="error"
                />
              )}
              {filteredData.length === 0 ? (
                <IntroBox text="No resources found. You can delete the Project." />
              ) : (
                <IntroBox
                  text={`Prodel Service found ${data.length} related objects for the current Project. You need to clean up these resources before you can delete the Project. Follow the Link on the end of each line to jump to the related service. Or click on the Help Button to get more information.`}
                />
              )}
              <Tabs onSelect={function noRefCheck() {}}>
                <TabList>
                  <Tab>Resources</Tab>
                  <Tab>Raw Data</Tab>
                </TabList>
                <TabPanel>
                  <>
                    {filteredData.map((entry, index) => (
                      <div key={index}>
                        <table width="100%">
                          <tbody>
                            <tr>
                              <td width="45%" title="Name or ID">
                                {entry.resource?.name || entry.resource?.id}
                              </td>
                              <td width="25%" title="Type">
                                {entry?.type}
                              </td>
                              <td width="20%" title="Service">
                                {entry?.service_type}
                              </td>
                              <td width="5%" title="Delete order">
                                {entry?.delete_order}
                              </td>
                              <td width="5%">{calculateResourceType(entry?.type, entry?.service_type)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </>
                </TabPanel>
                <TabPanel>
                  <JsonViewer toolbar theme="light" data={{ data }} showRoot={false} expanded={10} />
                </TabPanel>
              </Tabs>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
