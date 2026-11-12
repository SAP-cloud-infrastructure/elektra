import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { PrettyDate } from "lib/components/pretty_date"
import { SortableHeader, type SortState } from "lib/components/SortableHeader"
import { InfoTooltip } from "lib/components/InfoTooltip"
import type { Instance } from "../../../types/instance"
import { StatusPill } from "./StatusPill"
import { IpList } from "./IpList"
import { CopyableId } from "./CopyableId"

interface InstanceTableProps {
  instances: Instance[]
  // While true, render skeleton placeholder rows instead of data (initial load).
  isLoading?: boolean
}

// Names longer than this are truncated in the table; the full name is shown as
// a title tooltip (mirrors the legacy list's truncate(30), with a little more
// room in the wider React layout).
const NAME_MAX = 40

// Image/id values are truncated past this length with a tooltip carrying the
// full value.
const OS_MAX = 40

// Explains an image id that has no resolvable name: the image may be gone or
// just not visible to the current user.
const IMAGE_ID_HELP =
  "The image name could not be resolved. The image may have been deleted, or it " +
  "may not be visible to you (e.g. owned by another project or not shared)."

// Explains the dash: the server was not booted from an image at all.
const IMAGE_NONE_HELP = "This server has no image — it was booted directly from a volume (boot-from-volume)."

// Renders a possibly-long value truncated with an ellipsis, exposing the full
// value as a native title tooltip when truncated.
function Truncated({ value, max }: { value: string; max: number }) {
  const truncated = value.length > max
  return <span title={truncated ? value : undefined}>{truncated ? `${value.slice(0, max)}…` : value}</span>
}

// The OS / Size cell: two labelled rows — "OS" (the image) over "Size" (the
// flavor) — so the two values are clearly distinguished even when the image is
// a bare id or missing. Image resolution:
//  - resolved name  -> show it (truncated with tooltip)
//  - id but no name -> muted + monospace id; tooltip explains it is unresolved
//  - no id at all   -> muted "No image"; tooltip explains boot-from-volume
function OsSizeCell({
  image,
  flavor,
}: {
  image: { name: string | null; id: string | null }
  flavor: { name: string | null; id: string | null }
}) {
  return (
    <div className="os-size">
      <div className="os-size-row">
        <span className="os-size-label">OS</span>
        <ImageValue name={image.name} id={image.id} />
      </div>
      <div className="os-size-row">
        <span className="os-size-label">Size</span>
        <span className="instance-flavor">{flavor.name ?? flavor.id ?? "—"}</span>
      </div>
    </div>
  )
}

function ImageValue({ name, id }: { name: string | null; id: string | null }) {
  if (name) return <Truncated value={name} max={OS_MAX} />

  if (id) {
    return (
      <InfoTooltip content={IMAGE_ID_HELP} maxWidth="20rem">
        <span className="instance-image-id" title={id}>
          {id.length > 18 ? `${id.slice(0, 18)}…` : id}
        </span>
      </InfoTooltip>
    )
  }

  return (
    <InfoTooltip content={IMAGE_NONE_HELP} maxWidth="20rem">
      <span className="text-muted fst-italic">No image</span>
    </InfoTooltip>
  )
}

// A single grey placeholder bar used inside skeleton loading rows.
function SkeletonBar({ width = "80%", height }: { width?: string; height?: string }) {
  return <span className="instance-skeleton-bar" style={{ width, height }} />
}

// Skeleton loading rows shown while the first page of instances is loading.
// They mirror the table's column layout so the content appears to "fill in"
// instead of popping in after a bare spinner (same approach as the networking
// ports list).
function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <tbody data-testid="instances-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td>
            {/* Name line (full-size) over the smaller id line, matching the
                real cell layout so the skeleton doesn't look undersized. */}
            <SkeletonBar width="300px" height="1rem" />
            <br />
            <SkeletonBar width="9rem" height="0.7rem" />
          </td>
          <td>
            <SkeletonBar width="50%" height="1rem" />
          </td>
          <td>
            <SkeletonBar width="40%" height="1rem" />
          </td>
          <td>
            <SkeletonBar width="170px" height="1rem" />
          </td>
          <td>
            <SkeletonBar width="65%" height="1rem" />
            <br />
            <SkeletonBar width="40%" height="0.8rem" />
          </td>
          <td>
            <SkeletonBar width="55%" height="1rem" />
          </td>
          <td className="snug" />
        </tr>
      ))}
    </tbody>
  )
}

