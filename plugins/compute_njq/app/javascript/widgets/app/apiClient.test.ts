import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the ajax helper so we control exactly what the BFF "returns".
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()
vi.mock("lib/ajax_helper", () => ({
  createAjaxHelper: () => ({ get: mockGet, post: mockPost, put: mockPut, delete: mockDelete }),
}))

import { createComputeApi } from "./apiClient"

const validInstance = {
  id: "s1",
  name: "web-01",
  status: { state: "active", transition: null },
  locked: false,
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: [
    { addr: "10.0.0.5", type: "fixed" },
    { addr: "203.0.113.9", type: "floating" },
  ],
  created: "2026-01-01T00:00:00Z",
}

describe("createComputeApi", () => {
  const api = createComputeApi("/acme/demo/compute-njq")

  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDelete.mockReset()
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
        data: {
          flavors: [
            { id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
          ],
        },
      })
      const result = await api.formOptions.getFlavors()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("f1")
    })

    it("returns the image list", async () => {
      mockGet.mockResolvedValue({ data: { images: [] } })
      const result = await api.formOptions.getImages()
      expect(result.images).toEqual([])
      // volumes defaults to [] when the backend omits it.
      expect(result.volumes).toEqual([])
    })

    it("returns bootable volumes alongside images", async () => {
      mockGet.mockResolvedValue({
        data: {
          images: [],
          volumes: [
            {
              id: "v1",
              name: "root-vol",
              size: 50,
              availability_zone: "qa-de-1a",
              disk_format: "raw",
              hypervisor_type: "kvm",
              img_hv_type: null,
            },
          ],
        },
      })
      const result = await api.formOptions.getImages()
      expect(result.volumes.map((v) => v.id)).toEqual(["v1"])
    })

    it("returns keypairs", async () => {
      mockGet.mockResolvedValue({ data: { keypairs: [{ name: "k1" }] } })
      const result = await api.formOptions.getKeypairs()
      expect(result).toEqual([{ name: "k1" }])
    })

    it("returns networks", async () => {
      mockGet.mockResolvedValue({ data: { networks: [{ id: "n1", name: "default" }] } })
      const result = await api.formOptions.getNetworks()
      expect(result).toEqual([{ id: "n1", name: "default" }])
    })

    it("returns subnets and reserved fixed-IP ports", async () => {
      mockGet.mockResolvedValue({
        data: {
          subnets: [{ id: "s1", name: "sub-a", cidr: "10.0.0.0/24", network_id: "n1" }],
          fixed_ip_ports: [{ id: "p1", ip_addresses: ["10.0.0.5"], subnet_ids: ["s1"] }],
        },
      })
      const result = await api.formOptions.getSubnets()
      expect(result.subnets).toEqual([{ id: "s1", name: "sub-a", cidr: "10.0.0.0/24", network_id: "n1" }])
      expect(result.fixed_ip_ports).toEqual([{ id: "p1", ip_addresses: ["10.0.0.5"], subnet_ids: ["s1"] }])
    })

    it("defaults fixed_ip_ports to [] when omitted", async () => {
      mockGet.mockResolvedValue({ data: { subnets: [] } })
      const result = await api.formOptions.getSubnets()
      expect(result.fixed_ip_ports).toEqual([])
    })

    it("returns security_groups", async () => {
      mockGet.mockResolvedValue({
        data: { security_groups: [{ id: "sg1", name: "default", project_id: "p1", project_label: "monsoon3/demo" }] },
      })
      const result = await api.formOptions.getSecurityGroups()
      expect(result).toEqual([{ id: "sg1", name: "default", project_id: "p1", project_label: "monsoon3/demo" }])
    })

    it("returns availability_zones", async () => {
      mockGet.mockResolvedValue({ data: { availability_zones: [{ name: "az-1" }] } })
      const result = await api.formOptions.getAvailabilityZones()
      expect(result).toEqual([{ name: "az-1" }])
    })

    it("returns volume_types", async () => {
      mockGet.mockResolvedValue({ data: { volume_types: [{ id: "vt1", name: "premium" }] } })
      const result = await api.formOptions.getVolumeTypes()
      expect(result).toEqual([{ id: "vt1", name: "premium" }])
    })
  })

  describe("instances.create", () => {
    const createPayload = {
      name: "web-01",
      flavor_id: "f1",
      image_id: "i1",
      keypair: "k",
      network_id: "n1",
      security_groups: [] as string[],
      user_data: "",
    }

    it("posts the payload nested under instance and returns the UI-shaped instance", async () => {
      mockPost.mockResolvedValue({ data: { instance: validInstance } })
      const result = await api.instances.create(createPayload)
      expect(mockPost).toHaveBeenCalledWith("instances", { instance: createPayload })
      expect(result.id).toBe("s1")
      expect(result).toEqual(validInstance)
    })

    it("throws the error envelope on failure", async () => {
      mockPost.mockResolvedValue({ data: { error: "API Error", code: 403, message: "Quota exceeded" } })
      await expect(api.instances.create(createPayload)).rejects.toThrow(/Quota exceeded \(HTTP 403\)/)
    })

    it("surfaces the backend detail when the request rejects with a non-2xx status", async () => {
      // The ajax helper rejects on non-2xx with a generic message ("API Error")
      // but carries the full envelope in error.data; detailedError must lift the
      // real message out of it.
      const rejection = Object.assign(new Error("API Error"), {
        status: 400,
        data: { error: "API Error", code: 400, message: "Invalid key_name" },
      })
      mockPost.mockRejectedValue(rejection)
      await expect(api.instances.create(createPayload)).rejects.toThrow(/Invalid key_name \(HTTP 400\)/)
    })
  })

  describe("instances.action / terminate", () => {
    it("posts the action_name under instances/:id/action", async () => {
      mockPost.mockResolvedValue({ data: { ok: true } })
      await api.instances.action("s1", "stop")
      expect(mockPost).toHaveBeenCalledWith("instances/s1/action", { action_name: "stop" })
    })

    it("throws the error envelope when an action fails", async () => {
      mockPost.mockResolvedValue({ data: { error: "API Error", code: 409, message: "Conflict" } })
      await expect(api.instances.action("s1", "stop")).rejects.toThrow(/Conflict \(HTTP 409\)/)
    })

    it("deletes instances/:id for terminate", async () => {
      mockDelete.mockResolvedValue({ data: { ok: true } })
      await api.instances.terminate("s1")
      expect(mockDelete).toHaveBeenCalledWith("instances/s1")
    })

    it("throws the error envelope when terminate fails", async () => {
      mockDelete.mockResolvedValue({ data: { error: "API Error", code: 403, message: "Forbidden" } })
      await expect(api.instances.terminate("s1")).rejects.toThrow(/Forbidden \(HTTP 403\)/)
    })
  })

  describe("instances.updateName / setTags / resetStatus", () => {
    it("updateName PUTs the new name nested under instance", async () => {
      mockPut.mockResolvedValue({ data: { ok: true } })
      await api.instances.updateName("s1", "web-02")
      expect(mockPut).toHaveBeenCalledWith("instances/s1", { instance: { name: "web-02" } })
    })

    it("setTags PUTs the full tag list to instances/:id/tags", async () => {
      mockPut.mockResolvedValue({ data: { ok: true } })
      await api.instances.setTags("s1", ["web", "prod"])
      expect(mockPut).toHaveBeenCalledWith("instances/s1/tags", { tags: ["web", "prod"] })
    })

    it("setTags accepts an empty list to clear all tags", async () => {
      mockPut.mockResolvedValue({ data: { ok: true } })
      await api.instances.setTags("s1", [])
      expect(mockPut).toHaveBeenCalledWith("instances/s1/tags", { tags: [] })
    })

    it("resetStatus POSTs the chosen state to instances/:id/reset_status", async () => {
      mockPost.mockResolvedValue({ data: { ok: true } })
      await api.instances.resetStatus("s1", "active")
      expect(mockPost).toHaveBeenCalledWith("instances/s1/reset_status", { state: "active" })
    })

    it("throws the error envelope when an edit fails", async () => {
      mockPut.mockResolvedValue({ data: { error: "API Error", code: 403, message: "Forbidden" } })
      await expect(api.instances.updateName("s1", "web-02")).rejects.toThrow(/Forbidden \(HTTP 403\)/)
    })
  })
})
