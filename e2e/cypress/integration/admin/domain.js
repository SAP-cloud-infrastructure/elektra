const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("domain landing page", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/home`)
  })

  it("open domain landing page and check user profile", () => {
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "TC3_OBS_TA1")
  })

  it("open domain landing page and check logout button", () => {
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Log out").click()
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
