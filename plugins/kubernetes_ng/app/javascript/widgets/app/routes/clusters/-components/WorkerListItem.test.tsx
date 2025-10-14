import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import WorkerListItem from "./WorkerListItem"
import { worker1 as mockWorker } from "../../../mocks/data"

describe("WorkerListItem", () => {
  it("renders without crashing", () => {
    render(<WorkerListItem worker={mockWorker} />)
    expect(screen.getByTestId("worker-list-item")).toBeInTheDocument()
  })

  it("renders worker basic info correctly", () => {
    render(<WorkerListItem worker={mockWorker} />)
    expect(screen.getByText(mockWorker.name)).toBeInTheDocument()
    expect(screen.getByText(mockWorker.architecture)).toBeInTheDocument()
    expect(screen.getByText(mockWorker.machineType)).toBeInTheDocument()
  })

  it("renders machine image name and version", () => {
    render(<WorkerListItem worker={mockWorker} />)
    expect(screen.getByText(mockWorker.machineImage.name)).toBeInTheDocument()
    expect(screen.getByText(mockWorker.machineImage.version)).toBeInTheDocument()
  })

  it("renders scaling info (min/max/surge)", () => {
    render(<WorkerListItem worker={mockWorker} />)
    expect(screen.getByText(`Min ${mockWorker.min}`)).toBeInTheDocument()
    expect(screen.getByText(`Max ${mockWorker.max}`)).toBeInTheDocument()
    expect(screen.getByText(`Surge ${mockWorker.maxSurge}`)).toBeInTheDocument()
  })
})
