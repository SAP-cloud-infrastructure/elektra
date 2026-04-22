import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "../helpers/auth"

/**
 * Shared File System - Functional Tests (Admin)
 *
 * Tests functionality of shared file system storage pages.
 * Verifies that pages load and basic UI elements are visible.
 *
 * Run with: pnpm e2e:playwright:ui -- --host http://localhost:PORT shared-filesystem-admin-functional
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"

test.describe("Shared File System - Admin", () => {
  test.setTimeout(60000) // 60 seconds

  test("can access shares page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/shares`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })

  test("can access snapshots page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/snapshots`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })

  test("can access replicas page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/replicas`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })

  test("can access share networks page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/share-networks`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })

  test("can access security services page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/security-services`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })

  test("can access autoscaling page", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/${TEST_DOMAIN}/admin/shared-filesystem-storage/?r=/autoscaling`, {
      waitUntil: "domcontentloaded",
    })

    await expect(page.locator("[data-test=page-title]")).toContainText("File System Storage")
    await page.waitForTimeout(2000)
  })
})
