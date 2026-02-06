const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("masterdata", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open masterdata", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/test/masterdata-cockpit/project`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
