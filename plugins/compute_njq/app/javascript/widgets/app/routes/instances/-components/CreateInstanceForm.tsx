import { useEffect, useRef, useState, type ReactNode } from "react"
import { QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../../../apiClient"
import { SearchableSelect } from "./SearchableSelect"
import { MultiSelect } from "lib/components/MultiSelect"
import { FlavorTypeTabs } from "./FlavorTypeTabs"
import { groupFlavorsByAccess, flavorLabel } from "./flavorGrouping"
import { groupSecurityGroupsByProject } from "./securityGroupGrouping"
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
  // The submit/cancel controls live in the modal footer (outside the <form>),
  // so the form reports its state up and the footer drives it via `form=`.
  formId?: string
  onStatusChange?: (status: { canSubmit: boolean; isPending: boolean }) => void
}

// Horizontal form row mirroring the legacy compute create form (SimpleForm
// :horizontal_form wrapper): a right-aligned label in a col-sm-4 column and the
// field in a col-sm-8 column. Required fields get the same
// `<abbr title="required">*</abbr>` marker (native tooltip) the legacy form
// renders. The right-alignment comes from the global
// `.form-horizontal .col-form-label` rule, so the <form> must carry the
// `form-horizontal` class.
function FormRow({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="row mb-3">
      <label className="col-sm-4 col-form-label" htmlFor={htmlFor}>
        {required && <abbr title="required">*</abbr>} {label}
      </label>
      <div className="col-sm-8">
        <div className="input-wrapper">{children}</div>
        {error && <span className="invalid-feedback d-block">{error}</span>}
        {hint && (
          <p className="form-text">
            {/* A textual hint gets the legacy info-circle marker; a node hint
                (e.g. an inline loader) is rendered as-is. */}
            {typeof hint === "string" && <i className="fa fa-info-circle" />}
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

// A subtle group separator: extra vertical space between field blocks, with no
// heading or divider line — just enough breathing room to make the three
// logical groups (compute/placement, access/networking, advanced) scannable
// without the weight of section headers or rules.
function SectionGap() {
  return <div className="create-instance-section-gap" aria-hidden="true" />
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

export function CreateInstanceForm({ api, queryClient, onSuccess, onCancel, formId, onStatusChange }: Props) {
  const [form, setForm] = useState(EMPTY)
  // A field's query only runs once its dropdown has been opened (lazy).
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [flavorType, setFlavorType] = useState<FlavorTypeTab | null>(null)
  const [customRootDisk, setCustomRootDisk] = useState(false)
  const [rootDiskSize, setRootDiskSize] = useState("")

  // Focus the Name field when the dialog opens, so the user can start typing
  // immediately (mirrors the legacy form's autofocus).
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const set = (key: keyof typeof EMPTY, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }))
  const open = (key: string) => setOpened((o) => ({ ...o, [key]: true }))

  // The flavor list drives the type tabs, so it must load as soon as the dialog
  // opens (not lazily on dropdown open like the other fields).
  const flavors = useFlavorsQuery(api, { enabled: true })
  const images = useImagesQuery(api, { enabled: !!opened.image })
  const keypairs = useKeypairsQuery(api, { enabled: !!opened.keypair })
  const networks = useNetworksQuery(api, { enabled: !!opened.network })
  // Lazy like the other dropdown fields: the MultiSelect fires onOpen on first
  // open, which flips `opened.secgroup` and enables the query.
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

  // Report the submit-ability + pending state up so the modal footer (which
  // owns the buttons) can enable/disable the primary action and show progress.
  const canSubmit = parsed.success && !sizeError
  useEffect(() => {
    onStatusChange?.({ canSubmit, isPending: mutation.isPending })
  }, [canSubmit, mutation.isPending, onStatusChange])

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
    <form id={formId} className="form-horizontal" onSubmit={submit}>
      {mutation.isError && (
        <div className="alert alert-danger" role="alert">
          {mutation.error?.message ?? "Failed to create the instance."}
        </div>
      )}

      <FormRow
        label="Name"
        htmlFor="ci-name"
        required
        error={nameError}
        hint="The name must not end with a dot followed by a number."
      >
        <input
          id="ci-name"
          ref={nameRef}
          type="text"
          className={`form-control ${nameError ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </FormRow>

      <SectionGap />

      <FormRow label="Flavor Type" required>
        <FlavorTypeTabs value={flavorType} onChange={onTypeChange} availableTabs={availableTabs} />
      </FormRow>

      {flavorType && (
        <FormRow label="Flavor" required>
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
        </FormRow>
      )}

      {form.flavor_id && (
        <div onClick={() => open("image")}>
          <FormRow
            label="Image"
            required
            hint={
              flavorType === "other"
                ? "All images are shown; this flavor type has no hypervisor restriction."
                : `Images for ${FLAVOR_TYPE_LABELS[flavorType!]} and images without a hypervisor restriction (these run on any hypervisor).`
            }
          >
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
          </FormRow>
        </div>
      )}

      {mode === "optional" && (
        <FormRow label="Custom Root Disk">
          <div className="form-check">
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
        </FormRow>
      )}

      {rootDiskActive && (
        <FormRow label="Custom Root Disk Size in GB" htmlFor="ci-root-disk-size" required error={sizeError}>
          <input
            id="ci-root-disk-size"
            type="number"
            className={`form-control ${sizeError ? "is-invalid" : ""}`}
            value={rootDiskSize}
            onChange={(e) => setRootDiskSize(e.target.value)}
          />
        </FormRow>
      )}

      <div onClick={() => open("az")}>
        <FormRow label="Availability Zone">
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
        </FormRow>
      </div>

      <SectionGap />

      <div onClick={() => open("keypair")}>
        <FormRow label="Key Pair" required>
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
        </FormRow>
      </div>

      <div onClick={() => open("network")}>
        <FormRow label="Network" required>
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
        </FormRow>
      </div>

      <FormRow label="Security Groups">
        <MultiSelect
          options={securityGroups.data ?? []}
          value={form.security_groups}
          onChange={(v) => set("security_groups", v)}
          getLabel={(sg) => sg.name}
          getValue={(sg) => sg.name}
          getGroups={groupSecurityGroupsByProject}
          onOpen={() => open("secgroup")}
          isLoading={securityGroups.isLoading}
          placeholder="Select security groups…"
          emptyMessage="No security groups available"
        />
      </FormRow>

      <SectionGap />

      <FormRow label="User Data" htmlFor="ci-user-data">
        <textarea
          id="ci-user-data"
          className="form-control"
          rows={4}
          value={form.user_data}
          onChange={(e) => set("user_data", e.target.value)}
        />
      </FormRow>

      {/* In modal mode (formId set) the buttons live in the modal footer and
          drive this form via the `form=` attribute; standalone, the form keeps
          its own footer so it stays usable on its own. */}
      {!formId && (
        <div className="d-flex justify-content-end gap-2">
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
      )}
    </form>
  )
}
