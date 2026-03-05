import { useEffect, useState, useCallback } from "react"
import { useBlocker } from "@tanstack/react-router"

interface UseNavigationBlockOptions {
  hasUnsavedChanges: boolean
}

interface NavigationBlockState {
  /** Whether a navigation block dialog should be shown */
  isBlocked: boolean
  /** The URL the user is trying to navigate to (for external links) */
  pendingUrl: string | null
  /** Call this to proceed with navigation */
  proceed: () => void
  /** Call this to cancel navigation and stay on the page */
  reset: () => void
}

/**
 * Blocks navigation when there are unsaved changes.
 *
 * Handles three types of navigation:
 * 1. In-app navigation (TanStack Router) - e.g., navigating between clusters
 * 2. External link clicks - e.g., clicking sidebar links, header navigation
 * 3. Browser close/refresh - shows browser's native "Changes may not be saved" dialog
 */
export function useNavigationBlock({ hasUnsavedChanges }: UseNavigationBlockOptions): NavigationBlockState {
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  // Block in-app navigation using TanStack Router
  // This will be the future when moving to Aurora, but we want to support both for now
  const blocker = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges,
    withResolver: true,
  })

  // Handle external link clicks outside the plugin
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a[href]") as HTMLAnchorElement

      if (!link) return

      const href = link.getAttribute("href")

      // Skip non-navigating links
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return

      // Skip links that open in new tab/window
      if (link.target === "_blank") return

      // Skip if link is inside our React app
      const reactRoot = document.getElementById("kubernetes-ng-app")
      if (reactRoot?.contains(link)) return

      // Prevent navigation and show dialog
      e.preventDefault()
      e.stopPropagation()
      setPendingUrl(href)
    }

    // Use capture phase to intercept before other handlers
    document.addEventListener("click", handleLinkClick, true)
    return () => document.removeEventListener("click", handleLinkClick, true)
  }, [hasUnsavedChanges])

  // Handle browser close/refresh with native dialog
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Changes you made may not be saved."
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Determine if we're blocked by either mechanism
  const isRouterBlocked = blocker.status === "blocked"
  const isExternalBlocked = pendingUrl !== null

  const proceed = useCallback(() => {
    if (isRouterBlocked && blocker.proceed) {
      blocker.proceed()
    } else if (isExternalBlocked && pendingUrl) {
      window.location.href = pendingUrl
    }
  }, [isRouterBlocked, isExternalBlocked, pendingUrl, blocker])

  const reset = useCallback(() => {
    if (isRouterBlocked && blocker.reset) {
      blocker.reset()
    }
    setPendingUrl(null)
  }, [isRouterBlocked, blocker])

  return {
    isBlocked: isRouterBlocked || isExternalBlocked,
    pendingUrl,
    proceed,
    reset,
  }
}
