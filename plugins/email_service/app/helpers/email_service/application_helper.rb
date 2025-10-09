# frozen_string_literal: true

module EmailService
  # EmailService::ApplicationHelper
  module ApplicationHelper
    def encoding
      @encoding ||= "utf-8"
    end

    def user_id
      @user_id ||= current_user.id
    end

    def project_id
      @project_id ||= current_user.project_id
    end

    def email_service_url
      @email_service_url ||= current_user.service_url("email-aws")
    end

    def cronus_region
      @cronus_region ||= current_user.default_services_region
    end

    def ec2_creds
      @ec2_creds =
        services
          .identity
          .ec2_credentials(user_id, { tenant_id: project_id })
          &.first
    end

    def ec2_creds_collection
      @ec2_creds_collection ||=
        services.identity.ec2_credentials(user_id, { tenant_id: project_id })
    end

    def ec2_access
      @ec2_access ||= ec2_creds&.access
    end

    def ec2_secret
      @ec2_secret ||= ec2_creds&.secret
    end

    def create_credentials
      @create_credentials ||=
        services.identity.create_ec2_credentials(
          user_id,
          { tenant_id: project_id }
        )
    end

    def find_credentials(user_id, access_id, options = {})
      @find_credentials ||=
        services.identity.find_ec2_credential(user_id, access_id, options)
    end

    def delete_credentials(access_id)
      services.identity.delete_ec2_credential(user_id, access_id)
    end

    def map_region(region)
      unless available_regions.include?(region)
        Rails.logger.debug(" \n\n **** Invalid Region Detected: #{region} ****")
        return "invalid_region"
      end
      case region
      when "na-us-1"
        "us-east-1"
      when "na-us-2"
        "us-east-2"
      when "na-us-3"
        "us-west-2"
      when "ap-sa-2"
        "ap-south-1"
      when "ap-jp-1"
        "ap-northeast-1"
      when "ap-jp-2"
        "ap-northeast-2"
      when "eu-de-1", "qa-de-1", "qa-de-2"
        "eu-central-1"
      when "na-ca-1"
        "ca-central-1"
      when "la-br-1"
        "sa-east-1"
      else
        "eu-central-1"
      end
    end

    def available_regions
      @available_regions ||= ["na-us-1","na-ca-1","ap-au-1","ap-jp-1","eu-de-1","eu-de-2","la-br-1","ap-sa-2", "qa-de-1", "qa-de-2"]
    end

    def region_details
      [
        {
          "na-us-1": { 
          "ccloud_location": "Virginia (Sterling)", 
          "aws_region": "us-east-1",
          "aws_location": "US East (N. Virginia)",
          "sending_enabled": "true",
        }},
        {
          "na-ca-1": { 
          "ccloud_location": "Toronto", 
          "aws_region": "ca-central-1",
          "aws_location": "Cananda (Central)",
          "sending_enabled": "false",
        }},
        {
          "ap-au-1": { 
          "ccloud_location": "Sydney", 
          "aws_region": "ap-southeast-2",
          "aws_location": "Asia Pacific (Sydney)",
          "sending_enabled": "false",
        }},
        {
          "ap-jp-1": { 
          "ccloud_location": "Tokyo", 
          "aws_region": "ap-northeast-1",
          "aws_location": "Asia Pacific (Tokyo)",
          "sending_enabled": "false",
        }},
        {
          "eu-de-1": { 
          "ccloud_location": "Rot", 
          "aws_region": "eu-west-1",
          "aws_location": "Europe (Ireland)",
          "sending_enabled": "true",
        }},
        {
          "eu-de-2": { 
          "ccloud_location": "Frankfurt", 
          "aws_region": "eu-central-1",
          "aws_location": "Europe (Frankfurt)",
          "sending_enabled": "false",
        }},
        {
          "la-br-1": { 
          "ccloud_location": "Saõ Paulo", 
          "aws_region": "sa-east-1",
          "aws_location": "South America (São Paulo)",
          "sending_enabled": "false",
        }},
        {
          "ap-sa-2": { 
          "ccloud_location": "Dammam", 
          "aws_region": "me-south-1",
          "aws_location": "Middle East (Bahrain)",
          "sending_enabled": "false",
        }},
      ]
    end
    def account_env_collection
      %w[PROD QA DEV DEMO TRAIN SANDBOX LAB]
    end

    def aws_mail_type_collection
      %w[MARKETING TRANSACTIONAL]
    end

    #
    # Raw email
    #

    # https://docs.aws.amazon.com/ses/latest/dg/mime-types.html
    def restricted_file_ext
      %w[
        .ade
        .adp
        .app
        .asp
        .bas
        .bat
        .cer
        .chm
        .cmd
        .com
        .cpl
        .crt
        .csh
        .der
        .exe
        .fxp
        .gadget
        .hlp
        .hta
        .inf
        .ins
        .isp
        .its
        .js
        .jse
        .ksh
        .lib
        .lnk
        .mad
        .maf
        .mag
        .mam
        .maq
        .mar
        .mas
        .mat
        .mau
        .mav
        .maw
        .mda
        .mdb
        .mde
        .mdt
        .mdw
        .mdz
        .msc
        .msh
        .msh1
        .msh2
        .mshxml
        .msh1xml
        .msh2xml
        .msi
        .msp
        .mst
        .ops
        .pcd
        .pif
        .plg
        .prf
        .prg
        .reg
        .scf
        .scr
        .sct
        .shb
        .shs
        .sys
        .ps1
        .ps1xml
        .ps2
        .ps2xml
        .psc1
        .psc2
        .tmp
        .url
        .vb
        .vbe
        .vbs
        .vps
        .vsmacros
        .vss
        .vst
        .vsw
        .vxd
        .ws
        .wsc
        .wsf
        .wsh
        .xnk
      ]
    end

    # need to keep for a while for backward compatibility
    def ses_client
      @region ||= map_region(@cronus_region)
      @endpoint ||= email_service_url

      unless !ec2_creds || ec2_creds.nil?
        begin
          @credentials ||=
            Aws::Credentials.new(ec2_creds.access, ec2_creds.secret)
          @ses_client ||=
            Aws::SES::Client.new(
              region: @region,
              endpoint: @endpoint,
              credentials: @credentials,
            )
        rescue Aws::SES::Errors::ServiceError, StandardError => e
          Rails.logger.error e.message
          return e.message
        end
      end

      @ses_client || nil
    end

    def ses_client_v2
      @cronus_region = cronus_region
      @region ||= map_region(@cronus_region)
      @endpoint ||= email_service_url
      unless !ec2_creds || ec2_creds.nil?
        begin
          @credentials ||=
            Aws::Credentials.new(ec2_creds.access, ec2_creds.secret)
          @ses_client_v2 ||=
            Aws::SESV2::Client.new(
              region: @region,
              endpoint: @endpoint,
              credentials: @credentials,
            )
        rescue Aws::SESV2::Errors::ServiceError, StandardError => e
          Rails.logger.error e.message
          return("\n [email_service][application_helper][ses_client_v2][:error] #{e.message}  \n")
        end
      end

      @ses_client_v2 || nil
    end

    # Get CloudWatch Client
    def cloud_watch_client
      @region ||= map_region(@cronus_region)
      @endpoint ||= email_service_url

      unless !ec2_creds || ec2_creds.nil?
        begin
          @credentials ||=
            Aws::Credentials.new(ec2_creds.access, ec2_creds.secret)
          @cloud_watch_client ||=
            Aws::CloudWatch::Client.new(
              region: @region,
              endpoint: @endpoint,
              credentials: @credentials,
            )
        rescue Aws::CloudWatch::Errors::ValidationError, ThrottlingException, ServiceUnavailable, OptInRequired => e
          Rails.logger.error e.message
          return("\n [email_service][application_helper][cloud_watch_client][:error] #{e.message}  \n")
        end
      end

      @cloud_watch_client || nil
    end

    # put dashboard using CloudWatch
    def cloud_watch_put_dashboard
      options =
        {
          DashboardName: "text widget dashboard",
          DashboardBody: {
            widgets: [
              {
                type: "text",
                x: 0,
                y: 7,
                width: 3,
                height: 3,
                properties: {
                  markdown: "Hello world",
                },
              },
            ],
          },
        }
      resp = cloud_watch_client.put_dashboard({
                                                dashboard_name: options[:DashboardName], # required
                                                dashboard_body: options[:DashboardBody].to_s, # required
                                              })
    rescue StandardError, Aws::CloudWatch::Errors::InternalServiceError, InvalidParameterInput => e
      Rails.logger.error e.message
      ("\n [email_service][application_helper][cloud_watch_put_dashboard][:error] #{e.message}  \n")
    end

    # Get Account Details

    def account
      @account ||= ses_client_v2.get_account if nebula_active? && ec2_creds &&
                                                ses_client_v2
    end

    def metrics_types
      %w[
        SEND
        COMPLAINT
        PERMANENT_BOUNCE
        TRANSIENT_BOUNCE
        OPEN
        CLICK
        DELIVERY
        DELIVERY_OPEN
        DELIVERY_CLICK
        DELIVERY_COMPLAINT
      ]
    end

    # https://docs.aws.amazon.com/sdk-for-ruby/v2/api/Aws/SESV2/Client.html#list_email_identities-instance_method
    def list_email_identities(next_token = nil, page_size = 1000)
      id = 0
      identities = []
      identity = {}
      if ec2_creds && ses_client_v2
        options = { next_token: next_token, page_size: page_size }
        resp = ses_client_v2.list_email_identities(options)
        # Adding ID to each element
        resp.email_identities.each do |item|
          identity = {
            id: id,
            identity_type: item.identity_type,
            identity_name: item.identity_name,
            sending_enabled: item.sending_enabled,
            verification_status: item.verification_status,
          }
          id += 1
          unless item.identity_name.include?(
            "@activation.email.global.cloud.sap"
          )
            opts = { email_identity: item.identity_name }
            details = ses_client_v2.get_email_identity(opts)

            identity.merge!(
              {
                feedback_forwarding_status: details.feedback_forwarding_status,
                verified_for_sending_status: details.verified_for_sending_status,
                dkim_attributes: details.dkim_attributes,
                mail_from_attributes: details.mail_from_attributes.mail_from_domain,
                policies: details.policies,
                tags: details.tags,
                configuration_set_name: details.configuration_set_name,
              }
            )
            if details.dkim_attributes.next_signing_key_length.nil?
              identity.merge!({ dkim_type: "byo_dkim" })
            else
              identity.merge!({ dkim_type: "easy_dkim" })
            end
          end
          identities.push identity
        end
      end

      identities
    end

    def email_addresses
      @email_addresses ||= list_email_identities
      identities = []
      @email_addresses&.each do |item|
        if item[:identity_type] == "EMAIL_ADDRESS" &&
           !item[:identity_name].include?(
             "@activation.email.global.cloud.sap"
           )
          identities.push item
        end
      end
      identities
    end

    def email_addresses_collection
      @email_addresses ||= email_addresses
      identities_collection = []
      @email_addresses&.each do |item|
        identities_collection.push item[:identity_name] if item[:identity_type] == "EMAIL_ADDRESS"
      end
      identities_collection
    end

    def domains
      @domains ||= list_email_identities
      identities = []
      @domains&.each do |item|
        identities.push item if item[:identity_type] == "DOMAIN"
      end
      identities
    end

    def domains_collection
      @domains ||= domains
      domains_collection = []
      @domains&.each { |item| domains_collection.push item[:identity_name] }
      domains_collection
    end

    def managed_domains
      @domains ||= list_email_identities
      identities = []
      @domains&.each do |item|
        identities.push item if item[:identity_type] == "MANAGED_DOMAIN"
      end
      identities
    end

    # find an identity by name
    def find_verified_identity_by_name(identity, id_type = "EMAIL_ADDRESS")
      case id_type
      when "EMAIL_ADDRESS"
        @id_list ||= email_addresses
      when "DOMAIN"
        @id_list ||= domains
      when "MANAGED_DOMAIN"
        @id_list ||= managed_domains
      else
        @id_list = []
      end

      found = {}
      unless @id_list.empty?
        @id_list.each do |item|
          found = item if identity == item[:identity_name]
        end
      end

      found
    end

    def create_email_identity_email(
      verified_email,
      tags = [{ key: "Tagkey", value: "TagValue" }],
      configset_name = nil
    )
      begin
        ses_client_v2.create_email_identity(
          {
            email_identity: verified_email,
            tags: tags,
            configuration_set_name: configset_name,
          }
        )
        status = "success"
        audit_logger.info(
          current_user.id,
          "has added an email identity (type: email) ",
          verified_email
        )
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        Rails.logger.error e.message
        flash[
          :error
        ] = "[create_email_identity_email] error : Status Code:(#{e.code}): #{e.message} "
        status = e.message
      end
      status
    end

    def delete_email_identity(identity)
      status = nil
      begin
        ses_client_v2.delete_email_identity({ email_identity: identity })
        audit_logger.info(
          current_user.id,
          " has removed verified identity ",
          identity
        )

        status = "success"
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        status =
          "[email_service][application_helper][delete_email_identity] #{e.message}"
        Rails.logger.error status
      end
      status
    end

    def create_email_identity_domain(verified_domain)
      dkim_signing_attributes = {}

      case verified_domain.dkim_type
      when "easy_dkim"
        dkim_signing_attributes.merge!(
          { next_signing_key_length: verified_domain.next_signing_key_length }
        )
      when "byo_dkim"
        dkim_signing_attributes.merge!(
          {
            domain_signing_selector: verified_domain.domain_signing_selector,
            domain_signing_private_key: verified_domain.domain_signing_private_key,
          }
        )
      end

      email_identity_attributes = {
        email_identity: verified_domain.identity_name,
        tags: verified_domain.tags,
        dkim_signing_attributes: dkim_signing_attributes,
      }

      unless verified_domain.configuration_set_name.nil?
        email_identity_attributes.merge!(
          { configuration_set_name: verified_domain.configuration_set_name }
        )
      end

      status = nil

      begin
        ses_client_v2.create_email_identity(email_identity_attributes)
        audit_logger.info(
          current_user.id,
          "has added an email identity (type: domain) ",
          verified_domain.identity_name
        )
        status = "success"
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        status =
          "[email_service][application_helper][create_email_identity_domain][error]: #{e.message}"
        Rails.logger.error "\n #{status}"
      end

      status
    end

    def find_identity_name(identity)
      @verified_domains = domains
      @verified_domain = new_verified_domain({})
      unless @verified_domains.empty?
        @verified_domains.each do |v|
          @verified_domain = new_verified_domain(v) if v[:identity_name] ==
                                                       identity
        end
      end

      @verified_domain
    end

    def new_verified_domain(attributes = {})
      EmailService::VerifiedDomain.new(attributes)
    end

    # DKIM Attributes

    # list dkim attributes
    def get_dkim_attributes(identity)
      begin
        found = {}
        @domains ||= domains
        @domains&.each do |item|
          found = item if item[:identity_name] == identity
        end
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        Rails.logger.error "[get_dkim_attributes]: ERROR : #{e.message}"
      end

      found.empty? ? nil : found
    end

    def get_dkim_verification_status(resp, identity)
      if resp
        verification_status =
          resp[:dkim_attributes][identity][:dkim_verification_status]
      end
      verification_status
    end

    def token_to_instructions(tokens)
      msg = ""
      return if tokens.nil? || tokens.empty?
      tokens.each { |x| msg += "[#{x}._domainkey.example.com CNAME #{x}.dkim.amazonses.com ]" }
      msg
    end

    #
    # PlainEmail
    #

    # send plain email
    def send_plain_email(plain_email)
      begin
        resp =
          ses_client_v2.send_email(
            {
              from_email_address: plain_email.source,
              destination: {
                to_addresses: plain_email.to_addr,
                cc_addresses: plain_email.cc_addr,
                bcc_addresses: plain_email.bcc_addr,
              },
              reply_to_addresses: plain_email.reply_to_addr || plain_email.source,
              feedback_forwarding_email_address: plain_email.return_path || plain_email.source,
              content: {
                simple: {
                  subject: {
                    data: plain_email.subject,
                    charset: @encoding,
                  },
                  body: {
                    text: {
                      data: plain_email.text_body,
                      charset: @encoding,
                    },
                    html: {
                      data: plain_email.html_body,
                      charset: @encoding,
                    },
                  },
                },
              },
              email_tags: [
                { name: "sample_tag_name", value: "sample_tag_value" },
              ],
            # configuration_set_name: "ConfigurationSetName",
            # list_management_options: {
            #   contact_list_name: "ContactListName",
            #   topic_name: "TopicName",
            # },
            }
          )

        status = "success - email sent to #{plain_email.to_addr} - message id: #{resp}"

        audit_logger.info(
          "[cronus][send_plain_email] : ",
          current_user.id,
          "has sent email to",
          status.to_s
        )
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        status = e.message
      end

      status
    end

    # switch between email and domain source type

    def selected_source_type(type)
      type.blank? ? "email" : type.downcase
    end

    def hide_email_source(type)
      return true if type.blank?
      return false if type.casecmp("email").zero?

      false
    end

    def hide_domain_source(type)
      return true if type.blank?
      return false if type.casecmp("domain").zero?

      true
    end

    # switch between EASYDKIM and BYODKIM
    def selected_dkim_type(type)
      type.blank? ? "easy_dkim" : type.downcase
    end

    def hide_easy_dkim(type)
      return true if type.blank?
      return false if type.casecmp("easy_dkim").zero?

      false
    end

    def hide_byo_dkim(type)
      return true if type.blank?
      return false if type.casecmp("byo_dkim").zero?

      true
    end

    #
    # TemplatedEmail
    #

    # send a templated email
    def send_templated_email(templated_email)
      destination = { to_addresses: templated_email.to_addr }

      destination.merge!({ cc_addresses: templated_email.cc_addr }) unless templated_email.cc_addr.nil?

      destination.merge!({ cc_addresses: templated_email.bcc_addr }) unless templated_email.bcc_addr.nil?

      send_email_hash = {
        from_email_address: templated_email.source,
        destination: destination,
      }

      unless templated_email.configset_name.nil?
        send_email_hash.merge!(
          { configuration_set_name: templated_email.configset_name }
        )
      end

      unless templated_email.list_management_options.nil?
        send_email_hash.merge!(
          {
            list_management_options: {
              contact_list_name: templated_email.list_management_options.contact_list_name, # "ContactListName",
              topic_name: templated_email.list_management_options.topic_name,
            },
          }
        )
      end

      unless templated_email.reply_to_addr.nil?
        send_email_hash.merge!(
          { reply_to_addresses: templated_email.reply_to_addr }
        )
      end

      unless templated_email.return_path.nil?
        send_email_hash.merge!(
          { feedback_forwarding_email_address: templated_email.return_path }
        )
      end

      if templated_email.tags.empty?
        send_email_hash.merge!(
          {
            email_tags: [
              { name: "sample_tag_name", value: "sample_tag_value" },
            ],
          }
        )
      end

      send_email_hash.merge!(
        {
          content: {
            template: {
              template_name: templated_email.template_name,
              template_data: templated_email.template_data,
            },
          },
        }
      )

      begin
        resp = ses_client_v2.send_email(send_email_hash)
        audit_logger.info(
          current_user.id,
          "has sent templated email from the template",
          templated_email.template_name,
          "to",
          templated_email.to_addr,
          templated_email.cc_addr,
          templated_email.bcc_addr,
          "with the template data",
          templated_email.template_data
        )
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        error = e.message
        Rails.logger.error "\n[cronus][send_templated_email][ServiceError] : sending templated email  #{e.message}\n"
      end

      resp&.successful? ? "success" : error
    end

    #
    # Templates
    #

    def templates
      @templates ||= get_all_email_templates
    end

    def templates_collection
      if !templates && templates.empty?
        []
      else
        @templates_collection ||= get_templates_collection(templates)
      end
    end

    # WIP
    # Attempt to parse using regex the template data
    def get_template_items
      template_regex = /\{{\K[^\s}]+(?=}})/
      subject =
        "Subscription Preferences for {{contact.firstName}} {{contact.lastName}}"
      html_part =
        "<!doctype html><html><head><meta charset='utf-8'></head><body><h1>Your Preferences</h1> <p>You have indicated that you are interested in receiving information about the following subjects:</p> <ul> {{#each subscription}} <li>{{interest}}</li> {{/each}} </ul> <p>You can change these settings at any time by visiting the <a href=https://www.example.com/preferences/i.aspx?id={{meta.userId}}> Preference Center</a>.</p></body></html>"
      text_part =
        "Your Preferences\n\nYou have indicated that you are interested in receiving information about the following subjects:\n {{#each subscription}} - {{interest}}\n {{/each}} \nYou can change these settings at any time by visiting the Preference Center at https://www.example.com/prefererences/i.aspx?id={{meta.userId}}"
      # to get first occurance
      # @subject_match = subject.match(template_regex)
      # to get all occurances
      @subject_match = subject.scan(template_regex)
      @html_part_match = html_part.scan(template_regex)
      @text_part_match = text_part.scan(template_regex)
    end

    # Get template names as a collection to be rendered on form
    def get_templates_collection(templates)
      templates_collection = []
      templates.each { |template| templates_collection << template[:name] } unless templates.empty?
      templates_collection
    end

    # get all templates with next_token for every 10 items
    def get_all_email_templates
      templates = []
      next_token, templates = list_email_templates
      until next_token.nil?
        next_token, templates_set = list_email_templates(next_token)
        templates += templates_set
      end

      templates
    end

    # find a template with name or returns an empty template object
    def find_email_template(name)
      templates = get_all_email_templates
      template = new_template({})
      unless templates.empty?
        templates.each { |t| template = new_template(t) if t[:name] == name }
      end

      template
    end

    def new_template(attributes = {})
      EmailService::Template.new(attributes)
    end

    def pretty_print_html(input)
      Nokogiri.HTML(input)
    end

    def toggle_dkim(identity, signing_enabled = true)
      begin
        put_email_identity_dkim_attributes(email_identity, signing_enabled)
        audit_logger.info(
          current_user.id,
          " has toggled DKIM for [",
          identity,
          "] to : ",
          signing_enabled
        )
        status = "success"
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error " enable dkim: #{e.message}"
      end

      status
    end

    #
    # Configuration Sets
    #

    def configsets
      @configsets ||= list_configsets
    end

    def configset_names
      @configset_names ||= list_configset_names
    end

    def is_unique(name)
      configset = find_configset(name)
      configset.name != name
    end

    def store_configset(configset)
      begin
        configuration_set_params = {
          configuration_set_name: configset.name,
          tracking_options: {
            custom_redirect_domain: configset.custom_redirect_domain,
          },
          delivery_options: {
            tls_policy: configset.tls_policy,
            sending_pool_name: configset.sending_pool_name,
          },
          reputation_options: {
            reputation_metrics_enabled: configset.reputation_metrics_enabled,
            last_fresh_start: configset.last_fresh_start,
          },
          sending_options: {
            sending_enabled: configset.sending_enabled,
          },
          tags: configset.tags,
          suppression_options: {
            suppressed_reasons: configset.suppressed_reasons,
          },
        }
        ses_client_v2.create_configuration_set(configuration_set_params)
        audit_logger.info(
          current_user.id,
          "has created configset with following values ",
          configset.inspect
        )
        status = "success"
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error " store configset (v2): #{e.message}"
      end

      status
    end

    def delete_configset(name)
      begin
        ses_client_v2.delete_configuration_set({ configuration_set_name: name })
        audit_logger.info(current_user.id, "has deleted configset", name)
        status = "success"
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        msg = "Unable to delete Configset #{name}. Error : #{e.message} "
        status = msg
        Rails.logger.error msg
      end

      status
    end

    def list_configsets(token = nil, page_size = 1000)
      configset_hash = {}
      configsets = []
      begin
        # lists 1000 items by default
        resp =
          ses_client_v2.list_configuration_sets(
            { next_token: token, page_size: page_size }
          )

        next_token = resp.next_token
        if resp.configuration_sets.size.positive?
          (0...resp.configuration_sets.size).each do |index|
            item =
              ses_client_v2.get_configuration_set(
                { configuration_set_name: resp.configuration_sets[index] }
              )

            configset_hash = {
              id: index,
              name: item.configuration_set_name,
              tracking_options: item.tracking_options,
              delivery_options: item.delivery_options,
              reputation_options: item.reputation_options.reputation_metrics_enabled,
              sending_options: item.reputation_options,
              tags: item.tags,
              suppression_options: item.suppression_options,
            }
            configsets.push(configset_hash)
          end
        else
          status = I18n.t("email_service.errors.configset_list_empty").to_s
        end
      rescue Aws::SESV2::Errors::ServiceError, StandardError => e
        error =
          "#{I18n.t("email_service.errors.configset_list_error")} :  #{e.message}"
        Rails.logger.error error
      end
      configsets
    end

    # get an array of configset names up to 1000 entries
    def list_configset_names(token = "")
      configset_names = []
      configsets = list_configsets(token)
      configsets.each { |cfg| configset_names << cfg[:name] } unless configsets.empty?
      configset_names
    end

    def new_configset(attributes = {})
      ::EmailService::Configset.new(attributes)
    end

    def find_configset(name)
      configsets = list_configsets
      return if configsets.empty?

      configsets.each { |cfg| return new_configset(cfg) if cfg[:name] == name }
    end

    def matching_event_types_collection
      %w[send reject bounce complaint delivery open click renderingFailure]
    end

    def dimension_value_source_collection
      %w[messageTag emailHeader linkTag]
    end

    def configuration_set_attribute_names
      %w[eventDestinations trackingOptions deliveryOptions reputationOptions]
    end

    ### Custom verification email template

    def create_custom_verification_email_template(custom_template)
      begin
        template_params = {
          template_name: custom_template.template_name,
          from_email_address: custom_template.from_email_address,
          template_subject: custom_template.subject,
          template_content: custom_template.content,
          success_redirection_url: custom_template.success_redirection_url,
          failure_redirection_url: custom_template.failure_redirection_url,
        }
        ses_client_v2.create_custom_verification_email_template(template_params)
        status = "success"
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error "Create custom verification template failed: #{e.message}"
      end
      status
    end

    def delete_custom_verification_email_template(name)
      begin
        ses_client_v2.delete_custom_verification_email_template(
          { template_name: name }
        )
        status = "success"
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error "Delete custom verification template: #{status}"
      end
      status
    end

    def new_custom_verification_email_template(attributes = {})
      EmailService::CustomVerificationEmailTemplate.new(attributes)
    end

    def update_custom_verification_email_template(custom_template = {})
      ses_client_v2.update_custom_verification_email_template(
        {
          template_name: custom_template.template_name,
          from_email_address: custom_template.from_email_address,
          template_subject: custom_template.template_subject,
          template_content: custom_template.template_content,
          success_redirection_url: custom_template.success_redirection_url,
          failure_redirection_url: custom_template.failure_redirection_url,
        }
      )
      "success"
    rescue Aws::SES::Errors::ServiceError, StandardError => e
      Rails.logger.error "Create custom verification template: #{e.message}"
    end

    def list_custom_verification_email_templates(next_token = nil)
      @custom_verification_email_templates = []
      @template_items = []
      begin
        options = { next_token: next_token, page_size: 20 }
        resp = ses_client_v2.list_custom_verification_email_templates(options)
        return resp if resp.is_a?(Exception)

        @custom_verification_email_templates =
          resp[:custom_verification_email_templates]
        total_items = @custom_verification_email_templates&.count
        return @custom_verification_email_template unless total_items&.positive?
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error " List custom verification email templates: #{status}"
      end

      index = 1
      @custom_verification_email_templates.each do |item|
        template_item = {}
        template_item.merge!(
          {
            id: index,
            template_name: item.template_name,
            from_email_address: item.from_email_address,
            template_subject: item.template_subject,
            success_redirection_url: item.success_redirection_url,
            failure_redirection_url: item.failure_redirection_url,
          }
        )
        @template_items.push(template_item)
        index += 1
      end
      @template_items
    end

    # find a template with name or returns an empty template object
    def find_custom_verification_email_template(template_name)
      begin
        options = { template_name: template_name }
        template = ses_client_v2.get_custom_verification_email_template(options)
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        status = e.message.to_s
        Rails.logger.error " Find custom verification template: #{status}"
      end

      template || new_custom_verification_email_template
    end

    def send_stats
      @send_stats ||= domain_statistics_report
    end

    # TODO: List
    #
    ### domain_statistics_report

    def domain_statistics_report(domain = nil, report_start_date = Time.now - 86_400, report_end_date = Time.now)
      attrs = {
        domain: domain,
        start_date: report_start_date,
        end_date: report_end_date,
      }

      report = ses_client_v2.get_domain_statistics_report(attrs)

      # Unable to find a dashboard account for <1234565789>
      # Check dashboard account is enabled or not
    rescue Aws::SESV2::Errors::ServiceError, StandardError => e
      error = "[domain_statistics_report][error]: #{e.message}"
      Rails.logger.error error

      report
    end

    #
    ### batch_get_metric_data

    def metric_data(_query_params = {})
      query = {
        queries: [
          {
            id: "QueryIdentifier",
            namespace: "VDM", # accepts VDM
            metric: "SEND", # accepts SEND, COMPLAINT, PERMANENT_BOUNCE, TRANSIENT_BOUNCE, OPEN, CLICK, DELIVERY, DELIVERY_OPEN, DELIVERY_CLICK, DELIVERY_COMPLAINT
            dimensions: {
              "EMAIL_IDENTITY" => "MetricDimensionValue",
            },
            start_date: Time.now - 86_400,
            end_date: Time.now,
          },
        ],
      }
      ses_client_v2.batch_get_metric_data(query)
    rescue Aws::SESV2::Errors::ServiceError, StandardError => e
      error = "[batch_get_metric_data]. Error: #{e.message}"
      Rails.logger.error error
    end

    #
    ### contacts && contact_list

    def create_contact(_contact__options = {})
      if contact_options.empty?
        contact_options = {
          contact_list_name: "ContactListName",
          email_address: "EmailAddress",
          topic_preferences: [
            {
              topic_name: "TopicName",
              subscription_status: "OPT_IN", # accepts OPT_IN, OPT_OUT
            },
          ],
          unsubscribe_all: false,
          attributes_data: "AttributesData",
        }
      end
      ses_client_v2.create_contact(contact_options)
    rescue Aws::SESV2::Errors::ServiceError, StandardError => e
      error = "Listing contact lists failed. Error message: #{e.message}"
      Rails.logger.error error
    end

    def get_contact(_options = {})
      options = {
        contact_list_name: "ContactListName",
        email_address: "EmailAddress",
      }
      ses_client_v2.get_contact(options)
    end

    def update_contact(_options = {})
      options = {
        contact_list_name: "ContactListName",
        email_address: "EmailAddress",
        topic_preferences: [
          {
            topic_name: "TopicName",
            subscription_status: "OPT_IN", # accepts OPT_IN, OPT_OUT
          },
        ],
        unsubscribe_all: false,
        attributes_data: "AttributesData",
      }
      ses_client_v2.update_contact(options)
    end

    def list_contacts(_options = {})
      options = {
        contact_list_name: "ContactListName",
        filter: {
          filtered_status: "OPT_IN", # accepts OPT_IN, OPT_OUT
          topic_filter: {
            topic_name: "TopicName",
            use_default_if_preference_unavailable: false,
          },
        },
        page_size: 1,
        next_token: "NextToken",
      }
      ses_client_v2.list_contacts(options)
    end

    def delete_contact(contact_list_name, email_address)
      options = {
        contact_list_name: contact_list_name,
        email_address: email_address,
      }
      ses_client_v2.delete_contact(options)
    end

    def get_contact_list(name)
      options = { contact_list_name: name }
      ses_client_v2.get_contact_list(options)
    end

    def list_contact_lists(next_token = nil, page_size = 1)
      options = { page_size: page_size, next_token: next_token }
      ses_client_v2.list_contact_lists(options)
    rescue Aws::SESV2::Errors::ServiceError, StandardError => e
      error = "Listing contact lists failed. Error message: #{e.message}"
      Rails.logger.error error
    end

    def update_contact_list
      options = {
        contact_list_name: "ContactListName",
        topics: [
          {
            topic_name: "TopicName",
            display_name: "DisplayName",
            description: "Description",
            default_subscription_status: "OPT_IN", # accepts OPT_IN, OPT_OUT
          },
        ],
        description: "Description",
      }
      ses_client_v2.update_contact_list(options)
    end

    def delete_contact_list(_options = {})
      options = { contact_list_name: "ContactListName" }
      ses_client_v2.delete_contact_list(options)
    end

    def create_dedicated_ip_pool(_options = {})
      if options.empty?
        options = {
          pool_name: "PoolName",
          tags: [{ key: "TagKey", value: "TagValue" }],
          scaling_mode: "STANDARD", # accepts STANDARD, MANAGED
        }
      end
      ses_client_v2.create_dedicated_ip_pool(options)
    rescue Aws::SESV2::Errors::ServiceError, StandardError => e
      error = "Listing contact lists failed. Error message: #{e.message}"
      Rails.logger.error error
    end

    def list_dedicated_ip_pools(_options = {})
      options = { next_token: "NextToken", page_size: 1 }
      ses_client_v2.list_dedicated_ip_pools(options)
    end

    def get_dedicated_ip(ip_address)
      ses_client_v2.get_dedicated_ip({ ip: ip_address })
    end

    def get_dedicated_ips(_options = {})
      options = { pool_name: "PoolName", next_token: "NextToken", page_size: 1 }
      ses_client_v2.get_dedicated_ips(options)
    end

    def put_dedicated_ip_in_pool(ip, pool_name)
      options = { ip: ip, destination_pool_name: pool_name }
      ses_client_v2.put_dedicated_ip_in_pool(options)
    end

    def get_dedicated_ip_pool(_options = {})
      options = { pool_name: "PoolName" }
      ses_client_v2.get_dedicated_ip_pool(options)
    end

    def delete_dedicated_ip_pool(_options = {})
      options = { pool_name: "PoolName" }
      ses_client_v2.delete_dedicated_ip_pool(options)
    end

    def create_deliverability_test_report(_options = {})
      if options.empty?
        options = {
          report_name: "ReportName",
          from_email_address: "EmailAddress",
          content: {
            simple: {
              subject: {
                data: "MessageData",
                charset: "Charset",
              },
              body: {
                text: {
                  data: "MessageData",
                  charset: "Charset",
                },
                html: {
                  data: "MessageData",
                  charset: "Charset",
                },
              },
            },
            raw: {
              data: "data",
            },
            template: {
              template_name: "EmailTemplateName",
              template_arn: "AmazonResourceName",
              template_data: "EmailTemplateData",
            },
          },
          tags: [{ key: "TagKey", value: "TagValue" }],
        }
      end
      ses_client_v2.create_deliverability_test_report(options)
    end

    def list_deliverability_test_reports(options)
      options = { next_token: "NextToken", page_size: 1 }
      ses_client_v2.list_deliverability_test_reports(options)
    end

    def get_deliverability_dashboard_options(_options = {})
      ses_client_v2.get_deliverability_dashboard_options(_options)
    end

    # SES Pricing may apply for this https://aws.amazon.com/ses/pricing/
    def put_deliverability_dashboard_option(_options = {})
      options = {
        dashboard_enabled: false,
        subscribed_domains: [
          {
            domain: "Domain",
            subscription_start_date: Time.now,
            inbox_placement_tracking_option: {
              global: false,
              tracked_isps: ["IspName"],
            },
          },
        ],
      }
      ses_client_v2.put_deliverability_dashboard_option(options)
    end

    def get_deliverability_test_report(_options = {})
      report_id = ses_client_v2.get_deliverability_test_report(options)
    end

    def get_domain_deliverability_campaign(campaign_id)
      options = { campaign_id: campaign_id }
      ses_client_v2.get_domain_deliverability_campaign(options)
    end

    def list_domain_deliverability_campaigns(_options = {})
      options = {
        start_date: Time.now,
        end_date: Time.now,
        subscribed_domain: "Domain",
        next_token: "NextToken",
        page_size: 1,
      }
      ses_client_v2.list_domain_deliverability_campaigns(options)
    end

    def create_email_identity_policy
      options = {
        email_identity: "Identity",
        policy_name: "PolicyName",
        policy: "Policy",
      }
      ses_client_v2.create_email_identity_policy(options)
    end

    def get_email_identity_policies(identity)
      options = { email_identity: identity }
      ses_client_v2.get_email_identity_policies(options)
    end

    def update_email_identity_policy(_options = {})
      options = {
        email_identity: "Identity",
        policy_name: "PolicyName",
        policy: "Policy",
      }
      ses_client_v2.update_email_identity_policy(options)
    end

    def delete_email_identity_policy(identity, policy_name)
      options = { email_identity: identity, policy_name: policy_name }
      ses_client_v2.delete_email_identity_policy(options)
    end

    #
    ### templates v3 -- [START]
    def create_email_template(template)
      begin
        options = {
          template_name: template.name,
          template_content: {
            subject: template.subject,
            text: template.text_part,
            html: template.html_part,
          },
        }
        ses_client_v2.create_email_template(options)
        audit_logger.info(
          current_user.id,
          "has created a template ",
          template.name
        )
        status = "success"
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        status = "Unable to save template: #{e.message}"
        Rails.logger.error " #{status}."
      end

      status
    end

    def get_email_template(name)
      ses_client_v2.get_email_template({ template_name: name })
    rescue Aws::SES::Errors::ServiceError, StandardError => e
      status = "Unable to fetch template: #{e.message}"
      Rails.logger.error " #{status}."
    end

    # list first 10 templates subsequently with next_token
    def list_email_templates(token = nil)
      options = { next_token: token, page_size: 10 }
      tmpl_hash = {}
      templates = []
      next_token = nil
      begin
        template_list = ses_client_v2.list_email_templates(options)
        next_token = template_list.next_token
        index = 0
        while template_list.size.positive? &&
              index < template_list.templates_metadata.count
          resp =
            ses_client_v2.get_email_template(
              {
                template_name: template_list.templates_metadata[index].template_name,
              }
            )
          tmpl_hash = {
            id: index,
            name: resp.template_name,
            subject: resp.template_content.subject,
            text_part: resp.template_content.text,
            html_part: resp.template_content.html,
          }
          templates.push(tmpl_hash)
          index += 1
        end
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        Rails.logger.error " Unable to fetch templates. Error message: #{e.message}"
      end

      [next_token, templates]
    end

    def update_email_template(template)
      begin
        options = {
          template_name: template.name,
          template_content: {
            subject: template.subject,
            text: template.text_part,
            html: template.html_part,
          },
        }
        ses_client_v2.update_email_template(options)
        audit_logger.info(
          current_user.id,
          "has updated template ",
          template.name
        )
        status = "success"
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        msg = "Unable to update template #{template.name}. Error: #{e.message}"
        Rails.logger.error msg
        status = msg
      end
      status
    end

    def delete_email_template(name)
      ses_client_v2.delete_email_template({ template_name: name })
    end

    ### templates v3 -- [END]

    def create_import_job(_options = {})
      options = {
        import_destination: { # required
          suppression_list_destination: {
            suppression_list_import_action: "DELETE", # accepts DELETE, PUT
          },
          contact_list_destination: {
            contact_list_name: "ContactListName",
            contact_list_import_action: "DELETE", # accepts DELETE, PUT
          },
        },
        import_data_source: {
          s3_url: "S3Url",
          data_format: "CSV", # accepts CSV, JSON
        },
      }
      ses_client_v2.create_import_job(options)
    end

    def get_import_job(job_id)
      options = { job_id: job_id }
      ses_client_v2.get_import_job(options)
    end

    def list_import_jobs(_options = {})
      options = {
        import_destination_type: "SUPPRESSION_LIST", # accepts SUPPRESSION_LIST, CONTACT_LIST
        next_token: "NextToken",
        page_size: 1,
      }
      ses_client_v2.list_import_jobs(options)
    end

    def list_recommendations(_options = {})
      options = {
        filter: {
          "TYPE" => "ListRecommendationFilterValue",
        },
        next_token: "NextToken",
        page_size: 1,
      }
      ses_client_v2.list_recommendations(options)
    end

    def create_configuration_set_event_destination(_options = {})
      if options.empty?
        options = {
          configuration_set_name: "ConfigurationSetName",
          event_destination: {
            name: "EventDestinationName",
            enabled: false,
            matching_event_types: ["send"], # accepts send, reject, bounce, complaint, delivery, open, click, renderingFailure
            kinesis_firehose_destination: {
              iam_role_arn: "AmazonResourceName",
              delivery_stream_arn: "AmazonResourceName",
            },
            cloud_watch_destination: {
              dimension_configurations: [
                {
                  dimension_name: "DimensionName",
                  dimension_value_source: "messageTag", # accepts messageTag, emailHeader, linkTag
                  default_dimension_value: "DefaultDimensionValue",
                },
              ],
            },
            sns_destination: {
              topic_arn: "AmazonResourceName",
            },
          },
        }
      end
      ses_client_v2.create_configuration_set_event_destination(options)
    rescue Aws::SES::Errors::ServiceError, StandardError => e
      status = e.message.to_s
      Rails.logger.error "Create custom verification template failed: #{status}"
    end

    def get_configuration_set_event_destinations(options)
      options = { configuration_set_name: "ConfigurationSetName" }
      ses_client_v2.get_configuration_set_event_destinations(options)
    end

    def update_configuration_set_event_destination(_options = {})
      options = {
        configuration_set_name: "ConfigurationSetName",
        event_destination_name: "EventDestinationName",
        event_destination: {
          enabled: false,
          matching_event_types: ["SEND"], # accepts SEND, REJECT, BOUNCE, COMPLAINT, DELIVERY, OPEN, CLICK, RENDERING_FAILURE, DELIVERY_DELAY, SUBSCRIPTION
          kinesis_firehose_destination: {
            iam_role_arn: "AmazonResourceName",
            delivery_stream_arn: "AmazonResourceName",
          },
          cloud_watch_destination: {
            dimension_configurations: [
              {
                dimension_name: "DimensionName",
                dimension_value_source: "MESSAGE_TAG", # accepts MESSAGE_TAG, EMAIL_HEADER, LINK_TAG
                default_dimension_value: "DefaultDimensionValue",
              },
            ],
          },
          sns_destination: {
            topic_arn: "AmazonResourceName",
          },
          pinpoint_destination: {
            application_arn: "AmazonResourceName",
          },
        },
      }
      ses_client_v2.update_configuration_set_event_destination(options)
    rescue Aws::SES::Errors::ServiceError, StandardError => e
      status = e.message.to_s
      Rails.logger.error "Updating configuration set event destination failed: #{status}"
    end

    def delete_configuration_set_event_destination(
      configuration_set_name,
      event_destination_name
    )
      options = {
        configuration_set_name: configuration_set_name,
        event_destination_name: event_destination_name,
      }
      ses_client_v2.delete_configuration_set_event_destination(options)
    end

    def get_suppressed_destination(email_address)
      begin
        options = { email_address: email_address }
        @suppressed_destination ||= ses_client_v2.get_suppressed_destination(options)
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        Rails.logger.error e.message
        e.message
      end
      @suppressed_destination || e.message
    end

    def list_suppressed_destinations(_options = {})
      options = {
        reasons: %w[BOUNCE COMPLAINT], # accepts BOUNCE, COMPLAINT
        start_date: Time.now,
        end_date: Time.now,
        next_token: nil,
        page_size: 1,
      }
      begin
        @suppressed_detinations = ses_client_v2.list_suppressed_destinations(options)
      rescue Aws::SES::Errors::ServiceError, StandardError => e
        Rails.logger.error e.message
        e.message
      end
      @suppressed_detinations || e.message
    end

    def delete_suppressed_destination(email_address)
      ses_client_v2.delete_suppressed_destination(
        { email_address: email_address }
      )
    rescue Aws::SES::Errors::ServiceError, StandardError => e
      Rails.logger.error e.message
      e.message
    end

    def get_blacklist_reports(blacklist = [])
      options = { blacklist_item_names: blacklist }
      ses_client_v2.get_blacklist_reports(options)
    end

    # Tags

    def tag_resource(_options = {})
      options = {
        resource_arn: "AmazonResourceName",
        tags: [{ key: "TagKey", value: "TagValue" }],
      }
      ses_client_v2.tag_resource(options)
    end

    def untag_resource(arn, tag_keys = ["TagKey"])
      options = { resource_arn: arn, tag_keys: tag_keys }
      ses_client_v2.untag_resource(options)
    end

    def list_tags_for_resource(arn = nil)
      options = { resource_arn: arn }
      ses_client_v2.list_tags_for_resource(options)
    end

    def put_account_dedicated_ip_warmup_attributes(auto_warmup_enabled: false)
      options = { auto_warmup_enabled: auto_warmup_enabled }
      ses_client_v2.put_account_dedicated_ip_warmup_attributes(options)
    end

    def put_dedicated_ip_warmup_attributes(ip, warmup_percentage = 1)
      options = { ip: ip, warmup_percentage: warmup_percentage }
      ses_client_v2.put_dedicated_ip_warmup_attributes(options)
    end

    def put_account_details(_options = {})
      options = {
        mail_type: "MARKETING", # required, accepts MARKETING, TRANSACTIONAL
        website_url: "WebsiteURL",
        contact_language: "EN", # accepts EN, JA
        use_case_description: "UseCaseDescription",
        additional_contact_email_addresses: ["AdditionalContactEmailAddress"],
        production_access_enabled: false,
      }
      ses_client_v2.put_account_details(options)
    end

    def put_account_sending_attributes(sending_enabled: false)
      options = { sending_enabled: sending_enabled }
      ses_client_v2.put_account_sending_attributes(options)
    end

    def put_account_suppression_attributes(
      suppressed_reasons = %w[BOUNCE COMPLAINT]
    )
      options = { suppressed_reasons: suppressed_reasons }
      ses_client_v2.put_account_suppression_attributes(options)
    end

    def put_configuration_set_suppression_options(
      configuration_set_name,
      suppressed_reasons = %w[BOUNCE COMPLAINT]
    )
      options = {
        configuration_set_name: configuration_set_name,
        suppressed_reasons: suppressed_reasons,
      }
      ses_client_v2.put_configuration_set_suppression_options(options)
    end

    def put_account_vdm_attributes(_options = {})
      options = {
        vdm_attributes: {
          vdm_enabled: "ENABLED", # accepts ENABLED, DISABLED
          dashboard_attributes: {
            engagement_metrics: "ENABLED", # accepts ENABLED, DISABLED
          },
          guardian_attributes: {
            optimized_shared_delivery: "ENABLED", # accepts ENABLED, DISABLED
          },
        },
      }
      ses_client_v2.put_account_vdm_attributes(options)
    end

    def put_configuration_set_delivery_options(
      configuration_set_name,
      tls_policy,
      sending_pool_name
    )
      options = {
        configuration_set_name: configuration_set_name,
        tls_policy: tls_policy, # accepts REQUIRE, OPTIONAL
        sending_pool_name: sending_pool_name,
      }
      ses_client_v2.put_configuration_set_delivery_options(options)
    end

    def put_configuration_set_reputation_options(
      configuration_set_name,
      reputation_metrics_enabled: false
    )
      options = {
        configuration_set_name: configuration_set_name,
        reputation_metrics_enabled: reputation_metrics_enabled,
      }
      ses_client_v2.put_configuration_set_reputation_options(options)
    end

    def put_configuration_set_sending_options(
      configuration_set_name,
      sending_enabled
    )
      options = {
        configuration_set_name: configuration_set_name,
        sending_enabled: sending_enabled,
      }
      ses_client_v2.put_configuration_set_sending_options(options)
    end

    def put_configuration_set_tracking_options(
      configuration_set_name,
      custom_redirect_domain
    )
      options = {
        configuration_set_name: configuration_set_name, # required
        custom_redirect_domain: custom_redirect_domain,
      }
      ses_client_v2.put_configuration_set_tracking_options(options)
    end

    def put_configuration_set_vdm_options(_options = {})
      options = {
        configuration_set_name: "ConfigurationSetName",
        vdm_options: {
          dashboard_options: {
            engagement_metrics: "ENABLED", # accepts ENABLED, DISABLED
          },
          guardian_options: {
            optimized_shared_delivery: "ENABLED", # accepts ENABLED, DISABLED
          },
        },
      }
      ses_client_v2.put_configuration_set_vdm_options(options)
    end

    def put_email_identity_configuration_set_attributes(
      email_identity,
      configuration_set_name
    )
      options = {
        email_identity: email_identity,
        configuration_set_name: configuration_set_name,
      }
      ses_client_v2.put_email_identity_configuration_set_attributes(options)
    end

    def put_email_identity_dkim_attributes(email_identity, signing_enabled)
      options = {
        email_identity: email_identity,
        signing_enabled: signing_enabled,
      }
      ses_client_v2.put_email_identity_dkim_attributes(options)
    end

    def put_email_identity_dkim_signing_attributes(_options = {})
      options = {
        email_identity: "Identity",
        signing_attributes_origin: "AWS_SES", # accepts AWS_SES, EXTERNAL
        signing_attributes: {
          domain_signing_selector: "Selector",
          domain_signing_private_key: "PrivateKey",
          next_signing_key_length: "RSA_1024_BIT", # accepts RSA_1024_BIT, RSA_2048_BIT
        },
      }
      ses_client_v2.put_email_identity_dkim_signing_attributes(options)
    end

    def put_email_identity_feedback_attributes(
      email_identity,
      email_forwarding_enabled
    )
      options = {
        email_identity: email_identity,
        email_forwarding_enabled: email_forwarding_enabled,
      }
      ses_client_v2.put_email_identity_feedback_attributes(options)
    end

    def put_email_identity_mail_from_attributes(_options = {})
      options = {
        email_identity: "Identity", # required
        mail_from_domain: "MailFromDomainName",
        behavior_on_mx_failure: "USE_DEFAULT_VALUE", # accepts USE_DEFAULT_VALUE, REJECT_MESSAGE
      }
      ses_client_v2.put_email_identity_mail_from_attributes(options)
    end

    def put_suppressed_destination(email_address, reason)
      options = {
        email_address: email_address,
        reason: reason, # accepts BOUNCE, COMPLAINT
      }
      ses_client_v2.put_suppressed_destination(options)
    end

    #
    ### Send Bulk Email

    def send_bulk_email(_options = {})
      options = {
        from_email_address: "EmailAddress",
        from_email_address_identity_arn: "AmazonResourceName",
        reply_to_addresses: ["EmailAddress"],
        feedback_forwarding_email_address: "EmailAddress",
        feedback_forwarding_email_address_identity_arn: "AmazonResourceName",
        default_email_tags: [
          { name: "MessageTagName", value: "MessageTagValue" },
        ],
        default_content: {
          template: {
            template_name: "EmailTemplateName",
            template_arn: "AmazonResourceName",
            template_data: "EmailTemplateData",
          },
        },
        bulk_email_entries: [
          {
            destination: {
              to_addresses: ["EmailAddress"],
              cc_addresses: ["EmailAddress"],
              bcc_addresses: ["EmailAddress"],
            },
            replacement_tags: [
              { name: "MessageTagName", value: "MessageTagValue" },
            ],
            replacement_email_content: {
              replacement_template: {
                replacement_template_data: "EmailTemplateData",
              },
            },
          },
        ],
        configuration_set_name: "ConfigurationSetName",
      }
      ses_client_v2.send_bulk_email(options)
    end

    def test_render_email_template(template_name, template_data)
      options = { template_name: template_name, template_data: template_data }
      ses_client_v2.test_render_email_template(options)
    end

    #
    ## nebula
    #

    def nebula_request
    end

    def custom_endpoint_url
      nil
    end

    def nebula_provider_collection
      %w[aws int]
    end

    def nebula_endpoint_url
      current_user.service_url("nebula")
    end

    def api_request(uri, method, headers = nil, body = nil)
      https = Net::HTTP.new(uri.host, uri.port)
      https.use_ssl = true

      request = case method
        when "GET"
          Net::HTTP::Get.new(uri)
        when "POST"
          Net::HTTP::Post.new(uri)
        when "DELETE"
          Net::HTTP::Delete.new(uri)
        else
          Net::HTTP::Get.new(uri)
        end

      JSON.parse(headers).each { |name, value| request[name] = value } unless headers.nil?
      request.body = body if body

      begin
        response = https.request(request)
      rescue StandardError => e
        Rails.logger.error e.message
        e.message
      end

      response
    end

    def format_response(response)
      "#{response.code} : #{response.read_body}"
    end

    def handle_parser_error(error)
      err = JSON.dump({ error: error.message })
      @nebula_details = JSON.parse(err)
    end

    def parse_response(parsed)
      if parsed.instance_of?(Hash)
        if parsed.key?("error")
          @nebula_details = parsed
        elsif parsed.key?("status") && parsed.key?("security_attributes")
          security_attributes = parsed["security_attributes"]&.split(", ")
          production = parsed.key?("production") ? parsed["production"] : nil
          status = parsed["status"].nil? ? nil : parsed["status"]
          allowed_emails = parsed.key?("allowed_emails") ? parsed["allowed_emails"] : nil
          complaint = parsed.key?("complaint") ? parsed["complaint"] : nil
          @nebula_details = {
            security_officer: security_attributes[0][16...].strip.to_s,
            environment: security_attributes[1][12...].strip.to_s,
            valid_until: security_attributes[2][12...].strip.to_s,
            production: production.to_s,
            allowed_emails: allowed_emails.to_s,
            complaint: complaint.to_s,
            status: status.to_s,
          }
        end
      elsif parsed.instance_of?(String)
        @nebula_details = JSON.parse(parsed)
      end
    end

    def nebula_details
      url = URI("#{nebula_endpoint_url}/v1/aws/#{project_id}")
      Rails.logger.debug(" \n url: #{url}")
      headers = JSON.dump({ 'X-Auth-Token': "#{current_user.token}", 'Content-Type': "application/json" })
      body = nil
      begin
        response = api_request(url, "GET", headers, body)
        if response && response&.status == 200
          @parsed = JSON.parse(response&.read_body)
          parse_response(@parsed) if @parsed
        end
      rescue JSON::ParserError => e
        handle_parser_error(e)
      end

      @nebula_details
    end

    def nebula_status
      @nebula_details ||= JSON.parse(JSON.dump(nebula_details))
      if @nebula_details.instance_of?(Hash)
        if @nebula_details.key?("error")
          err = @nebula_details["error"]
          @status = "TERMINATED" if err.include?("account is marked as terminated")
          @status = "NOT_ACTIVATED" if err.include?("account isn't activated")
        elsif @nebula_details.key?("status") && @nebula_details["status"]
          case @nebula_details["status"]
          when "GRANTED"
            if @nebula_details.key?("production")
              @status = @nebula_details["production"] == "true" ? "PRODUCTION" : "SANDBOX"
            end
          when "DENIED"
            @status = "DENIED"
          when "PENDING"
            @status = "PENDING"
          when "PENDING-CUSTOMER-ACTION"
            @status = "PENDING-CUSTOMER-ACTION"
          when "CUSTOMER-ACTION-COMPLETED"
            @status = "CUSTOMER-ACTION-COMPLETED"
          end
        end
      elsif @nebula_details.instance_of?(String)
        @status = @nebula_details
      end
      @status
    end

    def nebula_active?
      @nebula_status = nebula_status
      status_items = %w[GRANTED PENDING PENDING_CUSTOMER_ACTION CUSTOMER_ACTION_COMPLETED PRODUCTION SANDBOX]
      @nebula_status && status_items.any? { |item| @nebula_status.include? item } ? true : false
    end

    def nebula_available?
      services.available?(:nebula)
    end

    def get_nebula_uri(provider = "aws", custom_url = nil)
      base_url = provider == "aws" && custom_url.nil? ? nebula_endpoint_url : custom_url
      URI("#{base_url}/v1/#{provider}/#{project_id}")
    end

    def nebula_activate(multicloud_account = nil)
      return "MultiCloud parameters for activation are invalid" if multicloud_account.nil?

      provider = multicloud_account.provider || "aws"
      endpoint_url = multicloud_account.custom_endpoint_url || nil
      url = get_nebula_uri(provider, endpoint_url)
      headers = JSON.dump({ 'X-Auth-Token': current_user.token, 'Content-Type': "application/json" })
      body =
        JSON.dump(
          {
            accountEnv: multicloud_account.account_env,
            identities: multicloud_account.identity,
            mailType: multicloud_account.mail_type || "TRANSACTIONAL",
            securityOfficer: multicloud_account.security_officer,
          }
        )

      response = api_request(url, "POST", headers, body)

      audit_logger.info(
        "[cronus][nebula_activate]: ",
        current_user.id,
        "has intiated multicloud account (nebula) activation",
        "for the project",
        project_id,
        response.code
      )
      response.code.to_i < 300 ? "success" : format_response(response)
    end

    def nebula_deactivate(provider = "aws")
      url = get_nebula_uri(provider, custom_endpoint_url)
      headers = JSON.dump({ 'X-Auth-Token': current_user.token.to_s, 'Content-Type': "application/json" })
      body = nil

      response = api_request(url, "DELETE", headers, body)

      audit_logger.info(
        "[cronus][nebula_deactivate]: ",
        current_user.id,
        "has intiated multicloud account (nebula) deletion",
        "for the project",
        project_id,
        response.code
      )
      response.code.to_i < 300 ? "success" : format_response(response)
    end
    
    def cronus_account_details
      access = ec2_access
      secret = ec2_secret

      @cronus_region = cronus_region || "eu-de-2"
      @aws_region = map_region(@cronus_region) || "eu-central-1"
      @cronus_endpoint = "https://cronus.#{@cronus_region}.cloud.sap"
      signer = aws_signer("ses", access, secret, @aws_region, @cronus_endpoint)
      signature = signer.sign_request(
        http_method: "GET",
        url: "#{@cronus_endpoint}/v2/email/account",
      )

      begin
        account_url = URI("#{@cronus_endpoint}/v2/email/account")
        https = Net::HTTP.new(account_url.host, account_url.port)

        https.use_ssl = true
        https.verify_mode = OpenSSL::SSL::VERIFY_PEER

        request = Net::HTTP::Get.new(account_url)

        request["X-Amz-Date"] = signature.headers["x-amz-date"]
        request["Host"] = signature.headers["host"]
        request["X-Amz-security-token"] = signature.headers["x-amz-security-token"]
        request["X-Amz-content-sha256"] = signature.headers["x-amz-content-sha256"]
        request["Authorization"] = signature.headers["authorization"]
        response = https.request(request)
        Rails.logger.debug(" response: #{response} \n")
        Rails.logger.debug(" \n [cronus_account_details] : response: #{response} \n")
        @cronus_account_details = JSON.parse(response.read_body)
      rescue StandardError => e
        Rails.logger.error e.message
        error = "ERROR IS: #{e.message}"
      end
      @cronus_account_details || error
    end

    def aws_account_details
      @aws_account_details ||= ses_client_v2.get_account if ec2_creds && ses_client_v2
    end

    def aws_signer(service, access, secret, region, url)
      return nil unless service && access && secret && region && url

      @aws_signer ||= Aws::Sigv4::Signer.new(
        service: service,
        region: region,
        endpoint: url,
        access_key_id: access,
        secret_access_key: secret,
      )
    end

    def _suppressed_email_list(next_token = nil)
      return nil if !ec2_access || !ec2_secret

      access = ec2_access
      secret = ec2_secret

      @suppressed_destination_array = []

      @cronus_region = cronus_region
      @aws_region = map_region(@cronus_region)

      @cronus_endpoint = "https://cronus.#{@cronus_region}.cloud.sap"
      signer = aws_signer("ses", access, secret, @aws_region, @cronus_endpoint)

      return nil if signer == nil?

      signature = signer.sign_request(
        http_method: "GET",
        url: "#{@cronus_endpoint}/v2/email/suppression/addresses",
      )
      begin
        if next_token
          suppression_url = URI("#{@cronus_endpoint}/v2/email/suppression/addresses?NextToken=#{next_token}")
        elsif next_token.nil?
          suppression_url = URI("#{@cronus_endpoint}/v2/email/suppression/addresses")
        end

        https = Net::HTTP.new(suppression_url.host, suppression_url.port)
        https.use_ssl = true
        request = Net::HTTP::Get.new(suppression_url)
        request["X-Amz-Date"] = signature.headers["x-amz-date"]
        request["Host"] = signature.headers["host"]
        request["X-Amz-security-token"] = signature.headers["x-amz-security-token"]
        request["X-Amz-content-sha256"] = signature.headers["x-amz-content-sha256"]
        request["Authorization"] = signature.headers["authorization"]
        response = https.request(request)
        @parsed = JSON.parse(response.read_body)
      rescue StandardError => e
        Rails.logger.error e.message
      end

      [@parsed["NextToken"], @parsed["SuppressedDestinationSummaries"]] if @parsed
    end

    def suppression_destination_list
      suppressed_destinations = []
      loop do
        next_token, suppression_list_set = _suppressed_email_list(next_token)
        suppressed_destinations.concat(suppression_list_set) if suppression_list_set
        break unless next_token && next_token.size.positive?
      end
      suppressed_destinations.empty? ? nil : suppressed_destinations
    end

    
    def find_suppressed_destination(_email_address)
      @suppressed_destinations = suppression_destination_list
      @found = {}
      unless @suppressed_destinations.nil?
        @suppressed_destinations.each do |item|
          @found = item if item["EmailAddress"] == email_address
        end
      end
      @found || nil
    end
  end
end
