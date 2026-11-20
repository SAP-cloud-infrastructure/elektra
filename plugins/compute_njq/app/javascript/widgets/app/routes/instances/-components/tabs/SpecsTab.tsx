import type { InstanceDetail } from "../../../../types/instance"
import { InlineLoading } from "./InlineLoading"

interface SpecsTabProps {
  specs: InstanceDetail["specs"]
  loading?: boolean
}

// Specs tab — Flavor / RAM / VCPUs / Root Disk, mirroring the legacy table.
export function SpecsTab({ specs, loading = false }: SpecsTabProps) {
  if (!specs) return loading ? <InlineLoading /> : <>No instance specifications</>

  return (
    <table className="table datatable">
      <tbody>
        <tr>
          <th>Flavor</th>
          <td>
            {specs.flavor === null && loading ? (
              <InlineLoading />
            ) : (
              <>
                {specs.flavor}
                {/* Hypervisor family appended in parentheses rather than its own
                    row; omitted when unknown (null) so there is no empty "()". */}
                {specs.hypervisor_type && ` (${specs.hypervisor_type})`}
              </>
            )}
          </td>
        </tr>
        <tr>
          <th>RAM</th>
          <td>{specs.ram === null && loading ? <InlineLoading /> : `${specs.ram}MB`}</td>
        </tr>
        <tr>
          <th>VCPUs</th>
          <td>{specs.vcpus === null && loading ? <InlineLoading /> : `${specs.vcpus} VCPU`}</td>
        </tr>
        <tr>
          <th>Root Disk</th>
          <td>
            {specs.root_disk_size === null && loading ? (
              <InlineLoading />
            ) : (
              <>
                {specs.root_disk_size} GB
                <p>
                  <small>{specs.root_disk_device}</small>
                </p>
              </>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
