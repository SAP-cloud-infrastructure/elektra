# frozen_string_literal: true

require "spec_helper"

describe KubernetesNg::ApplicationController, type: :controller do
  routes { KubernetesNg::Engine.routes }

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

  describe "GET show" do
    context "without landscape_name" do
      it "redirects to prod landscape" do
        get :show, params: default_params
        expect(response).to redirect_to(
          action: :show,
          landscape_name: 'prod',
          domain_id: default_params[:domain_id],
          project_id: default_params[:project_id]
        )
      end
    end

    context "with valid landscape_name" do
      it "returns http success for prod" do
        get :show, params: default_params.merge(landscape_name: 'prod')
        expect(response).to be_successful
      end

      it "returns http success for canary" do
        get :show, params: default_params.merge(landscape_name: 'canary')
        expect(response).to be_successful
      end

      it "returns http success for qa" do
        get :show, params: default_params.merge(landscape_name: 'qa')
        expect(response).to be_successful
      end

      it "sets @landscape_name instance variable" do
        get :show, params: default_params.merge(landscape_name: 'prod')
        expect(assigns(:landscape_name)).to eq('prod')
      end
    end

    context "with invalid landscape_name" do
      it "redirects to prod landscape" do
        get :show, params: default_params.merge(landscape_name: 'invalid')
        expect(response).to redirect_to(
          action: :show,
          landscape_name: 'prod',
          domain_id: default_params[:domain_id],
          project_id: default_params[:project_id]
        )
      end
    end
  end

  describe "#kubernetes_service" do
    controller do
      def test_kubernetes_service
        kubernetes_service
        render json: { success: true }
      end
    end

    before do
      routes.draw do
        get 'test_kubernetes_service' => 'kubernetes_ng/application#test_kubernetes_service'
        get ':landscape_name/test_kubernetes_service' => 'kubernetes_ng/application#test_kubernetes_service'
      end
    end

    context "when landscape_name is missing" do
      it "raises LandscapeError" do
        expect {
          controller.send(:kubernetes_service)
        }.to raise_error(KubernetesNg::LandscapeError, "Landscape name is required.")
      end
    end

    context "when landscape_name is present" do
      it "returns a scoped kubernetes service" do
        allow(controller).to receive(:params).and_return(
          ActionController::Parameters.new(landscape_name: 'prod')
        )
        allow(controller).to receive(:services).and_return(
          double(kubernetes_ng: double(scoped: double))
        )
        allow(controller).to receive(:current_region).and_return('qa-de-1')

        expect { controller.send(:kubernetes_service) }.not_to raise_error
      end
    end
  end
end
