const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("masterdata", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open masterdata", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`)
    cy.contains("[data-test=page-title]", "Project Masterdata")
    cy.contains("Masterdata Status")
  })

  it("open masterdata and check edit masterdata", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/masterdata-cockpit/project`)
    cy.contains("[data-test=page-title]", "Project Masterdata")
    cy.get("#edit_masterdata_btn").click()
    cy.contains("Edit masterdata for project: admin")
    cy.contains("button", "Cancel").click()
  })
})
