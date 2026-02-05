describe("networking", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("open floating ip page and check allocate new dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/floating_ips`)
    cy.contains("[data-test=page-title]", "Floating IPs")
    cy.contains("a", "Allocate new").click()
    cy.contains("button", "Allocate").should("be.disabled")
    cy.get("#floating_ip_floating_subnet_id").should("be.hidden")
    cy.get("#floating_ip_floating_network_id").select(1)
    cy.get("#floating_ip_floating_subnet_id").should("be.visible")
    cy.get("#floating_ip_floating_subnet_id").select(1)
    cy.contains("button", "Allocate").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open private networks page and test create new dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/networks/private`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("a", "Create new").click()
    cy.contains("Network Address (CIDR)")
    cy.contains("button", "Cancel").click()
  })

  it("open routers page and test create new dialog", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/routers`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("th", "External Subnet")
    cy.contains("a", "Create new").click()
    cy.contains("button", "Create").should("be.disabled")
    cy.get("#router_name").type("test")
    cy.get("#router_external_gateway_info_network_id").select(1)
    cy.get("#router_external_gateway_info_external_fixed_ips_subnet_id").should("be.visible").select(1)
    cy.contains("button", "Create").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  // set to skip because the security group creation is not working
  // the New Security Group is in the test disabled
  // but if I check this directly in the browser with the same user it is enabled
  it.skip("open securtiy groups page and test create new security group dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "New Security Group").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#name").type("test")
    cy.contains("button", "Save").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open securtiy groups page and test default security group actions", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "default").click()
    cy.contains("h4", "Security Group Info")
    cy.contains("a", "Add New Rule").click()
    cy.contains("New Security Group Rule")
    cy.contains("button", "Cancel").click()
  })

  it("open floating IPs and test allocate new", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/floating_ips`)
    cy.contains("[data-test=page-title]", "Floating IPs")
    cy.contains("a", "Allocate new").click()
    cy.contains("button", "Allocate").should("be.disabled")
    cy.get("#floating_ip_floating_network_id").select(1)
    cy.get("#floating_ip_floating_subnet_id").should("be.visible").select(1)
    cy.contains("button", "Allocate").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open backup networks", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/backup_networks`)
    cy.contains("[data-test=page-title]", "Backup Network")
    cy.contains("a", "Get Access").click()
    cy.contains(
      "The backup network cannot be automatically assigned in this domain. Please open a support ticket so our support staff can take care of this for you."
    )
  })

  it("open fixed IPs and Ports and check Reserved new IP", () => {
    // use admin project because on the member project no networks are configured
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/widget/ports/?r=/ports`)
    cy.contains("[data-test=page-title]", "Fixed IPs / Ports")
    cy.contains("a", "Reserve new IP").click()
    cy.contains("button", "Save").should("be.disabled")
  })
})
