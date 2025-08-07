describe("automation", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open automation page and test Add Node button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/automation/nodes/`)
    cy.contains("[data-test=page-title]", "Automation")
    cy.contains("Add Node").click()
    cy.contains("Install new Node")
    cy.contains("button", "Cancel").click()
  })

  it("open automation page and test New Automation button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/automation/automations`)
    cy.contains("[data-test=page-title]", "Automation")
    cy.contains("Available Automations")
    cy.contains("New Automation").click()
    cy.contains("New Automation")
    cy.contains("button", "Cancel").click()
  })
})
