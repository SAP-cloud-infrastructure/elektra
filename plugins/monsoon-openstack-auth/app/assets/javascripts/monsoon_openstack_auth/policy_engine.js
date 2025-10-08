class PolicyEngine {
  constructor(data = {}) {
    if (!data) {
      throw new Error("Missing data. Please provide rules and locals");
    }
    if (!data.rules) {
      throw new Error("Missing rules. Please provide rules");
    }
    if (!data.locals) {
      throw new Error("Missing locals. Please provide locals");
    }
    
    // locals are user specific attributes like domain_id, roles etc.
    this.rules = data.rules;
    
    for (const [name, rule] of Object.entries(this.rules)) {
      try {
        this.rules[name] = eval(rule);
      } catch (e) {
        // Handle eval error silently (matching original behavior)
      }
    }
    
    this.locals = data.locals;
  }
  
  isAllowed(name, params = {}) {
    const rule = this.rules[name];
    
    if (!rule) {
      throw new Error(`Rule ${name} not found.`);
    }
    
    return rule(this.rules, this.locals, params);
  }
}

// If you need to expose it globally (like CoffeeScript's @)
if (typeof window !== 'undefined') {
  window.PolicyEngine = PolicyEngine;
} else if (typeof global !== 'undefined') {
  global.PolicyEngine = PolicyEngine;
}
