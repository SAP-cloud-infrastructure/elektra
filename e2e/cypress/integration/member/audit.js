const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("audit", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open audit and should see unauthorized", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/test/audit/`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