// The sortable value for an instance in a given column.
function sortValue(instance: Instance, column: string): string {
  switch (column) {
    case "name":
      return (instance.name || instance.id || "").toLowerCase()
    case "az":
      return (instance.availability_zone || "").toLowerCase()
    case "status":
      return (instance.status.state || "").toLowerCase()
    case "os":
      return (instance.image.name || instance.image.id || "").toLowerCase()
    case "created":
      // created is an ISO-8601 timestamp, so lexicographic order == chronological.
      return instance.created || ""
    default:
      return ""
  }
}

// Columns: Name (+ ID) · Status · IPs · OS / Size · AZ · Created at · (actions)
export function InstanceTable({ instances, isLoading = false }: InstanceTableProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" })

  const onSort = (column: string) => {
    setSort((prev) => {
      // Cycle: asc -> desc -> no sort (back to the original order), matching
      // the networking ports list behaviour.
      if (prev.column !== column) return { column, direction: "asc" }
      if (prev.direction === "asc") return { column, direction: "desc" }
      return { column: null, direction: "asc" }
    })
  }

  let rows = instances
  if (sort.column) {
    const dir = sort.direction === "asc" ? 1 : -1
    rows = [...instances].sort((a, b) => {
      const av = sortValue(a, sort.column as string)
      const bv = sortValue(b, sort.column as string)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }

  return (
    <table className="table instances">
      <thead>
        <tr>
          <SortableHeader label="Name" column="name" sort={sort} onSort={onSort} />
          <SortableHeader label="Status" column="status" sort={sort} onSort={onSort} />
          <SortableHeader label="AZ" column="az" sort={sort} onSort={onSort} tooltip="Availability Zone" />
          <th>IPs</th>
          <SortableHeader
            label="OS / Size"
            column="os"
            sort={sort}
            onSort={onSort}
            tooltip="Operating system image and flavor (size) of the server"
          />
          <SortableHeader label="Created at" column="created" sort={sort} onSort={onSort} />
          <th className="snug" />
        </tr>
      </thead>
      {isLoading ? (
        <SkeletonRows />
      ) : (
        <tbody>
          {rows.length === 0 ? (
            <tr data-empty="true">
              <td colSpan={7} role="status">
                No instances found.
              </td>
            </tr>
          ) : (
            rows.map((instance) => {
              const displayName = instance.name ?? instance.id
              const truncated = displayName.length > NAME_MAX
              return (
                <tr key={instance.id}>
                  <td>
                    <Link
                      to="/instances/$id"
                      params={{ id: instance.id }}
                      search={{ tab: "Information" }}
                      title={truncated ? displayName : undefined}
                    >
                      {truncated ? `${displayName.slice(0, NAME_MAX)}…` : displayName}
                    </Link>
                    <br />
                    <CopyableId id={instance.id} />
                  </td>
                  <td>
                    <StatusPill status={instance.status} />
                  </td>
                  <td>{instance.availability_zone ?? "—"}</td>
                  <td className="snug-nowrap">
                    <IpList ips={instance.ips} instanceId={instance.id} />
                  </td>
                  <td>
                    <OsSizeCell image={instance.image} flavor={instance.flavor} />
                  </td>
                  <td className="instance-created">
                    {instance.created ? <PrettyDate date={instance.created} /> : "—"}
                  </td>
                  <td className="snug" />
                </tr>
              )
            })
          )}
        </tbody>
      )}
    </table>
  )
}
