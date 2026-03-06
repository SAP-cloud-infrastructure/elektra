# Authentication & Authorization Simplification Roadmap

## Executive Summary

The `monsoon-openstack-auth` plugin was originally designed as a reusable gem for multiple projects. Since all dependent projects no longer exist and the code has been moved into this project, significant simplification opportunities exist by removing gem/engine abstractions and consolidating cross-cutting concerns into `app/core/`.

**Key Findings:**
- **Authentication:** 35 Ruby files, ~425-line god class, unnecessary abstraction layers, Rails Engine overhead
- **Authorization:** 4 core files, `eval()`-based policy parsing with security concerns, deprecated enforcement pathways
- **Both:** Monkey-patched globally, legacy namespace (`MonsoonOpenstackAuth`), over-engineered for multi-project reuse

**Recommended Destination:** `app/core/` (not `plugins/identity`) because both are cross-cutting concerns used throughout the application.

---

## Critical Security Issues (Address First)

### 1. Replace `eval()` in Policy Engine ⚠️ HIGH PRIORITY
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authorization/policy_engine.rb:278`

**Problem:** Policy rules are parsed through regex substitutions then executed via `eval()`:
```ruby
@executable = eval("lambda {|locals={},params={},trace=nil| #{@parsed_rule} }")
```

**Impact:** Malformed policy files could lead to arbitrary code execution. The 45-line regex chain is fragile and hard to audit.

**Fix:** Replace with AST-based parser or whitelist-based approach. Remove `eval()` entirely.

### 2. Fix Unsafe Class Evaluation
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authorization.rb:68`

**Problem:**
```ruby
klazz = eval(class_name.capitalize)
```

