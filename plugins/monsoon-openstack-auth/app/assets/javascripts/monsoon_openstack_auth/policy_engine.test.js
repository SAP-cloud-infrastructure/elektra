import { describe, it, expect, beforeEach, vi } from "vitest"
import "./policy_engine.js"

describe("PolicyEngine", () => {
  describe("Constructor", () => {
    it("should be defined globally", () => {
      expect(PolicyEngine).toBeDefined()
      expect(typeof PolicyEngine).toBe("function")
    })

    it("should throw error when data is null", () => {
      expect(() => new PolicyEngine(null)).toThrow("Missing data. Please provide rules and locals")
    })

    it("should throw error when data is undefined (defaults to empty object)", () => {
      // When undefined, constructor defaults to {}, so it checks for missing rules
      expect(() => new PolicyEngine(undefined)).toThrow("Missing rules. Please provide rules")
    })

    it("should throw error when rules are missing", () => {
      expect(() => new PolicyEngine({ locals: {} })).toThrow("Missing rules. Please provide rules")
    })

    it("should throw error when locals are missing", () => {
      expect(() => new PolicyEngine({ rules: {} })).toThrow("Missing locals. Please provide locals")
    })

    it("should create instance with valid data", () => {
      const data = {
        rules: { testRule: "(rules, locals, params) => true" },
        locals: { userId: "123" },
      }
      const engine = new PolicyEngine(data)

      expect(engine).toBeInstanceOf(PolicyEngine)
      expect(engine.rules).toBeDefined()
      expect(engine.locals).toBeDefined()
    })

    it("should evaluate rules from strings using eval", () => {
      const data = {
        rules: {
          alwaysTrue: "(rules, locals, params) => true",
          alwaysFalse: "(rules, locals, params) => false",
        },
        locals: { userId: "123" },
      }
      const engine = new PolicyEngine(data)

      expect(typeof engine.rules.alwaysTrue).toBe("function")
      expect(typeof engine.rules.alwaysFalse).toBe("function")
    })

    it("should handle eval errors silently", () => {
      const data = {
        rules: {
          validRule: "(rules, locals, params) => true",
          invalidRule: "this is not valid javascript {{{",
        },
        locals: { userId: "123" },
      }

      // Should not throw
      expect(() => new PolicyEngine(data)).not.toThrow()
      const engine = new PolicyEngine(data)

      expect(typeof engine.rules.validRule).toBe("function")
      expect(typeof engine.rules.invalidRule).toBe("string") // Stays as string if eval fails
    })

    it("should store locals correctly", () => {
      const locals = {
        userId: "user-123",
        roles: ["admin", "member"],
        domainId: "domain-456",
      }
      const data = {
        rules: {},
        locals: locals,
      }
      const engine = new PolicyEngine(data)

      expect(engine.locals).toEqual(locals)
      expect(engine.locals.userId).toBe("user-123")
      expect(engine.locals.roles).toEqual(["admin", "member"])
    })
  })

  describe("isAllowed", () => {
    let engine

    beforeEach(() => {
      const data = {
        rules: {
          canViewProject: "(rules, locals, params) => locals.roles.includes('viewer')",
          canEditProject: "(rules, locals, params) => locals.roles.includes('editor')",
          canDeleteProject: "(rules, locals, params) => locals.roles.includes('admin')",
          isDomainOwner: "(rules, locals, params) => locals.domainId === params.domainId",
          complexRule:
            "(rules, locals, params) => locals.roles.includes('admin') || (locals.roles.includes('member') && params.projectOwner === locals.userId)",
        },
        locals: {
          userId: "user-123",
          roles: ["viewer", "member"],
          domainId: "domain-456",
        },
      }
      engine = new PolicyEngine(data)
    })

    it("should throw error when rule does not exist", () => {
      expect(() => engine.isAllowed("nonExistentRule")).toThrow("Rule nonExistentRule not found.")
    })

    it("should evaluate simple true rule", () => {
      expect(engine.isAllowed("canViewProject")).toBe(true)
    })

    it("should evaluate simple false rule", () => {
      expect(engine.isAllowed("canEditProject")).toBe(false)
    })

    it("should pass params to rule evaluation", () => {
      expect(engine.isAllowed("isDomainOwner", { domainId: "domain-456" })).toBe(true)
      expect(engine.isAllowed("isDomainOwner", { domainId: "domain-789" })).toBe(false)
    })

    it("should handle empty params", () => {
      expect(engine.isAllowed("canViewProject")).toBe(true)
      expect(engine.isAllowed("canViewProject", {})).toBe(true)
    })

    it("should evaluate complex rules with multiple conditions", () => {
      // User is not admin but is member and project owner
      expect(engine.isAllowed("complexRule", { projectOwner: "user-123" })).toBe(true)

      // User is not admin and not project owner
      expect(engine.isAllowed("complexRule", { projectOwner: "user-999" })).toBe(false)
    })

    it("should provide access to all rules in rule evaluation", () => {
      const data = {
        rules: {
          baseRule: "(rules, locals, params) => locals.isActive",
          compositeRule: "(rules, locals, params) => rules.baseRule(rules, locals, params) && locals.isVerified",
        },
        locals: {
          isActive: true,
          isVerified: true,
        },
      }
      const compositeEngine = new PolicyEngine(data)

      expect(compositeEngine.isAllowed("compositeRule")).toBe(true)
    })

    it("should handle rules that check array membership", () => {
      const data = {
        rules: {
          hasRole: "(rules, locals, params) => locals.roles.includes(params.role)",
        },
        locals: {
          roles: ["admin", "editor", "viewer"],
        },
      }
      const roleEngine = new PolicyEngine(data)

      expect(roleEngine.isAllowed("hasRole", { role: "admin" })).toBe(true)
      expect(roleEngine.isAllowed("hasRole", { role: "guest" })).toBe(false)
    })

    it("should handle rules with string comparisons", () => {
      const data = {
        rules: {
          isSameDomain: "(rules, locals, params) => locals.domainId === params.domainId",
        },
        locals: {
          domainId: "domain-123",
        },
      }
      const domainEngine = new PolicyEngine(data)

      expect(domainEngine.isAllowed("isSameDomain", { domainId: "domain-123" })).toBe(true)
      expect(domainEngine.isAllowed("isSameDomain", { domainId: "domain-456" })).toBe(false)
    })

    it("should handle rules with numeric comparisons", () => {
      const data = {
        rules: {
          canUploadFile: "(rules, locals, params) => params.fileSize <= locals.maxFileSize",
        },
        locals: {
          maxFileSize: 1024 * 1024 * 10, // 10MB
        },
      }
      const uploadEngine = new PolicyEngine(data)

      expect(uploadEngine.isAllowed("canUploadFile", { fileSize: 1024 * 1024 * 5 })).toBe(true) // 5MB
      expect(uploadEngine.isAllowed("canUploadFile", { fileSize: 1024 * 1024 * 20 })).toBe(false) // 20MB
    })

    it("should handle rules with boolean logic", () => {
      const data = {
        rules: {
          canPerformAction: "(rules, locals, params) => (locals.isAdmin || locals.isOwner) && !locals.isSuspended",
        },
        locals: {
          isAdmin: false,
          isOwner: true,
          isSuspended: false,
        },
      }
      const actionEngine = new PolicyEngine(data)

      expect(actionEngine.isAllowed("canPerformAction")).toBe(true)

      actionEngine.locals.isSuspended = true
      expect(actionEngine.isAllowed("canPerformAction")).toBe(false)
    })
  })

  describe("Global Exposure", () => {
    it("should be available on window object in browser environment", () => {
      expect(window.PolicyEngine).toBeDefined()
      expect(window.PolicyEngine).toBe(PolicyEngine)
    })

    it("should create instances via window.PolicyEngine", () => {
      const data = {
        rules: { testRule: "(rules, locals, params) => true" },
        locals: { userId: "123" },
      }
      const engine = new window.PolicyEngine(data)

      expect(engine).toBeInstanceOf(PolicyEngine)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty rules object", () => {
      const data = {
        rules: {},
        locals: { userId: "123" },
      }
      const engine = new PolicyEngine(data)

      expect(engine.rules).toEqual({})
      expect(() => engine.isAllowed("anyRule")).toThrow("Rule anyRule not found.")
    })

    it("should handle empty locals object", () => {
      const data = {
        rules: { simpleRule: "(rules, locals, params) => true" },
        locals: {},
      }
      const engine = new PolicyEngine(data)

      expect(engine.locals).toEqual({})
      expect(engine.isAllowed("simpleRule")).toBe(true)
    })

    it("should handle rules that throw exceptions", () => {
      const data = {
        rules: {
          throwingRule: "(rules, locals, params) => { throw new Error('Rule error'); }",
        },
        locals: { userId: "123" },
      }
      const engine = new PolicyEngine(data)

      expect(() => engine.isAllowed("throwingRule")).toThrow("Rule error")
    })

    it("should handle rules that return non-boolean values", () => {
      const data = {
        rules: {
          returnsString: "(rules, locals, params) => 'yes'",
          returnsNumber: "(rules, locals, params) => 1",
          returnsNull: "(rules, locals, params) => null",
          returnsUndefined: "(rules, locals, params) => undefined",
          returnsObject: "(rules, locals, params) => ({ allowed: true })",
        },
        locals: { userId: "123" },
      }
      const engine = new PolicyEngine(data)

      // JavaScript truthy/falsy values
      expect(engine.isAllowed("returnsString")).toBeTruthy()
      expect(engine.isAllowed("returnsNumber")).toBeTruthy()
      expect(engine.isAllowed("returnsNull")).toBeFalsy()
      expect(engine.isAllowed("returnsUndefined")).toBeFalsy()
      expect(engine.isAllowed("returnsObject")).toBeTruthy()
    })

    it("should handle deeply nested locals", () => {
      const data = {
        rules: {
          checkNestedProperty: "(rules, locals, params) => locals.user.profile.settings.notifications.email === true",
        },
        locals: {
          user: {
            profile: {
              settings: {
                notifications: {
                  email: true,
                  sms: false,
                },
              },
            },
          },
        },
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("checkNestedProperty")).toBe(true)
    })

    it("should allow modifying locals after instantiation", () => {
      const data = {
        rules: {
          checkRole: "(rules, locals, params) => locals.roles.includes('admin')",
        },
        locals: {
          roles: ["viewer"],
        },
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("checkRole")).toBe(false)

      // Modify locals
      engine.locals.roles.push("admin")

      expect(engine.isAllowed("checkRole")).toBe(true)
    })

    it("should handle special characters in rule names", () => {
      const data = {
        rules: {
          "can:view:project": "(rules, locals, params) => true",
          "user-has-permission": "(rules, locals, params) => false",
        },
        locals: {},
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("can:view:project")).toBe(true)
      expect(engine.isAllowed("user-has-permission")).toBe(false)
    })
  })

  describe("Real-World Use Cases", () => {
    it("should handle OpenStack project permissions", () => {
      const data = {
        rules: {
          "compute:create_server":
            "(rules, locals, params) => locals.roles.includes('compute_admin') || locals.roles.includes('member')",
          "compute:delete_server":
            "(rules, locals, params) => locals.roles.includes('compute_admin') || (locals.roles.includes('member') && params.serverOwnerId === locals.userId)",
          "network:create_network": "(rules, locals, params) => locals.roles.includes('network_admin')",
        },
        locals: {
          userId: "user-123",
          roles: ["member", "network_viewer"],
          projectId: "project-456",
        },
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("compute:create_server")).toBe(true)
      expect(engine.isAllowed("compute:delete_server", { serverOwnerId: "user-123" })).toBe(true)
      expect(engine.isAllowed("compute:delete_server", { serverOwnerId: "user-999" })).toBe(false)
      expect(engine.isAllowed("network:create_network")).toBe(false)
    })

    it("should handle domain-scoped permissions", () => {
      const data = {
        rules: {
          "domain:admin":
            "(rules, locals, params) => locals.domainId === params.domainId && locals.roles.includes('domain_admin')",
          "domain:view":
            "(rules, locals, params) => locals.domainId === params.domainId || locals.roles.includes('cloud_admin')",
        },
        locals: {
          userId: "user-123",
          domainId: "domain-abc",
          roles: ["domain_admin", "member"],
        },
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("domain:admin", { domainId: "domain-abc" })).toBe(true)
      expect(engine.isAllowed("domain:admin", { domainId: "domain-xyz" })).toBe(false)
      expect(engine.isAllowed("domain:view", { domainId: "domain-abc" })).toBe(true)
      expect(engine.isAllowed("domain:view", { domainId: "domain-xyz" })).toBe(false)
    })

    it("should handle time-based permissions", () => {
      const currentTime = Date.now()
      const data = {
        rules: {
          "access:within_hours":
            "(rules, locals, params) => params.currentTime >= locals.accessStartTime && params.currentTime <= locals.accessEndTime",
        },
        locals: {
          accessStartTime: currentTime - 3600000, // 1 hour ago
          accessEndTime: currentTime + 3600000, // 1 hour from now
        },
      }
      const engine = new PolicyEngine(data)

      expect(engine.isAllowed("access:within_hours", { currentTime: currentTime })).toBe(true)
      expect(engine.isAllowed("access:within_hours", { currentTime: currentTime - 7200000 })).toBe(false) // 2 hours ago
      expect(engine.isAllowed("access:within_hours", { currentTime: currentTime + 7200000 })).toBe(false) // 2 hours from now
    })
  })
})
