describe("project landing page", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open project landing page and check user profile", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "admin")
    cy.contains("a", "edit role assignments").click()
    cy.contains("button", "Add New Member")
  })

  it("open project landing page and check logout button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Log out").click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    // check not in one string because it can be different order
    cy.contains("button", "Enter CC3TEST")
  })
})
