import { filterShareTypeData, filterOperations } from "./castellum"
import { CASTELLUM_SCOPES } from "../constants"

describe("filterShareTypeData", () => {
  it("should handle all shares data", () => {
    const testData = {
      [CASTELLUM_SCOPES.combined]: { someConfig: true },
    }
    const isAllShares = undefined

    const result = filterShareTypeData(testData, isAllShares)

    expect(result.data).toEqual(testData)
    expect(result.allShares).toEqual(true)
  })

  it("should handle non-matching fields", () => {
    const testData = {
      foo: {},
      bar: {},
      [CASTELLUM_SCOPES.combined]: {},
      [`${CASTELLUM_SCOPES.separate}:shareType1`]: {},
    }
    const isAllShares = true

    const result = filterShareTypeData(testData, isAllShares)

    expect(result.data).toEqual({
      [CASTELLUM_SCOPES.combined]: {},
    })
    expect(result.allShares).toEqual(true)
  })

  it("should return default value for empty data", () => {
    const testData = {}
    const isAllShares = false

    const result = filterShareTypeData(testData, isAllShares)

    expect(result.data).toEqual({ [CASTELLUM_SCOPES.combined]: null })
    expect(result.allShares).toEqual(false)
  })

  it("should handle separate shares data", () => {
    const testData = {
      [`${CASTELLUM_SCOPES.separate}:shareType1`]: { someConfig: true },
      [`${CASTELLUM_SCOPES.separate}:shareType2`]: { someConfig: true },
    }
    const isAllShares = undefined

    const result = filterShareTypeData(testData, isAllShares)

    expect(result.data).toEqual(testData)
    expect(result.allShares).toEqual(false)
  })
})

describe("filterOperations", () => {
  it("should handle combined asset types", () => {
    const testData = [{ asset_type: CASTELLUM_SCOPES.combined }]

    const result = filterOperations(testData)

    expect(result.data).toEqual(testData)
    expect(result.allShares).toEqual(true)
  })

  it("should handle non-matching fields", () => {
    const testData = [
      { asset_type: "foo" },
      { asset_type: "bar" },
      { asset_type: CASTELLUM_SCOPES.combined },
      { asset_type: `${CASTELLUM_SCOPES.separate}:shareType1` },
    ]

    const result = filterOperations(testData)

    expect(result.data).toEqual([{ asset_type: CASTELLUM_SCOPES.combined }])
    expect(result.allShares).toEqual(true)
  })

  it("should return default value for empty data", () => {
    const testData = []

    const result = filterOperations(testData)

    expect(result.data).toEqual([])
    expect(result.allShares).toEqual(true)
  })

  it("should handle separate asset types", () => {
    const testData = [
      { asset_type: `${CASTELLUM_SCOPES.separate}:shareType1` },
      { asset_type: `${CASTELLUM_SCOPES.separate}:shareType2` },
    ]

    const result = filterOperations(testData)

    expect(result.data).toEqual(testData)
    expect(result.allShares).toEqual(false)
  })
})
