const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("flavors", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open flavors page and see it is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/compute/flavors`)
    cy.contains("[data-test=page-title]", "Flavors")
  })
})
