import type { UseQueryResult } from "@tanstack/react-query"
import type { InstanceMetrics } from "../../../../types/instance"

const VM_TOOLS_DOC = "https://documentation.global.cloud.sap/docs/customer/compute/os-image/vmware-vm-tools/"

interface RowProps {
  metricsQuery: UseQueryResult<InstanceMetrics, Error>
}

// VMware Guest Tools row — mirrors the legacy async states: loading spinner,
// not found, outdated (with versions), up to date, and error.
export function GuestToolsRow({ metricsQuery }: RowProps) {
  const { data, isLoading, isError, error } = metricsQuery

  return (
    <tr>
      <th>VMware Guest Tools</th>
      <td id="guest_tools">
        {isLoading && <span className="spinner" role="status" aria-hidden="true" />}

        {isError && (
          <span className="text-danger">
            <i className="fa fa-exclamation-triangle" /> Problem to get guest tools version: {error?.message}
          </span>
        )}

        {data && <GuestToolsContent metrics={data} />}
      </td>
    </tr>
  )
}

function GuestToolsContent({ metrics }: { metrics: InstanceMetrics }) {
  const gt = metrics.guest_tools

  if (!gt || gt.state === "not_found") {
    return (
      <span>
        <span className="text-warning">
          <i className="fa fa-exclamation-triangle" /> not found {"->"}
        </span>{" "}
        <a href={VM_TOOLS_DOC} target="_blank" rel="noreferrer">
          how to install
        </a>
      </span>
    )
  }

  if (gt.state === "outdated") {
    return (
      <span>
        <span className="text-warning">
          <i className="fa fa-wrench" /> outdated {"->"}
        </span>{" "}
        <a href={VM_TOOLS_DOC} target="_blank" rel="noreferrer">
          how to update
        </a>
        <div className="small">
          ( Installed version: {gt.installed} Target version: {gt.target} )
        </div>
      </span>
    )
  }

  return (
    <span>
      <span className="text-success">
        <i className="fa fa-check" /> up to date
      </span>
      <div className="small">( Installed version: {gt.installed} )</div>
    </span>
  )
}
