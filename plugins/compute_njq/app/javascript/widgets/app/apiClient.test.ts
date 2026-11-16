import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the ajax helper so we control exactly what the BFF "returns".
const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock("lib/ajax_helper", () => ({
  createAjaxHelper: () => ({ get: mockGet, post: mockPost }),
}))

import { createComputeApi } from "./apiClient"

const validInstance = {
  id: "s1",
  name: "web-01",
  status: { state: "active", transition: null },
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: { fixed: ["10.0.0.5"], floating: ["203.0.113.9"] },
  created: "2026-01-01T00:00:00Z",
}

describe("createComputeApi", () => {
  const api = createComputeApi("/acme/demo/compute-njq")

  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
  })

  describe("getInstances", () => {
    it("returns the validated instances array", async () => {
      mockGet.mockResolvedValue({ data: { instances: [validInstance] } })
      const result = await api.instances.getInstances()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("s1")
    })

    it("throws when the BFF answers with an error envelope (even on HTTP 200)", async () => {
      mockGet.mockResolvedValue({ data: { error: "API Error", code: 404, message: "not found" } })
      await expect(api.instances.getInstances()).rejects.toThrow(/not found \(HTTP 404\)/)
    })

    it("throws a descriptive error when the response fails Zod validation", async () => {
      // `status` must be an object, not a string → schema violation
      mockGet.mockResolvedValue({ data: { instances: [{ ...validInstance, status: "active" }] } })
      await expect(api.instances.getInstances()).rejects.toThrow(/Invalid response: instances/)
    })

    it("throws when the top-level shape is wrong", async () => {
      mockGet.mockResolvedValue({ data: { wrong: true } })
      await expect(api.instances.getInstances()).rejects.toThrow(/Invalid response: instances/)
    })
  })

  describe("getInstance", () => {
    it("returns a single validated instance", async () => {
      mockGet.mockResolvedValue({ data: { instance: validInstance } })
      const result = await api.instances.getInstance("s1")
      expect(result.id).toBe("s1")
    })
  })

  describe("formOptions", () => {
    it("returns validated flavors", async () => {
      mockGet.mockResolvedValue({
        data: { flavors: [{ id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm" }] },
      })
      const result = await api.formOptions.getFlavors()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("f1")
    })

    it("returns images with next_marker", async () => {
      mockGet.mockResolvedValue({ data: { images: [], next_marker: null } })
      const result = await api.formOptions.getImages({ q: "ubuntu" })
      expect(result.images).toEqual([])
      expect(result.next_marker).toBeNull()
    })
  })

  describe("instances.create", () => {
    it("posts the payload and returns the created instance", async () => {
      mockPost.mockResolvedValue({ data: { instance: validInstance } })
      const result = await api.instances.create({
        name: "web-01",
        flavor_id: "f1",
        image_id: "i1",
        keypair: "k",
        network_id: "n1",
        security_groups: [],
        user_data: "",
      })
      expect(result.id).toBe("s1")
    })

    it("throws the error envelope on failure", async () => {
      mockPost.mockResolvedValue({ data: { error: "API Error", code: 403, message: "Quota exceeded" } })
      await expect(
        api.instances.create({
          name: "x",
          flavor_id: "f1",
          image_id: "i1",
          keypair: "k",
          network_id: "n1",
          security_groups: [],
          user_data: "",
        })
      ).rejects.toThrow(/Quota exceeded \(HTTP 403\)/)
    })
  })
})
