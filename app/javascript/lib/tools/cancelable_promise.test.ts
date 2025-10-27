import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Type definitions for the cancelable promise utility
interface CancelablePromise<T> {
  promise: Promise<T>
  cancel(): void
}

interface CanceledError {
  isCanceled: true
}

type MakeCancelable = <T>(promise: Promise<T>) => CancelablePromise<T>

// Import your actual implementation
import makeCancelable from "./cancelable_promise" // Adjust the import path as needed

describe("makeCancelable", () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe("Successful Promise Resolution", () => {
    it("should resolve with the original value when promise resolves and is not canceled", async () => {
      const originalValue = { data: "test" }
      const originalPromise: Promise<{ data: string }> = Promise.resolve(originalValue)

      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toEqual(originalValue)
    })

    it("should resolve immediately for already resolved promises", async () => {
      const value = "immediate"
      const resolvedPromise: Promise<string> = Promise.resolve(value)

      const cancelablePromise = makeCancelable(resolvedPromise)

      const result = await cancelablePromise.promise
      expect(result).toBe(value)
    })

    it("should handle promise that resolves with undefined", async () => {
      const originalPromise: Promise<undefined> = Promise.resolve(undefined)

      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toBeUndefined()
    })

    it("should handle promise that resolves with null", async () => {
      const originalPromise: Promise<null> = Promise.resolve(null)

      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toBeNull()
    })

    it("should handle promise that resolves with falsy values", async () => {
      const falsyValues: Array<string | number | boolean | null | undefined> = [false, 0, "", null, undefined]

      for (const value of falsyValues) {
        const originalPromise = Promise.resolve(value)
        const cancelablePromise = makeCancelable(originalPromise)

        const result = await cancelablePromise.promise
        expect(result).toBe(value)
      }
    })

    it("should handle numeric values", async () => {
      const numbers: number[] = [42, 0, -1, 3.14, Number.MAX_SAFE_INTEGER]

      for (const num of numbers) {
        const originalPromise: Promise<number> = Promise.resolve(num)
        const cancelablePromise = makeCancelable(originalPromise)

        const result = await cancelablePromise.promise
        expect(result).toBe(num)
      }
    })

    it("should handle boolean values", async () => {
      const booleans: boolean[] = [true, false]

      for (const bool of booleans) {
        const originalPromise: Promise<boolean> = Promise.resolve(bool)
        const cancelablePromise = makeCancelable(originalPromise)

        const result = await cancelablePromise.promise
        expect(result).toBe(bool)
      }
    })
  })

  describe("Promise Rejection", () => {
    it("should reject with the original error when promise rejects and is not canceled", async () => {
      const originalError = new Error("Test error")
      const originalPromise: Promise<never> = Promise.reject(originalError)

      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toThrow("Test error")
    })

    it("should reject with custom error objects", async () => {
      interface CustomError {
        message: string
        code: number
      }

      const customError: CustomError = { message: "Custom error", code: 500 }
      const originalPromise: Promise<never> = Promise.reject(customError)

      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toEqual(customError)
    })

    it("should reject with string errors", async () => {
      const stringError = "String error message"
      const originalPromise: Promise<never> = Promise.reject(stringError)

      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toBe(stringError)
    })

    it("should handle typed error objects", async () => {
      interface ValidationError {
        field: string
        message: string
        value: unknown
      }

      const validationError: ValidationError = {
        field: "email",
        message: "Invalid email format",
        value: "invalid-email",
      }

      const originalPromise: Promise<never> = Promise.reject(validationError)
      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toEqual(validationError)
    })
  })

  describe("Cancellation Before Resolution", () => {
    it("should reject with isCanceled when canceled before promise resolves", async () => {
      let resolveOriginal: (value: string) => void
      const originalPromise = new Promise<string>((resolve) => {
        resolveOriginal = resolve
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Cancel before resolving
      cancelablePromise.cancel()

      // Now resolve the original promise
      resolveOriginal!("should not matter")

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })
    })

    it("should reject with isCanceled when canceled before promise rejects", async () => {
      let rejectOriginal: (error: Error) => void
      const originalPromise = new Promise<string>((resolve, reject) => {
        rejectOriginal = reject
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Cancel before rejecting
      cancelablePromise.cancel()

      // Now reject the original promise
      rejectOriginal!(new Error("Original error"))

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })
    })

    it("should handle cancellation with complex generic types", async () => {
      interface User {
        id: number
        name: string
        email: string
      }

      let resolveOriginal: (user: User) => void
      const originalPromise = new Promise<User>((resolve) => {
        resolveOriginal = resolve
      })

      const cancelablePromise = makeCancelable(originalPromise)
      cancelablePromise.cancel()

      resolveOriginal!({ id: 1, name: "John", email: "john@example.com" })

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })
    })
  })

  describe("Cancellation After Resolution", () => {
    it("should still resolve normally if canceled after promise already resolved", async () => {
      const value = "resolved value"
      const originalPromise: Promise<string> = Promise.resolve(value)

      const cancelablePromise = makeCancelable(originalPromise)

      // Wait for resolution
      const result = await cancelablePromise.promise

      // Cancel after resolution (should have no effect)
      cancelablePromise.cancel()

      expect(result).toBe(value)
    })

    it("should still reject normally if canceled after promise already rejected", async () => {
      const error = new Error("Original error")
      const originalPromise: Promise<never> = Promise.reject(error)

      const cancelablePromise = makeCancelable(originalPromise)

      // Wait for rejection
      await expect(cancelablePromise.promise).rejects.toThrow("Original error")

      // Cancel after rejection (should have no effect)
      cancelablePromise.cancel()
    })
  })

  describe("Multiple Cancellations", () => {
    it("should handle multiple cancel calls gracefully", async () => {
      let resolveOriginal: (value: string) => void
      const originalPromise = new Promise<string>((resolve) => {
        resolveOriginal = resolve
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Call cancel multiple times
      cancelablePromise.cancel()
      cancelablePromise.cancel()
      cancelablePromise.cancel()

      resolveOriginal!("test")

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })
    })
  })

  describe("Timing Scenarios", () => {
    it("should handle immediate cancellation", async () => {
      const originalPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("delayed"), 100)
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Cancel immediately
      cancelablePromise.cancel()

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })
    })

    it("should handle cancellation during promise execution", async () => {
      vi.useFakeTimers()

      const originalPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("delayed value"), 1000)
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Cancel after some time but before resolution
      setTimeout(() => {
        cancelablePromise.cancel()
      }, 500)

      // Fast-forward time to trigger cancel
      vi.advanceTimersByTime(500)

      // Fast-forward past original resolution time
      vi.advanceTimersByTime(600)

      await expect(cancelablePromise.promise).rejects.toEqual({ isCanceled: true })

      vi.useRealTimers()
    })
  })

  describe("Return Value Structure", () => {
    it("should return an object with promise and cancel properties", () => {
      const originalPromise: Promise<string> = Promise.resolve("test")
      const cancelablePromise = makeCancelable(originalPromise)

      expect(cancelablePromise).toHaveProperty("promise")
      expect(cancelablePromise).toHaveProperty("cancel")
      expect(typeof cancelablePromise.cancel).toBe("function")
      expect(cancelablePromise.promise).toBeInstanceOf(Promise)
    })

    it("should return a new promise instance, not the original", () => {
      const originalPromise: Promise<string> = Promise.resolve("test")
      const cancelablePromise = makeCancelable(originalPromise)

      expect(cancelablePromise.promise).not.toBe(originalPromise)
    })

    it("should maintain proper typing", () => {
      const stringPromise: Promise<string> = Promise.resolve("test")
      const numberPromise: Promise<number> = Promise.resolve(42)
      const objectPromise: Promise<{ id: number }> = Promise.resolve({ id: 1 })

      const cancelableString = makeCancelable(stringPromise)
      const cancelableNumber = makeCancelable(numberPromise)
      const cancelableObject = makeCancelable(objectPromise)

      // TypeScript should infer correct types
      expect(cancelableString.promise).toBeInstanceOf(Promise)
      expect(cancelableNumber.promise).toBeInstanceOf(Promise)
      expect(cancelableObject.promise).toBeInstanceOf(Promise)
    })
  })

  describe("Complex Value Types", () => {
    it("should handle complex objects", async () => {
      interface ComplexObject {
        nested: { data: number[] }
        fn: () => string
        date: Date
        optional?: string
      }

      const complexObject: ComplexObject = {
        nested: { data: [1, 2, 3] },
        fn: () => "test",
        date: new Date("2023-01-01"),
      }

      const originalPromise: Promise<ComplexObject> = Promise.resolve(complexObject)
      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toEqual(complexObject)
      expect(result.fn()).toBe("test")
    })

    it("should handle arrays with proper typing", async () => {
      type MixedArray = Array<string | number | { three: number } | number[]>
      const array: MixedArray = [1, "two", { three: 3 }, [4, 5]]

      const originalPromise: Promise<MixedArray> = Promise.resolve(array)
      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toEqual(array)
    })

    it("should handle generic types", async () => {
      interface ApiResponse<T> {
        data: T
        status: number
        message: string
      }

      interface User {
        id: number
        name: string
      }

      const response: ApiResponse<User> = {
        data: { id: 1, name: "John" },
        status: 200,
        message: "Success",
      }

      const originalPromise: Promise<ApiResponse<User>> = Promise.resolve(response)
      const cancelablePromise = makeCancelable(originalPromise)

      const result = await cancelablePromise.promise
      expect(result).toEqual(response)
      expect(result.data.name).toBe("John")
    })

    it("should handle union types", async () => {
      type StringOrNumber = string | number
      const values: StringOrNumber[] = ["hello", 42, "world", 0]

      for (const value of values) {
        const originalPromise: Promise<StringOrNumber> = Promise.resolve(value)
        const cancelablePromise = makeCancelable(originalPromise)

        const result = await cancelablePromise.promise
        expect(result).toBe(value)
      }
    })
  })

  describe("Error Edge Cases", () => {
    it("should handle errors that are not Error instances", async () => {
      interface CustomErrorObject {
        custom: string
        isCanceled: boolean
        code?: number
      }

      const customError: CustomErrorObject = { custom: "error", isCanceled: false, code: 500 }
      const originalPromise: Promise<never> = Promise.reject(customError)
      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toEqual(customError)
    })

    it("should handle null/undefined errors", async () => {
      const originalPromise: Promise<never> = Promise.reject(null)
      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toBeNull()
    })

    it("should distinguish between canceled rejection and error with isCanceled property", async () => {
      interface ErrorWithCanceledProp {
        message: string
        isCanceled: boolean
      }

      // Test that an error object with isCanceled: false is not treated as a cancellation
      const errorWithIsCanceled: ErrorWithCanceledProp = { message: "Error", isCanceled: false }
      const originalPromise: Promise<never> = Promise.reject(errorWithIsCanceled)
      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toEqual(errorWithIsCanceled)
    })

    it("should handle typed error hierarchies", async () => {
      abstract class BaseError {
        abstract message: string
        abstract code: number
      }

      class ValidationError extends BaseError {
        message = "Validation failed"
        code = 400
        field: string

        constructor(field: string) {
          super()
          this.field = field
        }
      }

      const validationError = new ValidationError("email")
      const originalPromise: Promise<never> = Promise.reject(validationError)
      const cancelablePromise = makeCancelable(originalPromise)

      await expect(cancelablePromise.promise).rejects.toBeInstanceOf(ValidationError)

      try {
        await cancelablePromise.promise
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        if (error instanceof ValidationError) {
          expect(error.field).toBe("email")
          expect(error.code).toBe(400)
        }
      }
    })
  })

  describe("Race Conditions", () => {
    it("should handle race between resolution and cancellation", async () => {
      vi.useFakeTimers()

      let resolveOriginal: (value: string) => void
      const originalPromise = new Promise<string>((resolve) => {
        resolveOriginal = resolve
      })

      const cancelablePromise = makeCancelable(originalPromise)

      // Set up simultaneous resolution and cancellation
      setTimeout(() => resolveOriginal!("resolved"), 100)
      setTimeout(() => cancelablePromise.cancel(), 100)

      vi.advanceTimersByTime(100)

      // The result depends on which happens first in the event loop
      // Both outcomes are valid, but we should get one or the other
      try {
        const result = await cancelablePromise.promise
        expect(result).toBe("resolved")
      } catch (error) {
        expect(error).toEqual({ isCanceled: true })
      }

      vi.useRealTimers()
    })
  })

  describe("Memory and Cleanup", () => {
    it("should not prevent garbage collection of original promise", () => {
      // This is more of a conceptual test - in a real scenario you'd use weak references
      // or memory profiling tools to verify
      const originalPromise: Promise<string> = Promise.resolve("test")
      const cancelablePromise = makeCancelable(originalPromise)

      expect(cancelablePromise.promise).toBeDefined()
      expect(typeof cancelablePromise.cancel).toBe("function")
    })

    it("should work with async/await patterns", async () => {
      const fetchData = async (): Promise<{ id: number; data: string }> => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { id: 1, data: "fetched" }
      }

      const cancelablePromise = makeCancelable(fetchData())
      const result = await cancelablePromise.promise

      expect(result).toEqual({ id: 1, data: "fetched" })
    })
  })

  describe("Type Safety", () => {
    it("should maintain type safety with void promises", async () => {
      const voidPromise: Promise<void> = Promise.resolve()
      const cancelablePromise = makeCancelable(voidPromise)

      const result = await cancelablePromise.promise
      expect(result).toBeUndefined()
    })

    it("should work with Promise.all results", async () => {
      const promises = [Promise.resolve("string"), Promise.resolve(42), Promise.resolve({ key: "value" })] as const

      const allPromise = Promise.all(promises)
      const cancelablePromise = makeCancelable(allPromise)

      const result = await cancelablePromise.promise
      expect(result).toEqual(["string", 42, { key: "value" }])
    })

    it("should handle optional and nullable types", async () => {
      type OptionalString = string | undefined
      type NullableNumber = number | null

      const optionalPromise: Promise<OptionalString> = Promise.resolve(undefined)
      const nullablePromise: Promise<NullableNumber> = Promise.resolve(null)

      const cancelableOptional = makeCancelable(optionalPromise)
      const cancelableNullable = makeCancelable(nullablePromise)

      const optionalResult = await cancelableOptional.promise
      const nullableResult = await cancelableNullable.promise

      expect(optionalResult).toBeUndefined()
      expect(nullableResult).toBeNull()
    })
  })
})
