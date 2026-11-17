import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import type { Instance } from "../types/instance"
// Exercise the onMutate/onError/onSettled callbacks directly (no React render):
// useMutation returns an object; we test the option callbacks the hook builds
// via the extracted factory.
import { buildActionMutationOptions } from "./useInstanceActionMutation"

function seedList(qc: QueryClient) {
  qc.setQueryData(QUERY_KEYS.instances, [
    {
      id: "s1",
      name: "x",
      status: { state: "active", transition: null },
      locked: false,
      flavor: { id: null, name: null },
      image: { id: null, name: null },
      ips: [],
      created: null,
    },
  ])
}

const rows = (qc: QueryClient) => qc.getQueryData<Instance[]>(QUERY_KEYS.instances)!

describe("action mutation optimistic transition", () => {
  it("onMutate patches the row transition and onError restores it", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { action: vi.fn() } } as never
    const opts = buildActionMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", actionName: "stop", optimisticTransition: "powering-off" })
    expect(rows(qc)[0].status.transition).toBe("powering-off")

    opts.onError!(new Error("boom"), { id: "s1", actionName: "stop" }, ctx)
    expect(rows(qc)[0].status.transition).toBe(null)
  })

  it("onMutate flips locked for a lock without setting a transition, and onError restores it", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { action: vi.fn() } } as never
    const opts = buildActionMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", actionName: "lock" })
    expect(rows(qc)[0].locked).toBe(true)
    // Lock has no Nova task_state, so it must not spin the status pill / hide the menu.
    expect(rows(qc)[0].status.transition).toBe(null)

    opts.onError!(new Error("boom"), { id: "s1", actionName: "lock" }, ctx)
    expect(rows(qc)[0].locked).toBe(false)
  })

  it("onMutate clears locked for an unlock", async () => {
    const qc = new QueryClient()
    qc.setQueryData(QUERY_KEYS.instances, [
      {
        id: "s1",
        name: "x",
        status: { state: "active", transition: null },
        locked: true,
        flavor: { id: null, name: null },
        image: { id: null, name: null },
        ips: [],
        created: null,
      },
    ])
    const api = { instances: { action: vi.fn() } } as never
    const opts = buildActionMutationOptions(api, qc)

    await opts.onMutate!({ id: "s1", actionName: "unlock" })
    expect(rows(qc)[0].locked).toBe(false)
    expect(rows(qc)[0].status.transition).toBe(null)
  })
})
