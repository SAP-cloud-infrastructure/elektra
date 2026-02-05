describe("domain landing page", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/home`)
  })

  it("open domain landing page and check user profile", () => {
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "TC3_OBS_TA1")
  })

  it("open domain landing page and check logout button", () => {
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Log out").click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    // check not in one string because it can be different order
    cy.contains("button", "Enter CC3TEST")
  })

  it("open domain landing page open and create project dialog", () => {
    cy.contains("a", "Create a New Project").click()
    cy.contains("h4", "Create new project")
    cy.get('input[name="commit"]').click()
    cy.contains("Name: Name should not be empty")
  })

  it("open domain landing page and check my requests", () => {
    cy.contains("[data-test=page-title]", "Home")
    cy.contains("a", "My Requests").click()
    cy.contains("[data-test=page-title]", "My Requests")
  })
})
