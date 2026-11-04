---
name: policy-rbac
description: >-
  Use when adding or changing permission checks in a controller or React widget,
  understanding why a button is hidden or shown, or debugging why enforce_permissions
  raises SecurityViolation. Covers the policy.json format, server-side enforcement,
  JS delivery, and client-side isAllowed() calls.
---

# Policy / RBAC

Elektra maintains its own **UI-layer permission system** that is separate from
OpenStack's backend enforcement. Each plugin provides a `config/policy.json` that
maps action names to role-based rules. The system is a **best-effort UI mapping**:
rules control whether buttons appear and whether controller actions are gatekept,
but the OpenStack backend is the final authority. If a user slips past a missing
or incomplete UI check, the backend will reject the request anyway.

```
policy.json (per plugin)
  → merged into a single PolicyEngine at boot
      → server-side: enforce_permissions / authorization_required → SecurityViolation (HTTP 403/200)
      → JS delivery: policy.to_js → window.policyConfig → policy_engine.js → window.policy
          → widget.setPolicy() → lib/policy.js module
              → React components: policy.isAllowed("rule_name", params)
```

---

## Policy JSON format

Every plugin under `plugins/<name>/config/policy.json` follows the same format.
All files are merged into one flat hash at startup — **plugin-level rules are in the
same namespace**, so rule names must be unique across all plugins (conventionally
prefixed with `<plugin>:` for action rules, or without prefix for shared context
rules).

### Rule types

```json
{
  "rule_name": "<expression>"
}
```

The expression language:

| Syntax | Meaning |
|--------|---------|
| `role:some_role` | User has the named OpenStack role |
| `rule:other_rule` | Evaluate another rule (recursive) |
| `@` | Always allow (everyone) |
| `!` | Always deny (nobody) |
| `true` / `True` | Always allow |
| `false` / `False` | Always deny |
| `or` / `and` / `not` | Boolean operators |
| `( ... )` | Grouping |
| `domain_id:%(target.project.domain_id)s` | Compare a local (token attribute) to a param |
| `project_id:%(network.tenant_id)s` | Same, different target path |
| `token.is_admin_project:true` | Token flag check |

**Locals** available on the left side of `:` comparisons:

| Local | Value |
|-------|-------|
| `roles` | User's role names (array) |
| `domain_id` | Token's domain scope |
| `project_id` | Token's project scope |
| `domain_name` | Token's domain name |
| `user_id` | User UUID |
| `project_domain_id` | Project's domain ID |
| `token.is_admin_project` | `true` if token carries the admin project flag |
| `is_admin` | Always `false` — admin tokens do not bypass checks in Elektra |

**Params** (`%(name)s`) are runtime values passed to `enforce_permissions` or
`is_allowed?` as a hash. They can be nested with dots: `%(target.project.domain_id)s`
→ `params[:target].project.domain_id`.

### Global base policy — `config/policy.json`

A top-level `config/policy.json` defines shared rules used across all plugins:

```json
{
  "cloud_admin":   "rule:admin_required and (token.is_admin_project:True or domain_id:'ccadmin')",
  "domain_admin":  "rule:admin_required and not domain_id:nil",
  "project_admin": "rule:admin_required and not project_id:nil",
  "admin_required": "role:admin or is_admin:1",
  "service_role":  "role:service",
  "monsoon2_domain": "%(target.scoped_domain_name)s=='monsoon2'",
  "project_parent": "not %(target.project.parent_id)s==nil",
  "default":       "rule:admin_required"
}
```

These rules are merged first; plugin files are merged on top.
Duplicate keys: first definition wins (`merge!` with `{ |key, v1, v2| v1 }`).

### Typical plugin policy structure

Each plugin defines:
1. **Context rules** — role-set aliases (`context_is_admin`, `context_is_editor`, `context_is_viewer`)
2. **Action rules** — `<plugin>:<resource>_<action>` → context rule or custom expression

Example from `lbaas2/config/policy.json`:

```json
{
  "lbaas2_member":  "role:member or role:Member",
  "lbaas2_viewer":  "role:loadbalancer_viewer or role:network_viewer",
  "lbaas2_admin":   "role:loadbalancer_admin or role:network_admin",
  "lbaas2_context_is_editor": "rule:lbaas2_context_is_loadbalancer_admin or rule:lbaas2_member",
  "lbaas2_context_is_viewer": "rule:lbaas2_context_is_editor or rule:lbaas2_viewer",
  "default":        "rule:lbaas2_cloud_admin",

  "lbaas2:loadbalancer_list":   "rule:lbaas2_context_is_viewer",
  "lbaas2:loadbalancer_create": "rule:lbaas2_context_is_editor",
  "lbaas2:loadbalancer_device": "rule:lbaas2_cloud_admin"
}
```

`default` is the fallback rule for any action not explicitly listed — `lbaas2`
requires cloud admin for anything not defined.

