describe("authentication", () => {
  it("user is not logged, tries to visit domain home and is redirected to login page", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/home/`)
    cy.contains("Please sign in")
  })

  it("login failed", () => {
    cy.elektraLogin("cc3test", "EVIL_MAN", "EVIL_PASSWORD")
    cy.contains("Invalid username/password combination.")
  })

  it("user is not logged in and tries to visit BAD DOMAIN ans sees Unsupported Domain", () => {
    cy.visit(`/BAD_DOMAIN/home`, { failOnStatusCode: false })
    // cy.contains('button','Log in').click()
    cy.contains("Unsupported Domain")
  })

  it("user is logged in and tries to visit BAD PROJECT ans sees Project Not Found", () => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/BAD_PROJECT/identity/project/home`)
    cy.contains("Project Not Found")
  })
})
