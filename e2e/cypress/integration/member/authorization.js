const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("user role assignments", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open user role assignments page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/projects/role-assignments`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.contains("Technical Team User")
    cy.contains("button", "Add New Member").should("not.exist")
  })

  it("open group role assignments page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/projects/role-assignments?active_tab=groupRoles`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.contains("CC3TEST_DOMAIN_ADMINS")
    cy.contains("button", "Add New Member").should("not.exist")
  })
})
