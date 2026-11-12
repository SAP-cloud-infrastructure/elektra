import type { InstanceDetail } from "../../../../types/instance"
import { humanize } from "./humanize"
import { InlineLoading } from "./InlineLoading"

interface MetadataTabProps {
  metadata: InstanceDetail["metadata"]
  loading?: boolean
}

// Metadata tab — Image name / Image ID then each remaining metadata entry,
// mirroring the legacy metadata table.
export function MetadataTab({ metadata, loading = false }: MetadataTabProps) {
  return (
    <table className="table datatable">
      <tbody>
        <tr>
          <th>Image name</th>
          <td>{metadata.image_name ?? "-"}</td>
        </tr>
        {metadata.image_id && (
          <tr>
            <th>Image ID</th>
            <td>{metadata.image_id}</td>
          </tr>
        )}
        {metadata.extra.map((entry) => (
          <tr key={entry.key}>
            <th>{humanize(entry.key)}</th>
            <td>{entry.value ? entry.value : "N/A"}</td>
          </tr>
        ))}
        {loading && metadata.extra.length === 0 && (
          <tr>
            <th />
            <td>
              <InlineLoading />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
