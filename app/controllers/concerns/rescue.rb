# frozen_string_literal: true

# this module is included in controllers.
module Rescue
  def self.included(base)
    base.class_eval do
      # GLOBAL ERROR RESCUE && HANDLING
      ##############################

      rescue_from "ActiveRecord::ConnectionNotEstablished" do |exception|
        # render error with application_error layout
        render(
          template: "application/exceptions/db_error",
          layout: "application_error",
          status: 500,
        )
      end

    

      # handle Missing Template
      rescue_from "ActionView::MissingTemplate" do |exception|
        options = {
          warning: true,
          sentry: true,
          title: "Page not Found",
          description:
            "The page you are looking for doesn't exist. Please verify the url",
        }
        render_exception_page(exception, options.merge(sentry: true))
      end

      # handle Token issues
      rescue_from "Elektron::Errors::TokenExpired",
                  "ActionController::InvalidAuthenticityToken" do |exception|
        redirect_to monsoon_openstack_auth.login_path(
                      domain_fid: @scoped_domain_fid,
                      domain_name: @scoped_domain_name,
                      after_login: params[:after_login],
                    )
      end

      # handle NotAuthorized but NOTE! this should never fetch because all errors related to
      # "MonsoonOpenstackAuth::Authentication::NotAuthorized" are rescued directly in rescope_token and handled by
      # "rescue_and_render_exception_page" but I leave it here just in case ;-)
      rescue_from "MonsoonOpenstackAuth::Authentication::NotAuthorized" do |exception|
        if MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso? &&
           exception.message =~ /Valid certificate authentication/
          # Certificate SSO succeeded but user has no OpenStack access — show 403, no redirect
          render_exception_page(
            exception,
            title: "Access Forbidden",
            description: "Your account is not associated with any OpenStack domain or project. Please contact your cloud administrator to request access.",
            warning: true,
            sentry: false,
            status: 403
          )

        elsif exception.message =~ /has no access to project/
          render(template: "application/exceptions/unauthorized")

        else
          redirect_to monsoon_openstack_auth.login_path(
                        domain_fid: @scoped_domain_fid,
                        domain_name: @scoped_domain_name,
                        after_login: params[:after_login],
                      )
        end
      end

      # handle all api errors
      rescue_from "Elektron::Errors::ApiResponse" do |exception|
        options = {
          title: exception.code_type,
          description: :message,
          warning: true,
          sentry: false,
        }

        case exception.code.to_i
        # when 407 # Authentication required
        #   # ignore this error here. It should be caught by
        #   # Elektron::Errors::TokenExpired rescue.
        #   # Most likely this is the cause of double render error!
        #   return
        when 401 # unauthorized
          redirect_to monsoon_openstack_auth.login_path(
                        domain_fid: @scoped_domain_fid,
                        domain_name: @scoped_domain_name,
                        after_login: params[:after_login],
                      )
        when 404 # not found
          options[:title] = "Object not Found"
          options[
            :description
          ] = "The object you are looking for doesn't exist. \
        Please verify your input. (#{exception.message})"
          render_exception_page(exception, options.merge(sentry: false))
        when 403 # forbidden
          options[:title] = "Permission Denied"
          options[:description] = exception.message ||
            "You are not authorized to request this page."
          render_exception_page(exception, options.merge(sentry: false))
        when 422 # UNPROCESSABLE ENTITY
          options[:title] = "Unprocessable Entity"
          options[:description] = exception.message || "Backend Error."
          render_exception_page(exception, options.merge(sentry: false))
        when 429 # too many requests
          options[:title] = "Too Many Requests"
          options[:description] = exception.message ||
            "You have made too many requests to identity. Please try again later."
          render_exception_page(exception, options.merge(sentry: false))
        when 501 # Not implemented
          options[:title] = "Not Implemented"
          options[:description] = exception.message ||
            "The requested functionality is not supported."
          render_exception_page(exception, options.merge(sentry: false))
        end
      end

      # catch all mentioned errors that are note handled and render error page
      rescue_and_render_exception_page [
                                         {
                                           "MonsoonOpenstackAuth::Authorization::SecurityViolation" => {
                                             title: "Forbidden",
                                             sentry: false,
                                             warning: true,
                                             status: 403,
                                             description:
                                               lambda do |e, _c|
                                                 m =
                                                   "You are not authorized to view this page."
                                                 if e.involved_roles &&
                                                      e
                                                        .involved_roles
                                                        .length
                                                        .positive?
                                                   m +=
                                                     " Please check (role assignments) if you have one of the \
            following roles: #{e.involved_roles.flatten.join(", ")}."
                                                 end
                                                 m
                                               end,
                                           },
                                         },
                                         {
                                           "Core::Error::ProjectNotFound" => {
                                             title: "Project Not Found",
                                             sentry: false,
                                             warning: true,
                                           },
                                         },
                                       ]
    end
  end
end
