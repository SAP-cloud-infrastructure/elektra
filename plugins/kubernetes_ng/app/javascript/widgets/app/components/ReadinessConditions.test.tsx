import React from "react"
import { render, screen, within, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ReadinessConditions from "./ReadinessConditions"
import {
  ReadinessConditionTrue,
  ReadinessConditionFalse,
  ReadinessConditionUnknown,
  ReadinessConditionPending,
} from "../mocks/data"
import { ReadinessCondition } from "../types/cluster"

describe("<ReadinessConditions />", () => {
  describe("badges", () => {
    it("renders conditions badges with correct text", () => {
      render(
        <ReadinessConditions
          conditions={[ReadinessConditionTrue, ReadinessConditionFalse, ReadinessConditionUnknown]}
        />
      )

      expect(screen.getByText("Ready")).toBeInTheDocument()
      expect(screen.getByText("CP")).toBeInTheDocument()
      expect(screen.getByText("OC")).toBeInTheDocument()
    })

    it("applies success variant when status is True without icon", () => {
      render(<ReadinessConditions conditions={[ReadinessConditionTrue]} data-testid="readiness-conditions" />)

      const badge = within(screen.getByTestId("readiness-conditions")).getByText(ReadinessConditionTrue.displayValue)
      expect(badge).toHaveAttribute("data-variant", "success")
      expect(within(badge).queryByRole("img")).not.toBeInTheDocument()
    })

    it("applies error variant when status is False and icon is present", () => {
      render(<ReadinessConditions conditions={[ReadinessConditionFalse]} data-testid="readiness-conditions" />)

      const badge = within(screen.getByTestId("readiness-conditions")).getByText(ReadinessConditionFalse.displayValue)
      expect(badge).toHaveAttribute("data-variant", "error")
      expect(within(badge).queryByRole("img")).toBeInTheDocument()
    })

    it("applies warning variant for any other status and icon is present", () => {
      render(
        <ReadinessConditions
          conditions={[ReadinessConditionUnknown, ReadinessConditionPending]}
          data-testid="readiness-conditions"
        />
      )

      const badge = within(screen.getByTestId("readiness-conditions")).getByText(ReadinessConditionUnknown.displayValue)
      expect(badge).toHaveAttribute("data-variant", "warning")
      expect(within(badge).queryByRole("img")).toBeInTheDocument()
      const badge2 = within(screen.getByTestId("readiness-conditions")).getByText(
        ReadinessConditionPending.displayValue
      )
      expect(badge2).toHaveAttribute("data-variant", "warning")
      expect(within(badge2).queryByRole("img")).toBeInTheDocument()
    })
  })

  describe("details", () => {
    let conditions: Array<ReadinessCondition> = []

    beforeEach(() => {
      conditions = [
        ReadinessConditionTrue,
        ReadinessConditionFalse,
        ReadinessConditionUnknown,
        ReadinessConditionPending,
      ]
    })

    it("renders only non-True conditions boxes initially", () => {
      render(<ReadinessConditions conditions={conditions} showDetails />)

      const boxes = screen.getAllByTestId("condition-box")
      expect(boxes).toHaveLength(3)
      expect(boxes[0]).toHaveTextContent(ReadinessConditionFalse.type)
      expect(boxes[1]).toHaveTextContent(ReadinessConditionUnknown.type)
      expect(boxes[2]).toHaveTextContent(ReadinessConditionPending.type)

      // True condition should not appear
      expect(screen.queryByText(ReadinessConditionTrue.type)).not.toBeInTheDocument()

      expect(
        within(screen.getByTestId("toggle-readiness-details")).getByText("Show full readiness details")
      ).toBeInTheDocument()
    })

    it("shows all conditions after clicking 'Show all'", async () => {
      render(<ReadinessConditions conditions={conditions} showDetails />)

      const toggle = screen.getByTestId("toggle-readiness-details")
      await act(async () => {
        fireEvent.click(toggle)
      })

      // all 3 should now appear
      const boxes = screen.getAllByTestId("condition-box")
      expect(boxes).toHaveLength(4)
      expect(
        within(screen.getByTestId("toggle-readiness-details")).getByText("Hide full readiness details")
      ).toBeInTheDocument()
    })

    it("hides healthy conditions again after clicking 'Hide healthy'", async () => {
      render(<ReadinessConditions conditions={conditions} showDetails />)

      const toggle = screen.getByTestId("toggle-readiness-details")
      // Expand to show all
      await act(async () => {
        fireEvent.click(toggle)
      })
      // Collapse to hide healthy
      act(() => {
        fireEvent.click(toggle)
      })

      const boxes = screen.getAllByTestId("condition-box")
      expect(boxes).toHaveLength(3)
    })

    it("does not render toggle or boxes when showDetails=false", () => {
      render(<ReadinessConditions conditions={conditions} showDetails={false} />)

      // Toggle link shouldn't appear
      expect(screen.queryByTestId("toggle-readiness-details")).not.toBeInTheDocument()

      // No boxes
      const boxes = screen.queryAllByTestId("condition-box")
      expect(boxes).toHaveLength(0)
    })
  })
})
