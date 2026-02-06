const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("kubernetes", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open kubernetes page in member project and see that I need kubernetes admin role", () => {
    cy.visit(`/${TEST_DOMAIN}/test/kubernetes/`)
    cy.contains("[data-test=page-title]", "Kubernetes as a Service")
    cy.contains("code", "kubernetes_admin")
  })
})
