UUID_REGEX = /\A[0-9a-f]{32}\z/i

module V2
  class ScopeController < ApplicationController
    prepend_before_action :determine_scope

    protected 

    def determine_scope
      resolver = V2::ScopeResolver.new(Rails.configuration.keystone_endpoint)
      
      @domain_scope = resolver.resolve_domain(params[:domain_id])
      @project_scope = resolver.resolve_project(params[:project_id])
    
      redirect_to_canonical_url if should_redirect?
    end


    private

    def should_redirect?
      domain_needs_redirect? || project_needs_redirect?
    end

    def domain_needs_redirect?
      params[:domain_id] && @domain_scope.fid && @domain_scope.fid != params[:domain_id]
    end

    def project_needs_redirect?
      params[:project_id] && @project_scope.fid && @project_scope.fid != params[:project_id]
    end

    def redirect_to_canonical_url
      new_params = params.to_unsafe_h.dup
      new_params[:domain_id] = @domain_scope.fid if domain_needs_redirect?
      new_params[:project_id] = @project_scope.fid if project_needs_redirect?
      
      redirect_to url_for(new_params), status: :moved_permanently
    end
  end
end