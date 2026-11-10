import { PrettyDate } from "lib/components/pretty_date"
import type { Instance } from "../../../types/instance"
import { StatusPill } from "./StatusPill"
import { IpList } from "./IpList"

interface InstanceTableProps {
  instances: Instance[]
}

// Column order and headers mirror the legacy compute instance list
// (plugins/compute/app/views/compute/instances/index.html.haml), so the new
// React list looks identical to the server-rendered one:
//   Name / AZ · Power state · IPs · OS / Size · Created at · (actions)
export function InstanceTable({ instances }: InstanceTableProps) {
  return (
    <table className="table instances">
      <thead>
        <tr>
          <th>Name / AZ</th>
          <th>Power state</th>
          <th>IPs</th>
          <th>OS / Size</th>
          <th>Created at</th>
          <th className="snug" />
        </tr>
      </thead>
      <tbody>
        {instances.length === 0 ? (
          <tr data-empty="true">
            <td colSpan={6} role="status">
              No instances found.
            </td>
          </tr>
        ) : (
          instances.map((instance) => (
            <tr key={instance.id}>
              <td>{instance.name ?? instance.id}</td>
              <td>
                <StatusPill status={instance.status} />
              </td>
              <td className="snug-nowrap">
                <IpList ips={instance.ips} />
              </td>
              <td>
                {instance.image.name ?? instance.image.id ?? "—"}
                <br />
                {instance.flavor.name ?? instance.flavor.id ?? "—"}
              </td>
              <td>{instance.created ? <PrettyDate date={instance.created} /> : "—"}</td>
              <td className="snug" />
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
