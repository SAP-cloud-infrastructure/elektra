const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("volumes", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/test/block-storage/?r=/volumes`)
  })

  it("the volumes page is reachable", () => {
    cy.contains("[data-test=page-title]", "Volumes & Snapshots")
    cy.get(".table.volumes")
    cy.request("/").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("click on 'Create New' button opens a modal window", () => {
    cy.contains("Create New").click()
    cy.url().should("include", "/?r=/volumes/new")
    cy.get(".modal-content").as("modal")

    cy.get("@modal").contains("New Volume")
    cy.get("@modal").contains("Save")
  })
})

describe("snapshots", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/test/block-storage/?r=/snapshots`)
  })

  it("the snapshots page is reachable", () => {
    cy.contains("[data-test=page-title]", "Volumes & Snapshots")
    cy.get(".table.snapshots")
    cy.request(`/${TEST_DOMAIN}/test/block-storage/?r=/snapshots`).should((response) => {
      expect(response.status).to.eq(200)
    })
  })
})

describe("deep links", () => {
  it("opens the new volume modal window", () => {
    cy.elektraLoginWithEnv()
    cy.visit(`/${TEST_DOMAIN}/test/block-storage/?r=/volumes/new`)
    cy.contains("[data-test=page-title]", "Volumes & Snapshots")
    cy.contains("New Volume")
    cy.contains("Save")
  })
})
