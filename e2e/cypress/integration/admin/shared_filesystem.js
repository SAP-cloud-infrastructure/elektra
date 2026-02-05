describe("shared filesystem", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open shared file system storage page and check create new dialog", () => {
    // use admin project because shared networks are not configured in the member project
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/shares`)
    cy.contains("[data-test=page-title]", "File System Storage")
    cy.contains("a", "Create New").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#name").type("test")
    cy.get("#share_proto").select(1)
    cy.get("#size").type("10")
    cy.get("#share_network_id").select(1)
    cy.contains("button", "Save").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open shared file system storage snapshots", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/snapshots`)
    cy.contains("[data-test=page-title]", "File System Storage")
  })

  it("open shared file system storage replicas", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/replicas`)
    cy.contains("[data-test=page-title]", "File System Storage")
  })

  it("open shared file system storage share-networks and check create new dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/share-networks`)
    cy.contains("[data-test=page-title]", "File System Storage")
    cy.contains("a", "Create New").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#name").type("test")
    cy.get("#neutron_net_id").select("private_datapath_admin_cc3test")
    cy.get("#neutron_subnet_id").should("be.visible")
    cy.get("#neutron_subnet_id").select(1)
    cy.contains("button", "Save").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open shared file system storage security-services and check create new dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/security-services`)
    cy.contains("[data-test=page-title]", "File System Storage")
    cy.contains("a", "Create New").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#type").select(1)
    cy.get("#ou").type("test")
    cy.get("#name").type("test")
    cy.contains("button", "Save").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open shared file system storage autoscaling and check configure dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/shared-filesystem-storage/?r=/autoscaling`)
    cy.contains("[data-test=page-title]", "File System Storage")
    cy.contains("a", "Configure").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.contains("button", "Cancel").click()
  })
})
