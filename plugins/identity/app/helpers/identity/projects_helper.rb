module Identity
  module ProjectsHelper
    # This method loads remote projects via ajax into a new created div.
    def remote_projects(options = {})
      container_id = SecureRandom.hex

      content_tag(:div, id: container_id) do
        content_tag(
          :div,
          "",
          data: {
            update_path:
              plugin("identity").projects_path(
                {
                  per_page: (options[:per_page] || 3),
                  filter: (options[:filter] || {}),
                  partial: true,
                },
              ),
            update_immediately: true,
          },
        )
      end
    end

    def role_label_long(role_name)
      t("roles.#{role_name}", default: role_name.try(:titleize)) +
        " (#{role_name})"
    end

    # render the wizard step for each service that implements the wizard
    # see also _wizard_steps partial
    def wizard_step(options = {}, &block)
      title = options[:title]
      description = options[:description]
      mandatory = options[:mandatory] || false
      status = options[:status]
      action_button_options = options[:action_button]
      skip_button_options = options[:skip_button]

      tooltip = action_button_options && action_button_options[:tooltip]
      tooltip_data =
        (
          if tooltip
            { toggle: "tooltip", title: sanitize(tooltip), html: true }
          else
            {}
          end
        )

      if action_button_options
        label = action_button_options[:label] || "Activate"
        url = action_button_options[:url]
        css_class = "btn btn-info pull-right"

        if url
          action_button =
            link_to(
              label,
              url,
              data: { modal: true, wizard_action_button: true }.merge(
                tooltip_data,
              ),
              class: css_class,
            )
        else
          action_button =
            link_to(
              label,
              "javascript:void(0)",
              class: css_class,
              disabled: true,
              data: tooltip_data,
            )
        end
      end

      if skip_button_options
        label = skip_button_options[:label] || "Do this later"
        url = skip_button_options[:url]
        css_class = "btn btn-secondary btn-sm float-end"
        data = skip_button_options[:data] || {}
        if url
          skip_button = link_to(label, url, class: css_class, data: data)
        else
          skip_button = link_to(label, "javascript:void(0)")
        end
      end

      css_class =
        case status
        when ProjectProfile::STATUS_DONE
          "success"
        when ProjectProfile::STATUS_SKIPPED
          "warning"
        when "pending"
          "default"
        else
          "info"
        end

      content_tag :div,
                  class:
                    "wizard-step bs-callout bs-callout-emphasize bs-callout-#{css_class}" do
        content_tag :div, class: "row" do
          concat(
            content_tag(:div, class: "col-md-10") do
              concat content_tag(:h4, title)
              block.call
            end,
          )
          concat(
            content_tag(:div, class: "col-md-2") do
              if status == ProjectProfile::STATUS_SKIPPED
                concat(content_tag :span, "skipped", class: "pull-right")
                concat(action_button)
              elsif status == ProjectProfile::STATUS_DONE
                content_tag :i, "", class: "fa fa-check fa-3x pull-right"
              else
                concat(content_tag :p, action_button)
                concat(content_tag :p, skip_button)
              end
            end,
          )
        end
      end
    end
  end
end
