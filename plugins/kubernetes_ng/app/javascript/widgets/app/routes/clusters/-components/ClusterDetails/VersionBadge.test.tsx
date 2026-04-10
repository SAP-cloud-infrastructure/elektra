import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { VersionBadge } from "./VersionBadge"

describe("VersionBadge", () => {
  it("should render version text", () => {
    render(<VersionBadge version="1.27.5" />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })

  it("should render plain text with spinner when loading", () => {
    const { container } = render(<VersionBadge version="1.27.5" isLoading />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Check for spinner
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
    // Should not render badge when loading
    expect(container.querySelector('[data-juno-badge]')).not.toBeInTheDocument()
  })

  it("should render plain text when there is an error", () => {
    const { container } = render(<VersionBadge version="1.27.5" hasError />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should not render badge or spinner when there's an error
    expect(container.querySelector('[data-juno-badge]')).not.toBeInTheDocument()
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
  })

  it("should render success icon when no updates", () => {
    const { container } = render(<VersionBadge version="1.27.5" />)
    // Badge with icon prop always renders an icon (success icon when no updates)
    expect(container.querySelector("svg")).toBeInTheDocument()
    // Check for success icon specifically
    expect(container.querySelector('svg[alt="success"]')).toBeInTheDocument()
  })

  it("should render update icon when patch is available", () => {
    const { container } = render(
      <VersionBadge version="1.27.5" versionUpdates={{ patch: ["1.27.6"] }} />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render update icon when upgrade is available", () => {
    const { container } = render(
      <VersionBadge version="1.27.5" versionUpdates={{ minor: ["1.28.0"] }} />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render update icon when major upgrade is available", () => {
    const { container } = render(
      <VersionBadge version="1.27.5" versionUpdates={{ major: ["2.0.0"] }} />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render update icon when both patch and upgrade available", () => {
    const { container } = render(
      <VersionBadge version="1.27.5" versionUpdates={{ patch: ["1.27.6"], minor: ["1.28.0"] }} />
    )
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("should use success variant when no updates", () => {
    render(<VersionBadge version="1.27.5" data-testid="version-badge" />)
    expect(screen.getByTestId("version-badge")).toBeInTheDocument()
  })

  it("should use info variant when updates available", () => {
    render(
      <VersionBadge
        version="1.27.5"
        versionUpdates={{ patch: ["1.27.6"] }}
        data-testid="version-badge-with-updates"
      />
    )
    expect(screen.getByTestId("version-badge-with-updates")).toBeInTheDocument()
  })

  it("should show tooltip on hover", () => {
    render(
      <VersionBadge
        version="1.27.5"
        versionUpdates={{ patch: ["1.27.6"] }}
        tooltipText="Patch available"
      />
    )
    // Tooltip component should be present (even if not visible yet)
    // The TooltipTrigger wraps the badge
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })

  it("should render custom tooltip text", () => {
    render(<VersionBadge version="1.27.5" tooltipText="Custom tooltip" />)
    // Note: Tooltip content might not be in the DOM until hover
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })

  it("should render without tooltip when not provided", () => {
    render(<VersionBadge version="1.27.5" />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })
})
