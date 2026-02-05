describe("cost report", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open cost report", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/reports/cost/project`)
    cy.contains("[data-test=page-title]", "Cost Report")
    cy.contains("No data available for this project.")
  })
})
