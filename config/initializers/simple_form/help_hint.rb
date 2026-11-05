module SimpleForm
  module Components
    # Needs to be enabled in order to do automatic lookups
    module HelpHint
      # Name of the component method
      def help_hint(wrapper_options = nil)
        help_hint_container =
          'data-bs-container="' + options[:icon_hint_container].to_s + '"'
        @help_hint ||=
          begin
            if options[:help_hint].present?
              '<a class="help-hint" data-content="' + options[:help_hint].to_s +
                '" data-bs-placement="top" ' +
                (
                  if options[:icon_hint_container].present?
                    help_hint_container
                  else
                    ""
                  end
                ) +
                ' data-popover-type="help-hint" data-bs-toggle="popover" href="#" role="button" >' \
                  '<span class="fa-stack">' \
                  '<i class="fa fa-square fa-stack-2x"></i>' \
                  '<i class="fa fa-info fa-inverse fa-stack-1x"></i>' \
                  "</span>" \
                  "</a>"
            end
          end
      end

      # Used when is optional
      def has_help_hint?
        help_hint.present?
      end
    end
  end
end

SimpleForm::Inputs::Base.send(:include, SimpleForm::Components::HelpHint)
