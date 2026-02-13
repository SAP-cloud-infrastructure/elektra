const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("metrics", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open metrics page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/metrics/`)
    cy.contains("[data-test=page-title]", "Metrics")
    cy.contains("a", "Open Maia Dashboard")
  })
})
