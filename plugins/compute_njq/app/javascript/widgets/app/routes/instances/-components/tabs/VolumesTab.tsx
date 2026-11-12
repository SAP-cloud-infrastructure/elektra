import type { DetailVolume } from "../../../../types/instance"
import { InlineLoading } from "./InlineLoading"

interface VolumesTabProps {
  volumes: DetailVolume[]
  loading?: boolean
}

// Volumes Attached tab — Volume Name / Device Name / Size, mirroring the legacy
// volumes table.
export function VolumesTab({ volumes, loading = false }: VolumesTabProps) {
  return (
    <table className="table datatable">
      <thead>
        <tr>
          <th>Volume Name</th>
          <th>Device Name</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
        {loading && volumes.length === 0 ? (
          <tr>
            <td colSpan={3}>
              <InlineLoading />
            </td>
          </tr>
        ) : volumes.length === 0 ? (
          <tr>
            <td colSpan={3}>No volumes attached.</td>
          </tr>
        ) : (
          volumes.map((vol) => (
            <tr key={vol.id}>
              <td>
                {vol.name}
                <br />
                <span className="info-text">{vol.id}</span>
              </td>
              <td>{vol.device}</td>
              <td>{vol.size} GB</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
