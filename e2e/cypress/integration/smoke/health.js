/**
 * Health Check Tests
 *
 * These tests verify that Elektra is running and healthy.
 * No authentication is required for these endpoints.
 */
describe("system health", () => {
  it("liveliness probe returns 200", () => {
    cy.request("/system/liveliness").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("readiness probe returns 200", () => {
    cy.request("/system/readiness").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("startprobe returns 200", () => {
    cy.request("/system/startprobe").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("root endpoint returns 200", () => {
    cy.request("/").should((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
