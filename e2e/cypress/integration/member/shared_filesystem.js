const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("shared filesystem", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open shared file system storage page and check for new button", () => {
    cy.visit(`/${TEST_DOMAIN}/test/shared-filesystem-storage/?r=/shares`)
    cy.contains("[data-test=page-title]", "File System Storage")
    cy.contains("Create New")
  })
})
