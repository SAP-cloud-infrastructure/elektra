import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import WorkerList from "./WorkerList"
import { worker1, worker2 } from "../../../mocks/data"

describe("WorkerList", () => {
  it("renders without crashing", () => {
    render(<WorkerList workers={[worker1, worker2]} data-testid="worker-list" />)
    expect(screen.getByTestId("worker-list")).toBeInTheDocument()
  })

  it("renders table headers correctly", () => {
    render(<WorkerList workers={[worker1, worker2]} />)
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Architecture")).toBeInTheDocument()
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText("Image/Version")).toBeInTheDocument()
    expect(screen.getByText("Scaling")).toBeInTheDocument()
  })

  it("renders the correct number of WorkerListItem components", () => {
    render(<WorkerList workers={[worker1, worker2]} />)
    expect(screen.getByText(worker1.name)).toBeInTheDocument()
    expect(screen.getByText(worker2.name)).toBeInTheDocument()
  })

  it("renders 'No workers found' when list is empty", () => {
    render(<WorkerList workers={[]} />)
    expect(screen.getByText("No workers found")).toBeInTheDocument()
  })

  it("passes extra props to the wrapper div", () => {
    render(<WorkerList workers={[worker1, worker2]} data-extra="test-prop" data-testid="worker-list" />)
    const wrapper = screen.getByTestId("worker-list")
    expect(wrapper).toHaveAttribute("data-extra", "test-prop")
  })
})
