class DateTimePickerInput < SimpleForm::Inputs::Base
  def input
    template.content_tag(:div, class: "input-group date form_datetime") do
      template.concat @builder.text_field(attribute_name, input_html_options)
      template.concat span_remove
      template.concat span_table
    end
  end

  def input_html_options
    super.merge(
      { class: "form-control", readonly: true },
    ) do |k, a_value, b_value|
      k.to_s.downcase == "class" ? a_value.push(b_value) : b_value
    end
  end

  def span_remove
    template.content_tag(:span, class: "input-group-addon") do
      template.concat icon_remove
    end
  end

  def span_table
    template.content_tag(:span, class: "input-group-addon") do
      template.concat icon_table
    end
  end

  def icon_remove
    "<i class='fa fa-times'></i>".html_safe
  end

  def icon_table
    "<i class='fa fa-calendar'></i>".html_safe
  end
end
