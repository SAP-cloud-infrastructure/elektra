describe("images", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open images page and see a list of available images", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/image/ng?r=/os-images/available`)
    cy.contains("[data-test=page-title]", "Server Images & Snapshots")
    cy.contains("td", "vmdk")
    cy.contains(".btn", "Load Next").click()
  })
})
