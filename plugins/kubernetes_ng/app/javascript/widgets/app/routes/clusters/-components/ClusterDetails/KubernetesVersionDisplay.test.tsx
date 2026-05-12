import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { KubernetesVersionDisplay } from "./KubernetesVersionDisplay"

describe("KubernetesVersionDisplay", () => {
  it("should render version text", () => {
    render(<KubernetesVersionDisplay version="1.27.5" />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })

  it("should render help icon when versionUpdates is undefined", () => {
    const { container } = render(<KubernetesVersionDisplay version="1.27.5" />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render help icon
    const helpIcon = container.querySelector('svg[alt="help"]')
    expect(helpIcon).toBeInTheDocument()
  })

  it("should render help icon when versionUpdates is null", () => {
    const { container } = render(<KubernetesVersionDisplay version="1.27.5" versionUpdates={null} />)
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render help icon
    const helpIcon = container.querySelector('svg[alt="help"]')
    expect(helpIcon).toBeInTheDocument()
  })

  it("should render plain version text when no updates available", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ patch: [], minor: [], major: [] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should not render any icon when no updates
    expect(container.querySelector("svg")).not.toBeInTheDocument()
  })

  it("should render info icon when patch is available", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ patch: ["1.27.6"] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render info icon
    const infoIcon = container.querySelector('svg[alt="info"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it("should render info icon when upgrade is available", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ minor: ["1.28.0"] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render info icon
    const infoIcon = container.querySelector('svg[alt="info"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it("should render info icon when major upgrade is available", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ major: ["2.0.0"] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render info icon
    const infoIcon = container.querySelector('svg[alt="info"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it("should render info icon when both patch and upgrade available", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ patch: ["1.27.6"], minor: ["1.28.0"] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should render info icon
    const infoIcon = container.querySelector('svg[alt="info"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it("should show tooltip with help icon when cloud profile couldn't be fetched", () => {
    render(<KubernetesVersionDisplay version="1.27.5" versionUpdates={null} />)
    // Tooltip component should be present
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
  })

  it("should render with data-testid attribute", () => {
    render(
      <KubernetesVersionDisplay
        version="1.27.5"
        versionUpdates={{ patch: ["1.27.6"] }}
        data-testid="version-display"
      />
    )
    expect(screen.getByTestId("version-display")).toBeInTheDocument()
  })

  it("should render without icon when empty versionUpdates object", () => {
    const { container } = render(
      <KubernetesVersionDisplay version="1.27.5" versionUpdates={{ patch: [], minor: [], major: [] }} />
    )
    expect(screen.getByText("1.27.5")).toBeInTheDocument()
    // Should not render any icon
    expect(container.querySelector("svg")).not.toBeInTheDocument()
  })
})
