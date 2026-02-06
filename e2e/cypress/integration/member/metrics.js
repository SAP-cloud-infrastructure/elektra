describe("metrics", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open metrics page and see it is loading", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/metrics/`)
    cy.contains("[data-test=page-title]", "Metrics")
    cy.contains("a", "Open Maia Dashboard")
  })
})
