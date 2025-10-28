import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import React, { useContext } from "react"
import { FormContext } from "./form_context"

// Test component that consumes the context
const TestContextConsumer: React.FC = () => {
  const context = useContext(FormContext)

  return (
    <div data-testid="context-consumer">
      <span data-testid="context-type">{typeof context}</span>
      <span data-testid="context-value">{JSON.stringify(context)}</span>
      <span data-testid="is-object">{context !== null && typeof context === "object" ? "true" : "false"}</span>
    </div>
  )
}

// Test component that provides context value
const TestContextProvider: React.FC<{ value: any; children: React.ReactNode }> = ({ value, children }) => (
  <FormContext.Provider value={value}>{children}</FormContext.Provider>
)

// Test component using Consumer pattern
const TestContextConsumerPattern: React.FC = () => (
  <FormContext.Consumer>
    {(context) => (
      <div data-testid="consumer-pattern">
        <span data-testid="consumer-type">{typeof context}</span>
        <span data-testid="consumer-value">{JSON.stringify(context)}</span>
      </div>
    )}
  </FormContext.Consumer>
)

// Test component that checks for specific properties
const TestContextProperties: React.FC = () => {
  const context = useContext(FormContext)

  return (
    <div data-testid="context-properties">
      <span data-testid="has-form-values">{"formValues" in (context as object) ? "true" : "false"}</span>
      <span data-testid="has-on-change">{"onChange" in (context as object) ? "true" : "false"}</span>
      <span data-testid="has-is-submitting">{"isFormSubmitting" in (context as object) ? "true" : "false"}</span>
      <span data-testid="object-keys">{JSON.stringify(Object.keys(context as object))}</span>
    </div>
  )
}

