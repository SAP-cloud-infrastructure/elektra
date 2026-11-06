# frozen_string_literal: true

# Shared helper for rendering a status pill in server-rendered (HAML/ERB)
# views: a coloured dot + humanised label in a tinted capsule. This is the
# HAML-world counterpart of the React `lib/components/StatusPill` component and
# reuses the same `.status-pill` / `state-<status>-icon` styles defined in
# `_monsoon_theme.scss`, so pills look identical across React and HAML plugins.
module StatusPillHelper
  # Default status -> semantic category mapping, covering the common OpenStack
  # resource statuses (networking, compute vm states, etc.). Categories drive
  # the pill tint: ok (green), active (blue), error (red), busy (orange),
  # idle (grey). Callers can extend/override via the `category_map:` option.
  DEFAULT_STATUS_CATEGORY = {
    # ready / healthy
    "active"    => "ok",
    "available" => "ok",
    "up"        => "ok",
    # in use / attached (occupied, not an alarm)
    "in-use"    => "active",
    "attached"  => "active",
    # idle / offline / disabled
    "down"        => "idle",
    "detached"    => "idle",
    "maintenance" => "idle",
    "deactivated" => "idle",
    "shutoff"     => "idle",
    "suspended"   => "idle",
    "paused"      => "idle",
    # error / gone
    "error"          => "error",
    "error_deleting" => "error",
    "killed"         => "error",
    "deleted"        => "error",
    "pending_delete" => "error",
    # transient / in progress
    "creating"  => "busy",
    "deleting"  => "busy",
    "build"     => "busy",
    "pending"   => "busy",
    "queued"    => "busy",
    "saving"    => "busy",
    "importing" => "busy",
  }.freeze

  # Renders a status pill.
  #
  # status       - the raw resource status (e.g. "ACTIVE", "error", "in-use")
  # category     - optional explicit semantic category (ok/active/error/busy/
  #                idle); when given it wins over the status->category mapping
  # category_map - optional hash merged on top of DEFAULT_STATUS_CATEGORY to
  #                extend/override the colour mapping (keys are downcased status)
  # label        - optional display label (defaults to the humanised status)
  # tooltip      - optional tooltip text shown on hover
  def status_pill(status, category: nil, category_map: {}, label: nil, tooltip: nil)
    return if status.blank?

    key = status.to_s.downcase
    map = category_map.blank? ? DEFAULT_STATUS_CATEGORY : DEFAULT_STATUS_CATEGORY.merge(category_map)
    category ||= map[key] || "idle"

    data = { bs_toggle: "tooltip", bs_placement: "top" } if tooltip.present?

    content_tag(
      :span,
      label || status.to_s.humanize,
      class: "status-pill status-pill-#{category}",
      data: data,
      title: tooltip,
    )
  end
end
