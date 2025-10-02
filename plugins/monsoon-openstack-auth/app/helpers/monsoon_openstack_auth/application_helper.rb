module MonsoonOpenstackAuth
  module ApplicationHelper
    # for the case a url or path helper method from the main app is needed
    def method_missing method, *args, &block
      if (method.to_s.end_with?('_path') or method.to_s.end_with?('_url')) and main_app.respond_to?(method)
        main_app.send(method, *args)
      else
        super
      end
    end

    def inside_layout(layout = 'application', &block)
      render :inline => capture(&block), :layout => "layouts/#{layout}"
    end
  end
end
