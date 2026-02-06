describe("flavors", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open flavors page and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/compute/flavors`)
    cy.contains("[data-test=page-title]", "Flavors")
  })
})
