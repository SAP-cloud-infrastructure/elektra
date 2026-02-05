describe("user role assignments", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open user role assignments page and check role options", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/identity/projects/role-assignments`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.get("[data-test=search]").eq(0).type("TC3_OBS_TM")
    cy.contains("TC3_OBS_TM")
    cy.contains("button", "Edit").should("be.visible").click()
    cy.contains("admin (Keystone Administrator)")
    cy.contains("button", "Cancel").click()
  })

  it("open user role assignments page and check new member button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/identity/projects/role-assignments`)
    cy.contains("[data-test=page-title]", "Authorizations")
    cy.contains("button", "Add New Member").click()
    cy.get('input[placeholder*="User name or ID"]').type("TC3_OBS_TM")
    cy.contains("Technical Team User", { timeout: 10000 }).should("be.visible")
  })
})

describe("group role assignments", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open group role assignments page", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/identity/projects/role-assignments?active_tab=groupRoles`)
    cy.contains("[data-test=page-title]", "Authorizations")
  })
})
