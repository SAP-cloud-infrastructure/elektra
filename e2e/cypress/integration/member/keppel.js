const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("keppel", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open container image registry page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/keppel`)
    cy.contains("[data-test=page-title]", "Container Image Registry")
  })
})
