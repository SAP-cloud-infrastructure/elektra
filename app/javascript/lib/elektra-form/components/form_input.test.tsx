import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { FormInput, FormInputProps } from "./form_input"
import { FormContext, FormContextType } from "./form_context"

describe("FormInput", () => {
  const mockOnChange = vi.fn()

  const defaultContext = {
    formValues: {},
    formErrors: {},
    formName: "testForm",
    onChange: mockOnChange,
  }

  const renderWithContext = (contextValue: FormContextType, props: FormInputProps) => {
    return render(
      <FormContext.Provider value={contextValue}>
        <FormInput {...props} />
      </FormContext.Provider>
    )
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe("Basic Rendering", () => {
    it("should render an input element", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toBeInTheDocument()
    })

    it("should render a textarea element", () => {
      renderWithContext(defaultContext, {
        testId: "test-textarea",
        elementType: "textarea",
        name: "testField",
      })

      expect(screen.getByTestId("test-textarea")).toBeInTheDocument()
      expect(screen.getByTestId("test-textarea").tagName).toBe("TEXTAREA")
    })

    it("should render a select element with children", () => {
      renderWithContext(defaultContext, {
        testId: "test-select",
        elementType: "select",
        name: "testField",
        children: [
          <option key="1" value="1">
            Option 1
          </option>,
          <option key="2" value="2">
            Option 2
          </option>,
        ],
      })

      expect(screen.getByTestId("test-select")).toBeInTheDocument()
      expect(screen.getByTestId("test-select").tagName).toBe("SELECT")
    })
  })

  describe("ID Generation", () => {
    it("should generate id from formName and name when no id provided", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "email",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveAttribute("id", "testForm_email")
    })

    it("should use provided id when specified", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        id: "customId",
        name: "email",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveAttribute("id", "customId")
    })

    it("should use name as id when formName is not provided", () => {
      const contextWithoutFormName = { ...defaultContext, formName: undefined }

      renderWithContext(contextWithoutFormName, {
        testId: "test-input",
        elementType: "input",
        name: "email",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveAttribute("id", "email")
    })
  })

  describe("CSS Classes", () => {
    it("should apply form-control class for text input", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveClass("form-control")
    })

    it("should apply form-check-input class for checkbox", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "checkbox",
      })

      expect(screen.getByTestId("test-input")).toHaveClass("form-check-input")
    })

    it("should apply form-check-input class for radio", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "radio",
      })

      expect(screen.getByTestId("test-input")).toHaveClass("form-check-input")
    })

    it("should apply required class when required is true", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        required: true,
      })

      expect(screen.getByTestId("test-input")).toHaveClass("required")
    })

    it("should apply optional class when required is false", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        required: false,
      })

      expect(screen.getByTestId("test-input")).toHaveClass("optional")
    })

    it("should apply custom className", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        className: "custom-class another-class",
      })

      expect(screen.getByTestId("test-input")).toHaveClass("custom-class")
      expect(screen.getByTestId("test-input")).toHaveClass("another-class")
    })
  })

  describe("Validation Classes", () => {
    it("should not apply is-invalid class when field is valid", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).not.toHaveClass("is-invalid")
    })

    it("should apply is-invalid class when field has error", () => {
      const contextWithError = {
        ...defaultContext,
        formErrors: { testField: "This field is required" },
      }

      renderWithContext(contextWithError, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveClass("is-invalid")
    })

    it("should handle null formErrors gracefully", () => {
      const contextWithNullErrors = {
        ...defaultContext,
        formErrors: undefined,
      }

      renderWithContext(contextWithNullErrors, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).not.toHaveClass("is-invalid")
    })

    it("should handle undefined formErrors gracefully", () => {
      const contextWithoutErrors = {
        ...defaultContext,
        formErrors: undefined,
      }

      renderWithContext(contextWithoutErrors, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).not.toHaveClass("is-invalid")
    })
  })

  describe("Form Values", () => {
    it("should display value from context for text input", () => {
      const contextWithValue = {
        ...defaultContext,
        formValues: { testField: "test value" },
      }

      renderWithContext(contextWithValue, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveValue("test value")
    })

    it("should display empty string when value is undefined", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveValue("")
    })

    it("should set checked property for checkbox when value is true", () => {
      const contextWithValue = {
        ...defaultContext,
        formValues: { testField: true },
      }

      renderWithContext(contextWithValue, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "checkbox",
      })

      expect(screen.getByTestId("test-input")).toBeChecked()
    })

    it("should not set checked property for checkbox when value is false", () => {
      const contextWithValue = {
        ...defaultContext,
        formValues: { testField: false },
      }

      renderWithContext(contextWithValue, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "checkbox",
      })

      expect(screen.getByTestId("test-input")).not.toBeChecked()
    })

    it("should handle null formValues gracefully", () => {
      const contextWithNullValues = {
        ...defaultContext,
        formValues: undefined,
      }

      renderWithContext(contextWithNullValues, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      expect(screen.getByTestId("test-input")).toHaveValue("")
    })
  })

  describe("Change Handler", () => {
    it("should call onChange with correct arguments for text input", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      const input = screen.getByTestId("test-input")
      fireEvent.change(input, { target: { value: "new value" } })

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith("testField", "new value")
    })

    it("should call onChange with checked value for checkbox", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "checkbox",
      })

      const input = screen.getByTestId("test-input")
      fireEvent.click(input)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith("testField", true)
    })

    it("should call onChange with unchecked value for checkbox", () => {
      const contextWithValue = {
        ...defaultContext,
        formValues: { testField: true },
      }

      renderWithContext(contextWithValue, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "checkbox",
      })

      const input = screen.getByTestId("test-input")
      fireEvent.click(input)

      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith("testField", false)
    })

    it("should handle multiple onChange events", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      const input = screen.getByTestId("test-input")
      fireEvent.change(input, { target: { value: "first" } })
      fireEvent.change(input, { target: { value: "second" } })
      fireEvent.change(input, { target: { value: "third" } })

      expect(mockOnChange).toHaveBeenCalledTimes(3)
      expect(mockOnChange).toHaveBeenNthCalledWith(1, "testField", "first")
      expect(mockOnChange).toHaveBeenNthCalledWith(2, "testField", "second")
      expect(mockOnChange).toHaveBeenNthCalledWith(3, "testField", "third")
    })
  })

  describe("Other Props", () => {
    it("should pass through additional props", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        placeholder: "Enter text",
        disabled: true,
        "aria-label": "Test field",
      })

      const input = screen.getByTestId("test-input")
      expect(input).toHaveAttribute("placeholder", "Enter text")
      expect(input).toBeDisabled()
      expect(input).toHaveAttribute("aria-label", "Test field")
    })

    it("should handle maxLength prop", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        maxLength: 10,
      })

      expect(screen.getByTestId("test-input")).toHaveAttribute("maxLength", "10")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty string as className", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
        className: "",
      })

      const input = screen.getByTestId("test-input")
      expect(input.className).toContain("form-control")
    })

    it("should handle missing context onChange gracefully", () => {
      const contextWithoutOnChange = {
        ...defaultContext,
        onChange: undefined,
      }

      renderWithContext(contextWithoutOnChange, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "text",
      })

      const input = screen.getByTestId("test-input")
      // Should not throw error
      expect(() => fireEvent.change(input, { target: { value: "test" } })).not.toThrow()
    })

    it("should handle number input type", () => {
      const contextWithValue = {
        ...defaultContext,
        formValues: { testField: "42" },
      }

      renderWithContext(contextWithValue, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "number",
      })

      expect(screen.getByTestId("test-input")).toHaveValue(42)
    })

    it("should handle email input type", () => {
      renderWithContext(defaultContext, {
        testId: "test-input",
        elementType: "input",
        name: "testField",
        type: "email",
      })

      expect(screen.getByTestId("test-input")).toHaveAttribute("type", "email")
    })
  })
})
