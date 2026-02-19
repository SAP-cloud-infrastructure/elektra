import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseError, FormatRequestData } from "./helper"

describe("helper.ts", () => {
  describe("parseError", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
    })

    describe("String input", () => {
      it("returns plain string as-is", () => {
        const result = parseError("Simple error message")
        expect(result).toBe("Simple error message")
      })

      it("parses JSON string with message property", () => {
        const jsonError = JSON.stringify({ message: "Database connection failed" })
        const result = parseError(jsonError)
        expect(result).toBe("Database connection failed")
      })

      it("parses JSON string with code and message properties", () => {
        const jsonError = JSON.stringify({ code: "ERR_500", message: "Internal server error" })
        const result = parseError(jsonError)
        expect(result).toBe("ERR_500, Internal server error")
      })

      it("returns original string if JSON parsing fails", () => {
        const invalidJson = "{invalid json"
        const result = parseError(invalidJson)
        expect(result).toBe("{invalid json")
      })

      it("handles empty string", () => {
        const result = parseError("")
        expect(result).toBe("")
      })

      it("handles JSON string with only code property", () => {
        const jsonError = JSON.stringify({ code: "ERR_404" })
        const result = parseError(jsonError)
        expect(result).toBe(jsonError)
      })
    })

    describe("Object input", () => {
      it("extracts message from Error object", () => {
        const error = new Error("Network timeout")
        const result = parseError(error)
        expect(result).toBe("Network timeout")
        expect(consoleLogSpy).toHaveBeenCalledWith("Error parsing error message::object")
      })

      it("extracts message from custom error object", () => {
        const error = { message: "Custom error occurred" }
        const result = parseError(error)
        expect(result).toBe("Custom error occurred")
        expect(consoleLogSpy).toHaveBeenCalledWith("Error parsing error message::object")
      })

      it("parses JSON message within error object", () => {
        const error = { message: JSON.stringify({ code: "AUTH_FAIL", message: "Invalid credentials" }) }
        const result = parseError(error)
        expect(result).toBe("AUTH_FAIL, Invalid credentials")
      })

      it("handles object without message property", () => {
        const error = { status: 500, statusText: "Internal Server Error" }
        const result = parseError(error)
        expect(result).toBe("[object Object]")
        expect(consoleLogSpy).toHaveBeenCalledWith("Error parsing error message::object")
      })

      it("handles object with non-string message property", () => {
        const error = { message: 12345 }
        const result = parseError(error)
        expect(result).toBe("[object Object]")
        expect(consoleLogSpy).toHaveBeenCalledWith("Error parsing error message::object")
      })

      it("handles nested error objects", () => {
        const error = { message: "Outer error", innerError: { message: "Inner error" } }
        const result = parseError(error)
        expect(result).toBe("Outer error")
      })
    })

    describe("Other input types", () => {
      it("handles null input", () => {
        const result = parseError(null)
        expect(result).toBe("null")
      })

      it("handles undefined input", () => {
        const result = parseError(undefined)
        expect(result).toBe("undefined")
      })

      it("handles number input", () => {
        const result = parseError(404)
        expect(result).toBe("404")
      })

      it("handles boolean input", () => {
        const result = parseError(true)
        expect(result).toBe("true")
      })

      it("handles array input", () => {
        const result = parseError([1, 2, 3])
        expect(result).toBe("1,2,3")
      })
    })

    describe("Edge cases", () => {
      it("handles empty object", () => {
        const result = parseError({})
        expect(result).toBe("[object Object]")
        expect(consoleLogSpy).toHaveBeenCalledWith("Error parsing error message::object")
      })

      it("handles object with empty string message", () => {
        const error = { message: "" }
        const result = parseError(error)
        expect(result).toBe("")
      })

      it("handles malformed JSON in error message", () => {
        const error = { message: "{broken json: test" }
        const result = parseError(error)
        expect(result).toBe("{broken json: test")
      })

      it("handles JSON with null message", () => {
        const jsonError = JSON.stringify({ message: null })
        const result = parseError(jsonError)
        expect(result).toBe(jsonError)
      })
    })
  })

  describe("FormatRequestData", () => {
    describe("Basic value formatting", () => {
      it("formats simple key-value pairs", () => {
        const options = { name: "John", age: 30 }
        const result = FormatRequestData(options)
        expect(result).toBe("name=John&age=30")
      })

      it("converts numbers to strings", () => {
        const options = { count: 42, price: 19.99 }
        const result = FormatRequestData(options)
        expect(result).toBe("count=42&price=19.99")
      })

      it("converts booleans to strings", () => {
        const options = { active: true, deleted: false }
        const result = FormatRequestData(options)
        expect(result).toBe("active=true&deleted=false")
      })

      it("handles empty object", () => {
        const options = {}
        const result = FormatRequestData(options)
        expect(result).toBe("")
      })
    })

    describe("Null and empty value filtering", () => {
      it("filters out null values", () => {
        const options = { name: "John", email: null, age: 30 }
        const result = FormatRequestData(options)
        expect(result).toBe("name=John&age=30")
      })

      it("filters out empty string values", () => {
        const options = { name: "John", email: "", age: 30 }
        const result = FormatRequestData(options)
        expect(result).toBe("name=John&age=30")
      })

      it("filters out both null and empty strings", () => {
        const options = { a: "value", b: null, c: "", d: "another" }
        const result = FormatRequestData(options)
        expect(result).toBe("a=value&d=another")
      })

      it("keeps zero values", () => {
        const options = { count: 0, price: 0.0 }
        const result = FormatRequestData(options)
        expect(result).toBe("count=0&price=0")
      })

      it("keeps false boolean values", () => {
        const options = { active: false }
        const result = FormatRequestData(options)
        expect(result).toBe("active=false")
      })
    })

    describe("Date formatting", () => {
      it("formats Date objects to ISO string without milliseconds", () => {
        const date = new Date("2024-01-15T10:30:45.123Z")
        const options = { createdAt: date }
        const result = FormatRequestData(options)
        expect(result).toBe("createdAt=2024-01-15T10%3A30%3A45")
      })

      it("handles multiple dates", () => {
        const startDate = new Date("2024-01-01T00:00:00.000Z")
        const endDate = new Date("2024-12-31T23:59:59.999Z")
        const options = { start: startDate, end: endDate }
        const result = FormatRequestData(options)
        expect(result).toContain("start=2024-01-01T00%3A00%3A00")
        expect(result).toContain("end=2024-12-31T23%3A59%3A59")
      })

      it("mixes dates with other values", () => {
        const date = new Date("2024-06-15T12:00:00.000Z")
        const options = { name: "Test", date: date, count: 5 }
        const result = FormatRequestData(options)
        expect(result).toContain("name=Test")
        expect(result).toContain("date=2024-06-15T12%3A00%3A00")
        expect(result).toContain("count=5")
      })
    })

    describe("Array formatting", () => {
      it("formats array values with [] suffix", () => {
        const options = { tags: ["javascript", "typescript"] }
        const result = FormatRequestData(options)
        expect(result).toBe("tags%5B%5D=javascript&tags%5B%5D=typescript")
      })

      it("filters null values from arrays", () => {
        const options = { items: ["a", null, "b", null, "c"] }
        const result = FormatRequestData(options)
        expect(result).toBe("items%5B%5D=a&items%5B%5D=b&items%5B%5D=c")
      })

      it("filters empty strings from arrays", () => {
        const options = { items: ["a", "", "b", "", "c"] }
        const result = FormatRequestData(options)
        expect(result).toBe("items%5B%5D=a&items%5B%5D=b&items%5B%5D=c")
      })

      it("handles empty array", () => {
        const options = { tags: [] }
        const result = FormatRequestData(options)
        expect(result).toBe("")
      })

      it("handles array with all null/empty values", () => {
        const options = { tags: [null, "", null] }
        const result = FormatRequestData(options)
        expect(result).toBe("")
      })

      it("converts array elements to strings", () => {
        const options = { ids: [1, 2, 3] }
        const result = FormatRequestData(options)
        expect(result).toBe("ids%5B%5D=1&ids%5B%5D=2&ids%5B%5D=3")
      })

      it("handles multiple arrays", () => {
        const options = { colors: ["red", "blue"], sizes: ["S", "M", "L"] }
        const result = FormatRequestData(options)
        expect(result).toContain("colors%5B%5D=red")
        expect(result).toContain("colors%5B%5D=blue")
        expect(result).toContain("sizes%5B%5D=S")
        expect(result).toContain("sizes%5B%5D=M")
        expect(result).toContain("sizes%5B%5D=L")
      })

      it("mixes arrays with regular values", () => {
        const options = { name: "Product", tags: ["new", "sale"], price: 99 }
        const result = FormatRequestData(options)
        expect(result).toContain("name=Product")
        expect(result).toContain("tags%5B%5D=new")
        expect(result).toContain("tags%5B%5D=sale")
        expect(result).toContain("price=99")
      })
    })

    describe("Special characters and encoding", () => {
      it("encodes special characters in values", () => {
        const options = { message: "Hello World!", email: "test@example.com" }
        const result = FormatRequestData(options)
        expect(result).toContain("message=Hello+World%21")
        expect(result).toContain("email=test%40example.com")
      })

      it("encodes URLs in values", () => {
        const options = { callback: "https://example.com/callback?param=value" }
        const result = FormatRequestData(options)
        expect(result).toContain("callback=https%3A%2F%2Fexample.com%2Fcallback%3Fparam%3Dvalue")
      })

      it("handles unicode characters", () => {
        const options = { name: "Café", emoji: "🎉" }
        const result = FormatRequestData(options)
        expect(result).toContain("name=Caf%C3%A9")
        expect(result).toContain("emoji=%F0%9F%8E%89")
      })
    })

    describe("Complex scenarios", () => {
      it("handles mixed types comprehensively", () => {
        const options = {
          string: "test",
          number: 42,
          boolean: true,
          nullValue: null,
          emptyString: "",
          array: ["a", "b"],
          date: new Date("2024-01-01T00:00:00.000Z"),
          zero: 0,
          falseBool: false,
        }
        const result = FormatRequestData(options)

        expect(result).toContain("string=test")
        expect(result).toContain("number=42")
        expect(result).toContain("boolean=true")
        expect(result).not.toContain("nullValue")
        expect(result).not.toContain("emptyString")
        expect(result).toContain("array%5B%5D=a")
        expect(result).toContain("array%5B%5D=b")
        expect(result).toContain("date=2024-01-01T00%3A00%3A00")
        expect(result).toContain("zero=0")
        expect(result).toContain("falseBool=false")
      })

      it("preserves parameter order for non-array values", () => {
        const options = { a: "1", b: "2", c: "3" }
        const result = FormatRequestData(options)
        const params = result.split("&")
        expect(params).toHaveLength(3)
      })
    })

    describe("Edge cases", () => {
      it("handles object with undefined values", () => {
        const options = { name: "Test", value: undefined }
        const result = FormatRequestData(options)
        expect(result).toBe("name=Test")
      })

      it("handles nested objects by converting to string", () => {
        const options = { nested: { key: "value" } }
        const result = FormatRequestData(options)
        expect(result).toBe("nested=%5Bobject+Object%5D")
      })

      it("handles very long strings", () => {
        const longString = "a".repeat(1000)
        const options = { data: longString }
        const result = FormatRequestData(options)
        expect(result).toContain("data=")
        expect(result.length).toBeGreaterThan(1000)
      })

      it("handles single element array", () => {
        const options = { tags: ["single"] }
        const result = FormatRequestData(options)
        expect(result).toBe("tags%5B%5D=single")
      })
    })
  })
})
