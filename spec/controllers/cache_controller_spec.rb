# frozen_string_literal: true

require "spec_helper"

describe CacheController, type: :controller do
  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      "Domain",
      nil,
      default_params[:domain_id],
      "default",
    )
    FriendlyIdEntry.find_or_create_entry(
      "Project",
      default_params[:domain_id],
      default_params[:project_id],
      default_params[:project_id],
    )
  end

  before(:each) do
    stub_authentication

    @identity = double("identity").as_null_object
    allow(controller.service_user).to receive(:identity).and_return(@identity)

    # Ensure ObjectCache returns empty results so the code falls through to the API
    allow(ObjectCache).to receive(:find_objects).and_return([])
  end

  describe "GET 'users'" do
    let(:api_user) do
      { "id" => "u1", "name" => "testuser", "description" => "Test User", "email" => "test@example.com" }
    end

    before(:each) do
      allow(@identity).to receive(:find_user).and_return(nil)
      allow(@identity).to receive(:users).and_return([api_user])
    end

    context "when params[:domain] is provided" do
      it "passes the provided domain to the identity API" do
        custom_domain = "custom-domain-id"

        get :users, params: default_params.merge(term: "test", domain: custom_domain, nocache: "true")

        expect(@identity).to have_received(:users).with(
          hash_including(domain_id: custom_domain),
          anything
        ).at_least(:once)
      end
    end

    context "when params[:domain] is NOT provided" do
      it "falls back to @scoped_domain_id" do
        get :users, params: default_params.merge(term: "test", nocache: "true")

        expect(@identity).to have_received(:users).with(
          hash_including(domain_id: default_params[:domain_id]),
          anything
        ).at_least(:once)
      end
    end
  end

  describe "GET 'groups'" do
    let(:api_group) do
      { "id" => "g1", "name" => "testgroup" }
    end

    before(:each) do
      allow(@identity).to receive(:groups).and_return([api_group])
      allow(@identity).to receive(:find_group).and_return(nil)
    end

    context "when params[:domain] is provided" do
      it "passes the provided domain to the identity API" do
        custom_domain = "custom-domain-id"

        get :groups, params: default_params.merge(term: "test", domain: custom_domain)

        expect(@identity).to have_received(:groups).with(
          hash_including(domain_id: custom_domain),
          anything
        ).at_least(:once)
      end
    end

    context "when params[:domain] is NOT provided" do
      it "falls back to @scoped_domain_id" do
        get :groups, params: default_params.merge(term: "test")

        expect(@identity).to have_received(:groups).with(
          hash_including(domain_id: default_params[:domain_id]),
          anything
        ).at_least(:once)
      end
    end
  end
end
