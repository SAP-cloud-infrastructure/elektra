const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("audit", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open audit log page", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/audit/`)
    cy.contains("[data-test=page-title]", "Audit Log")
    cy.contains("label", "Filter")
  })
})
