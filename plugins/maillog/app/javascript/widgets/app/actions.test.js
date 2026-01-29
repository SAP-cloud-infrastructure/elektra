import { encodeUrlParamsFromObject } from "./actions"

describe("Actions", () => {
  describe("encodeUrlParamsFromObject", () => {
    test("return empty string if no object given", () => {
      expect(encodeUrlParamsFromObject()).toEqual("")
    })
    test("return url params when object given", () => {
      expect(encodeUrlParamsFromObject({ limit: 10, offset: 0 })).toEqual(
        "&limit=10&offset=0"
      )
    })
    test("return url param also when object value has an object", () => {
      expect(
        encodeUrlParamsFromObject({
          obj1: { operators: "arturo" },
          obj2: { operators: "michi" },
          limit: 10,
          offset: 0,
        })
      ).toEqual("&operators=arturo&operators=michi&limit=10&offset=0")
    })
  })
})
