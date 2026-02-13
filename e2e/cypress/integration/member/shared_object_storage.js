const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("shared object storage", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open object storage and see that I need one of the respective roles", () => {
    cy.visit(`/${TEST_DOMAIN}/test/object-storage/swift`)
    cy.contains("[data-test=page-title]", "Object Storage")
    cy.contains(
      "Object Storage can only be used when your user account has the admin or objectstore_admin or objectstore_viewer role for this project."
    )
  })
})
