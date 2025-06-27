require "spec_helper"

describe Networking::FloatingIpsController, type: :controller do
  routes { Networking::Engine.routes }

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

  before :each do
    stub_authentication
  end

  describe "GET 'index'" do

    it "returns http success" do
      allow_any_instance_of(ServiceLayer::NetworkingService).to receive(:project_floating_ips).and_return([])
      # mock list_floating_ips_ptr_records that is called in index function from dns_service
      allow_any_instance_of(ServiceLayer::DnsServiceService).to receive(
        :list_floating_ips_ptr_records,
      ).and_return([])
      
      get :index, params: default_params
      expect(response).to be_successful
    end

    describe "floating IPs" do
      before :each do
        allow_any_instance_of(ServiceLayer::DnsServiceService).to receive(
          :list_floating_ips_ptr_records,
        ).and_return([])
      end
      it "renders floating IPs table" do
        allow_any_instance_of(ServiceLayer::NetworkingService).to receive(:project_floating_ips).and_return([])
        get :index, params: default_params
        expect(response).to render_template("index")
        expect(assigns(:floating_ips)).to be_empty
      end
    end
  end
end
