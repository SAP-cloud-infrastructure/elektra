const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("networking", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open floating ip page and check allocate new dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/networking/floating_ips`)
    cy.contains("[data-test=page-title]", "Floating IPs")
    cy.contains("a", "Allocate new").click()
    cy.contains("button", "Allocate").should("be.disabled")
  })

  it("open private networks page and test create new dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/networking/networks/private`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("a", "Create new").click()
    cy.contains("Network Address (CIDR)")
    cy.contains("button", "Cancel").click()
  })

  it("open routers page and test create new dialog", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${TEST_DOMAIN}/admin/networking/routers`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("th", "External Subnet")
    cy.contains("a", "Create new").click()
  })

  it("open securtiy groups page", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
  })

  it("open securtiy groups page and test default security group actions", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "default").click()
    cy.contains("h4", "Security Group Info")
    cy.contains("a", "Add New Rule").click()
    cy.contains("New Security Group Rule")
    cy.contains("button", "Cancel").click()
  })

  it("open floating IPs and test allocate new", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${TEST_DOMAIN}/admin/networking/floating_ips`)
    cy.contains("[data-test=page-title]", "Floating IPs")
    cy.contains("a", "Allocate new").click()
    cy.contains("button", "Allocate").should("be.disabled")
    cy.contains("button", "Cancel").click()
  })

  it("open backup networks", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${TEST_DOMAIN}/admin/networking/backup_networks`)
    cy.contains("[data-test=page-title]", "Backup Network")
    cy.contains("a", "Get Access").click()
    cy.contains(
      "The backup network cannot be automatically assigned in this domain. Please open a support ticket so our support staff can take care of this for you."
    )
  })

  it("open fixed IPs and Ports and check Reserved new IP", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${TEST_DOMAIN}/admin/networking/widget/ports/?r=/ports`)
    cy.contains("[data-test=page-title]", "Fixed IPs / Ports")
    cy.contains("a", "Reserve new IP").click()
    cy.contains("button", "Save").should("be.disabled")
  })
})
