import { useEffect, useState } from "react"
import { QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../../../apiClient"
import { SearchableSelect } from "./SearchableSelect"
import { FlavorTypeTabs } from "./FlavorTypeTabs"
import { groupFlavorsByAccess, flavorLabel } from "./flavorGrouping"
import {
  FlavorTypeTab,
  FLAVOR_TYPE_TABS,
  FLAVOR_TYPE_LABELS,
  flavorInTab,
  tabHypervisor,
  groupImages,
  imageLabel,
} from "./imageGrouping"
import { rootDiskMode, rootDiskSizeError, DEFAULT_ROOT_DISK_SIZE } from "./rootDisk"
import { CreateInstancePayloadSchema, CreateInstancePayload } from "../../../types/createInstance"
import { useCreateInstanceMutation } from "../../../hooks/useCreateInstanceMutation"
import {
  useFlavorsQuery,
  useImagesQuery,
  useKeypairsQuery,
  useNetworksQuery,
  useSecurityGroupsQuery,
  useAvailabilityZonesQuery,
} from "../../../hooks/useFormOptionQueries"

interface Props {
  api: ComputeApi
  queryClient: QueryClient
  onSuccess: () => void
  onCancel?: () => void
}

const EMPTY = {
  name: "",
  flavor_id: "",
  image_id: "",
  keypair: "",
  availability_zone: "",
  network_id: "",
  security_groups: [] as string[],
  user_data: "",
}

export function CreateInstanceForm({ api, queryClient, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState(EMPTY)
  // A field's query only runs once its dropdown has been opened (lazy).
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [flavorType, setFlavorType] = useState<FlavorTypeTab | null>(null)
  const [customRootDisk, setCustomRootDisk] = useState(false)
  const [rootDiskSize, setRootDiskSize] = useState("")

  const set = (key: keyof typeof EMPTY, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }))
  const open = (key: string) => setOpened((o) => ({ ...o, [key]: true }))

  // The flavor list drives the type tabs, so it must load as soon as the dialog
  // opens (not lazily on dropdown open like the other fields).
  const flavors = useFlavorsQuery(api, { enabled: true })
  const images = useImagesQuery(api, { enabled: !!opened.image })
  const keypairs = useKeypairsQuery(api, { enabled: !!opened.keypair })
  const networks = useNetworksQuery(api, { enabled: !!opened.network })
  const securityGroups = useSecurityGroupsQuery(api, { enabled: !!opened.secgroup })
  const azs = useAvailabilityZonesQuery(api, { enabled: !!opened.az })

  // Type-first selection: a hypervisor type narrows both the flavor list and the
  // coupled image list. Only tabs with at least one flavor are offered.
  const allFlavors = flavors.data ?? []
  const availableTabs = FLAVOR_TYPE_TABS.filter((t) => allFlavors.some((f) => flavorInTab(f, t)))
  const flavorsInType = flavorType ? allFlavors.filter((f) => flavorInTab(f, flavorType)) : []
  const hv = flavorType ? tabHypervisor(flavorType) : null

  const selectedFlavor = allFlavors.find((f) => f.id === form.flavor_id)
  const mode = rootDiskMode(selectedFlavor)

  // Reconcile the root-disk state whenever the flavor changes: a disk-less
  // flavor forces the disk on with a prefilled size; otherwise reset it.
  useEffect(() => {
    if (mode === "forced") {
      setCustomRootDisk(true)
      setRootDiskSize((prev) => (prev === "" ? String(DEFAULT_ROOT_DISK_SIZE) : prev))
    } else {
      setCustomRootDisk(false)
      setRootDiskSize("")
    }
  }, [form.flavor_id, mode])

  // Switching type invalidates the picked flavor (and thus the image), which may
  // belong to a different type.
  const onTypeChange = (tab: FlavorTypeTab) => {
    setFlavorType(tab)
    set("flavor_id", "")
    set("image_id", "")
  }

  // Switching flavor invalidates a previously picked image (hypervisor coupling).
  const onFlavorChange = (value: string) => {
    set("flavor_id", value)
    set("image_id", "")
  }

  const rootDiskActive = mode === "forced" || (mode === "optional" && customRootDisk)
  const sizeError = rootDiskActive ? rootDiskSizeError(rootDiskSize) : undefined

  const mutation = useCreateInstanceMutation(api, queryClient)

  const parsed = CreateInstancePayloadSchema.safeParse(form)
  const nameError =
    form.name !== "" && !parsed.success ? parsed.error.issues.find((i) => i.path[0] === "name")?.message : undefined

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.success || sizeError) return
    const payload: CreateInstancePayload = {
      ...parsed.data,
      custom_root_disk: rootDiskActive,
      custom_root_disk_size: rootDiskActive ? Number(rootDiskSize) : undefined,
    }
    mutation.mutate(payload, { onSuccess })
  }

  return (
    <form onSubmit={submit}>
      {mutation.isError && (
        <div className="alert alert-danger" role="alert">
          {mutation.error?.message ?? "Failed to create the instance."}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Name</label>
        <input
          type="text"
          className={`form-control ${nameError ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {nameError && <div className="invalid-feedback">{nameError}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Flavor Type</label>
        <FlavorTypeTabs value={flavorType} onChange={onTypeChange} availableTabs={availableTabs} />
      </div>

      {flavorType && (
        <div className="mb-3">
          <label className="form-label">Flavor</label>
          <SearchableSelect
            options={flavorsInType}
            value={form.flavor_id || null}
            onChange={onFlavorChange}
            getLabel={flavorLabel}
            getValue={(f) => f.id}
            getGroups={groupFlavorsByAccess}
            isLoading={flavors.isLoading}
            placeholder="Select a flavor…"
            emptyMessage="No flavors available"
          />
        </div>
      )}

      {form.flavor_id && (
        <div className="mb-3" onClick={() => open("image")}>
          <label className="form-label">Image</label>
          <SearchableSelect
            options={images.data?.images ?? []}
            value={form.image_id || null}
            onChange={(v) => set("image_id", v)}
            getLabel={imageLabel}
            getValue={(i) => i.id}
            getGroups={(imgs) => groupImages(imgs, hv)}
            isLoading={images.isLoading}
            placeholder="Select an image…"
            emptyMessage="No images found"
          />
          <div className="form-text">
            {flavorType === "other"
              ? "All images are shown; this flavor type has no hypervisor restriction."
              : `Images for ${FLAVOR_TYPE_LABELS[flavorType!]} and images without a hypervisor restriction (these run on any hypervisor).`}
          </div>
        </div>
      )}

      {mode !== "hidden" && (
        <div className="mb-3">
          {mode === "optional" && (
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="custom-root-disk"
                checked={customRootDisk}
                onChange={(e) => setCustomRootDisk(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="custom-root-disk">
                Custom root disk
              </label>
            </div>
          )}
          {rootDiskActive && (
            <>
              <label className="form-label">Custom Root Disk Size in GB</label>
              <input
                type="number"
                className={`form-control ${sizeError ? "is-invalid" : ""}`}
                value={rootDiskSize}
                onChange={(e) => setRootDiskSize(e.target.value)}
              />
              {sizeError && <div className="invalid-feedback">{sizeError}</div>}
            </>
          )}
        </div>
      )}

      <div className="mb-3" onClick={() => open("keypair")}>
        <label className="form-label">Key Pair</label>
        <SearchableSelect
          options={keypairs.data ?? []}
          value={form.keypair || null}
          onChange={(v) => set("keypair", v)}
          getLabel={(k) => k.name}
          getValue={(k) => k.name}
          isLoading={keypairs.isLoading}
          placeholder="Select a key pair…"
          emptyMessage="No key pairs available"
        />
      </div>

      <div className="mb-3" onClick={() => open("network")}>
        <label className="form-label">Network</label>
        <SearchableSelect
          options={networks.data ?? []}
          value={form.network_id || null}
          onChange={(v) => set("network_id", v)}
          getLabel={(n) => n.name ?? n.id}
          getValue={(n) => n.id}
          isLoading={networks.isLoading}
          placeholder="Select a network…"
          emptyMessage="No networks available"
        />
      </div>

      <div className="mb-3" onClick={() => open("secgroup")}>
        <label className="form-label">Security Groups</label>
        <select
          multiple
          className="form-control"
          value={form.security_groups}
          onChange={(e) =>
            set(
              "security_groups",
              Array.from(e.target.selectedOptions, (o) => o.value)
            )
          }
        >
          {(securityGroups.data ?? []).map((sg) => (
            <option key={sg.id} value={sg.name}>
              {sg.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3" onClick={() => open("az")}>
        <label className="form-label">Availability Zone</label>
        <SearchableSelect
          options={azs.data ?? []}
          value={form.availability_zone || null}
          onChange={(v) => set("availability_zone", v)}
          getLabel={(z) => z.name}
          getValue={(z) => z.name}
          isLoading={azs.isLoading}
          placeholder="Any availability zone…"
          emptyMessage="No availability zones"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">User Data</label>
        <textarea
          className="form-control"
          rows={4}
          value={form.user_data}
          onChange={(e) => set("user_data", e.target.value)}
        />
      </div>

      <div className="d-flex gap-2">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!parsed.success || !!sizeError || mutation.isPending}
        >
          {mutation.isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  )
}
