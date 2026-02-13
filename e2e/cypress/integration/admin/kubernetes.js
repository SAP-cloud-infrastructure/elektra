const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("kubernetes", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open kubernetes page in admin project and test create dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/kubernetes/`)
    cy.contains("[data-test=page-title]", "Kubernetes as a Service")
    cy.contains("button", "Create Cluster").click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000) // waiting for ajax to complete
    cy.contains("button[type=submit]", "Create").should("be.enabled")
    cy.get("input[placeholder='lower case letters and numbers']").type("test")
    cy.get("input[placeholder='a-z + 0-9']").type("test")
    cy.get("select[name=keypair").select(1)
    cy.contains("button[type=submit]", "Create").should("be.enabled")
    cy.contains("button", "Add Pool").click()
    cy.contains("Pool 2:")
    cy.contains("button[type=submit]", "Create").should("be.enabled")
    cy.contains("button", "Close").click()
  })
})
