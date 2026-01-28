import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { FormErrors } from "./form_errors"
import { FormContext } from "./form_context"

describe("FormErrors", () => {
  const defaultContext = {
    formValues: {},
    formErrors: null,
    formName: "testForm",
    onChange: () => {},
  }

  const renderWithContext = (contextValue: any, props = {}) => {
    return render(
      <FormContext.Provider value={contextValue}>
        <FormErrors {...props} />
      </FormContext.Provider>
    )
  }

  describe("Rendering", () => {
    it("should return null when no errors are provided", () => {
      const { container } = renderWithContext(defaultContext)
      expect(container.firstChild).toBeNull()
    })

    it("should return null when formErrors is null", () => {
      const contextWithNullErrors = {
        ...defaultContext,
        formErrors: null,
      }
      const { container } = renderWithContext(contextWithNullErrors)
      expect(container.firstChild).toBeNull()
    })

    it("should return null when formErrors is undefined", () => {
      const contextWithUndefinedErrors = {
        ...defaultContext,
        formErrors: undefined,
      }
      const { container } = renderWithContext(contextWithUndefinedErrors)
      expect(container.firstChild).toBeNull()
    })

    it("should render errors from context", () => {
      const contextWithErrors = {
        ...defaultContext,
        formErrors: { field1: "Error message" },
      }
      const { container } = renderWithContext(contextWithErrors)
      expect(container.firstChild).toBeInTheDocument()
      expect(screen.getByText(/field1:/)).toBeInTheDocument()
    })

    it("should render errors from props", () => {
      render(<FormErrors errors={{ field1: "Error from props" }} />)
      expect(screen.getByText(/field1:/)).toBeInTheDocument()
      expect(screen.getByText(/Error from props/)).toBeInTheDocument()
    })

    it("should prioritize props errors over context errors", () => {
      const contextWithErrors = {
        ...defaultContext,
        formErrors: { field1: "Context error" },
      }
      renderWithContext(contextWithErrors, { errors: { field2: "Props error" } })
      expect(screen.getByText(/field2:/)).toBeInTheDocument()
      expect(screen.getByText(/Props error/)).toBeInTheDocument()
      expect(screen.queryByText(/field1:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Context error/)).not.toBeInTheDocument()
    })
  })

  describe("CSS Classes", () => {
    it("should apply default className", () => {
      const contextWithErrors = {
        ...defaultContext,
        formErrors: { field1: "Error" },
      }
      const { container } = renderWithContext(contextWithErrors)
      const div = container.firstChild as HTMLElement
      expect(div).toHaveClass("alert")
      expect(div).toHaveClass("alert-error")
    })

    it("should apply custom className", () => {
      const contextWithErrors = {
        ...defaultContext,
        formErrors: { field1: "Error" },
      }
      const { container } = renderWithContext(contextWithErrors, {
        className: "custom-error-class",
      })
      const div = container.firstChild as HTMLElement
      expect(div).toHaveClass("custom-error-class")
      expect(div).not.toHaveClass("alert")
    })
  })

  describe("Error Types", () => {
    it("should render string errors", () => {
      render(<FormErrors errors={{ field1: "Simple error message" }} />)
      expect(screen.getByText(/Simple error message/)).toBeInTheDocument()
    })

    it("should render array of errors", () => {
      render(<FormErrors errors={{ field1: ["Error 1", "Error 2", "Error 3"] }} />)
      expect(screen.getByText(/Error 1/)).toBeInTheDocument()
      expect(screen.getByText(/Error 2/)).toBeInTheDocument()
      expect(screen.getByText(/Error 3/)).toBeInTheDocument()
    })

    it("should render nested object errors", () => {
      render(
        <FormErrors
          errors={{
            user: {
              name: "Name is required",
              email: "Email is invalid",
            },
          }}
        />
      )
      expect(screen.getByText(/user:/)).toBeInTheDocument()
      expect(screen.getByText(/name:/)).toBeInTheDocument()
      expect(screen.getByText(/Name is required/)).toBeInTheDocument()
      expect(screen.getByText(/email:/)).toBeInTheDocument()
      expect(screen.getByText(/Email is invalid/)).toBeInTheDocument()
    })

    it("should render deeply nested errors", () => {
      render(
        <FormErrors
          errors={{
            level1: {
              level2: {
                level3: "Deep error",
              },
            },
          }}
        />
      )
      expect(screen.getByText(/level1:/)).toBeInTheDocument()
      expect(screen.getByText(/level2:/)).toBeInTheDocument()
      expect(screen.getByText(/level3:/)).toBeInTheDocument()
      expect(screen.getByText(/Deep error/)).toBeInTheDocument()
    })
  })

  describe("Other Props", () => {
    it("should pass through additional props", () => {
      const contextWithErrors = {
        ...defaultContext,
        formErrors: { field1: "Error" },
      }
      const { container } = renderWithContext(contextWithErrors, {
        "data-testid": "error-container",
        role: "alert",
      })
      const div = container.firstChild as HTMLElement
      expect(div).toHaveAttribute("data-testid", "error-container")
      expect(div).toHaveAttribute("role", "alert")
    })
  })
})
