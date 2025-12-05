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

      expect(screen.getByText(ReadinessConditionTrue.displayValue)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionFalse.displayValue)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionUnknown.displayValue)).toBeInTheDocument()
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

    it("displays only non-True conditions boxes initially", () => {
      render(<ReadinessConditions conditions={conditions} showDetails data-testid="readiness-conditions" />)

      expect(screen.getByText(ReadinessConditionFalse.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionUnknown.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionPending.type)).toBeInTheDocument()

      // Healthy condition exists in the DOM but is inside collapse
      const collapse = screen.getByRole("region", { name: /Show full readiness details/i })
      expect(within(collapse).getByText(ReadinessConditionTrue.type)).toBeInTheDocument()

      // Button shows correct text and aria-expanded state
      const toggleButton = screen.getByRole("button", { name: /show full readiness details/i })
      expect(toggleButton).toHaveAttribute("aria-expanded", "false")

      // Click to expand
      fireEvent.click(toggleButton)
      expect(toggleButton).toHaveAttribute("aria-expanded", "true")
    })

    it("shows all conditions after clicking 'Show all'", async () => {
      render(<ReadinessConditions conditions={conditions} showDetails data-testid="readiness-conditions" />)

      const toggle = screen.getByRole("button", { name: /show full readiness details/i })
      await act(async () => {
        fireEvent.click(toggle)
      })

      expect(screen.getByText(ReadinessConditionFalse.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionUnknown.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionPending.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionTrue.type)).toBeInTheDocument()

      expect(
        within(screen.getByTestId("readiness-conditions")).getByText("Hide full readiness details")
      ).toBeInTheDocument()
    })

    it("hides healthy conditions again after clicking 'Hide healthy'", async () => {
      render(<ReadinessConditions conditions={conditions} showDetails />)

      const toggle = screen.getByRole("button", { name: /show full readiness details/i })
      // Expand to show all
      await act(async () => {
        fireEvent.click(toggle)
      })
      // Collapse to hide healthy
      act(() => {
        fireEvent.click(toggle)
      })

      expect(screen.getByText(ReadinessConditionFalse.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionUnknown.type)).toBeInTheDocument()
      expect(screen.getByText(ReadinessConditionPending.type)).toBeInTheDocument()
      // Healthy condition should still be in the DOM but inside collapse
      const collapse = screen.getByRole("region", { name: /Show full readiness details/i })
      expect(within(collapse).getByText(ReadinessConditionTrue.type)).toBeInTheDocument()
    })

    it("does not render toggle or boxes when showDetails=false", () => {
      render(<ReadinessConditions conditions={conditions} showDetails={false} />)

      // Toggle link shouldn't appear
      expect(screen.queryByRole("button", { name: /readiness-details/i })).not.toBeInTheDocument()

      // No boxes
      expect(screen.queryByText(ReadinessConditionFalse.type)).not.toBeInTheDocument()
      expect(screen.queryByText(ReadinessConditionUnknown.type)).not.toBeInTheDocument()
      expect(screen.queryByText(ReadinessConditionPending.type)).not.toBeInTheDocument()
      expect(screen.queryByText(ReadinessConditionTrue.type)).not.toBeInTheDocument()
    })
  })
})
