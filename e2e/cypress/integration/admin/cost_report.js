const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("cost report", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open cost report", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/reports/cost/project`)
    cy.contains("[data-test=page-title]", "Cost Report")
    cy.contains("No data available for this project.")
  })
})
