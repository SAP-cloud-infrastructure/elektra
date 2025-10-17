import React from "react"
import { render } from "@testing-library/react"
import CastellumScrapingErrors from "./scraping_errors"

describe("CastellumScrapingErrors", () => {
  let props

  beforeEach(() => {
    props = {
      loadShareTypesOnce: vi.fn(),
      loadAssetsOnce: vi.fn(),
      projectID: "1234",
      config: { data: null },
      assets: { errorMessage: null, isFetching: false, data: null },
      shares: [],
      handleDelete: vi.fn(),
      handleForceDelete: vi.fn(),
    }
  })

  it("should not call loadAssetsOnce when config is null", () => {
    render(<CastellumScrapingErrors {...props} />)

    expect(props.loadShareTypesOnce).toHaveBeenCalledWith(props.projectID)
    expect(props.loadAssetsOnce).not.toHaveBeenCalled()
  })

  it("should call loadAssetsOnce with both shareTypes when config has 2 entries", () => {
    const shareTypes = ["shareType1", "shareType2"]
    props.config.data = {
      shareType1: { value: "value1" },
      shareType2: { value: "value2" },
    }

    render(<CastellumScrapingErrors {...props} />)

    expect(props.loadShareTypesOnce).toHaveBeenCalledWith(props.projectID)
    expect(props.loadAssetsOnce).toHaveBeenCalledWith(props.projectID, shareTypes)
  })
})
