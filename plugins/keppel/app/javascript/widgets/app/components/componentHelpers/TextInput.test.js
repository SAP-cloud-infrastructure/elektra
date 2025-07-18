import React from "react"
import { render, fireEvent, screen } from "@testing-library/react"
import { TextInput } from "./TextInput" // Adjust the import according to your file structure

describe("TextInput", () => {
  it("renders input element when isEditable is true", () => {
    const mockOnChange = jest.fn()
    render(<TextInput testid="input" value="" isEditable={true} onChange={mockOnChange} />)
    const inputElement = screen.getByTestId("input")
    expect(inputElement).not.toBeNull()
    fireEvent.change(inputElement, { target: { value: "New Value" } })
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('renders input element when isEditable is false', () => {
    render(<TextInput value="" isEditable={false} onChange={() => {}} />)
    expect(screen.getByText("Any")).not.toBeNull()
  })
})
