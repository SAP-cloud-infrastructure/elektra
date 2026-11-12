import { InlineLoading } from "./InlineLoading"

interface KeyPairsTabProps {
  keyName: string | null
  loading?: boolean
}

// Key Pairs tab — single Keypair row, mirroring the legacy table.
export function KeyPairsTab({ keyName, loading = false }: KeyPairsTabProps) {
  return (
    <table className="table datatable">
      <tbody>
        <tr>
          <th>Keypair</th>
          <td>{loading && !keyName ? <InlineLoading /> : keyName ? keyName : "No keypair"}</td>
        </tr>
      </tbody>
    </table>
  )
}
