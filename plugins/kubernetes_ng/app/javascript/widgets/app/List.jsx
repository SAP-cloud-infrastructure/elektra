import React, { useEffect, useState } from "react"
import apiClient from "./apiClient"
import { DataGrid, DataGridRow, DataGridCell, DataGridHeadCell, Message } from "@cloudoperators/juno-ui-components"
import Loading from "./Loading"
import { IntroBox } from "@cloudoperators/juno-ui-components"

const AppCredentialsList = () => {
  const [clusters, setClusters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = React.useState(null)

  // fetch the clusters from the api
  useEffect(() => {
    apiClient
      .get(`kubernetes-ng/api/clusters/`)
      .then((response) => {
        console.log("clusters", response.data)
        setClusters(response.data)
      })
      .catch((error) => {
        console.error("Error fetching clusters:", error)
        setError(error?.data?.error?.error?.message || "An error occurred while fetching the clusters.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleExpanded = (uid) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(uid)) {
      newExpanded.delete(uid)
    } else {
      newExpanded.add(uid)
    }
    setExpandedRows(newExpanded)
  }

  const truncateText = (text, maxLength = 30) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) : text
  }

  return (
    <div>
      <IntroBox text="This is a list of all clusters." />
      {error && <Message variant="error" text={error} />}
      {isLoading || !clusters ? (
        <Loading />
      ) : (
        <div>
          {!clusters ? (
            <DataGridRow>
              <DataGridCell colSpan={6}>No Clusters found. Create a new one 🚀</DataGridCell>
            </DataGridRow>
          ) : (
            <DataGrid columns={6} minContentColumns={[6]}>
              <DataGridRow>
                <DataGridHeadCell>Name</DataGridHeadCell>
                <DataGridHeadCell>Status</DataGridHeadCell>
                <DataGridHeadCell>Infrastructure</DataGridHeadCell>
                <DataGridHeadCell>Version</DataGridHeadCell>
                <DataGridHeadCell>Secret Binding Name</DataGridHeadCell>
                <DataGridHeadCell>Description</DataGridHeadCell>
              </DataGridRow>
              {clusters.map((cluster) => {
                const description = cluster.stateDetails?.description || ""
                const isExpanded = expandedRows.has(cluster.uid)
                const shouldTruncate = description.length > 30

                return (
                  <DataGridRow key={cluster.uid}>
                    <DataGridCell>{cluster.name || "-"}</DataGridCell>
                    <DataGridCell>{cluster.status || "-"}</DataGridCell>
                    <DataGridCell>{cluster.infrastructure || "-"}</DataGridCell>
                    <DataGridCell>{cluster.version || "-"}</DataGridCell>
                    <DataGridCell>{cluster.secretBindingName || "-"}</DataGridCell>
                    <DataGridCell>
                      <div>
                        {isExpanded ? description || "-" : truncateText(description) || "-"}
                        {shouldTruncate && (
                          <button onClick={() => toggleExpanded(cluster.uid)}>
                            {isExpanded ? " Show less" : "..."}
                          </button>
                        )}
                      </div>
                    </DataGridCell>
                  </DataGridRow>
                )
              })}
            </DataGrid>
          )}
        </div>
      )}
    </div>
  )
}

export default AppCredentialsList
