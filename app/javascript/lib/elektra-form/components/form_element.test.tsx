import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { FormElement, FormElementHorizontal, FormElementInline } from "./form_element"
import { FormContext } from "./form_context"

describe("FormElement", () => {
  const defaultContext = {
    formValues: {},
    formErrors: {},
    formName: "testForm",
    onChange: () => {},
  }

  const renderWithContext = (contextValue: any, props: any) => {
    return render(
      <FormContext.Provider value={contextValue}>
        <FormElement {...props} />
      </FormContext.Provider>
    )
  }

  beforeEach(() => {
    // Clean up between tests if needed
  })

  describe("Basic Rendering", () => {
    it("should render a form group with label and children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      expect(screen.getByText("Test Label")).toBeInTheDocument()
      expect(container.querySelector("input")).toBeInTheDocument()
      expect(container.querySelector(".form-group")).toBeInTheDocument()
    })

    it("should render without children", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
      })

      expect(screen.getByText("Test Label")).toBeInTheDocument()
    })

    it("should render with string children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: "String content",
      })

      expect(screen.getByText("String content")).toBeInTheDocument()
    })

    it("should render with multiple children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: [<input key="1" type="text" />, <span key="2">Help text</span>],
      })

      expect(container.querySelector("input")).toBeInTheDocument()
      expect(screen.getByText("Help text")).toBeInTheDocument()
    })

    it("should handle null children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: null,
      })

      expect(screen.getByText("Test Label")).toBeInTheDocument()
    })

    it("should filter out null children in array", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: [<input key="1" type="text" />, null, <span key="2">Text</span>],
      })

      expect(container.querySelector("input")).toBeInTheDocument()
      expect(screen.getByText("Text")).toBeInTheDocument()
    })
  })

  describe("Label Generation", () => {
    it("should generate label with correct htmlFor from formName and name", () => {
      renderWithContext(defaultContext, {
        label: "Email",
        name: "email",
        children: <input type="text" />,
      })

      const label = screen.getByText("Email").closest("label")
      expect(label).toHaveAttribute("for", "testForm_email")
    })

    it("should use name as htmlFor when formName is not provided", () => {
      const contextWithoutFormName = { ...defaultContext, formName: undefined }

      renderWithContext(contextWithoutFormName, {
        label: "Email",
        name: "email",
        children: <input type="text" />,
      })

      const label = screen.getByText("Email").closest("label")
      expect(label).toHaveAttribute("for", "email")
    })

    it("should apply control-label class by default", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("control-label")
    })

    it("should apply custom labelClass", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        labelClass: "custom-label-class",
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("custom-label-class")
      expect(label).not.toHaveClass("control-label")
    })
  })

  describe("Required Field Handling", () => {
    it("should apply optional class when required is false", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        required: false,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("optional")
      expect(label).not.toHaveClass("required")
    })

    it("should apply required class when required is true", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        required: true,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("required")
      expect(label).not.toHaveClass("optional")
    })

    it("should show asterisk when required is true", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        required: true,
        children: <input type="text" />,
      })

      const abbr = screen.getByTitle("required")
      expect(abbr).toBeInTheDocument()
      expect(abbr.textContent).toBe("*")
      expect(abbr.tagName).toBe("ABBR")
    })

    it("should not show asterisk when required is false", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        required: false,
        children: <input type="text" />,
      })

      const abbr = screen.queryByTitle("required")
      expect(abbr).not.toBeInTheDocument()
    })
  })

  describe("Validation Classes", () => {
    it("should not apply has-error class when field is valid", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).not.toHaveClass("has-error")
    })

    it("should apply has-error class when field has error", () => {
      const contextWithError = {
        ...defaultContext,
        formErrors: { testField: "This field is required" },
      }

      const { container } = renderWithContext(contextWithError, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).toHaveClass("has-error")
    })

    it("should handle null formErrors gracefully", () => {
      const contextWithNullErrors = {
        ...defaultContext,
        formErrors: null,
      }

      const { container } = renderWithContext(contextWithNullErrors, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).not.toHaveClass("has-error")
    })

    it("should handle undefined formErrors gracefully", () => {
      const contextWithUndefinedErrors = {
        ...defaultContext,
        formErrors: undefined,
      }

      const { container } = renderWithContext(contextWithUndefinedErrors, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).not.toHaveClass("has-error")
    })

    it("should handle non-object formErrors gracefully", () => {
      const contextWithInvalidErrors = {
        ...defaultContext,
        formErrors: "invalid",
      }

      const { container } = renderWithContext(contextWithInvalidErrors, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).not.toHaveClass("has-error")
    })
  })

  describe("Horizontal Layout", () => {
    it("should not apply horizontal layout by default", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).not.toHaveClass("col-sm-4")
      expect(container.querySelector(".col-sm-8")).not.toBeInTheDocument()
    })

    it("should apply horizontal layout when horizontal is true", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-4")
      expect(container.querySelector(".col-sm-8")).toBeInTheDocument()
    })

    it("should use default labelWidth of 4 for horizontal layout", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-4")
      expect(container.querySelector(".col-sm-8")).toBeInTheDocument()
    })

    it("should use custom labelWidth for horizontal layout", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        labelWidth: 3,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-3")
      expect(container.querySelector(".col-sm-9")).toBeInTheDocument()
    })

    it("should calculate correct column width for input wrapper", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        labelWidth: 2,
        children: <input type="text" />,
      })

      expect(container.querySelector(".col-sm-10")).toBeInTheDocument()
    })

    it("should apply row class when not inline", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).toHaveClass("row")
    })
  })

  describe("Inline Layout", () => {
    it("should not render input-wrapper when inline is true", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        inline: true,
        children: <input type="text" />,
      })

      expect(container.querySelector(".input-wrapper")).not.toBeInTheDocument()
    })

    it("should render input-wrapper when inline is false", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        inline: false,
        children: <input type="text" />,
      })

      expect(container.querySelector(".input-wrapper")).toBeInTheDocument()
    })

    it("should not apply row class when inline is true", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        inline: true,
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).not.toHaveClass("row")
    })
  })

  describe("Children Name Prop", () => {
    it("should pass name prop to children without name", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" data-testid="test-input" />,
      })

      const input = screen.getByTestId("test-input")
      expect(input).toHaveAttribute("name", "testField")
    })

    it("should preserve existing name prop on children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: <input type="text" name="customName" data-testid="test-input" />,
      })

      const input = screen.getByTestId("test-input")
      expect(input).toHaveAttribute("name", "customName")
    })

    it("should pass name to multiple children", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: [
          <input key="1" type="text" data-testid="input-1" />,
          <input key="2" type="text" data-testid="input-2" />,
        ],
      })

      expect(screen.getByTestId("input-1")).toHaveAttribute("name", "testField")
      expect(screen.getByTestId("input-2")).toHaveAttribute("name", "testField")
    })

    it("should handle children with and without name props", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        children: [
          <input key="1" type="text" data-testid="input-1" />,
          <input key="2" type="text" name="custom" data-testid="input-2" />,
        ],
      })

      expect(screen.getByTestId("input-1")).toHaveAttribute("name", "testField")
      expect(screen.getByTestId("input-2")).toHaveAttribute("name", "custom")
    })
  })

  describe("Complex Layouts", () => {
    it("should handle horizontal and required together", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        required: true,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-4")
      expect(label).toHaveClass("required")
      expect(screen.getByTitle("required")).toBeInTheDocument()
    })

    it("should handle horizontal with error state", () => {
      const contextWithError = {
        ...defaultContext,
        formErrors: { testField: "Error" },
      }

      const { container } = renderWithContext(contextWithError, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        children: <input type="text" />,
      })

      const formGroup = container.querySelector(".form-group")
      expect(formGroup).toHaveClass("has-error")
      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-4")
    })

    it("should handle inline with required", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        inline: true,
        required: true,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("required")
      expect(container.querySelector(".input-wrapper")).not.toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty label", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "",
        name: "testField",
        children: <input type="text" />,
      })

      const label = container.querySelector("label")
      expect(label).toBeInTheDocument()
      expect(label?.textContent).toBe("")
    })

    it("should handle labelWidth of 12", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        labelWidth: 12,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-12")
      expect(container.querySelector(".col-sm-0")).toBeInTheDocument()
    })

    it("should handle labelWidth of 0", () => {
      const { container } = renderWithContext(defaultContext, {
        label: "Test Label",
        name: "testField",
        horizontal: true,
        labelWidth: 0,
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveClass("col-sm-0")
      expect(container.querySelector(".col-sm-12")).toBeInTheDocument()
    })

    it("should handle special characters in name", () => {
      renderWithContext(defaultContext, {
        label: "Test Label",
        name: "test-field_123",
        children: <input type="text" />,
      })

      const label = screen.getByText("Test Label").closest("label")
      expect(label).toHaveAttribute("for", "testForm_test-field_123")
    })
  })
})

