import React from "react"
import {
  Panel,
  PanelBody,
  Stack,
  Message,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"
import { useParams } from "react-router-dom"
import { getApiClient } from "./apiClient"
import { useHistory, useLocation } from "react-router-dom"
import Loading from "./Loading"
import ExpireDate from "./ExpireDate"

const Show = ({ userId }) => {
  const { id } = useParams()
  //console.log("userId", userId)
  //console.log("id", id)
  const location = useLocation()
  const history = useHistory()
  const [item, setItem] = React.useState({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [expired, setExpired] = React.useState(false)

  // fetch the items from the api
  React.useEffect(() => {
    getApiClient()
      .get(`users/${userId}/application_credentials/${id}`)
      .then((response) => {
        //console.log("item response", response.data.application_credential)
        setItem(response.data.application_credential)
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id])

  const close = () => {
    history.replace(location.pathname.replace(/\/[^/]+\/show$/, ""))
  }

  return (
    <div>
      <Panel opened={true} onClose={close} heading="Show Application Credentials">
        <PanelBody>
          <Stack direction="vertical" gap="3">
            {error && <Message variant="error" text={error} />}
            {isLoading && !error && !item ? (
              <Loading />
            ) : (
              <div>
                <DataGrid columns={2}>
                  <DataGridRow>
                    <DataGridHeadCell>Name</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">{!item.name ? "-" : item.name}</DataGridCell>
                  </DataGridRow>
                  <DataGridRow>
                    <DataGridHeadCell>ID</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">{item?.id}</DataGridCell>
                  </DataGridRow>
                  <DataGridRow>
                    <DataGridHeadCell>Description</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">{!item.description ? "-" : item.description} </DataGridCell>
                  </DataGridRow>
                  <DataGridRow>
                    <DataGridHeadCell>Roles</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">
                      {!item.roles ? "-" : item.roles.map((role) => role.name).join(", ")}
                    </DataGridCell>
                  </DataGridRow>
                  <DataGridRow>
                    <DataGridHeadCell>Unresticted</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">
                      {!item.unrestricted ? "No" : item.unrestricted ? "Yes" : "No"}
                    </DataGridCell>
                  </DataGridRow>
                  <DataGridRow>
                    <DataGridHeadCell>Expires at</DataGridHeadCell>
                    <DataGridCell className="tw-break-all">
                      <ExpireDate item={item} setExpired={setExpired} expired={expired}></ExpireDate>
                    </DataGridCell>
                  </DataGridRow>
                </DataGrid>
              </div>
            )}
          </Stack>
        </PanelBody>
      </Panel>
    </div>
  )
}

export default Show
