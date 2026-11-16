import { useState } from "react"
import { QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../../../apiClient"
import { SearchableSelect } from "./SearchableSelect"
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

export function CreateInstanceForm({ api, queryClient, onSuccess }: Props) {
  const [form, setForm] = useState(EMPTY)
  // A field's query only runs once its dropdown has been opened (lazy).
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [imageQuery, setImageQuery] = useState("")

  const set = (key: keyof typeof EMPTY, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }))
  const open = (key: string) => setOpened((o) => ({ ...o, [key]: true }))

  const flavors = useFlavorsQuery(api, { enabled: !!opened.flavor })
  const images = useImagesQuery(api, { q: imageQuery, enabled: !!opened.image })
  const keypairs = useKeypairsQuery(api, { enabled: !!opened.keypair })
  const networks = useNetworksQuery(api, { enabled: !!opened.network })
  const securityGroups = useSecurityGroupsQuery(api, { enabled: !!opened.secgroup })
  const azs = useAvailabilityZonesQuery(api, { enabled: !!opened.az })

  const mutation = useCreateInstanceMutation(api, queryClient)

  const parsed = CreateInstancePayloadSchema.safeParse(form)
  const nameError =
    form.name !== "" && !parsed.success ? parsed.error.issues.find((i) => i.path[0] === "name")?.message : undefined

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.success) return
    mutation.mutate(parsed.data as CreateInstancePayload, { onSuccess })
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

      <div className="mb-3" onClick={() => open("flavor")}>
        <label className="form-label">Flavor</label>
        <SearchableSelect
          options={flavors.data ?? []}
          value={form.flavor_id || null}
          onChange={(v) => set("flavor_id", v)}
          getLabel={(f) => f.name}
          getValue={(f) => f.id}
          isLoading={flavors.isLoading}
          placeholder="Select a flavor…"
          emptyMessage="No flavors available"
        />
      </div>

      <div className="mb-3" onClick={() => open("image")}>
        <label className="form-label">Image</label>
        <SearchableSelect
          options={images.data?.images ?? []}
          value={form.image_id || null}
          onChange={(v) => set("image_id", v)}
          getLabel={(i) => i.name ?? i.id}
          getValue={(i) => i.id}
          onSearch={setImageQuery}
          isLoading={images.isLoading}
          placeholder="Select an image…"
          emptyMessage="No images found"
        />
      </div>

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

      <button type="submit" className="btn btn-primary" disabled={!parsed.success || mutation.isPending}>
        {mutation.isPending ? "Creating…" : "Create"}
      </button>
    </form>
  )
}
