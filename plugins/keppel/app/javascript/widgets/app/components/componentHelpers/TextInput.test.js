import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import { TextInput } from "./TextInput" // Adjust the import according to your file structure

describe("TextInput", () => {
  it("renders input element when isEditable is true", async () => {
    const mockOnChange = jest.fn()
    let value = ""

    const { rerender } = render(
      <TextInput
        testid="input"
        value={value}
        isEditable={true}
        onChange={(e) => {
          value = e.target.value
          mockOnChange(e)
        }}
      />
    )
    const inputElement = screen.getByTestId("input")
    expect(inputElement).not.toBeNull()
    
    fireEvent.change(inputElement, { target: { value: "New Value" } })
    rerender(
      <TextInput
        testid="input"
        value={value}
        isEditable={true}
        onChange={(e) => {
          value = e.target.value
          mockOnChange(e)
        }}
      />
    )
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(inputElement.value).toBe("New Value")
  })

  it("renders input element when isEditable is false", () => {
    render(<TextInput value="" isEditable={false} onChange={() => {}} />)
    expect(screen.getByText("Any")).not.toBeNull()
  })
})