---

## Server-side: loading and evaluating policy

### How policy.json files are loaded

`config/initializers/monsoon_openstack_auth.rb` builds the path list:

```ruby
def policy_paths
  paths = ['config/policy.json']   # global base rules
  Core::PluginsManager.available_plugins.each do |p|
    paths << p.policy_file_path if p.has_policy_file?
  end
  paths
end

auth.authorization.policy_file_path = policy_paths
```

`MonsoonOpenstackAuth.load_policy` merges all files into one flat hash and
constructs a `PolicyEngine`:

```ruby
combined_policies = {}
pol_files.each do |pol_file|
  combined_policies.merge!(JSON.parse(File.read(pol_file))) { |key, v1, v2| v1 }
end
@policy_engine = MonsoonOpenstackAuth::Authorization::PolicyEngine.new(combined_policies)
```

The engine parses every rule into a Ruby `lambda` at boot time. In development
with `debug_policy_engine: true`, the engine reloads the policy on every request.

### Controller action map

Rails action names are mapped to policy action suffixes automatically:

| Rails action | Policy suffix |
|---|---|
| `index` | `list` |
| `show` | `get` |
| `destroy` | `delete` |
| `new` | `create` |
| `edit` | `update` |
| anything else | action name as-is |

So `Compute::InstancesController#index` with `authorization_context "compute"`
checks rule `compute:instance_list` automatically.

### `authorization_context` + `authorization_required`

```ruby
class Compute::FlavorsController < Compute::ApplicationController
  authorization_context "compute"
  authorization_required
end
```

`authorization_context "compute"` sets `@authorization_context = "compute"` via
`prepend_before_action`. `authorization_required` adds a `before_action` that:
1. Derives the rule name: `compute:flavor_list` (for `index`)
2. Builds policy params from controller params (loads `@flavor` from DB if `flavor_id` param exists)
3. Calls `enforce_permissions(rule_name, params)`

`authorization_required` accepts standard `before_action` options:
- `except: %i[new_floatingip attach_floatingip]` — skip for specific actions
- `only: [:create, :update]` — only enforce for these actions

### `enforce_permissions`

`enforce_permissions` is the core method (defined in `MonsoonOpenstackAuth::Authorization::InstanceMethods`):

```ruby
enforce_permissions("compute:instance_create")
enforce_permissions("::networking:floating_ip_associate")  # :: prefix = cross-plugin
enforce_permissions("compute:instance_lock", { target: { instance: @instance } })
enforce_permissions(["compute:instance_list", "compute:instance_get"])  # multiple rules (AND)
```

- Evaluates the rule against the current user's token attributes
- Raises `MonsoonOpenstackAuth::Authorization::SecurityViolation` on failure
- `SecurityViolation` is caught by `Rescue` concern → renders warning page (HTTP 403) or redirects

The `::` prefix on a rule name means "use the literal name without prepending the
current context" — allows one plugin's controller to check another plugin's rules.

### `is_allowed?` in views and models

```ruby
# HAML view — show button only if allowed
- if current_user.is_allowed?('identity:project_update', { target: { project: @active_project } })
  = link_to "Edit", edit_project_path(@active_project)

# HAML view — no params needed for simple role check
- if current_user.is_allowed?('networking:network_list')
  = render 'networks_table'
```

`AuthUser#is_allowed?` (`auth_user.rb:181`) calls `@policy.enforce(actions, params)` directly.
It does **not** raise — returns `true` or `false`. Used only for conditional rendering,
not for blocking access (use `enforce_permissions` for that).

---

## Policy delivery to the frontend

The layout (`app/views/layouts/application.html.haml`) inlines the serialised policy
in a `<script>` tag:

```haml
:javascript
  window.policyConfig = #{policy.try(:to_js).try(:html_safe) || {}}
= javascript_include_tag 'policy_engine'
```

`policy.to_js` (`PolicyEngine::Policy#to_js`) returns JSON:

```json
{
  "rules": {
    "compute:instance_list": "(function(rules,locals,params){ return locals[\"roles\"].indexOf(\"compute_viewer\")>=0 || ... })",
    "lbaas2:loadbalancer_create": "(function(rules,locals,params){ return ... })"
  },
  "locals": {
    "roles":      ["member", "compute_viewer"],
    "domain_id":  "abc123",
    "project_id": "def456",
    "user_id":    "xyz789",
    "token.is_admin_project": false
  }
}
```

The rules are already converted to JavaScript function strings by `Rule.parse_js`
at boot time. The `locals` snapshot is the current user's token attributes.

`policy_engine.js` (`app/javascript/policy_engine.js`) then evaluates each rule
string with `eval()` into a live function and exposes `window.policy`:

