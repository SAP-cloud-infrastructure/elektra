describe("key manager", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open key manager page and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/keymanager/secrets`)
    cy.contains("[data-test=page-title]", "Key Manager")
  })
})
