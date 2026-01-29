import React from "react"
import { AppShell, AppShellProvider } from "@cloudoperators/juno-ui-components"
import StoreProvider, { useAuthActions, useGlobalsActions } from "./components/StoreProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AppContent from "./AppContent"
import styles from "./styles.scss?inline"

/* IMPORTANT: Replace this with your app's name */
const URL_STATE_KEY = "maillog"
/* --------------------------- */

const App = ({ props }) => {
  const { setEndpoint, setUrlStateKey, setEmbedded } = useGlobalsActions()
  const { setAuthData } = useAuthActions()

  if (props.endpoint) {
    setEndpoint(props.endpoint)
  }
  if (props.project) {
    setAuthData({ project: props.project })
  }
  React.useEffect(() => {
    let timer
    const getToken = () => {
      window
        ._getCurrentToken()
        .then((token) => {
          const authToken = token.authToken
          // can also take project id from token.project.id
          if (!props.project) {
            setAuthData({ token: authToken, project: token.project.id })
            return
          }
          setAuthData({ token: authToken, project: props.project })

          // Calculate the duration until the token expires in milliseconds
          const expiresInMs = new Date(token.expires_at).getTime() - new Date().getTime()

          if (expiresInMs > 60000) {
            // Set the timeout to the duration until the token expires, subtracting some buffer time
            timer = setTimeout(getToken, expiresInMs - 60000) // Refresh 1 minute before expiry
          } else {
            // If the token is very close to expiration or already expired, retry sooner
            timer = setTimeout(getToken, 10000) // Retry after 10 seconds
          }
        })
        .catch((error) => {
          // Retry after a short delay in case of error
          timer = setTimeout(getToken, 60000) // Retry after 1 minute
        })
    }
    getToken()

    return () => clearTimeout(timer)
  }, [setAuthData])

  // Create query client which it can be used from overall in the app
  // set default endpoint to fetch data
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        meta: {
          endpoint: props.endpoint || props.currentHost || "",
        },
      },
    },
  })

  React.useEffect(() => {
    setEmbedded(props?.embedded === true || props?.embedded === "true")
  }, [props])

  // on app initial load save Endpoint and URL_STATE_KEY so it can be
  // used from overall in the application
  React.useEffect(() => {
    // set to empty string to fetch local test data in dev mode
    setUrlStateKey(URL_STATE_KEY)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell pageHeader="Converged Cloud | Maillog" embedded={true}>
        <AppContent props={props} />
      </AppShell>
    </QueryClientProvider>
  )
}

const StyledApp = (props) => {
  return (
    <AppShellProvider theme={`${props.theme ? props.theme : "theme-light"}`}>
      {/* load styles inside the shadow dom */}

      <style>{styles.toString()}</style>
      <StoreProvider>
        {/* <GetToken/> */}
        <App props={props} />
      </StoreProvider>
    </AppShellProvider>
  )
}

export default StyledApp
