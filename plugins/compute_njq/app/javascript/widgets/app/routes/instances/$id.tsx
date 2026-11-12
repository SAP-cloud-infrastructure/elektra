import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router"
import { useInstancesQuery, useInstanceDetailQuery, useInstanceMetricsQuery } from "../../hooks/useInstanceQueries"
import { InstanceTable } from "./-components/InstanceTable"
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

// The detail view is a Bootstrap modal overlaid on the instance list, mirroring
// the legacy compute Show modal: the list stays rendered in the background and
// the modal sits on top. Closing navigates back to the plain list.
function InstanceShow() {
  const { id } = Route.useParams()
  const { tab } = Route.useSearch()
  const { apiClient } = useRouteContext({ from: Route.id })
  const navigate = useNavigate()

  // Keep the list visible behind the modal (served from cache populated by the
  // list route) so the background does not disappear while the modal is open.
  const { data: instances } = useInstancesQuery(apiClient)

  const detailQuery = useInstanceDetailQuery(apiClient, id)
  const metricsQuery = useInstanceMetricsQuery(apiClient, id)

  const close = () => navigate({ to: "/instances" })
  const setTab = (next: TabName) =>
    navigate({ to: "/instances/$id", params: { id }, search: { tab: next }, replace: true })

  return (
    <div>
      <InstanceTable instances={instances ?? []} />
      <InstanceModal
        detailQuery={detailQuery}
        metricsQuery={metricsQuery}
        onClose={close}
        activeTab={tab}
        onTabChange={setTab}
      />
    </div>
  )
}
