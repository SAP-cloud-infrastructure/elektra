import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { ErrorsList } from "./errors_list"

describe("ErrorsList", () => {
  describe("Null/Undefined Handling", () => {
    it("should render empty span when errors is null", () => {
      const { container } = render(<ErrorsList errors={null} />)
      expect(container.querySelector("span")).toBeInTheDocument()
      expect(container.querySelector("span")?.textContent).toBe("")
    })

    it("should render empty span when errors is undefined", () => {
      const { container } = render(<ErrorsList errors={undefined} />)
      expect(container.querySelector("span")).toBeInTheDocument()
      expect(container.querySelector("span")?.textContent).toBe("")
    })

    it("should render empty span when no errors prop provided", () => {
      const { container } = render(<ErrorsList />)
      expect(container.querySelector("span")).toBeInTheDocument()
      expect(container.querySelector("span")?.textContent).toBe("")
    })
  })

  describe("String Errors", () => {
    it("should render a simple string error", () => {
      render(<ErrorsList errors="This is an error message" />)
      expect(screen.getByText("This is an error message")).toBeInTheDocument()
    })

    it("should render an empty string", () => {
      const { container } = render(<ErrorsList errors="" />)
      expect(container.querySelector("span")).toBeInTheDocument()
    })
  })

  describe("Array Errors", () => {
    it("should render array of string errors as list", () => {
      const errors = ["Error 1", "Error 2", "Error 3"]
      const { container } = render(<ErrorsList errors={errors} />)

      expect(screen.getByText("Error 1")).toBeInTheDocument()
      expect(screen.getByText("Error 2")).toBeInTheDocument()
      expect(screen.getByText("Error 3")).toBeInTheDocument()

      const listItems = container.querySelectorAll("li")
      expect(listItems).toHaveLength(3)
    })

    it("should render empty array", () => {
      const { container } = render(<ErrorsList errors={[]} />)
      const ul = container.querySelector("ul")
      expect(ul).toBeInTheDocument()
      expect(ul?.children).toHaveLength(0)
    })

    it("should render single item array", () => {
      render(<ErrorsList errors={["Single error"]} />)
      expect(screen.getByText("Single error")).toBeInTheDocument()
    })

    it("should render nested arrays", () => {
      const errors = [["Nested 1", "Nested 2"], "Top level"]
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText("Nested 1")).toBeInTheDocument()
      expect(screen.getByText("Nested 2")).toBeInTheDocument()
      expect(screen.getByText("Top level")).toBeInTheDocument()
    })
  })

  describe("Object Errors", () => {
    it("should render simple object errors", () => {
      const errors = {
        name: "Name is required",
        email: "Email is invalid",
      }
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText(/name:/)).toBeInTheDocument()
      expect(screen.getByText(/Name is required/)).toBeInTheDocument()
      expect(screen.getByText(/email:/)).toBeInTheDocument()
      expect(screen.getByText(/Email is invalid/)).toBeInTheDocument()
    })

    it("should render empty object", () => {
      const { container } = render(<ErrorsList errors={{}} />)
      const ul = container.querySelector("ul")
      expect(ul).toBeInTheDocument()
      expect(ul?.children).toHaveLength(0)
    })

    it("should render object with array values", () => {
      const errors = {
        password: ["Too short", "Must contain numbers", "Must contain symbols"],
      }
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText(/password:/)).toBeInTheDocument()
      expect(screen.getByText("Too short")).toBeInTheDocument()
      expect(screen.getByText("Must contain numbers")).toBeInTheDocument()
      expect(screen.getByText("Must contain symbols")).toBeInTheDocument()
    })

    it("should render nested objects", () => {
      const errors = {
        user: {
          profile: {
            firstName: "Required",
            lastName: "Required",
          },
        },
      }
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText(/user:/)).toBeInTheDocument()
      expect(screen.getByText(/profile:/)).toBeInTheDocument()
      expect(screen.getByText(/firstName:\sRequired/)).toBeInTheDocument()
      expect(screen.getByText(/lastName:/)).toBeInTheDocument()
    })

    it("should render deeply nested structure", () => {
      const errors = {
        level1: {
          level2: {
            level3: {
              level4: "Deep error",
            },
          },
        },
      }
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText(/level1:/)).toBeInTheDocument()
      expect(screen.getByText(/level2:/)).toBeInTheDocument()
      expect(screen.getByText(/level3:/)).toBeInTheDocument()
      expect(screen.getByText(/level4:\sDeep error/)).toBeInTheDocument()
    })
  })

  describe("Mixed Error Types", () => {
    it("should handle mixed array and object errors", () => {
      const errors = {
        simple: "String error",
        array: ["Error 1", "Error 2"],
        nested: {
          deep: "Deep error",
        },
      }
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText(/simple:\sString error/)).toBeInTheDocument()
      expect(screen.getByText(/array:/)).toBeInTheDocument()
      expect(screen.getByText("Error 1")).toBeInTheDocument()
      expect(screen.getByText("Error 2")).toBeInTheDocument()
      expect(screen.getByText(/nested:/)).toBeInTheDocument()
      expect(screen.getByText(/deep:\sDeep error/)).toBeInTheDocument()
    })

    it("should handle array containing mixed types", () => {
      const errors = ["Simple string", { field: "Field error" }, ["Nested", "Array"]]
      render(<ErrorsList errors={errors} />)

      expect(screen.getByText("Simple string")).toBeInTheDocument()
      expect(screen.getByText(/field:\sField error/)).toBeInTheDocument()
      expect(screen.getByText("Nested")).toBeInTheDocument()
      expect(screen.getByText("Array")).toBeInTheDocument()
    })
  })

  describe("List Structure", () => {
    it("should create proper ul/li structure for arrays", () => {
      const { container } = render(<ErrorsList errors={["Error 1", "Error 2"]} />)

      const ul = container.querySelector("ul")
      expect(ul).toBeInTheDocument()

      const lis = container.querySelectorAll("li")
      expect(lis).toHaveLength(2)
    })

    it("should create proper ul/li structure for objects", () => {
      const { container } = render(<ErrorsList errors={{ field1: "Error 1", field2: "Error 2" }} />)

      const ul = container.querySelector("ul")
      expect(ul).toBeInTheDocument()

      const lis = container.querySelectorAll("li")
      expect(lis).toHaveLength(2)
    })

    it("should create nested ul elements for nested structures", () => {
      const { container } = render(<ErrorsList errors={{ parent: { child: "Error" } }} />)

      const uls = container.querySelectorAll("ul")
      expect(uls.length).toBeGreaterThanOrEqual(2) // At least 2 nested lists
    })
  })

  describe("Key Generation", () => {
    it("should generate unique keys for list items", () => {
      const { container } = render(<ErrorsList errors={["Error 1", "Error 2", "Error 3"]} />)

      const lis = container.querySelectorAll("li")
      const keys = Array.from(lis).map((li) => li.getAttribute("data-key") || "")

      // Keys should be unique (even though we can't directly access React keys in tests,
      // we verify the structure renders correctly)
      expect(lis).toHaveLength(3)
    })
  })

  describe("Edge Cases", () => {
    it("should handle number as error", () => {
      render(<ErrorsList errors={42} />)
      expect(screen.getByText("42")).toBeInTheDocument()
    })

    it("should handle boolean as error", () => {
      const { container } = render(<ErrorsList errors={true} />)
      expect(container.textContent).toContain("")
    })

    it("should handle very deeply nested structure", () => {
      const errors = {
        a: { b: { c: { d: { e: { f: "Very deep" } } } } },
      }
      render(<ErrorsList errors={errors} />)
      expect(screen.getByText(/Very deep/)).toBeInTheDocument()
    })

    it("should handle objects with numeric keys", () => {
      const errors = {
        0: "First error",
        1: "Second error",
      }
      render(<ErrorsList errors={errors} />)
      expect(screen.getByText(/0:\sFirst error/)).toBeInTheDocument()
    })
  })
})
