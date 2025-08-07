describe("automation", () => {
  beforeEach(() => {
    cy.elektraLogin(
      Cypress.env("TEST_DOMAIN"),
      Cypress.env("TEST_USER"),
      Cypress.env("TEST_PASSWORD")
    )
  })

  it("open automation page and get unauthorized", () => {
    cy.request({
      url: `/${Cypress.env("TEST_DOMAIN")}/test/automation/nodes/`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
