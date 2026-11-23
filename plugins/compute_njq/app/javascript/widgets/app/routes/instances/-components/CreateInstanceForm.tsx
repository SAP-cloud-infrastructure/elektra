import { useEffect, useRef, useState } from "react"
import { QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../../../apiClient"
import { SearchableSelect } from "./SearchableSelect"
import { MultiSelect } from "lib/components/MultiSelect"
import { FormRow, SectionGap } from "./FormRow"
import { FlavorTypeTabs } from "./FlavorTypeTabs"
import { groupFlavorsByAccess, flavorLabel, flavorSizeFacets } from "./flavorGrouping"
import { groupSecurityGroupsByProject } from "./securityGroupGrouping"
import { FlavorTypeTab, FLAVOR_TYPE_TABS, FLAVOR_TYPE_LABELS, flavorInTab, tabHypervisor } from "./imageGrouping"
import {
  bootSourceOptions,
  groupBootSources,
  bootSourceLabel,
  bootSourceValue,
  isVolumeId,
  fitsFlavorFacet,
} from "./bootSource"
import { osFamilyFacets } from "./osFamily"
import { rootDiskMode, rootDiskSizeError, volumeTypeRequired, DEFAULT_ROOT_DISK_SIZE } from "./rootDisk"
import { CreateInstancePayloadSchema, CreateInstancePayload } from "../../../types/createInstance"
import { useCreateInstanceMutation } from "../../../hooks/useCreateInstanceMutation"
import {
  useFlavorsQuery,
  useImagesQuery,
  useKeypairsQuery,
  useNetworksQuery,
  useSubnetsQuery,
  useSecurityGroupsQuery,
  useAvailabilityZonesQuery,
  useVolumeTypesQuery,
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
  // The domain/project URL prefix (e.g. "/monsoon3/cc-demo"), used to build
  // cross-plugin call-to-action links when a required list (networks, key pairs)
  // is empty. Optional so the form still works without it (links are omitted).
  scopePrefix?: string
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
  subnet_id: "",
  fixed_ip: "",
}

export function CreateInstanceForm({
  api,
  queryClient,
  onSuccess,
  onCancel,
  formId,
  onStatusChange,
  scopePrefix,
}: Props) {
  const [form, setForm] = useState(EMPTY)
  // A field's query only runs once its dropdown has been opened (lazy).
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [flavorType, setFlavorType] = useState<FlavorTypeTab | null>(null)
  const [customRootDisk, setCustomRootDisk] = useState(false)
  const [rootDiskSize, setRootDiskSize] = useState("")
  const [volumeType, setVolumeType] = useState("")
  const [showAdvancedNetwork, setShowAdvancedNetwork] = useState(false)

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
  // Eager: an empty key pair / network list drives the prerequisite info banner
  // at the top of the form, which must appear without first opening the dropdown.
  const keypairs = useKeypairsQuery(api, { enabled: true })
  const networks = useNetworksQuery(api, { enabled: true })
  // Subnets back the advanced network options; load them only once that section
  // is opened. The whole list is fetched and filtered client-side by network.
  const subnets = useSubnetsQuery(api, { enabled: showAdvancedNetwork })
  // Eager: the "default" security group is preselected on open, which requires
  // the list to be present without waiting for the dropdown to be opened. The
  // list is small, so the upfront request is cheap.
  const securityGroups = useSecurityGroupsQuery(api, { enabled: true })
  const azs = useAvailabilityZonesQuery(api, { enabled: !!opened.az })

  // Type-first selection: a hypervisor type narrows both the flavor list and the
  // coupled image list. Only tabs with at least one flavor are offered.
  const allFlavors = flavors.data ?? []
  const availableTabs = FLAVOR_TYPE_TABS.filter((t) => allFlavors.some((f) => flavorInTab(f, t)))
  const flavorsInType = flavorType ? allFlavors.filter((f) => flavorInTab(f, flavorType)) : []
  const hv = flavorType ? tabHypervisor(flavorType) : null

  const selectedFlavor = allFlavors.find((f) => f.id === form.flavor_id)
  const mode = rootDiskMode(selectedFlavor)
  // The combined boot-source list (images + matching bootable volumes).
  const bootVolumes = images.data?.volumes ?? []
  const bootSources = bootSourceOptions(images.data?.images ?? [], bootVolumes, hv)
  // Root disk available to boot an image from: the custom root-disk size when
  // one is in effect, otherwise the flavor's own disk. Drives the "Fits this
  // flavor" facet (an image whose min_disk exceeds this would fail to launch).
  const bootDiskGb =
    mode === "forced" || (mode === "optional" && customRootDisk)
      ? Number(rootDiskSize) || 0
      : (selectedFlavor?.disk ?? 0)
  // Offer the "Fits this flavor" facet only when we know the disk size (so the
  // pill actually does something); SearchableSelect further hides it if no image
  // would be excluded.
  const bootSourceFacets = [...osFamilyFacets(bootSources), ...(bootDiskGb > 0 ? [fitsFlavorFacet(bootDiskGb)] : [])]
  const bootSourceSelected = isVolumeId(form.image_id || null, bootVolumes) ? "volume" : "image"
  // Subnets belonging to the selected network (client-side filter, like legacy).
  const subnetsForNetwork = (subnets.data?.subnets ?? []).filter((s) => s.network_id === form.network_id)
  // Reserved fixed-IP addresses available for the chosen subnet (or all when no
  // subnet is picked), offered as datalist suggestions for the fixed-IP field.
  const reservedIps = (() => {
    const ports = subnets.data?.fixed_ip_ports ?? []
    const matching = form.subnet_id ? ports.filter((p) => p.subnet_ids.includes(form.subnet_id)) : ports
    return [...new Set(matching.flatMap((p) => p.ip_addresses))].sort()
  })()
  // A disk-less KVM flavor must boot from a new premium volume, so it needs a
  // volume type; load the (small) premium list only when that applies. A
  // selected bootable volume boots from itself, so no new root volume / type.
  const needsVolumeType = volumeTypeRequired(selectedFlavor) && bootSourceSelected !== "volume"
  const volumeTypes = useVolumeTypesQuery(api, { enabled: needsVolumeType })

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

  // Default the volume type to the first premium type (legacy preselected index
  // 1) once the list loads and the field is relevant; clear it when it is not.
  const availableVolumeTypes = volumeTypes.data ?? []
  useEffect(() => {
    if (!needsVolumeType) {
      setVolumeType("")
      return
    }
    setVolumeType((prev) => (prev === "" && availableVolumeTypes.length > 0 ? availableVolumeTypes[0].id : prev))
  }, [needsVolumeType, availableVolumeTypes])

  // Preselect the "default" security group once, when the list first loads and
  // the user has not picked any yet (mirrors the legacy controller). The guard
  // keeps a later deselection from re-adding it.
  const securityGroupsData = securityGroups.data
  const defaultSgApplied = useRef(false)
  useEffect(() => {
    if (defaultSgApplied.current || !securityGroupsData) return
    const hasDefault = securityGroupsData.some((sg) => sg.name === "default")
    if (hasDefault && form.security_groups.length === 0) {
      set("security_groups", ["default"])
    }
    defaultSgApplied.current = true
  }, [securityGroupsData, form.security_groups])

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

  // Switching network invalidates a previously picked subnet (subnets belong to
  // a specific network) and the fixed IP.
  const onNetworkChange = (value: string) => {
    setForm((f) => ({ ...f, network_id: value, subnet_id: "", fixed_ip: "" }))
  }

  // A bootable volume boots from itself, so the custom root disk is mutually
  // exclusive with it (legacy handleImageSelection hides it on volume select).
  const rootDiskActive =
    bootSourceSelected !== "volume" && (mode === "forced" || (mode === "optional" && customRootDisk))
  const sizeError = rootDiskActive ? rootDiskSizeError(rootDiskSize) : undefined
  // A required volume type that has not been picked blocks submit (legacy
  // checkKvmVolumeType). Only applies to disk-less KVM flavors.
  const volumeTypeMissing = needsVolumeType && volumeType === ""

  const mutation = useCreateInstanceMutation(api, queryClient)

  const parsed = CreateInstancePayloadSchema.safeParse(form)
  const nameError =
    form.name !== "" && !parsed.success ? parsed.error.issues.find((i) => i.path[0] === "name")?.message : undefined

  // Report the submit-ability + pending state up so the modal footer (which
  // owns the buttons) can enable/disable the primary action and show progress.
  const canSubmit = parsed.success && !sizeError && !volumeTypeMissing
  useEffect(() => {
    onStatusChange?.({ canSubmit, isPending: mutation.isPending })
  }, [canSubmit, mutation.isPending, onStatusChange])

  // Plain empty-state text shown inside each select's open panel. Actionable
  // guidance (how to create the missing resource) lives in the info banner at
  // the top of the form instead, so it is never hidden behind an open dropdown.
  const keypairEmpty = "No key pairs available."
  const networkEmpty = "No networks available."
  const imageEmpty = "No images available for this flavor type. Try a different flavor type."

  // Once the lazily-loaded lists resolve empty we surface an info banner at the
  // top of the form telling the user to create the prerequisite first, with a
  // link to the sibling plugin (full-page navigation). Links need the shared
  // domain/project prefix; without it we still show the guidance text.
  const noKeypairs = keypairs.isSuccess && (keypairs.data?.length ?? 0) === 0
  const noNetworks = networks.isSuccess && (networks.data?.length ?? 0) === 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.success || sizeError || volumeTypeMissing) return
    const payload: CreateInstancePayload = {
      ...parsed.data,
      custom_root_disk: rootDiskActive,
      custom_root_disk_size: rootDiskActive ? Number(rootDiskSize) : undefined,
      // Only a disk-less KVM flavor submits a volume type (legacy behaviour).
      volume_type: needsVolumeType ? volumeType : undefined,
      // Advanced network options are only sent when non-empty.
      subnet_id: form.subnet_id || undefined,
      fixed_ip: form.fixed_ip || undefined,
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

      {noNetworks && (
        <div className="alert alert-info" role="alert">
          There are no private networks in this project yet. A server needs a network to connect to, so please create a
          private network first.
          {scopePrefix && (
            <>
              {" "}
              <a className="alert-link" href={`${scopePrefix}/networking/networks/private`}>
                Create a private network
              </a>
              .
            </>
          )}
        </div>
      )}

      {noKeypairs && (
        <div className="alert alert-info" role="alert">
          There are no SSH key pairs for your account. Without a key pair you will not be able to log into the server.
          {scopePrefix && (
            <>
              {" "}
              <a className="alert-link" href={`${scopePrefix}/compute/keypairs/new`}>
                Create an SSH key pair
              </a>
              .
            </>
          )}
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
            facets={flavorSizeFacets(flavorsInType)}
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
                : `Images for ${FLAVOR_TYPE_LABELS[flavorType!]} and images without a hypervisor restriction (these run on any hypervisor). Bootable volumes for this type are listed first.`
            }
          >
            <SearchableSelect
              options={bootSources}
              value={form.image_id || null}
              onChange={(v) => set("image_id", v)}
              getLabel={bootSourceLabel}
              getValue={bootSourceValue}
              getGroups={(opts) => groupBootSources(opts, hv)}
              facets={bootSourceFacets}
              isLoading={images.isLoading}
              placeholder="Select an image or bootable volume…"
              emptyMessage={imageEmpty}
            />
          </FormRow>
        </div>
      )}

      {mode === "optional" && bootSourceSelected !== "volume" && (
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

      {needsVolumeType && (
        <FormRow
          label="Volume Type"
          required
          hint="Disk-less KVM flavors boot from a new root volume; choose its volume type."
        >
          <SearchableSelect
            options={availableVolumeTypes}
            value={volumeType || null}
            onChange={setVolumeType}
            getLabel={(vt) => vt.name}
            getValue={(vt) => vt.id}
            isLoading={volumeTypes.isLoading}
            placeholder="Select a volume type…"
            emptyMessage="No volume types available"
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
            preserveOrder
            clearable
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
            emptyMessage={keypairEmpty}
          />
        </FormRow>
      </div>

      <div onClick={() => open("network")}>
        <FormRow label="Network" required>
          <SearchableSelect
            options={networks.data ?? []}
            value={form.network_id || null}
            onChange={onNetworkChange}
            getLabel={(n) => n.name ?? n.id}
            getValue={(n) => n.id}
            isLoading={networks.isLoading}
            placeholder="Select a network…"
            emptyMessage={networkEmpty}
          />
        </FormRow>
      </div>

      <div className="row mb-3">
        <div className="col-sm-4" />
        <div className="col-sm-8">
          <button
            type="button"
            className="btn btn-link p-0"
            aria-expanded={showAdvancedNetwork}
            onClick={() => setShowAdvancedNetwork((v) => !v)}
          >
            {showAdvancedNetwork ? "Hide" : "Show"} advanced network options
          </button>
        </div>
      </div>

      {showAdvancedNetwork && (
        <>
          <div className="row mb-3">
            <div className="col-sm-4" />
            <div className="col-sm-8">
              <p className="text-muted mb-2">
                These optional settings are for advanced use cases that need more control over the instance's network
                configuration. To offer them we create a port first (in the selected subnet or with the selected fixed
                IP) and attach it to the instance at creation time. Please read the warning below carefully.
              </p>
              <div className="alert alert-warning py-2 px-3" role="alert">
                <strong>Warning:</strong> Ports created this way are not deleted when the server is deleted, and
                floating IPs attached to them are not released automatically. Only use these options when necessary, and
                remember to clean up the ports manually afterwards.
              </div>
            </div>
          </div>

          <FormRow
            label="Subnet"
            hint="Pick the subnet the fixed IP is chosen from. Leave empty to let any subnet be used."
          >
            <SearchableSelect
              options={subnetsForNetwork}
              value={form.subnet_id || null}
              onChange={(v) => set("subnet_id", v)}
              getLabel={(s) => `${s.name ?? s.id}${s.cidr ? ` (${s.cidr})` : ""}`}
              getValue={(s) => s.id}
              clearable
              isLoading={subnets.isLoading}
              placeholder={form.network_id ? "Choose a subnet…" : "Choose a network first"}
              emptyMessage="No subnets for this network"
            />
          </FormRow>

          <FormRow
            label="Server Fixed IP"
            htmlFor="ci-fixed-ip"
            hint={
              reservedIps.length > 0
                ? "Pick a reserved IP or type a new one; leave empty to let DHCP assign one."
                : "Type a fixed IP, or leave empty to let DHCP assign one."
            }
          >
            <SearchableSelect
              options={reservedIps.map((ip) => ({ ip }))}
              value={form.fixed_ip || null}
              onChange={(v) => set("fixed_ip", v)}
              getLabel={(o) => o.ip}
              getValue={(o) => o.ip}
              allowCustom
              allowCustomLabel={(q) => `Use “${q}”`}
              preserveOrder
              placeholder="Any (DHCP)…"
              emptyMessage="No reserved IPs for this subnet"
            />
          </FormRow>
        </>
      )}

      <FormRow label="Security Groups">
        <MultiSelect
          options={securityGroups.data ?? []}
          value={form.security_groups}
          onChange={(v) => set("security_groups", v)}
          getLabel={(sg) => sg.name}
          getValue={(sg) => sg.name}
          getGroups={groupSecurityGroupsByProject}
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
