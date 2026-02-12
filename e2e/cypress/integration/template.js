const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("template", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open template page", () => {
    cy.visit(`/${TEST_DOMAIN}/template`)
    cy.contains("[data-test=page-title]", "Template")
  })
})
