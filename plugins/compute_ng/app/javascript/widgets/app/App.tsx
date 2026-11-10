import { StrictMode } from "react"
import { RouterProvider } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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
    <StrictMode>
      <style>{styles}</style>
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          basepath={basepath}
          router={router}
          defaultErrorComponent={({ error }) => (
            <div className="alert alert-danger" role="alert">
              <strong>Something went wrong.</strong>
              {error?.message && <span className="ms-1">{error.message}</span>}
            </div>
          )}
        />
      </QueryClientProvider>
    </StrictMode>
  )
}
