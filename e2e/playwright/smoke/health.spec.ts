import { test, expect } from "@playwright/test"

/**
 * Health Check Tests
 *
 * These tests verify that Elektra is running and healthy.
 * No authentication is required for these endpoints.
 *
 * Run with: pnpm e2e:playwright:smoke -- --host http://localhost:PORT health
 */
test.describe("system health", () => {
  test("liveliness probe returns 200", async ({ request }) => {
    const response = await request.get("/system/liveliness")
    expect(response.status()).toBe(200)
  })

  test("readiness probe returns 200", async ({ request }) => {
    const response = await request.get("/system/readiness")
    expect(response.status()).toBe(200)
  })

  test("startprobe returns 200", async ({ request }) => {
    const response = await request.get("/system/startprobe")
    expect(response.status()).toBe(200)
  })

  test("root endpoint returns 200", async ({ request }) => {
    const response = await request.get("/")
    expect(response.status()).toBe(200)
  })
})
