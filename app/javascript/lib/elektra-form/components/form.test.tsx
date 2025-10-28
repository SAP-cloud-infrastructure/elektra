import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from "vitest"
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React, { useContext } from "react"
import Form from "./form"
import { FormContext } from "./form_context"
import { FormInput } from "./form_input"

// Types for test components
interface TestInputProps {
  values?: Record<string, unknown>
  name: string
}

// Test components using the same pattern as your working FormContext tests
const TestInput: React.FC<TestInputProps> = ({ values, name }) => {
  const context = useContext(FormContext) as any

  return (
    <input
      data-testid={`input-${name}`}
      name={name}
      value={context?.formValues?.[name] || ""}
      onChange={(e) => context?.onChange?.(name, e.target.value)}
    />
  )
}

const TestDisplay: React.FC = () => {
  const context = useContext(FormContext) as any

  return (
    <div data-testid="form-state">
      <span data-testid="values">{JSON.stringify(context?.formValues || {})}</span>
      <span data-testid="submitting">{(context?.isFormSubmitting || false).toString()}</span>
      <span data-testid="valid">{(context?.isFormValid || false).toString()}</span>
      <span data-testid="errors">{JSON.stringify(context?.formErrors || null)}</span>
    </div>
  )
}

// Test child component that receives values prop
const TestChild: React.FC<{ values?: Record<string, any> }> = ({ values }) => (
  <div data-testid="child-values">{JSON.stringify(values || {})}</div>
)

