const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("api endpoints", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/test/identity/projects/api-endpoints`)
  })

  it("the api endpoints for clients page reachable", () => {
    cy.contains("[data-test=page-title]", "API Endpoints for Clients")
    cy.contains("Here you can find everything that is needed to access the project with the openstack client.")
  })
})

describe("web shell", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open web shell", () => {
    cy.visit(`/${TEST_DOMAIN}/test/webconsole/`)
    cy.contains("[data-test=page-title]", "Web Shell")
  })

  it("open web shell on toolbar", () => {
    cy.visit(`/${TEST_DOMAIN}/test/identity/project/home`)
    cy.get('[data-trigger="webconsole:open"]').click()
    cy.contains("div.toolbar", "Web Shell")
  })
})
