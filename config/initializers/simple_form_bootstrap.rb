# Use this setup block to configure all options available in SimpleForm.
SimpleForm.setup do |config|
  config.error_notification_class = "alert alert-danger"
  config.button_class = "btn btn-default"
  config.boolean_label_class = nil

  config.wrappers :vertical_form,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :pattern
    b.optional :min_max
    b.optional :readonly
    b.use :label, class: "control-label"

    b.use :input, class: "form-control"
    b.use :error, wrap_with: { tag: "span", class: "help-block" }
    b.use :hint, wrap_with: { tag: "p", class: "help-block" }
  end

  config.wrappers :vertical_file_input,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :readonly
    b.use :label, class: "control-label"

    b.use :input
    b.use :error, wrap_with: { tag: "span", class: "help-block" }
    b.use :hint, wrap_with: { tag: "p", class: "help-block" }
  end

  config.wrappers :vertical_boolean,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.wrapper tag: "div", class: "checkbox" do |ba|
      ba.use :label_input
    end

    b.use :error, wrap_with: { tag: "span", class: "help-block" }
    b.use :hint, wrap_with: { tag: "p", class: "help-block" }
  end

  config.wrappers :vertical_radio_and_checkboxes,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly
    b.use :label, class: "control-label"
    b.use :input
    b.use :error, wrap_with: { tag: "span", class: "help-block" }
    b.use :hint, wrap_with: { tag: "p", class: "help-block" }
  end

  # please keep in sync with :horizontal_form_disabled, horizontal_radio_and_checkboxes_4x8
  # BS5: horizontal forms use a `.row` grid; label is `.col-form-label`, hints/errors are
  # `.form-text`, invalid state is `.is-invalid` (BS3 `.form-group`/`.control-label`/`.help-block`/
  # `.has-error` were removed/renamed). `.col-sm-*` is unchanged in BS5.
  config.wrappers :horizontal_form,
                  tag: "div",
                  class: "row mb-3",
                  error_class: "is-invalid" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :pattern
    b.optional :min_max
    b.optional :readonly
    b.use :label, class: "col-sm-4 col-form-label"

    b.wrapper tag: "div", html: { class: "col-sm-8" } do |ba|
      ba.wrapper :input_wrapper, tag: "div", class: "input-wrapper" do |i|
        i.use :before_field_html
        i.use :input, class: "form-control"
        i.use :help_hint
      end

      ba.use :error, wrap_with: { tag: "span", class: "form-text text-danger" }
      ba.use :icon_hint, wrap_with: { tag: "p", class: "form-text" }
    end
  end

  # please keep in sync with :horizontal_form, horizontal_radio_and_checkboxes_4x8
  config.wrappers :horizontal_form_disabled,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :pattern
    b.optional :min_max
    b.optional :readonly
    b.use :label, class: "col-sm-4 control-label"

    b.wrapper tag: "div", class: "col-sm-8" do |ba|
      ba.wrapper tag: "div", class: "input-wrapper" do |i|
        i.use :before_field_html
        i.use :input, class: "form-control", readonly: true, disabled: true
        i.use :help_hint
      end

      ba.use :error, wrap_with: { tag: "span", class: "help-block" }
      ba.use :icon_hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_file_input,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :readonly
    b.use :label, class: "col-sm-3 control-label"

    b.wrapper tag: "div", class: "col-sm-9" do |ba|
      ba.use :input
      ba.use :error, wrap_with: { tag: "span", class: "help-block" }
      ba.use :hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_boolean,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.wrapper tag: "div", class: "col-sm-offset-3 col-sm-9" do |wr|
      wr.wrapper tag: "div", class: "checkbox" do |ba|
        ba.use :label_input, class: "col-sm-9"
      end

      wr.use :error, wrap_with: { tag: "span", class: "help-block" }
      wr.use :hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_boolean_4x8,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.wrapper tag: "div", class: "col-sm-offset-4 col-sm-8" do |wr|
      wr.wrapper tag: "div", class: "checkbox" do |ba|
        ba.use :label_input, class: "col-sm-8"
      end

      wr.use :error, wrap_with: { tag: "span", class: "help-block" }
      wr.use :hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_radio_and_checkboxes_4x8,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: "col-sm-4 control-label"

    b.wrapper tag: "div", class: "col-sm-8" do |ba|
      ba.wrapper tag: "div", class: "input-wrapper" do |i|
        i.use :input
        i.use :help_hint
      end

      ba.use :error, wrap_with: { tag: "span", class: "help-block" }
      ba.use :icon_hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_radio_and_checkboxes_4x8_scrollable,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: "col-sm-4 control-label"

    b.wrapper tag: "div", class: "col-sm-8" do |ba|
      ba.wrapper tag: "div",
                 class:
                   "input-wrapper horizontal_radio_and_checkboxes_4x8_scrollable" do |i|
        i.use :input
        i.use :help_hint
      end

      ba.use :error, wrap_with: { tag: "span", class: "help-block" }
      ba.use :icon_hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :horizontal_radio_and_checkboxes,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: "col-sm-3 control-label"

    b.wrapper tag: "div", class: "col-sm-9 " do |ba|
      ba.use :input, class: "overflow-auto"
      ba.use :error, wrap_with: { tag: "span", class: "help-block" }
      ba.use :hint, wrap_with: { tag: "p", class: "help-block" }
    end
  end

  config.wrappers :inline_form,
                  tag: "div",
                  class: "form-group",
                  error_class: "has-error" do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :pattern
    b.optional :min_max
    b.optional :readonly
    b.use :label, class: "sr-only"

    b.wrapper tag: "div", class: "input-wrapper" do |i|
      i.use :input, class: "form-control"
      i.use :help_hint
    end
    b.use :error, wrap_with: { tag: "span", class: "help-block" }
    b.use :icon_hint, wrap_with: { tag: "p", class: "help-block" }
  end

  # Wrappers for forms and inputs using the Bootstrap toolkit.
  # Check the Bootstrap docs (http://getbootstrap.com)
  # to learn about the different styles for forms and inputs,
  # buttons and other elements.
  config.default_wrapper = :vertical_form
  config.wrapper_mappings = {
    check_boxes: :vertical_radio_and_checkboxes,
    radio_buttons: :vertical_radio_and_checkboxes,
    file: :vertical_file_input,
    boolean: :vertical_boolean,
  }
end