```js
const rules = {}
for (let name in window.policyConfig.rules) {
  rules[name] = eval(window.policyConfig.rules[name])
}
window.policy = {
  isAllowed: function(name, params = {}) {
    const rule = rules[name]
    if (!rule) throw `Policy Engine Error: rule ${name} not found.`
    return rule(rules, window.policyConfig.locals, params)
  }
}
```

`window.policy` is available on every page that includes the standard layout.

---

## Client-side: React widgets

### `widget.setPolicy()`

`app/javascript/lib/widget.jsx` exposes `setPolicy`:

```js
setPolicy(policy) {
  policy = policy || this.config.policy   // falls back to window.policy
  setPolicy(policy)                        // stores in lib/policy.js module
}
```

`lib/policy.js` is a tiny module that holds a reference:

```js
export let policy
export function setPolicy(newPolicy) { policy = newPolicy }
```

Every widget `init.js` that needs policy calls `widget.setPolicy()` during
initialisation (before `widget.render(App)`):

```js
createWidget({ pluginName: "shared_filesystem_storage", widgetName: "app" })
  .then((widget) => {
    widget.setPolicy()   // installs window.policy into lib/policy module
    widget.render(App)
  })
```

### Using policy in React components

Components import `policy` from `lib/policy` and call `policy.isAllowed()`:

```tsx
// plugins/shared_filesystem_storage/.../share_networks/item.jsx
import { policy } from "lib/policy"

const Item = ({ shareNetwork }) => (
  <tr>
    {policy.isAllowed("shared_filesystem_storage:share_network_get") ? (
      <Link to={...}>{shareNetwork.name}</Link>
    ) : (
      <span>{shareNetwork.name}</span>
    )}
    {(policy.isAllowed("shared_filesystem_storage:share_network_delete") ||
      policy.isAllowed("shared_filesystem_storage:share_network_update")) && (
      <ActionMenu ... />
    )}
  </tr>
)
```

**With object-level params** (e.g. checking against a specific resource):

```tsx
// plugins/shared_filesystem_storage/.../replicas/item.tsx
const canI = useCallback(
  (permission: string) =>
    policy.isAllowed(`shared_filesystem_storage:replica_${permission}`, { replica }),
  [replica]
)

// Usage:
{canI("delete") && <button onClick={handleDelete}>Delete</button>}
```

The `params` object is passed to the rule engine and can be referenced in policy
rules via `%(replica.replica_state)s` syntax. For example:

```json
"shared_filesystem_storage:replica_delete":
  "rule:context_is_sharedfilesystem_admin and not (%(replica.replica_state)s=='active')"
```

This means: admin AND the replica is not in active state.

### Testing policy in components

In tests, mock `lib/policy` at the module level:

```ts
// shared_filesystem_storage/.../list.test.tsx
const mockIsAllowed = vi.fn().mockReturnValue(true)
vi.mock("lib/policy", () => ({ policy: { isAllowed: mockIsAllowed } }))
```

---

## Cross-plugin rule references

A rule can reference rules defined in another plugin's policy.json:

```json
"compute:instance_edit_securitygroups":
  "rule:context_is_compute_admin or rule:context_is_network_admin or role:securitygroup_admin"
```

`context_is_network_admin` is defined in `networking/config/policy.json`.
This works because all policy files are merged into a single flat hash.
A controller in `compute` can also enforce networking rules:

```ruby
enforce_permissions("::networking:floating_ip_associate")
```

---

## Debug mode

Two flags control policy debugging in development:

```yaml
# config/environments/development.rb
config.debug_policy_engine = true   # reloads policy on every request, enables trace logging
```

With trace enabled, every `enforce_permissions` call logs the full rule evaluation
tree to the Rails log (colour-coded). Add `?policy_trace=1` to any URL to enable
tracing for a single request without the dev config flag.

---

## Key files

- `config/policy.json` — global base rules (`cloud_admin`, `monsoon2_domain`, `project_parent`, etc.)
- `plugins/<name>/config/policy.json` — per-plugin action rules (24 plugins have one)
- `config/initializers/monsoon_openstack_auth.rb` — merges all policy files, sets up engine
- `lib/core/plugins_manager.rb:117` — `has_policy_file?` / `policy_file_path` discovery
- `plugins/monsoon-openstack-auth/lib/monsoon-openstack-auth.rb:57` — `load_policy` + `policy_engine`
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authorization/policy_engine.rb` — `PolicyEngine`, `Rule` (parse + eval), `Policy` (enforce), JS transpiler
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authorization.rb` — `authorization_context`, `authorization_required`, `enforce_permissions`, `is_allowed?`
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_user.rb:181` — `AuthUser#is_allowed?`
- `app/views/layouts/application.html.haml:12` — `window.policyConfig` inline JSON
- `app/javascript/policy_engine.js` — evaluates rules → `window.policy`
- `app/javascript/lib/policy.js` — module holding the policy reference for React
- `app/javascript/lib/widget.jsx:68` — `widget.setPolicy()`
