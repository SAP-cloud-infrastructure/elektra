describe("miscellaneous", () => {
  it("load member project via id shortcut", () => {
    cy.elektraLoginWithEnv()

    cy.visit("/_/d940aae3f8084f15a9b67de5b3b39720")
    cy.contains("d940aae3f8084f15a9b67de5b3b39720")
    cy.contains("Test Project")
  })

  it("load elektra test vm via id shortcut", () => {
    cy.elektraLoginWithEnv()

    cy.visit("/_jump_to/0b327741-8e12-4e92-b9ad-edf7a5d0594d")
    cy.contains("0b327741-8e12-4e92-b9ad-edf7a5d0594d")
    cy.contains("elektra-test-vm")
  })

  it("load metrics", () => {
    cy.request("/metrics").its("status").should("eq", 200)
  })
})
