const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("limes", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open resource management page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/resources/v2/project#/compute`)
    cy.contains("[data-test=page-title]", "Resource Management")
  })
})
