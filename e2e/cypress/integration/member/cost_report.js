const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("cost report", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("check for 403 forbidden", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/test/reports/cost/project`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
