const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("domain landing page", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/home`)
  })

  it("open domain landing page and check user profile", () => {
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "TC3_OBS_TM1")
  })

  it("open domain landing page and test create project", () => {
    cy.contains("[data-test=page-title]", "Home")
    cy.contains("a", "Create a New Project").click()
    cy.contains("Create new project")
    cy.contains("input", "Create").click()
    cy.contains("span.help-block", "Name should not be empty")
    cy.contains("button", "Cancel").click()
  })

  it("open domain landing page and test check my requests", () => {
    cy.contains("[data-test=page-title]", "Home")
    cy.contains("a", "My Requests").click()
    cy.contains("[data-test=page-title]", "My Requests")
  })
})
