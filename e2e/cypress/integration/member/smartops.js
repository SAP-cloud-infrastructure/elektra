const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("smartops", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open smartops and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/smartops`)
    cy.contains("[data-test=page-title]", "SmartOps")
    cy.contains("No Jobs found, nothing to do")
  })
})
