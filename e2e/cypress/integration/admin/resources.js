const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("resource management - project level", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("start page is reachable, and you can see the project settings", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/resources/v2/project`)
    cy.contains("[data-test=page-title]", "Resource Management")
  })
})
