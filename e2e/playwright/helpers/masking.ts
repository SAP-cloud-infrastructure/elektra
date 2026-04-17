import { Page } from "@playwright/test"

/**
 * Security Masking Helpers
 *
 * Provides reusable masking functions for visual regression tests.
 * Masks sensitive data like user IDs, emails, domain/project IDs, etc.
 */

/**
 * Get standard security mask selectors
 *
 * Masks common sensitive data patterns found across the application:
 * - User info in header
 * - Breadcrumbs
 * - Email addresses
 * - Domain/Project IDs
 * - User/Distribution List IDs
 * - Cost Object Numbers
 * - Timestamps
 *
 * @param page - Playwright Page object
 * @returns Array of locators to mask
 */
export function getSecurityMaskSelectors(page: Page) {
  return [
    // Header: User info in top right (Technical Team User CAM_ACCOUNTNAME)
    page.locator(".user-info, [class*='user-'], .navbar .dropdown-toggle"),
    page.locator("text=/Technical.*User/i"),
    page.locator("text=/CAM_[A-Z0-9]+/"),

    // Breadcrumb: User IDs and hashes (admin (hash...))
    page.locator(".breadcrumb"),

    // Email addresses - ALL patterns
    // Pattern: PREFIX_HEXSTRING@global.corp.sap
    page.locator("a[href^='mailto:']"),

    // User/Distribution List IDs (before emails)
    // Pattern: C3Us_*, DL_*, etc.
    page.locator("text=/^C3Us_/i"),
    page.locator("text=/^DL_/i"),

    // Cost Object Numbers row
    page.locator("text=/Name\\/Number/i").locator("..").locator(".."),

    // Domain/Project IDs rows
    page.locator("text=/Domain ID/i").locator(".."),
    page.locator("text=/Project ID/i").locator(".."),

    // Timestamps and dates
    page.locator("text=/Last change/i").locator(".."),
  ]
}

/**
 * Get basic security mask selectors (minimal set)
 *
 * Use this for pages with less sensitive data or when you need
 * a lighter masking approach.
 *
 * @param page - Playwright Page object
 * @returns Array of locators to mask
 */
export function getBasicMaskSelectors(page: Page) {
  return [
    // Header: User info
    page.locator(".user-info, [class*='user-'], .navbar .dropdown-toggle"),
    page.locator("text=/Technical.*User/i"),

    // Breadcrumb
    page.locator(".breadcrumb"),

    // Domain/Project IDs
    page.locator("text=/Domain ID/i").locator(".."),
    page.locator("text=/Project ID/i").locator(".."),

    // Email addresses
    page.locator("a[href^='mailto:']"),
  ]
}

/**
 * Standard screenshot options with black masking
 */
export const SCREENSHOT_OPTIONS = {
  maskColor: "#000000" as const, // Black masking
  maxDiffPixelRatio: 0.03 as const, // 3% tolerance
}
