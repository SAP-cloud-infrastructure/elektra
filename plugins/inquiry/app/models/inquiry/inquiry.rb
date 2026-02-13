require "csv"
module Inquiry
  class Inquiry < ApplicationRecord
    include Filterable
    paginates_per 20
    default_scope { order(updated_at: :desc) } # default sort order

    attr_accessor :process_step_description,
                  :current_user,
                  :additional_recipients

    has_many :process_steps, -> { order(:created_at) }, dependent: :destroy

    belongs_to :requester, class_name: "Inquiry::Processor"
    has_and_belongs_to_many :processors

    validate :validate_additional_recipients

    validates :processors,
              presence: {
                message: "missing. Please contact an administrator!",
              }
    validates :description, presence: true

    validates :process_step_description,
              presence: {
                message: "Please provide a description for the process action",
              }

    scope :id, ->(id) { where id: id }
    scope :state, ->(state) { where aasm_state: state }
    #scope :requester_id, -> (requester_id) { where requester_id: requester_id }
    scope :requester_id,
          ->(requester_id) {
            Inquiry.includes(:requester).where(
              inquiry_processors: {
                uid: requester_id,
              },
            )
          }
    scope :processor_id,
          ->(processor_id) {
            Inquiry.includes(:processors).where(
              inquiry_processors: {
                uid: processor_id,
              },
            )
          }
    scope :kind, ->(kind) { where kind: kind }
    scope :domain_id, ->(domain_id) { where domain_id: domain_id }
    scope :approver_domain_id,
          ->(approver_domain_id) {
            where approver_domain_id: approver_domain_id
          }
    scope :project_id, ->(project_id) { where project_id: project_id }

    after_create :transition_to_open

    # scopes manually written because of distinct issue with json column
    def self.processor_idx(processor_id)
      Inquiry.find_by_sql(
        "SELECT DISTINCT ON (inquiry_inquiries.id) inquiry_inquiries.* FROM inquiry_inquiries INNER JOIN inquiry_inquiries_processors ON inquiry_inquiries_processors.inquiry_id = inquiry_inquiries.id INNER JOIN inquiry_processors ON inquiry_processors.id = inquiry_inquiries_processors.processor_id WHERE inquiry_processors.uid = '#{processor_id}'",
      )
    end

    def self.requester_idx(requester_id)
      Inquiry.find_by_sql(
        "SELECT DISTINCT ON (inquiry_inquiries.id) inquiry_inquiries.* FROM inquiry_inquiries INNER JOIN inquiry_processors ON inquiry_processors.id = inquiry_inquiries.requester_id WHERE inquiry_processors.uid ='#{requester_id}'",
      )
    end

    def self.processor_open_requests(domain_id, processor_id)
      where(aasm_state: "open", approver_domain_id: domain_id)
        .to_a
        .keep_if { |r| r.processors.collect(&:uid).include?(processor_id) }
    end

    def self.processor_open_requests_count(domain_id)
      where(aasm_state: "open", approver_domain_id: domain_id).count
    end

    def self.processor_review_requests_count(domain_id)
      where(aasm_state: "reviewing", approver_domain_id: domain_id).count
    end

    def self.processor_requests_count(domain_id)
      self.processor_review_requests_count(domain_id) +
        self.processor_open_requests_count(domain_id)
    end

    def self.requestor_open_requests(domain_id, user_id)
      where(aasm_state: "open", domain_id: domain_id).to_a.keep_if do |r|
        r.requester.uid == user_id
      end
    end

    def self.requestor_review_requests(domain_id, user_id)
      where(aasm_state: "reviewing", domain_id: domain_id).to_a.keep_if do |r|
        r.requester.uid == user_id
      end
    end

    def self.requestor_requests_count(domain_id, user_id)
      self.requestor_open_requests(domain_id, user_id).length +
        self.requestor_review_requests(domain_id, user_id).length
    end

    def self.to_csv
      attributes = %w[Kind Description Requestor Approver Updated Status]
      # https://www.ablebits.com/office-addins-blog/2014/05/01/convert-csv-excel/#csv-not-parsed
      # In North America and some other countries, the default List Separator is a comma.
      # While in European countries the comma (,) is reserved as the Decimal Symbol and the List Separator is set to semicolon (;)
      CSV.generate(headers: true, col_sep: ";") do |csv|
        csv << attributes
        all.each do |inquiry|
          approver = "-"
          # get all steps and search for appover
          steps = inquiry.process_steps
          steps.each do |step|
            if step.event == "approve!"
              approver = "#{step.processor.full_name} (#{step.processor.name})"
            end
          end

          csv << [
            inquiry.kind,
            inquiry.description,
            "#{inquiry.requester.full_name} (#{inquiry.requester.name})",
            approver,
            inquiry.updated_at.getlocal.strftime("%F %T"),
            inquiry.aasm.human_state,
          ]
        end
      end
    end

    include AASM
    aasm do
      #error_on_all_events :error_on_all_events

      state :new, initial: true, before_enter: :set_process_step_description
      state :open
      state :approved
      state :rejected
      state :closed
      state :reviewing

      event :review,
            after: %i[notify_requester notify_processors],
            error: :error_on_event,
            guards: Proc.new { |*args| can_review?(*args) } do
        transitions from: %i[reviewing open],
                    to: :reviewing,
                    after: Proc.new { |*args| log_process_step(*args) }
      end

      event :open,
            after: %i[notify_requester notify_processors],
            error: :error_on_event do
        transitions from: :new,
                    to: :open,
                    after: Proc.new { |*args| log_process_step(*args) }
      end

      event :approve,
            after: %i[notify_requester notify_new_project],
            error: :error_on_event,
            guards: Proc.new { |*args| can_approve?(*args) } do
        before do
          #run_automatically('approved')
        end
        transitions from: %i[reviewing open],
                    to: :approved,
                    after: Proc.new { |*args| log_process_step(*args) },
                    guards: Proc.new { |*args| can_approve?(*args) }
      end

      event :reject,
            after: :notify_requester,
            error: :error_on_event,
            guards: Proc.new { |*args| can_reject?(*args) } do
        before do
          #run_automatically('rejected')
        end
        transitions from: %i[reviewing open],
                    to: :rejected,
                    after: Proc.new { |*args| log_process_step(*args) }
      end

      event :reopen,
            after: :notify_processors,
            error: :error_on_event,
            guards: Proc.new { |*args| can_reopen?(*args) } do
        transitions from: :rejected,
                    to: :open,
                    after: Proc.new { |*args| log_process_step(*args) },
                    guards: [:can_reopen?]
      end

      event :close,
            error: :error_on_event,
            guards: Proc.new { |*args| can_close?(*args) } do
        transitions from: %i[approved rejected open reviewing],
                    to: :closed,
                    after: Proc.new { |*args| log_process_step(*args) },
                    guards: [:can_close?]
      end
    end

    def error_on_event(args)
      raise args
    end

    def transition_to_open
      self.open!({ description: self.process_step_description })
    end

    def set_process_step_description(options = {})
      self.process_step_description = "Initial creation!"
    end

    def run_automatically(state)
      if self.callbacks[state] && self.callbacks[state]["autorun"] &&
           self.callbacks[state]["action"]
        begin
          ret = eval(self.callbacks[state]["action"])
          puts ret
        rescue => e
          puts "ERROR"
        end
      end
    end

    def log_process_step(options = {})
      step = ProcessStep.new
      step.from_state = self.aasm_state
      step.to_state = aasm.to_state
      step.event = aasm.current_event
      if options[:user]
        step.processor = Processor.find_by_uid(options[:user].id)
      else
        step.processor = self.requester
      end
      # additional_emails = self.additional_recipients.split(",")

      step.description = options[:description]
      if self.additional_recipients.present?
        step.description +=
          "; additional recipients: #{self.additional_recipients}"
      end
      self.process_steps << step

      notify_additional_recipients if self.additional_recipients.present?
    end

    def is_resource_admin?(user)
      user = self.current_user unless user
      return(
        !user.nil? && user.has_role?("resource_admin") ||
          user.has_role?("loud_resource_admin")
      )
    end

    def can_approve?(options = {})
      return(
        (self.open? || self.reviewing?) &&
          (
            user_is_processor?(get_user_id(options[:user])) ||
              is_resource_admin?(options[:user])
          )
      )
    end

    def can_review?(options = {})
      user_is_processor?(get_user_id(options[:user])) ||
        is_resource_admin?(options[:user])
    end

    def can_reopen?(options = {})
      return self.rejected? && user_is_requester?(get_user_id(options[:user]))
    end

    def can_reject?(options = {})
      return(
        (self.open? || self.reviewing?) &&
          (
            user_is_processor?(get_user_id(options[:user])) ||
              is_resource_admin?(options[:user])
          )
      )
    end

    def can_close?(options = {})
      return(
        user_is_processor?(get_user_id(options[:user])) ||
          user_is_requester?(get_user_id(options[:user]))
      )
    end

    def user_is_processor?(user_id)
      return true unless user_id
      if self.processors.find_by_uid(user_id)
        return true
      else
        return false
      end
    end

    def user_is_requester?(user_id)
      return true unless user_id
      if self.requester.uid == user_id
        return true
      else
        return false
      end
    end

    def events_allowed(user)
      self.current_user = user
      events = {}
      self
        .aasm
        .events(permitted: true)
        .each do |e|
          e.transitions.each do |t|
            events[t.to.to_sym] ||= []
            events[t.to.to_sym] << {
              event: e.name,
              name: Inquiry.aasm.human_event_name(e.name),
            }
          end
        end

      return events
    end

    def states_allowed(user)
      self.current_user = user
      events = events_allowed user
      states = []
      self
        .aasm
        .states(permitted: true)
        .each do |s|
          states << {
            state: s.name,
            name: s.display_name,
            events: events[s.name],
          }
        end

      return states
    end

    def proceed_state_change(new_state, user)
      return false unless self.valid?
      description = self.process_step_description

      case new_state.to_sym
      when :rejected
        return self.reject!({ user: user, description: description })
      when :approved
        return self.approve!({ user: user, description: description })
      when :open
        return self.reopen!({ user: user, description: description })
      when :closed
        return self.close!({ user: user, description: description })
      when :reviewing
        return self.review!({ user: user, description: description })
      else
        self.errors.add(:aasm_state, "Unknown state #{new_state}")
        return false
      end
    rescue => e
      self.errors.add(:aasm_state, e.message)
      # raise e
      return false
    end

    def get_user_id(user)
      if user
        return user.id
      elsif current_user
        return current_user.id
      else
        return nil
      end
    end

    def get_callback_action
      if self.callbacks.nil? || self.callbacks[self.aasm_state].nil?
        return nil
      else
        self.callbacks[self.aasm_state].name
      end
    end

    def notify_requester
      # puts "######### NOTIFY REQUESTER #########"
      begin
        InquiryMailer.notification_email_requester(
          self.requester.email,
          self.requester.full_name,
          self,
          self.process_steps.last,
        )
      rescue EmailDeliveryError => e
        Rails.logger.error "InquiryMailer: Could not send email to requester #{@user_email}. Exception: #{e.message}"
      end
    end

    def notify_new_project
      if self.kind == "project"
        # puts "######### NOTIFY NEW PROJECT #########"
        inform_new_project_dl =
          ENV["MONSOON_NEW_PROJECT_DL"] || "dl_not_set@sap.com"
        begin
          InquiryMailer.notification_new_project(
            inform_new_project_dl,
            self,
            self.requester.full_name,
          )
        rescue EmailDeliveryError => e
          Rails.logger.error "InquiryMailer: Could not send email to #{inform_new_project_dl} Exception: #{e.message}"
        end
      end
    end

    def notify_additional_recipients
      # puts "######### NOTIFY ADDITIONAL RECEIVERS #########"
      begin
        emails = self.additional_recipients.split(",")
        InquiryMailer.notification_email_additional_recipients(
          emails,
          self,
          self.process_steps.last,
          self.requester,
        )
      rescue EmailDeliveryError => e
        Rails.logger.error "InquiryMailer: Could not send email to additional recipients #{self.additional_recipients}. Exception: #{e.message}"
      end
    end

    def notify_processors
      # puts "######### NOTIFY PROCESSORS #########"
      begin
        InquiryMailer.notification_email_processors(
          (self.processors.map { |p| p.email }).compact,
          self,
          self.process_steps.last,
          self.requester,
        )
      rescue EmailDeliveryError => e
        Rails.logger.error "InquiryMailer: Could not send email to processors #{(self.processors.map { |p| p.email }).compact}. Exception: #{e.message}"
      end
    end

    def errors?
      return !self.errors.blank?
    end

    # Fix of Rails 5 bug with deserialization of attributes of type json.
    # Attributes aren't deserialized as hash as done in Rails 4.2
    def payload
      begin
        data = read_attribute(:payload)
        return data if data.is_a?(Hash)
        return JSON.parse(data)
      rescue => e
      ensure
        data
      end
    end

    private

    def validate_additional_recipients
      return if self.additional_recipients.nil?
      emails = self.additional_recipients.split(/,|, /)
      all_ok = true
      emails.each do |email|
        all_ok = false unless (
          email.strip =~ /\A([^@\s,+]+@[-a-z0-9]+\.[a-z]{2,})+\z/
        )
      end
      unless all_ok
        errors.add(
          :additional_recipients,
          "Please enter a comma separated email address list",
        )
      end
    end
  end
end
