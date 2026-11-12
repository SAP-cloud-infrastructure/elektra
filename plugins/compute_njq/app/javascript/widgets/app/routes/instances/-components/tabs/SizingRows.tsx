import type { UseQueryResult } from "@tanstack/react-query"
import type { InstanceMetrics } from "../../../../types/instance"

interface RowProps {
  metricsQuery: UseQueryResult<InstanceMetrics, Error>
}

// Sizing recommendation rows (vCPU + Memory) — mirrors the legacy async states.
// A null recommendation means current sizing is OK; a value is a recommendation.
export function SizingRows({ metricsQuery }: RowProps) {
  const { data, isLoading, isError, error } = metricsQuery

  return (
    <>
      <tr>
        <th>Sizing recommendation</th>
        <td>
          {isLoading && <span className="spinner" role="status" aria-hidden="true" />}
          {isError && (
            <span className="text-danger">
              <i className="fa fa-exclamation-triangle" /> Problem to get cpu recommendation: {error?.message}
            </span>
          )}
          {data &&
            (data.cpu_recommendation === null ? (
              <span className="text-success">
                <i className="fa fa-microchip" /> vCPU Sizing is OK
              </span>
            ) : (
              <span className="text-info">
                <i className="fa fa-microchip" /> vCPUs {"->"} {data.cpu_recommendation}
              </span>
            ))}
        </td>
      </tr>
      <tr>
        <th style={{ borderTop: 0 }} />
        <td style={{ borderTop: 0, paddingTop: 0 }}>
          {isLoading && <span className="spinner" role="status" aria-hidden="true" />}
          {isError && (
            <span className="text-danger">
              <i className="fa fa-exclamation-triangle" /> Problem to get memory recommendation: {error?.message}
            </span>
          )}
          {data &&
            (data.memory_recommendation === null ? (
              <span className="text-success">
                <i className="fa fa-database" /> Memory Sizing is OK
              </span>
            ) : (
              <span className="text-info">
                <i className="fa fa-database" /> Memory {"->"} {data.memory_recommendation} GB
              </span>
            ))}
        </td>
      </tr>
    </>
  )
}
