const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("project landing page", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open project landing page and check user profile", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "admin")
    cy.contains("a", "edit role assignments").click()
    cy.contains("button", "Add New Member")
  })

  it("open project landing page and check logout button", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Log out").click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    // check not in one string because it can be different order
    cy.contains("button", "Enter CC3TEST")
  })

  it("open project landing page and check delete project panel is loading", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/project/home`)
    cy.contains("th", "Delete Project")
    cy.contains("a", "Check").click()
    cy.contains("Prodel Service found")
  })
})