describe("FormElementHorizontal", () => {
  const defaultContext = {
    formValues: {},
    formErrors: {},
    formName: "testForm",
    onChange: () => {},
  }

  const renderWithContext = (contextValue: any, props: any) => {
    return render(
      <FormContext.Provider value={contextValue}>
        <FormElementHorizontal {...props} />
      </FormContext.Provider>
    )
  }

  it("should render with horizontal layout by default", () => {
    const { container } = renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      children: <input type="text" />,
    })

    const label = screen.getByText("Test Label").closest("label")
    expect(label).toHaveClass("col-sm-4")
    expect(container.querySelector(".col-sm-8")).toBeInTheDocument()
  })

  it("should accept and pass through all FormElement props", () => {
    const { container } = renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      required: true,
      labelWidth: 3,
      children: <input type="text" />,
    })

    const label = screen.getByText("Test Label").closest("label")
    expect(label).toHaveClass("col-sm-3")
    expect(label).toHaveClass("required")
    expect(screen.getByTitle("required")).toBeInTheDocument()
  })

  it("should override horizontal prop even if explicitly set to false", () => {
    const { container } = renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      horizontal: false,
      children: <input type="text" />,
    })

    const label = screen.getByText("Test Label").closest("label")
    screen.debug()
    expect(label).toHaveClass("col-sm-4")
  })
})

describe("FormElementInline", () => {
  const defaultContext = {
    formValues: {},
    formErrors: {},
    formName: "testForm",
    onChange: () => {},
  }

  const renderWithContext = (contextValue: any, props: any) => {
    return render(
      <FormContext.Provider value={contextValue}>
        <FormElementInline {...props} />
      </FormContext.Provider>
    )
  }

  it("should render with inline layout by default", () => {
    const { container } = renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      children: <input type="text" />,
    })

    expect(container.querySelector(".input-wrapper")).not.toBeInTheDocument()
    const formGroup = container.querySelector(".form-group")
    expect(formGroup).not.toHaveClass("row")
  })

  it("should accept and pass through all FormElement props", () => {
    renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      required: true,
      children: <input type="text" />,
    })

    const label = screen.getByText("Test Label").closest("label")
    expect(label).toHaveClass("required")
    expect(screen.getByTitle("required")).toBeInTheDocument()
  })

  it("should override inline prop even if explicitly set to false", () => {
    const { container } = renderWithContext(defaultContext, {
      label: "Test Label",
      name: "testField",
      inline: false,
      children: <input type="text" />,
    })

    expect(container.querySelector(".input-wrapper")).not.toBeInTheDocument()
  })
})