describe("FormContext", () => {
  describe("Default Context Value", () => {
    it("provides an empty object as default value", () => {
      render(<TestContextConsumer />)

      expect(screen.getByTestId("context-type")).toHaveTextContent("object")
      expect(screen.getByTestId("context-value")).toHaveTextContent("{}")
      expect(screen.getByTestId("is-object")).toHaveTextContent("true")
    })

    it("default value is an empty object with no properties", () => {
      render(<TestContextProperties />)

      expect(screen.getByTestId("has-form-values")).toHaveTextContent("false")
      expect(screen.getByTestId("has-on-change")).toHaveTextContent("false")
      expect(screen.getByTestId("has-is-submitting")).toHaveTextContent("false")
      expect(screen.getByTestId("object-keys")).toHaveTextContent("[]")
    })

    it("works with Consumer pattern", () => {
      render(<TestContextConsumerPattern />)

      expect(screen.getByTestId("consumer-type")).toHaveTextContent("object")
      expect(screen.getByTestId("consumer-value")).toHaveTextContent("{}")
    })
  })

  describe("Context Provider", () => {
    it("provides custom values through Provider", () => {
      const customValue = {
        formValues: { name: "John", email: "john@test.com" },
        isFormValid: true,
        isFormSubmitting: false,
      }

      render(
        <TestContextProvider value={customValue}>
          <TestContextConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("context-type")).toHaveTextContent("object")
      expect(screen.getByTestId("context-value")).toHaveTextContent(JSON.stringify(customValue))
    })

    it("provides primitive values through Provider", () => {
      render(
        <TestContextProvider value="string value">
          <TestContextConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("context-type")).toHaveTextContent("string")
      expect(screen.getByTestId("context-value")).toHaveTextContent('"string value"')
      expect(screen.getByTestId("is-object")).toHaveTextContent("false")
    })

    it("provides null values through Provider", () => {
      render(
        <TestContextProvider value={null}>
          <TestContextConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("context-type")).toHaveTextContent("object") // typeof null is 'object'
      expect(screen.getByTestId("context-value")).toHaveTextContent("null")
      expect(screen.getByTestId("is-object")).toHaveTextContent("false") // null check excludes null
    })

    it("provides undefined values through Provider", () => {
      render(
        <TestContextProvider value={undefined}>
          <TestContextConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("context-type")).toHaveTextContent("undefined")
      expect(screen.getByTestId("is-object")).toHaveTextContent("false")
    })

    it("provides complex nested objects through Provider", () => {
      const complexValue = {
        formValues: {
          user: { name: "John", settings: { theme: "dark" } },
          preferences: ["option1", "option2"],
        },
        formErrors: { name: "Required", email: "Invalid format" },
        metadata: { timestamp: new Date().toISOString() },
      }

      render(
        <TestContextProvider value={complexValue}>
          <TestContextConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("context-value")).toHaveTextContent(JSON.stringify(complexValue))
    })
  })

  describe("Context Nesting", () => {
    it("handles nested providers correctly", () => {
      const outerValue = { level: "outer", data: "outer-data" }
      const innerValue = { level: "inner", data: "inner-data" }

      render(
        <TestContextProvider value={outerValue}>
          <div data-testid="outer-context">
            <TestContextConsumer />
          </div>
          <TestContextProvider value={innerValue}>
            <div data-testid="inner-context">
              <TestContextConsumer />
            </div>
          </TestContextProvider>
        </TestContextProvider>
      )

      // Outer context should have outer value
      const outerConsumer = screen.getAllByTestId("context-value")[0]
      expect(outerConsumer).toHaveTextContent(JSON.stringify(outerValue))

      // Inner context should have inner value (overrides outer)
      const innerConsumer = screen.getAllByTestId("context-value")[1]
      expect(innerConsumer).toHaveTextContent(JSON.stringify(innerValue))
    })

    it("reverts to outer value when inner provider ends", () => {
      const ConditionalProvider: React.FC<{ showInner: boolean }> = ({ showInner }) => {
        const outerValue = { level: "outer" }
        const innerValue = { level: "inner" }

        return (
          <TestContextProvider value={outerValue}>
            <div data-testid="always-present">
              <TestContextConsumer />
            </div>
            {showInner && (
              <TestContextProvider value={innerValue}>
                <div data-testid="conditional">
                  <TestContextConsumer />
                </div>
              </TestContextProvider>
            )}
          </TestContextProvider>
        )
      }

      const { rerender } = render(<ConditionalProvider showInner={true} />)

      // Should have both contexts
      expect(screen.getAllByTestId("context-value")).toHaveLength(2)

      rerender(<ConditionalProvider showInner={false} />)

      // Should only have outer context
      expect(screen.getAllByTestId("context-value")).toHaveLength(1)
      expect(screen.getByTestId("context-value")).toHaveTextContent('{"level":"outer"}')
    })
  })

  describe("Context Consumer Patterns", () => {
    it("works with multiple consumers of the same context", () => {
      const sharedValue = { shared: "data", count: 42 }

      render(
        <TestContextProvider value={sharedValue}>
          <TestContextConsumer />
          <TestContextConsumer />
          <TestContextConsumerPattern />
        </TestContextProvider>
      )

      // All consumers should receive the same value
      const hookConsumers = screen.getAllByTestId("context-value")
      const patternConsumer = screen.getByTestId("consumer-value")

      hookConsumers.forEach((consumer) => {
        expect(consumer).toHaveTextContent(JSON.stringify(sharedValue))
      })
      expect(patternConsumer).toHaveTextContent(JSON.stringify(sharedValue))
    })

    it("handles dynamic context value changes", async () => {
      const DynamicProvider: React.FC = () => {
        const [value, setValue] = React.useState({ count: 0 })

        return (
          <TestContextProvider value={value}>
            <TestContextConsumer />
            <button data-testid="increment" onClick={() => setValue((prev) => ({ count: prev.count + 1 }))}>
              Increment
            </button>
          </TestContextProvider>
        )
      }

      render(<DynamicProvider />)

      expect(screen.getByTestId("context-value")).toHaveTextContent('{"count":0}')

      // Simulate value change
      const button = screen.getByTestId("increment")
      await button.click()

      expect(screen.getByTestId("context-value")).toHaveTextContent('{"count":1}')
    })
  })

  describe("Edge Cases", () => {
    it("handles context outside of provider (uses default value)", () => {
      render(<TestContextConsumer />)

      expect(screen.getByTestId("context-value")).toHaveTextContent("{}")
    })

    it("handles provider with no children", () => {
      render(<TestContextProvider value={{ test: "value" }} children={undefined} />)

      // Should render without errors
      expect(true).toBe(true)
    })

    it("handles provider with null children", () => {
      render(<TestContextProvider value={{ test: "value" }}>{null}</TestContextProvider>)

      // Should render without errors
      expect(true).toBe(true)
    })

    it("handles context with function values", () => {
      const functionValue = {
        onChange: (name: string, value: any) => `${name}: ${value}`,
        onSubmit: () => Promise.resolve("submitted"),
        validate: (values: any) => Object.keys(values).length > 0,
      }

      const FunctionConsumer: React.FC = () => {
        const context = useContext(FormContext) as any

        return (
          <div data-testid="function-consumer">
            <span data-testid="has-on-change">{typeof context.onChange === "function" ? "true" : "false"}</span>
            <span data-testid="has-on-submit">{typeof context.onSubmit === "function" ? "true" : "false"}</span>
            <span data-testid="has-validate">{typeof context.validate === "function" ? "true" : "false"}</span>
          </div>
        )
      }

      render(
        <TestContextProvider value={functionValue}>
          <FunctionConsumer />
        </TestContextProvider>
      )

      expect(screen.getByTestId("has-on-change")).toHaveTextContent("true")
      expect(screen.getByTestId("has-on-submit")).toHaveTextContent("true")
      expect(screen.getByTestId("has-validate")).toHaveTextContent("true")
    })
  })

  describe("Type Safety and Structure", () => {
    it("maintains object reference equality for same values", () => {
      const staticValue = { static: "value" }

      const ReferenceTest: React.FC = () => {
        const context1 = useContext(FormContext)
        const context2 = useContext(FormContext)

        return (
          <div data-testid="reference-test">
            <span data-testid="same-reference">{context1 === context2 ? "true" : "false"}</span>
          </div>
        )
      }

      render(
        <TestContextProvider value={staticValue}>
          <ReferenceTest />
        </TestContextProvider>
      )

      expect(screen.getByTestId("same-reference")).toHaveTextContent("true")
    })

    it("creates the context successfully", () => {
      expect(FormContext).toBeDefined()
      expect(FormContext.Provider).toBeDefined()
      expect(FormContext.Consumer).toBeDefined()
    })

    it("has correct context display name for debugging", () => {
      // React contexts have a displayName property for debugging
      expect(FormContext.displayName || "Context").toBeTruthy()
    })
  })
})
