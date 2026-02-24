const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("project landing page", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open project landing page and cannot see edit project button", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/project/home`)
    cy.contains("Test Project")
    cy.get("div.dropdown.header-action").should("not.exist")
  })

  it("open project landing page and check user profile and SSH keys", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "TC3_OBS_TM1")
    cy.contains("button", "Close").click()

    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Key Pairs").click()
    cy.contains("health")
  })

  it("open project landing page and check app credentials", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "App Credentials").click()
    cy.contains("No application credentials found. Create a new one")
    cy.contains("button", "Create").click()
    cy.contains("Create New Application Credentials")
    cy.contains("button", "Save").click()
    cy.contains("div", "Name are required.")
  })
})