describe("Form Component", () => {
  let mockValidate: MockedFunction<(values: Record<string, any>) => boolean>
  let mockOnSubmit: MockedFunction<(values: Record<string, any>) => Promise<any>>
  let mockOnValueChange: MockedFunction<(name: string | Record<string, any>, values: Record<string, any>) => void>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    console.log(`Running test: ${expect.getState().currentTestName}`)
    mockValidate = vi.fn()
    mockOnSubmit = vi.fn()
    mockOnValueChange = vi.fn()
    user = userEvent.setup()
  })

  beforeEach(() => {
    mockValidate = vi.fn()
    mockOnSubmit = vi.fn()
    mockOnValueChange = vi.fn()
    user = userEvent.setup()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State and Props", () => {
    it("renders with default initial state", () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent("{}")
      expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      expect(screen.getByTestId("valid")).toHaveTextContent("true")
      expect(screen.getByTestId("errors")).toHaveTextContent("null")
    })

    it("initializes with provided initialValues", () => {
      const initialValues = { name: "John", email: "john@example.com" }
      mockValidate.mockReturnValue(true)

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(initialValues))
      expect(mockValidate).toHaveBeenCalledWith(initialValues)
    })

    it("sets isValid based on validate function result", () => {
      mockValidate.mockReturnValue(false)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("valid")).toHaveTextContent("false")
    })

    it("applies className to form element", () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form className="custom-form-class" validate={mockValidate} onSubmit={mockOnSubmit}>
          <div>Content</div>
        </Form>
      )
      const form = screen.getByTestId("elektra-form")
      expect(form).toHaveClass("custom-form-class")
    })

    it("uses default props correctly", () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent("{}") // Empty initialValues
    })
  })

  describe("Value Updates", () => {
    it("updates single value via updateValue method", async () => {
      mockValidate.mockReturnValue(true)
      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="username" />
          <TestDisplay />
        </Form>
      )
      const input = screen.getByTestId("input-username")

      await user.type(input, "testuser")

      // Wait for the state to update
      await waitFor(() => {
        expect(screen.getByTestId("values")).toHaveTextContent('{"username":"testuser"}')
      })

      // Check that validate was called with final value
      await waitFor(() => {
        expect(mockValidate).toHaveBeenCalledWith({ username: "testuser" })
      })
    })

    it("updates multiple values via multiple input changes", async () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="name" />
          <TestInput name="email" />
          <TestDisplay />
        </Form>
      )

      const nameInput = screen.getByTestId("input-name")
      const emailInput = screen.getByTestId("input-email")

      await user.type(nameInput, "John")
      await user.type(emailInput, "john@test.com")

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify({ name: "John", email: "john@test.com" }))
    })

    it("calls onValueChange callback when provided", async () => {
      mockValidate.mockReturnValue(true)
      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit} onValueChange={mockOnValueChange}>
          <TestInput name="test" />
        </Form>
      )

      const input = screen.getByTestId("input-test")
      await user.type(input, "value")

      // Wait for the callback to be called (due to setTimeout)
      await waitFor(() => {
        expect(mockOnValueChange).toHaveBeenCalledWith("test", { test: "value" })
      })
    })

    it("updates validation state when values change", async () => {
      let callCount = 0
      mockValidate.mockImplementation(() => {
        callCount++
        return callCount === 1 // true for initial, false for subsequent calls
      })

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="test" />
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("valid")).toHaveTextContent("true")

      const input = screen.getByTestId("input-test")
      await user.type(input, "invalid")

      await waitFor(() => {
        expect(screen.getByTestId("valid")).toHaveTextContent("false")
      })
    })
  })

  describe("Form Events", async () => {
    it("handles onChange events from form elements", () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <FormInput
            testId="native-input"
            elementType="input"
            type="text"
            id="test"
            name="nativeField"
            children={null}
          />
          {/* <input data-testid="native-input" name="nativeField" /> */}
          <TestDisplay />
        </Form>
      )

      const input = screen.getByTestId("native-input")
      fireEvent.change(input, { target: { name: "nativeField", value: "test" } })

      expect(screen.getByTestId("values")).toHaveTextContent('{"nativeField":"test"}')
    })
  })

  describe("Form Submission", () => {
    it("handles successful form submission with immediate resolution", async () => {
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({ success: true })

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })

      expect(screen.getByTestId("submitting")).toHaveTextContent("false")

      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith({})

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      })
    })

    it("shows submitting state during form submission", async () => {
      mockValidate.mockReturnValue(true)
      let resolveSubmit: (value: any) => void
      mockOnSubmit.mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve
        })
      )

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      // Should show submitting state
      expect(screen.getByTestId("submitting")).toHaveTextContent("true")

      // Resolve the promise
      resolveSubmit!({ success: true })

      await waitFor(() => {
        expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      })
    })

    it("resets form after successful submission when resetForm is true (default)", async () => {
      const initialValues = { name: "John" }
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({ success: true })

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(initialValues))

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId("values")).toHaveTextContent("{}")
      })
    })

    it("does not reset form after successful submission when resetForm is false", async () => {
      const initialValues = { name: "John" }
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({ success: true })

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit} resetForm={false}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      })

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(initialValues))
    })

    it("handles submission errors", async () => {
      mockValidate.mockReturnValue(true)
      const errorResponse = { errors: { name: "Name is required" } }
      mockOnSubmit.mockRejectedValue(errorResponse)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId("errors")).toHaveTextContent(JSON.stringify(errorResponse.errors))
        expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      })
    })
    it("prevents default on form submission", async () => {
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({})

      // Mock the form's submit method to detect if preventDefault worked
      const mockSubmit = vi.fn()

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <button type="submit">Submit</button>
        </Form>
      )

      const form = screen.getByTestId("elektra-form") as HTMLFormElement
      form.submit = mockSubmit

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      // If preventDefault works, the native form.submit() shouldn't be called
      expect(mockSubmit).not.toHaveBeenCalled()
      // But our custom onSubmit should be called
      expect(mockOnSubmit).toHaveBeenCalledWith({})
    })

    it("passes current form values to onSubmit", async () => {
      const initialValues = { name: "John", email: "john@test.com" }
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({})

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith(initialValues)
    })
  })
  describe("Lifecycle Methods", () => {
    it("updates values when initialValues prop changes and current values are empty", () => {
      const { rerender } = render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent("{}")

      const newInitialValues = { name: "Updated" }
      mockValidate.mockReturnValue(true)

      rerender(
        <Form initialValues={newInitialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(newInitialValues))
    })

    it("does not update values when initialValues prop changes and current values are not empty", async () => {
      mockValidate.mockReturnValue(true)

      const { rerender } = render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="test" />
          <TestDisplay />
        </Form>
      )

      // Add some values first
      const input = screen.getByTestId("input-test")
      await user.type(input, "existing")

      expect(screen.getByTestId("values")).toHaveTextContent('{"test":"existing"}')

      // Try to update initialValues
      const newInitialValues = { name: "Should not update" }
      rerender(
        <Form initialValues={newInitialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="test" />
          <TestDisplay />
        </Form>
      )

      // Values should remain unchanged
      expect(screen.getByTestId("values")).toHaveTextContent('{"test":"existing"}')
    })
  })
  describe("Form Reset", () => {
    it("resets form after successful submission when resetForm is true", async () => {
      const initialValues = { name: "John" }
      mockValidate.mockReturnValue(true)
      mockOnSubmit.mockResolvedValue({ success: true })

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit} resetForm={true}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(initialValues))

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId("values")).toHaveTextContent("{}")
        expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      })
    })
  })

  describe("Context Provider", () => {
    it("provides correct context values to children", () => {
      const initialValues = { name: "Test" }
      mockValidate.mockReturnValue(true)

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("values")).toHaveTextContent(JSON.stringify(initialValues))
      expect(screen.getByTestId("submitting")).toHaveTextContent("false")
      expect(screen.getByTestId("valid")).toHaveTextContent("true")
      expect(screen.getByTestId("errors")).toHaveTextContent("null")
    })

    it("renders children with values prop", () => {
      const initialValues = { test: "value" }
      mockValidate.mockReturnValue(true)

      render(
        <Form initialValues={initialValues} validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestChild />
        </Form>
      )

      expect(screen.getByTestId("child-values")).toHaveTextContent(JSON.stringify(initialValues))
    })

    it("handles null children gracefully", () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          {null}
          <div>Valid child</div>
          {undefined}
        </Form>
      )

      expect(screen.getByText("Valid child")).toBeInTheDocument()
    })

    it("updates context when form state changes", async () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="contextTest" />
          <TestDisplay />
        </Form>
      )

      const input = screen.getByTestId("input-contextTest")
      await user.type(input, "updated")

      // Context should reflect the updated values
      expect(screen.getByTestId("values")).toHaveTextContent('{"contextTest":"updated"}')
    })
  })

  describe("Validation Integration", () => {
    it("calls validate function with correct parameters", async () => {
      mockValidate.mockReturnValue(true)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="email" />
        </Form>
      )

      const input = screen.getByTestId("input-email")
      await user.type(input, "test@example.com")

      expect(mockValidate).toHaveBeenLastCalledWith({ email: "test@example.com" })
    })

    it("handles validate function that returns truthy/falsy values", async () => {
      mockValidate
        .mockReturnValueOnce(true) // Initial - truthy
        .mockReturnValueOnce(false) // After change - falsy

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestInput name="test" />
          <TestDisplay />
        </Form>
      )

      expect(screen.getByTestId("valid")).toHaveTextContent("true")

      const input = screen.getByTestId("input-test")
      await user.type(input, "test")

      expect(screen.getByTestId("valid")).toHaveTextContent("false")
    })
  })

  describe("Error Handling", () => {
    it("handles submission errors with different error formats", async () => {
      mockValidate.mockReturnValue(true)

      const errorWithErrors = {
        errors: { field1: "Error 1", field2: "Error 2" },
        message: "Validation failed",
      }
      mockOnSubmit.mockRejectedValue(errorWithErrors)

      render(
        <Form validate={mockValidate} onSubmit={mockOnSubmit}>
          <TestDisplay />
          <button type="submit">Submit</button>
        </Form>
      )

      const submitButton = screen.getByRole("button", { name: /submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId("errors")).toHaveTextContent(JSON.stringify(errorWithErrors.errors))
      })
    })
  })
})
