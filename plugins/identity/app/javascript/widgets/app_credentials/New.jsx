import React from "react"
import { Panel, PanelBody, Stack, Message, IntroBox } from "@cloudoperators/juno-ui-components"
import { useHistory, useLocation } from "react-router-dom"
import { getApiClient } from "./apiClient"
import { NewForm } from "./NewForm"
import { ResponseData } from "./ResponseData"
import { set } from "date-fns"

const NewAppCredentials = ({ userId, refreshList, setOverlay }) => {
  const location = useLocation()
  const history = useHistory()
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [responseData, setResponseData] = React.useState(null)

  const close = () => {
    history.replace(location.pathname.replace("/create", ""))
    setOverlay(false)
  }

  const handleSubmit = (formData) => {
    //console.log("formData", formData)
    if (!formData.name) {
      setError("Name are required.")
      return
    }
    setError(null)
    setIsLoading(true)
    getApiClient()
      .post(`users/${userId}/application_credentials`, { application_credential: formData })
      .then(({ data }) => {
        setResponseData(data.application_credential)
        refreshList()
        setOverlay(true)
      })
      .catch((error) => {
        setError(error?.data?.error?.error?.message || "An error occurred while creating the application credential.")
        console.error("Error creating application credential:", error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <Panel opened={true} onClose={close} heading="Create New Application Credentials">
      <PanelBody>
        <Stack direction="vertical" gap="3">
          <IntroBox text="When you create a new Application Credential, it will automatically inherit your current user roles. You can view your assigned roles in your profile at any time. After the Application Credential has been created, you can review the roles granted to it in the details view." />
          {error && <Message variant="error" text={error} />}
          {isLoading && <Message variant="info" text="Creating credential..." />}
          {responseData ? (
            <ResponseData appCredential={responseData} onConfirm={close} />
          ) : (
            <>
              <NewForm
                onSubmit={(formData) => {
                  // this will trigger the handleSubmit function with data from the form
                  handleSubmit(formData)
                }}
                onCancel={close}
                setError={setError}
              />
            </>
          )}
        </Stack>
      </PanelBody>
    </Panel>
  )
}
export default NewAppCredentials
