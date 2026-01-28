module Maillog
  class MaillogController < ::Maillog::ApplicationController
    authorization_context 'maillog'
    authorization_required

    def index
    end
  end
end
