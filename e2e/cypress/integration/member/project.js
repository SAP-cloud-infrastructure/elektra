describe("project landing page", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open project landing page and cannot see edit project button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/project/home`)
    cy.contains("Test Project")
    cy.get("div.dropdown.header-action").should("not.exist")
  })

  it("open project landing page and check user profile and SSH keys", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Profile").click()
    cy.contains("td", "TC3_OBS_TM1")
    cy.contains("button", "Close").click()

    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Key Pairs").click()
    cy.contains("health")
  })

  it("open project landing page and check app credentials", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "App Credentials").click()
    cy.contains("No application credentials found. Create a new one")
    cy.contains("button", "Create").click()
    cy.contains("Create New Application Credentials")
    cy.contains("button", "Save").click()
    cy.contains("div", "Name are required.")
  })

  it("open project landing page and check logout button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/identity/project/home`)
    cy.contains("a.navbar-identity", "Technical Team User").click()
    cy.contains("a", "Log out").click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    // check not in one string because it can be different order
    cy.contains("button", "Enter CC3TEST")
  })
})
