describe("smartops", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open smartops and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/smartops`)
    cy.contains("[data-test=page-title]", "SmartOps")
    cy.contains("No Jobs found, nothing to do")
  })
})
