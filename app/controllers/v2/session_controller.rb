

module V2
  class SessionController < ScopeController 

    SESSION_NAME = :elektra_session
    before_action :ensure_authenticated, except: [:login, :create]

    def login
    end

    def create 
      result = V2::AuthHandler.authenticate_with_credentials(
        params[:user],
        params[:password],
        {
          domain_id: @domain_scope&.id,
          domain_name: @domain_scope&.name,
          project_id: @project_scope&.id,
          project_name: @project_scope&.name 
        }
      )
    
      if result[:error] 
        pp "================ERROR==============="
        pp result[:error] 
        @error = result[:error]
        render :new
      else 
        store_session(result)
        redirect_to session[:after_login_url] || "/#{@domain_scope.fid}"  
      end
    end

    private 

    def ensure_authenticated
      auth_session = session[SESSION_NAME]
      
      if auth_session.nil?
        pp "======================NO SESSION=================="
        # Store the after_login_url but don't clear the entire session
        session[:after_login_url] = request.url unless request.url.include?('login')
        redirect_to :login
      else
        # Check if existing session is still valid
        if session_expired?(auth_session)
          pp "======================SESSION EXPIRED=================="
          # Clear only the auth session, not the entire session
          session[SESSION_NAME] = nil
          session[:after_login_url] = request.url unless request.url.include?('login')
          redirect_to :login
        else
          pp "======================USING EXISTING SESSION=================="
          # Clear the after_login_url since user is authenticated
          session.delete(:after_login_url)
        end
      end
    end
    
    def session_expired?(auth_session)
      return true unless auth_session[:expires_at]
      
      Time.parse(auth_session[:expires_at]) <= Time.current
    rescue ArgumentError
      true # If we can't parse the expiry, consider it expired
    end

    def store_session(auth_result)
      return unless auth_result[:success]
      # byebug
      # Store the authentication data in session
      session[SESSION_NAME] = {
        token: auth_result[:token],
        token_data: auth_result[:token_data], # or however your result is structured
        authenticated_at: Time.current,
        expires_at: auth_result[:token_data]["expires_at"],
        scope: {
          domain_id: @domain_scope&.id,
          domain_name: @domain_scope&.name,
          project_id: @project_scope&.id,
          project_name: @project_scope&.name
        }
      }
      pp "======================SESSION CREATED=================="

    end
  end
end