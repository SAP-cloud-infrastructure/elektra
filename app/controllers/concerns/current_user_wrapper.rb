# frozen_string_literal: true

module CurrentUserWrapper
  # Redefine current_user method which comes from monsoon_openstack_auth gem.
  # This method wraps current_user and adds some details
  # like email and full_name.
  def current_user
    return nil if super.nil?
    if @current_user_wrapper.try(:token) == super.token
      return @current_user_wrapper
    end

    @current_user_wrapper = CurrentUserWrapper.new(super, session, service_user)
  end

  # Wrapper for current user
  class CurrentUserWrapper
    attr_reader :current_user

    def initialize(current_user, session, service_user)
      @current_user = current_user
      @session = session

      # already saved user details in session
      old_user_details = (@session[:current_user_details] || {})
      # check if user id from session differs from current_user id
      return if current_user.try(:id) == old_user_details[:id]

      # load user details for current_user
      user = service_user.identity.find_user(current_user.id)
      # save user_details in session
      @session[:current_user_details] = user.try(:attributes) || {}

      UserProfile.find_by_name_or_create_or_update(user.name) { user } if user
    end

    def try(method_name)
      if respond_to?(method_name)
        super(method_name)
      else
        @current_user.try(method_name)
      end
    end

    def inspect
      @current_user.context.to_s
    end

    # delegate all methods to wrapped current user
    def method_missing(method_name, *args, &block)
      if @current_user.respond_to?(method_name)
        @current_user.send(method_name, *args, &block)
      else
        super
      end
    end

    def respond_to_missing?(method_name, include_private = false)
      %i[email full_name].include?(method_name) ||
        @current_user.respond_to?(method_name, include_private)
    end

    # Email is not provided by current_user. So add it here.
    def email
      (@session[:current_user_details] || {})[:email]
    end

    # Fullname is not provided by current_user. So add it here.
    def full_name
      (@session[:current_user_details] || {})[:description]
    end
  end
end