**Fix:** Use `Object.const_get(class_name.capitalize)` with proper error handling, or better yet, remove `build_policy_params` entirely (see Phase 2 below - it's unused in practice).

### 3. Fix Duplicate Exception Handlers
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authorization/policy_engine.rb:325-339`

**Problem:** Three rescue blocks for NameError with two referencing undefined `nme` variable:
```ruby
rescue NameError => ne
  raise RuleExecutionError.new(self, locals, params, nme)  # nme is undefined!
```

**Fix:** Remove duplicate rescues, fix variable reference to `ne`.

### 4. Improve Two-Factor Cookie Security
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_session.rb:148`

**Problem:** Hardcoded domain `.cloud.sap`, uses `secret_key_base[0..31]` for encryption key.

**Fix:** Make domain configurable, use `ActiveSupport::KeyGenerator` to derive proper encryption key.

---

## Phased Simplification Plan

### Phase 1: Remove Dead Code (Low Risk, High Value)
**Estimated effort:** 2-4 hours
**Files affected:** ~15

#### Authentication Dead Code
- [ ] Delete `basic_auth_allowed` config (no implementation exists)
- [ ] Delete `LoggerWrapper` class (use `Rails.logger` with tagged logging)
- [ ] Delete `Cache::NoopCache` and `Cache::RailsMemoryCache` (use `Rails.cache` directly)
- [ ] Delete duplicate `.erb` views in plugin (main app uses `.haml` overrides)
- [ ] Delete `ApiClient#auth_user` method (unused)

#### Authorization Dead Code
- [ ] Remove `authorization_actions_for` (lines 161-167) - deprecated, only 1 usage
  - Migrate `plugins/inquiry/app/controllers/inquiry/admin/inquiries_controller.rb` to `authorization_required`
- [ ] Remove `if_allowed?` instance method (lines 332-361) - no controller usage
- [ ] Remove `ensure_authorization_performed` (lines 178-182, 258-269) - uses deprecated `after_filter`
- [ ] Remove `overridden_actions`, `run_authorization_check`, `instance_authorization_resource` supporting methods

**Expected outcome:** ~500-700 lines of code removed, clearer codebase.

---

### Phase 2: Simplify Core Logic (Medium Risk)

#### 2A: Break Up `AuthSession` God Class
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_session.rb` (425 lines)

**Current problems:** Single class handles session creation, token validation, rescoping, login, logout, two-factor, SSO, access keys, and redirect logic.

**Refactor into:**
```
app/core/auth/
  session_manager.rb      # Login, logout, session lifecycle
  token_validator.rb      # Validates tokens against Keystone
  two_factor_auth.rb      # Two-factor cookie/RADIUS logic
  rescoper.rb             # Token rescoping logic
  keystone_client.rb      # API calls to Keystone (rename from ConnectionDriver::Default)
```

**Benefits:**
- Single responsibility per class
- Easier testing
- Clearer dependencies

#### 2B: Simplify AuthUser
**File:** `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_user.rb` (220 lines)

**Changes:**
- [ ] Extract `is_allowed?` and `required_roles` to policy engine (authorization concern)
- [ ] Merge `CurrentUserWrapper` concern into `AuthUser` (add `email`, `full_name` directly)
- [ ] Replace custom `read_value` with Ruby's `dig` method

#### 2C: Consolidate Authorization Enforcement
**Files:** `authorization.rb` (418 lines), `policy_engine.rb` (356 lines)

**Current problems:** Three redundant enforcement pathways with duplicated logic.

**Changes:**
- [ ] Keep only `enforce_permissions` (modern approach)
- [ ] Simplify rule name resolution (lines 216-233) - pick one canonical format: `"context:resource_action"`
- [ ] Remove `build_policy_params` auto-loading (lines 32-98) - controllers pass explicit params
- [ ] Replace `eval()` in `policy_engine.rb:278` with safe parser (see Security Issue #1)

---

### Phase 3: De-Engine and Relocate (Higher Risk)
**Estimated effort:** 1-2 days
**Files affected:** ~40

#### 3A: Remove Rails Engine Packaging

**Delete:**
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/engine.rb`
- `plugins/monsoon-openstack-auth/monsoon-openstack-auth.gemspec`
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/version.rb`
- Engine-specific configurations (isolated namespace, asset pipeline)

#### 3B: Move to `app/core/`

**New structure:**
```
app/core/auth/
  # Authentication
  session_manager.rb
  token_validator.rb
  two_factor_auth.rb
  rescoper.rb
  keystone_client.rb
  auth_user.rb
  errors.rb

  # Controller concern
  controller_concern.rb   # authentication_required, current_user, logged_in?

app/core/authorization/
  policy_engine.rb        # Rule parsing and enforcement
  policy_params.rb        # Parameter conversion
  errors.rb               # SecurityViolation, PolicyParseError
  controller_concern.rb   # authorization_required, enforce_permissions

app/controllers/auth/
  sessions_controller.rb  # Login, logout, two-factor, SSO

app/views/auth/sessions/
  new.html.haml
  two_factor.html.haml
```

**Routes:** Move from engine routes to `config/routes.rb`:
```ruby
namespace :auth do
  resources :sessions, only: [:new, :create, :destroy] do
    collection do
      get :two_factor
      post :verify_two_factor
      post :consume_auth_token
    end
  end
end
```

#### 3C: Replace Global Monkey-Patching

**Current (bad):**
```ruby
# lib/monsoon-openstack-auth.rb:80-81
ActionController::Base.send(:include, MonsoonOpenstackAuth::Authentication)
ActionController::Base.send(:include, MonsoonOpenstackAuth::Authorization)
```

**New (good):**
```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include Core::Auth::ControllerConcern
  include Core::Authorization::ControllerConcern
end
```

#### 3D: Rename Namespace

**Find/replace across entire codebase:**
- `MonsoonOpenstackAuth::Authentication` → `Core::Auth`
- `MonsoonOpenstackAuth::Authorization` → `Core::Authorization`
- `MonsoonOpenstackAuth.configuration` → `Core::Auth.config` / `Core::Authorization.config`
- `MonsoonOpenstackAuth.policy_engine` → `Core::Authorization.policy_engine`

**Update references in:**
- ~35 controllers using `authorization_required`
- ~25 controllers using `enforce_permissions`
- ~15 views using `current_user.is_allowed?`
- Navigation configs
- Error handling in `Rescue` concern

---

### Phase 4: Simplify Configuration (Low Risk)

#### 4A: Inline Authentication Config

**Current:** 16 configuration options in `Configuration` class, mostly boolean flags.

**Simplify to:**
```ruby
# config/initializers/auth.rb
Core::Auth.configure do |config|
  config.keystone_endpoint = ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']
  config.ssl_verify_peer = ENV.fetch('MONSOON_OPENSTACK_AUTH_API_SSL_VERIFY_PEER', 'true') == 'true'
  config.two_factor_enabled = ENV.fetch('MONSOON_OPENSTACK_AUTH_2FA_ENABLED', 'false') == 'true'
  config.two_factor_radius_servers = ENV['MONSOON_OPENSTACK_AUTH_2FA_RADIUS_SERVERS']
  config.two_factor_domain = ENV.fetch('TWO_FACTOR_DOMAIN', '.cloud.sap')
  config.enforce_natural_user = ENV.fetch('MONSOON_OPENSTACK_AUTH_ENFORCE_NATURAL_USER', 'false') == 'true'
  config.enforce_rsa_dns_path = ENV['MONSOON_OPENSTACK_AUTH_ENFORCE_RSA_DNS_PATH']
end
```

**Remove:** `*_auth_allowed` boolean flags (form, SSO, token, access_key) - these are effectively hardcoded and never changed.

#### 4B: Simplify Authorization Config

**Current:** Separate `AuthorizationConfig` sub-class with trace/debug options, context, action mapping, policy file paths.

**Keep only:**
- Policy file paths (needed for merging plugin policies)
- Context (if still needed for multi-tenancy)

**Remove:** Trace/debug (use Rails logger levels instead), action mapping (standardize on one format).

---

### Phase 5: Optional Future Improvements

#### 5A: Replace Client-Side Policy Compilation
**Current:** Every rule is parsed twice (Ruby + JavaScript). JS version is generated via `to_js` method.

**Alternative:** Frontend calls API endpoint to check permissions instead of evaluating policies client-side.

**Effort:** Medium (requires frontend changes)
**Benefit:** Eliminates dual parsing, improves security (policies stay server-side)

#### 5B: Modern OpenStack SDK
**Current:** Custom Excon-based `ConnectionDriver::Default` talks to Keystone v3 API.

**Alternative:** Use `fog-openstack` gem or official OpenStack SDK.

**Effort:** High (may introduce new dependencies)
**Benefit:** Reduced maintenance, better API coverage

#### 5C: Test Coverage Improvements
**Current status:** Authorization has 4 solid spec files; authentication has basic coverage.

**Improvements:**
- Add integration tests for full login flow (form, SSO, two-factor)
- Add request specs for session controller edge cases
- Add specs for token rescoping logic

---

## Implementation Strategy

### Recommended Order

1. **Week 1: Security Fixes + Dead Code Removal**
   - Fix critical security issues (eval, duplicate rescues)
   - Remove all dead code from Phase 1
   - Run full test suite to ensure nothing breaks

2. **Week 2: Core Logic Simplification**
   - Break up `AuthSession` god class
   - Simplify `AuthUser`
   - Consolidate authorization enforcement
   - Update tests to match new structure

3. **Week 3: Relocation**
   - Move to `app/core/auth/` and `app/core/authorization/`
   - Update all references throughout codebase
   - Replace monkey-patching with explicit inclusion
   - Rename namespace from `MonsoonOpenstackAuth` to `Core`

4. **Week 4: Configuration Cleanup + Testing**
   - Inline configuration
   - Full regression testing
   - Update documentation

### Testing Strategy

- Run specs after each phase: `bundle exec rspec spec/`
- Test authentication flow manually: login, logout, two-factor, SSO
- Test authorization: verify policy enforcement in controllers
- Check all 26 plugin policy files still load correctly
- Verify frontend navigation permissions still work

### Rollback Plan

- Each phase should be a separate PR with git commits
- Tag before starting Phase 3 (relocation) for easy rollback
- Keep original `plugins/monsoon-openstack-auth/` until Phase 3 is fully tested

---

## Expected Outcomes

### Code Reduction
- **Lines removed:** ~1,000-1,500 (dead code, duplicate logic, gem overhead)
- **Complexity reduction:** God class → focused single-responsibility classes
- **Files consolidated:** 52 files → ~15 core files

### Maintainability Improvements
- Clearer separation of concerns (auth vs authz)
- Easier to test (smaller, focused classes)
- Simpler namespace (`Core::Auth` vs `MonsoonOpenstackAuth::Authentication`)
- No more gem/engine abstraction overhead

### Security Improvements
- Remove `eval()` from policy parsing
- Better encryption key derivation for two-factor cookies
- Configurable cookie domain

### Performance
- Slightly faster (less indirection, no unnecessary delegation layers)
- Potential improvement if client-side policy compilation is removed (Phase 5A)

---

## Risk Assessment

| Phase | Risk Level | Reason | Mitigation |
|-------|-----------|--------|------------|
| Phase 1 | Low | Only removing unused code | Comprehensive test run |
| Phase 2 | Medium | Refactoring core logic | Incremental changes, test after each class split |
| Phase 3 | High | Moving files, namespace changes | Separate PR, tag for rollback, staged deployment |
| Phase 4 | Low | Configuration changes | Only affects initialization, easy to revert |
| Phase 5 | Medium-High | Optional, can defer | Not required for simplification goal |

---

## Questions for Discussion

1. **Timeline:** Is 4 weeks acceptable, or should we prioritize certain phases?
2. **Phase 5A (Client-side policies):** Do we rely heavily on JavaScript policy checking in the UI? If so, this would require frontend changes.
3. **OpenStack SDK (Phase 5B):** Is there interest in modernizing the Keystone API client, or is the current implementation sufficient?
4. **Breaking changes:** Are there any external dependencies on `MonsoonOpenstackAuth` namespace that we're not aware of?
5. **Testing environment:** Do we have a staging environment to test authentication/authorization changes before production?

---

## Next Steps

1. Review this roadmap with the team
2. Get approval for phased approach
3. Create GitHub issues for each phase
4. Start with Phase 1 (security fixes + dead code removal)
5. Schedule code review sessions after each phase

---

**Document generated:** 2026-03-03
**Based on:** Authentication analysis (authentication-analyst) + Authorization analysis (authorization-analyst)
**Contact:** Team lead - auth-simplification team
