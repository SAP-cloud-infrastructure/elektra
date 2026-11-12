import type { UseQueryResult } from "@tanstack/react-query"
import { PrettyDate } from "lib/components/pretty_date"
import type { InstanceDetail, InstanceMetrics } from "../../../../types/instance"
import { humanize } from "./humanize"
import { GuestToolsRow } from "./GuestToolsRow"
import { SizingRows } from "./SizingRows"
import { InlineLoading } from "./InlineLoading"

interface InformationTabProps {
  instance: InstanceDetail
  metricsQuery: UseQueryResult<InstanceMetrics, Error>
  // True while the modal shows placeholder data from the list row and the full
  // detail is still loading; fields the list does not carry render a spinner.
  loading?: boolean
}

// Information tab — row order and labels mirror the legacy
// _item_details.html.haml Information table exactly.
export function InformationTab({ instance, metricsQuery, loading = false }: InformationTabProps) {
  const { status, fault_message } = instance

  return (
    <table className="table datatable">
      <tbody>
        <tr>
          <th>Name</th>
          <td>{instance.name}</td>
        </tr>
        <tr>
          <th>ID</th>
          <td>{instance.id}</td>
        </tr>
        <tr>
          <th>Status</th>
          {status.state === "error" ? (
            <td className="text-danger">
              <strong>
                Error
                {fault_message ? `: ${fault_message}` : ""}
              </strong>
            </td>
          ) : (
            <td>
              {status.transition && <span className="spinner me-1" role="status" aria-hidden="true" />}
              {humanize(status.transition || status.state)}
            </td>
          )}
        </tr>
        <tr>
          <th>Availability Zone</th>
          <td>{loading ? <InlineLoading /> : instance.availability_zone}</td>
        </tr>
        <tr>
          <th>Created</th>
          <td>{instance.created ? <PrettyDate date={instance.created} /> : loading ? <InlineLoading /> : null}</td>
        </tr>
        <tr>
          <th>Updated</th>
          <td>{instance.updated ? <PrettyDate date={instance.updated} /> : loading ? <InlineLoading /> : null}</td>
        </tr>
        {loading ? (
          <tr>
            <th>Host</th>
            <td>
              <InlineLoading />
            </td>
          </tr>
        ) : (
          instance.host && (
            <tr>
              <th>Host</th>
              <td>{instance.host}</td>
            </tr>
          )
        )}
        <tr>
          <th>Project</th>
          <td>
            {loading ? (
              <InlineLoading />
            ) : (
              <>
                {instance.project.name ?? instance.project.id ?? "N/A"}
                {!instance.project.same_scope && instance.project.id && (
                  <>
                    <br />
                    <span className="info-text">{instance.project.id}</span>
                  </>
                )}
              </>
            )}
          </td>
        </tr>
        <tr>
          <th>Tags</th>
          <td>
            {loading ? (
              <InlineLoading />
            ) : instance.tags.length === 0 ? (
              "none"
            ) : (
              <div className="u-flex-container u-flex-gap-small">
                {instance.tags.map((tag) => (
                  <span className="juno-badge juno-badge-info" key={tag}>
                    <i className="fa fa-tag" /> {tag}
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>
        <GuestToolsRow metricsQuery={metricsQuery} />
        <SizingRows metricsQuery={metricsQuery} />
      </tbody>
    </table>
  )
}
