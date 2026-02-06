const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("cost report", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open cost report and see no data available", () => {
    cy.visit(`/${TEST_DOMAIN}/test/reports/cost/project`)
    cy.contains("[data-test=page-title]", "Cost Report")
    cy.contains("No data available for this project.")
  })
})
