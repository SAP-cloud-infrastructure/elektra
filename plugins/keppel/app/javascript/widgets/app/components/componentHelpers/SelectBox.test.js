import React from "react"
import { SelectBox } from "./SelectBox"
import { render, screen } from "@testing-library/react"

const options = [
  { value: "1", label: "Option 1" },
  { value: "2", label: "Option 2" },
  { value: "3", label: "Option 3" },
]
describe("SelectBox", () => {
  it("displays correct label when isEditable is true", () => {
    render(<SelectBox testID="select-box" options={options} value={"0"} isEditable={true} onChange={() => {}} />)
    expect(screen.getByText("-- Please select --")).not.toBeNull()
  })
  it("displays correct label when isEditable is false", () => {
    render(<SelectBox testID="select-box" options={options} value={"2"} isEditable={false} onChange={() => {}} />)
    expect(screen.queryByText("Option 1")).toBeNull()
    expect(screen.getByText("Option 2")).not.toBeNull()
  })
})
