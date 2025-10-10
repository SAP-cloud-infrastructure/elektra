import React from "react"
import { render, screen } from "@testing-library/react"
import Groups from "../../components/groups"

describe("Groups component", () => {
  it("should render one groups", async () => {
    const mockGroups = [
      {
        id: "9d4cd354b558aa59a842bc2e74cfd18a0f0ade1ba5277bfdfcacaa50916a8072",
        name: "CCADMIN_CLOUD_ADMINS",
      },
    ]
    const mockGroupMembers = {
      "9d4cd354b558aa59a842bc2e74cfd18a0f0ade1ba5277bfdfcacaa50916a8072": {
        data: { name: "C123", id: "123456789", fullname: "Max Musterman" },
      },
    }

    await render(<Groups groups={mockGroups} groupMembers={mockGroupMembers} />)

    const text = await screen.getByText("CCADMIN_CLOUD_ADMINS")
    expect(text).toBeDefined()
  })
})
