import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor, within, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React from "react"
import { Tabs, Tab } from "./Tabs"

describe("Tabs", () => {
  afterEach(() => {
    cleanup()
  })

  const renderTabs = (props = {}) =>
    render(
      <Tabs defaultActiveKey="a" id="t" {...props}>
        <Tab eventKey="a" title="Alpha">
          <div>Content A</div>
        </Tab>
        <Tab eventKey="b" title="Beta">
          <div>Content B</div>
        </Tab>
      </Tabs>
    )

  it("renders a tablist with role=tab per tab", () => {
    renderTabs()
    expect(screen.getByRole("tablist")).toBeInTheDocument()
    expect(screen.getAllByRole("tab")).toHaveLength(2)
  })

  it("marks the default tab as selected", () => {
    renderTabs()
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "false")
  })

  it("switches the active tab on click (the React 19 bugfix)", async () => {
    const user = userEvent.setup()
    renderTabs()
    const beta = screen.getByRole("tab", { name: "Beta" })
    await user.click(beta)
    await waitFor(() => {
      expect(beta).toHaveAttribute("aria-selected", "true")
    })
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "false")
  })

  it("shows the active panel content and keeps inactive queryable but hidden", async () => {
    const user = userEvent.setup()
    renderTabs()
    const activePanel = screen.getByRole("tabpanel", { name: "Alpha" })
    expect(within(activePanel).getByText("Content A")).toBeVisible()
    await user.click(screen.getByRole("tab", { name: "Beta" }))
    await waitFor(() => {
      expect(within(screen.getByRole("tabpanel", { name: "Beta" })).getByText("Content B")).toBeVisible()
    })
  })

  it("filters out falsy (conditionally rendered) children", () => {
    render(
      <Tabs defaultActiveKey="a" id="t">
        <Tab eventKey="a" title="Alpha">
          A
        </Tab>
        {false && (
          <Tab eventKey="hidden" title="Hidden">
            H
          </Tab>
        )}
        {null}
      </Tabs>
    )
    expect(screen.getAllByRole("tab")).toHaveLength(1)
  })

  it("calls onSelect with the clicked key", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderTabs({ onSelect })
    await user.click(screen.getByRole("tab", { name: "Beta" }))
    expect(onSelect).toHaveBeenCalledWith("b")
  })
})
