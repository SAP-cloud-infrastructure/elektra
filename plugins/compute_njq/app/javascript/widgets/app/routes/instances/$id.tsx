import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router"
import { useInstanceDetailQuery, useInstanceMetricsQuery } from "../../hooks/useInstanceQueries"
import { InstanceModal, TABS, type TabName } from "./-components/InstanceModal"

interface InstanceDetailSearch {
  tab: TabName
}

export const Route = createFileRoute("/instances/$id")({
  // The active detail tab lives in the URL (?tab=...), so links can deep-link
  // into a specific tab (e.g. the IP cell opens "IP Addresses"). Defaults to
  // "Information"; an unknown value falls back to it.
  validateSearch: (search: Record<string, unknown>): InstanceDetailSearch => {
    const tab = search.tab as TabName
    return { tab: TABS.includes(tab) ? tab : "Information" }
  },
  component: InstanceShow,
})

// Renders only the detail modal into the /instances layout's <Outlet/>, so the
// list behind it stays mounted (no re-mount, no scroll/filter reset). On a deep
// link the layout route still renders the list; the modal shows its own loading
// state until the detail arrives.
function InstanceShow() {
  const { id } = Route.useParams()
  const { tab } = Route.useSearch()
  const { apiClient } = useRouteContext({ from: Route.id })
  const navigate = useNavigate()

  const detailQuery = useInstanceDetailQuery(apiClient, id)
  const metricsQuery = useInstanceMetricsQuery(apiClient, id)

  const close = () => navigate({ to: "/instances" })
  const setTab = (next: TabName) =>
    navigate({ to: "/instances/$id", params: { id }, search: { tab: next }, replace: true })

  return (
    <InstanceModal
      detailQuery={detailQuery}
      metricsQuery={metricsQuery}
      onClose={close}
      activeTab={tab}
      onTabChange={setTab}
    />
  )
}
