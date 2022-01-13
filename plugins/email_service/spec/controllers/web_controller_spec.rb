# frozen_string_literal: true

require 'spec_helper'

describe EmailService::WebController, type: :controller do
  routes { EmailService::Engine.routes }
 
  default_params = { domain_id: AuthenticationStub.domain_id,
                     project_id: AuthenticationStub.project_id }
  puts AuthenticationStub.domain_id
  before(:all) do
    FriendlyIdEntry.find_or_create_entry('Domain', nil,
                                         default_params[:domain_id], 'default')
    FriendlyIdEntry.find_or_create_entry('Project',
                                         default_params[:domain_id],
                                         default_params[:project_id],
                                         default_params[:project_id])
  end

  before :each do
    allow(UserProfile).to receive(:tou_accepted?).and_return(true)
  end

  describe 'GET index' do

    context 'email_user with cloud_support_tools_viewer_role' do
      before :each do
        stub_authentication do |token|
          token['roles'] = []
          token['roles'] << { 'id' => 'cloud_support_tools_viewer_role', 'name' => 'cloud_support_tools_viewer' }         
          token
        end
      end
      it 'returns http 401' do
        get :index, params: default_params
        expect(response).to have_http_status(401)
      end
    end

  end

end