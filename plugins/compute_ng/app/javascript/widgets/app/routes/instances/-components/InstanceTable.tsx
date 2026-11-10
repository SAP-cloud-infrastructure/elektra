import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell } from "@cloudoperators/juno-ui-components"
import type { Instance } from "../../../types/instance"
import { StatusPill } from "./StatusPill"
import { IpList } from "./IpList"

interface InstanceTableProps {
  instances: Instance[]
}

const Header = () => (
  <DataGridRow>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Flavor</DataGridHeadCell>
    <DataGridHeadCell>Image</DataGridHeadCell>
    <DataGridHeadCell>IP Addresses</DataGridHeadCell>
  </DataGridRow>
)

export function InstanceTable({ instances }: InstanceTableProps) {
  if (instances.length === 0) {
    return (
      <DataGrid columns={5}>
        <Header />
        <DataGridRow>
          <DataGridCell>
            <span role="status">No instances found.</span>
          </DataGridCell>
        </DataGridRow>
      </DataGrid>
    )
  }

  return (
    <div className="datagrid-hover">
      <DataGrid columns={5}>
        <Header />
        {instances.map((instance) => (
          <DataGridRow key={instance.id}>
            <DataGridCell>{instance.name ?? instance.id}</DataGridCell>
            <DataGridCell>
              <StatusPill status={instance.status} />
            </DataGridCell>
            <DataGridCell>{instance.flavor.name ?? instance.flavor.id ?? "—"}</DataGridCell>
            <DataGridCell>{instance.image.name ?? instance.image.id ?? "—"}</DataGridCell>
            <DataGridCell>
              <IpList ips={instance.ips} />
            </DataGridCell>
          </DataGridRow>
        ))}
      </DataGrid>
    </div>
  )
}
