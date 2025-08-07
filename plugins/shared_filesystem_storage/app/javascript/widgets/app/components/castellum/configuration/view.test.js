import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter as Router } from "react-router-dom"
import CastellumConfigurationView from "./view"

describe("CastellumConfigurationView", () => {
  let props

  beforeEach(() => {
    props = {
      config: { allShares: true, data: {} },
      loadShareTypesOnce: jest.fn(),
      disableAutoscaling: jest.fn(),
      projectID: "1234",
      shareTypes: { items: [], isFetching: false },
    }
  })

  it('should default to rendering the "All" page', () => {
    render(
      <Router>
        <CastellumConfigurationView {...props} />
      </Router>
    )
    expect(screen.getByText("Create autoscaling config for")).not.toBeNull()
    expect(screen.getByText("All")).not.toBeNull()
  })

  it('should display "Individual" content and not call disableAutoscaling when swapping to "Individual"', () => {
    render(
      <Router>
        <CastellumConfigurationView {...props} />
      </Router>
    )
    fireEvent.change(screen.getByTestId("autoscalingSelect"), { target: { value: "Individual" } })

    expect(screen.getByText("Individual")).not.toBeNull()
    expect(props.disableAutoscaling).not.toBeCalled()
  })

  it('should call disableAutoscaling when swapping to "Individual" with "All" having config', () => {
    props.config.data = {
      "nfs-shares": { size_constraints: { minimum_free_is_critical: 30 }, size_steps: { single: true } },
    }
    render(
      <Router>
        <CastellumConfigurationView {...props} />
      </Router>
    )
    fireEvent.change(screen.getByTestId("autoscalingSelect"), { target: { value: "Individual" } })
    expect(screen.getByText("Individual")).not.toBeNull()
    expect(props.disableAutoscaling).toBeCalledWith(props.projectID, ["nfs-shares"], false)
  })

  it('should call disableAutoscaling when swapping to "All" with "Individual" having config', () => {
    props.config.data = {
      [`nfs-shares-type:shareTypeName`]: {
        size_constraints: { minimum_free_is_critical: 30 },
        size_steps: { single: true },
      },
    }
    props.config.allShares = false
    render(
      <Router>
        <CastellumConfigurationView {...props} />
      </Router>
    )
    fireEvent.change(screen.getByTestId("autoscalingSelect"), { target: { value: "All" } })
    expect(screen.getByText("All")).not.toBeNull()
    expect(props.disableAutoscaling).toBeCalledWith(props.projectID, [`nfs-shares-type:shareTypeName`], true)
  })
})
