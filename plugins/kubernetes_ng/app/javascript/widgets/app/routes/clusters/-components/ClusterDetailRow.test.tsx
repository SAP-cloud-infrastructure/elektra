import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import ClusterDetailRow from "./ClusterDetailRow"

describe("ClusterDetailRow", () => {
  it("renders the label and value", () => {
    render(<ClusterDetailRow label="Name">Cluster A</ClusterDetailRow>)
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Cluster A")).toBeInTheDocument()
  })

  it("renders '-' when children is undefined", () => {
    render(<ClusterDetailRow label="Status" />)
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("renders '-' when children is an empty string", () => {
    render(<ClusterDetailRow label="Region">{""}</ClusterDetailRow>)
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("renders '-' when children is an empty array", () => {
    render(<ClusterDetailRow label="Tags">{[]}</ClusterDetailRow>)
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("renders 'true' for boolean true", () => {
    render(<ClusterDetailRow label="Enabled">{true}</ClusterDetailRow>)
    expect(screen.getByText("true")).toBeInTheDocument()
  })

  it("renders 'false' for boolean false", () => {
    render(<ClusterDetailRow label="Enabled">{false}</ClusterDetailRow>)
    expect(screen.getByText("false")).toBeInTheDocument()
  })

  it("renders '-' for whitespace-only strings", () => {
    render(<ClusterDetailRow label="Description">{"   "}</ClusterDetailRow>)
    expect(screen.getByText("-")).toBeInTheDocument()
  })
})
