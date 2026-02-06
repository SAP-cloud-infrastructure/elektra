const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("images", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open images page and see a list of available images", () => {
    cy.visit(`/${TEST_DOMAIN}/test/image/ng?r=/os-images/available`)
    cy.contains("[data-test=page-title]", "Server Images & Snapshots")
    cy.contains("td", "vmdk")
    cy.contains(".btn", "Load Next").click()
  })
})
