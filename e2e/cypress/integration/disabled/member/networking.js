const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("networking", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open floating ip page and check allocate new dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/floating_ips`)
    cy.contains("[data-test=page-title]", "Floating IPs")
    cy.contains("a", "Allocate new").click()
    cy.contains("label", "Dns domain").should("not.exist")
    cy.contains("label", "Floating network")
    cy.contains("button", "Allocate").should("be.disabled")
    cy.contains("button", "Cancel").click()
  })

  it("open external networks page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/networks/external`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("th", "Subnets Associated")
  })

  it("open private networks page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/networks/private`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("a", "Create new").should("not.exist")
    cy.contains("th", "Subnets Associated")
  })

  it("open routers page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/routers`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("a", "Create new").should("not.exist")
    cy.contains("th", "External Subnet")
  })

  it("open bgp vpns page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/widget/bgp-vpns/?r=/`)
    cy.contains("[data-test=page-title]", "Networks & Routers")
    cy.contains("a", "New BGP VPN").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#name").type("test")
    cy.contains("button", "Save").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open securtiy groups page", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "New Security Group").should("not.exist")
    cy.contains("a", "default").click()
    cy.contains("h4", "Security Group Info")
    cy.contains("a", "Add New Rule").should("not.exist")
  })

  it("open fixed ips and ports and get unauthorized", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/test/networking/widget/ports`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
