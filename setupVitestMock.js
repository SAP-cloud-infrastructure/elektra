import { vi } from "vitest"
const data = { name: "test" }

const mockFetchPromise = Promise.resolve({
  json: vi.fn(() => Promise.resolve({ name: "test" })),
  blob: vi.fn(() => {
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    })
    blob.text = vi.fn().mockResolvedValue(JSON.stringify(data))
    return Promise.resolve(blob)
  }),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  formData: vi.fn(() => Promise.resolve(new FormData())),
  ok: true,
  status: 200,
  statusText: "success",
  headers: new Headers({
    test: "test",
    "Content-Type": "application/json; charset=utf-8",
  }),
})

global.fetch = vi.fn(() => mockFetchPromise)
