import type { DetailSecurityGroup } from "../../../../types/instance"
import { InlineLoading } from "./InlineLoading"

interface SecurityGroupsTabProps {
  securityGroups: DetailSecurityGroup[]
  loading?: boolean
}

// Security Groups tab — name + id (+ project scope) and the rule strings,
// mirroring the legacy sec_groups table (rule strings are assembled by the BFF).
export function SecurityGroupsTab({ securityGroups, loading = false }: SecurityGroupsTabProps) {
  if (loading && securityGroups.length === 0) return <InlineLoading />

  return (
    <table className="table datatable">
      <tbody>
        {securityGroups.map((sg) => (
          <tr key={sg.id}>
            <th>
              {sg.name}
              <br />
              <div className="info-text">
                ID: {sg.id}
                {sg.project_name && (
                  <>
                    <br />
                    Project: {sg.project_name}
                  </>
                )}
              </div>
            </th>
            <td>
              {sg.rules.length === 0 ? (
                "No rules defined."
              ) : (
                <ul>
                  {sg.rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
