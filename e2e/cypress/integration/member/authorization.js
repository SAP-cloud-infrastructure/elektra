describe("user role assignments", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open user role assignments page", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/projects/role-assignments`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.contains("Technical Team User")
    cy.contains("button", "Add New Member").should("not.exist")
  })

  it("open group role assignments page", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/projects/role-assignments?active_tab=groupRoles`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.contains("CC3TEST_DOMAIN_ADMINS")
    cy.contains("button", "Add New Member").should("not.exist")
  })
})
