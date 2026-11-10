import { StrictMode } from "react"
import { AppShellProvider, Message } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import { createAppRouter } from "./router"
import styles from "./styles.scss?inline"

const queryClient = new QueryClient()

interface AppProps {
  // Injected from the HAML `data-*` attributes via the widget loader.
  basepath: string
  region: string
  projectid: string
}

export default function App({ basepath, region, projectid }: AppProps) {
  const router = createAppRouter(basepath, region, projectid)

  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <StrictMode>
        <MessagesProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider
              basepath={basepath}
              router={router}
              defaultErrorComponent={({ error }) => (
                <Message variant="error" title="Something went wrong" text={error.message} />
              )}
            />
          </QueryClientProvider>
        </MessagesProvider>
      </StrictMode>
    </AppShellProvider>
  )
}
