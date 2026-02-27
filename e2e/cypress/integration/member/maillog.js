const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("maillog", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open maillog page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/maillog`)
    cy.contains("[data-test=page-title]", "Maillog")
  })
})
