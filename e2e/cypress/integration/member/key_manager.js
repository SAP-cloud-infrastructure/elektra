const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("key manager", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open key manager page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/keymanager/secrets`)
    cy.contains("[data-test=page-title]", "Key Manager")
  })
})
