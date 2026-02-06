describe("limes", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open resource management page and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/resources/v2/project#/compute`)
    cy.contains("[data-test=page-title]", "Resource Management")
  })
})
