require "spec_helper"

describe Compute::InstancesController, type: :controller do
  routes { Compute::Engine.routes }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before(:all) do
    #DatabaseCleaner.clean
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

  before :each do
    stub_authentication
    allow_any_instance_of(ServiceLayer::ComputeService).to receive(
      :servers,
    ).and_return([])

    allow_any_instance_of(ServiceLayer::ComputeService).to receive(
      :usage,
    ).and_return(double("usage", instances: 1, ram: 2, cores: 4))
  end

  describe "GET 'index'" do
    it "returns http success" do
      get :index, params: default_params
      expect(response).to be_successful
    end
  end

  describe "POST 'pre_hard_reset'" do
    let(:instance) do
      double(
        "server",
        id: "instance-id",
        name: "my-instance",
        task_state: nil,
      )
    end

    before :each do
      allow_any_instance_of(ServiceLayer::ComputeService).to receive(
        :find_server,
      ).and_return(instance)
      allow(instance).to receive(:task_state=)
    end

    it "triggers the hard reset when the typed name matches" do
      expect(instance).to receive(:reboot).with("HARD").and_return(true)

      post :pre_hard_reset,
           params:
             default_params.merge(
               id: "instance-id",
               forms_confirm_hard_reset: {
                 name: "my-instance",
                 instance_name: "my-instance",
               },
             ),
           format: :js
    end

    it "does not trigger the hard reset when the typed name does not match" do
      expect(instance).not_to receive(:reboot)

      post :pre_hard_reset,
           params:
             default_params.merge(
               id: "instance-id",
               forms_confirm_hard_reset: {
                 name: "wrong-name",
                 instance_name: "my-instance",
               },
             ),
           format: :js

      expect(response).to render_template("confirm_hard_reset")
    end
  end

  it "no longer exposes a standalone hard_reset route" do
    expect { post "hard_reset", params: default_params.merge(id: "x") }.to raise_error(
      ActionController::UrlGenerationError,
    )
  end
end
