# frozen_string_literal: true

module EmailService
  # EmailService ApplicationController
  class ApplicationController < ::DashboardController
    include ::EmailService::ApplicationHelper

    authorization_context "email_service"
    authorization_required

    def check_pre_conditions_for_cronus
      
      unless available_regions.include?(cronus_region) || ["qa-de-1", "qa-de-2"].include?(cronus_region)
        render "email_service/shared/cronus_unavailable" and return
      end

      # Step 1: Role Check
      unless current_user.has_role?("email_user") || current_user.has_role?("email_admin") || current_user.has_role?("cloud_email_admin")
        render "email_service/shared/role_warning" and return
      end

      @nebula_account_details = nebula_account_details
      @cronus_account_details = cronus_account_details

      # Step 2: EC2 Credentials
      render "email_service/shared/ec2_credentials_warning" and return if ec2_creds.nil? || !ec2_creds

      # Step 3: Check Verified Identity & Domain for int provider only
      # if (email_addresses&.empty? && domains&.empty?)
      #   render 'email_service/shared/verified_identity_warning' and return
      # end

      # Step 4: Display cronus activation warning if nebula_account status is not 'GRANTED'

      if @nebula_account_details.class != String
        if @nebula_account_details.class == EmailService::NebulaAccount && @nebula_account_details&.status == "GRANTED"
          return
        end
      else
        render "email_service/shared/cronus_activation_warning", locals: { nebula_account_details: @nebula_account_details, cronus_account_details: @cronus_account_details } and return
      end
    end

    def nebula_account_details
      begin
        options = {
          provider: "aws",
          project_id: project_id,
        }
        Rails.logger.debug(" [nebula_account_details][options]: #{options}")
        Rails.logger.debug(" services.email_service.nebula_account(options) : #{services.email_service.nebula_account(options)} ")
        @nebula_account_details ||= services.email_service.nebula_account(options)
        Rails.logger.debug(" [nebula_account_details][@nebula_account_details]: #{@nebula_account_details}")
      rescue StandardError => e
        Rails.logger.debug(" nebula_account error: #{e.message}")
        err = e.message
      end
      @nebula_account_details || err
    end

    def cronus_account_details
      access = ec2_access
      secret = ec2_secret
      Rails.logger.debug(" [access]: #{access}")
      Rails.logger.debug("[secret]: #{secret}")

      return unless access || secret
      @cronus_region = cronus_region
      @aws_region = map_region(@cronus_region) || "eu-central-1"
      @cronus_endpoint = "https://cronus.#{@cronus_region}.cloud.sap"

      Rails.logger.debug(" \n @cronus_region: #{@cronus_region} \n @aws_region: #{@aws_region} \n @cronus_endpoint: #{@cronus_endpoint} \n")
      signer = aws_signer("ses", access, secret, @aws_region, @cronus_endpoint)
      signature = signer.sign_request(
        http_method: "GET",
        url: "#{@cronus_endpoint}/v2/email/account",
      )

      begin
        options = {
          headers: {
            "X-Amz-Date" => signature.headers["x-amz-date"],
            "Host" => signature.headers["host"],
            "X-Amz-security-token" => signature.headers["x-amz-security-token"],
            "X-Amz-content-sha256" => signature.headers["x-amz-content-sha256"],
            "Authorization" => signature.headers["authorization"],
          },
        }
        Rails.logger.debug(" services.email_service.cronus_account(options) : #{services.email_service.cronus_account(options)} ")
        @cronus_account_details ||= services.email_service.cronus_account(options)
        Rails.logger.debug(" [cronus_account_details]: #{@cronus_account_details}")
      rescue StandardError => e
        Rails.logger.debug(" cronus_account error: #{e.message}")
        err = e.message
      end
      @cronus_account_details || err
    end

    protected

    helper_method :release_state

    def release_state
      "tech_preview"
    end
  end
end
