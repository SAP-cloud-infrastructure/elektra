module V2
  class DebugController < SessionController 
    def index 
      render plain: build_debug_output
    end

    private 

    def build_debug_output
      <<~OUTPUT
        Hello
        Domain:
          RAW: #{params[:domain]}
          ID: #{@domain_scope.id}
          FID: #{@domain_scope.fid}
          Name: #{@domain_scope.name}
        Project: 
          RAW: #{params[:project]}
          ID: #{@project_scope.id}
          FID: #{@project_scope.fid}
          Name: #{@project_scope.name}
      OUTPUT
    end    
  end
end