# frozen_string_literal: true

require "spec_helper"
require_relative "./factories/factories.rb"
require_relative "shared"

describe Lbaas2::Loadbalancers::ListenersController, type: :controller do
  routes { Lbaas2::Engine.routes }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
    loadbalancer_id: "lb_123456789",
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
      listeners =
        double(
          "elektron",
          service: double("octavia", get: double("get", map_to: [])),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listeners)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::ListenersController,
      ).to receive(:extend_listener_data).and_return(
        double("cached_listeners").as_null_object,
      )
    end

    it_behaves_like "index action" do
      subject { @default_params = default_params }
    end
  end

  describe "GET 'show'" do
    before :each do
      listener =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get: double("get", map_to: double("listener", to_json: {})),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listener)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::ListenersController,
      ).to receive(:extend_listener_data).and_return(
        double("cahced_listeners").as_null_object,
      )
    end

    it_behaves_like "show action" do
      subject { @default_params = default_params }
    end
  end

  describe "POST 'create'" do
    before :each do
      listeners =
        double(
          "elektron",
          service: double("octavia", post: double("post", body: {})),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listeners)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::ListenersController,
      ).to receive(:extend_listener_data).and_return(
        double("cached_listeners").as_null_object,
      )
    end

    it_behaves_like "post action" do
      subject do
        @default_params = default_params
        @extra_params = { listener: ::Lbaas2::FakeFactory.new.listener }
      end
    end
  end

  describe "PUT 'update'" do
    before :each do
      listener =
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
                      "listener",
                      to_json: {
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
      ).and_return(listener)
      allow_any_instance_of(
        Lbaas2::Loadbalancers::ListenersController,
      ).to receive(:extend_listener_data).and_return(
        double("cached_listeners").as_null_object,
      )
    end

    it_behaves_like "PUT action" do
      subject do
        @default_params = default_params
        listener = ::Lbaas2::FakeFactory.new.update_listener
        @extra_params = { id: listener[:id], listener: listener }
      end
    end
  end

  describe "DELETE 'destroy'" do
    before :each do
      listener =
        double("elektron", service: double("octavia", delete: double("delete")))
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listener)
    end

    it_behaves_like "destroy action" do
      subject do
        @default_params = default_params
        @extra_params = { id: "listener_id" }
      end
    end
  end

  describe "GET 'itemsWithoutDefaultPoolForSelect'" do
    before :each do
      listeners =
        double(
          "elektron",
          service:
            double(
              "octavia",
              get: double("get", map_to: double("get", keep_if: [])),
            ),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listeners)
    end

    it_behaves_like "GET action with editor context" do
      subject do
        @default_params = default_params
        @extra_params = { loadbalancer_id: "lb_id" }
        @path = "itemsWithoutDefaultPoolForSelect"
      end
    end
  end

  describe "GET 'itemsForSelect'" do
    before :each do
      listeners =
        double(
          "elektron",
          service: double("octavia", get: double("get", map_to: [])),
        )
      allow_any_instance_of(ServiceLayer::Lbaas2Service).to receive(
        :elektron,
      ).and_return(listeners)
    end

    it_behaves_like "GET action with editor context" do
      subject do
        @default_params = default_params
        @extra_params = { loadbalancer_id: "lb_id" }
        @path = "itemsForSelect"
      end
    end
  end
end
