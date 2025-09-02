# frozen_string_literal: true

require "spec_helper"
require_relative "./factories/factories"
require_relative "shared"

describe Lbaas2::Loadbalancers::Pools::MembersController, type: :controller do
  routes { Lbaas2::Engine.routes }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
    loadbalancer_id: "lb_123456789",
    pool_id: "pool_123456789",
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

  describe "GET 'index'" do
    before :each do
      members =
        double(
          "elektron",
          service: double("octavia", get: double("get", map_to: [])),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(members)
    end

    it_behaves_like "index action" do
      subject { @default_params = default_params }
    end
  end

  describe "GET 'show'" do
    before :each do
      member =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get: double("get", map_to: double("member", to_json: {})),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(member)
    end

    it_behaves_like "show action" do
      subject { @default_params = default_params }
    end
  end

  describe "PUT 'update'" do
    before :each do
      member =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get:
                double(
                  "get",
                  map_to:
                    double(
                      "member",
                      to_json: {
                      },
                      identifier: "",
                      attributes: {
                      },
                      update_attributes: {
                      },
                      update: {
                      },
                    ),
                ),
              put: double("put", body: {}),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(member)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::Pools::MembersController,
      ).to receive(:parseMemberParams).and_return(
        ::Lbaas2::FakeFactory.new.member_params,
      )
    end

    context "network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "network_admin" }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json #added content type to keep int attr (like weight) as integer
        expect(response).to be_successful
      end
    end
    context "loadbalancer_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_admin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response).to be_successful
      end
    end
    context "cloud_network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "cloud_network_admin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response).to be_successful
      end
    end
    context "member" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "member" }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response).to be_successful
      end
    end
    context "loadbalancer_poolmemberadmin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_poolmemberadmin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response).to be_successful
      end
    end
    context "network_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "network_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "loadbalancer_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "empty network roles" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.update_member
        put :update,
            params: default_params.merge({ id: member[:id], member: member }),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
  end

  describe "PUT 'batch_update'" do
    before :each do
      elektronObj =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get:
                double(
                  "get",
                  map_to: double("lb", vip_subnet_id: "some_id", to_json: {}),
                ),
              put: double("put", body: ""),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(elektronObj)
    end

    context "network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "network_admin" }
          token
        end
      end
      it "return http success" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response).to be_successful
      end
    end
    context "loadbalancer_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_admin",
          }
          token
        end
      end
      it "return http success" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response).to be_successful
      end
    end
    context "cloud_network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "cloud_network_admin",
          }
          token
        end
      end
      it "return http success" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response).to be_successful
      end
    end
    context "member" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "member" }
          token
        end
      end
      it "return http success" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response).to be_successful
      end
    end
    context "loadbalancer_poolmemberadmin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_poolmemberadmin",
          }
          token
        end
      end
      it "return http success" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response).to be_successful
      end
    end
    context "network_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "network_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "loadbalancer_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "empty network roles" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token
        end
      end
      it "return 403 error" do
        put :batch_update,
            params:
              default_params.merge(
                {
                  members: [
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.240",
                      "protocol_port" => 8888,
                    ),
                    ::Lbaas2::FakeFactory.new.member(
                      "address" => "10.180.0.241",
                      "protocol_port" => 8889,
                    ),
                  ],
                },
              ),
            as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
  end

  describe "POST 'create'" do
    before :each do
      member =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get:
                double(
                  "get",
                  map_to: double("lb", vip_subnet_id: "some_id", to_json: {}),
                ),
              post: double("post", body: {}),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(member)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::Pools::MembersController,
      ).to receive(:member_params).and_return(::Lbaas2::FakeFactory.new.member)
    end

    context "network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "network_admin" }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response).to be_successful
      end
    end
    context "loadbalancer_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_admin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response).to be_successful
      end
    end
    context "cloud_network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "cloud_network_admin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response).to be_successful
      end
    end
    context "member" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "member" }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response).to be_successful
      end
    end
    context "loadbalancer_poolmemberadmin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_poolmemberadmin",
          }
          token
        end
      end
      it "return http success" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response).to be_successful
      end
    end
    context "network_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "network_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "loadbalancer_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "empty network roles" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token
        end
      end
      it "return 403 error" do
        member = ::Lbaas2::FakeFactory.new.member
        post :create,
             params: default_params.merge({ member: member }),
             as: :json
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
  end

  describe "DELETE 'destroy'" do
    before :each do
      member =
        double("elektron", service: double("octavia", delete: double("delete")))
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(member)
    end

    context "network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "network_admin" }
          token
        end
      end
      it "return http success" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response).to be_successful
      end
    end
    context "loadbalancer_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_admin",
          }
          token
        end
      end
      it "return http success" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response).to be_successful
      end
    end
    context "cloud_network_admin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "cloud_network_admin",
          }
          token
        end
      end
      it "return http success" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response).to be_successful
      end
    end
    context "member" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << { "id" => "lbaas2_role", "name" => "member" }
          token
        end
      end
      it "return http success" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response).to be_successful
      end
    end
    context "loadbalancer_poolmemberadmin" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_poolmemberadmin",
          }
          token
        end
      end
      it "return http success" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response).to be_successful
      end
    end
    context "network_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "network_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "loadbalancer_viewer" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token["roles"] << {
            "id" => "lbaas2_role",
            "name" => "loadbalancer_viewer",
          }
          token
        end
      end
      it "return 403 error" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
    context "no network roles" do
      before :each do
        stub_authentication do |token|
          token["roles"] = []
          token
        end
      end

      it "return 403 error" do
        delete :destroy, params: default_params.merge(id: "member_id")
        expect(response.code).to be == ("403")
        expect(response).to_not be_successful
      end
    end
  end

  describe "GET 'serversForSelect'" do
    before :each do
      lbs =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get:
                double(
                  "get",
                  map_to: double("lb", vip_network_id: "123", to_json: {}),
                ),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(lbs)

      allow_any_instance_of(ServiceLayer::NetworkingService).to receive(
        :ports,
      ).and_return([])
      allow_any_instance_of(ServiceLayer::ComputeService).to receive(
        :servers,
      ).and_return([])
    end

    it_behaves_like "GET action with editor context including loadbalancer_poolmemberadmin" do
      subject do
        loadbalancer = ::Lbaas2::FakeFactory.new.update_loadbalancer
        @default_params = default_params
        @extra_params = { id: loadbalancer[:id] }
        @path = "serversForSelect"
      end
    end
  end
end
