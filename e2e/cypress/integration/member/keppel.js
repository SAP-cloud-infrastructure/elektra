describe("keppel", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open container image registry page and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/keppel`)
    cy.contains("[data-test=page-title]", "Container Image Registry")
  })
})
