# frozen_string_literal: true

require 'spec_helper'
require_relative '../factories/factories'

describe Automation::AutomationsController, type: :controller do
  routes { Automation::Engine.routes }

  default_params = { domain_id: AuthenticationStub.domain_id,
                     project_id: AuthenticationStub.project_id }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      'Domain', nil, default_params[:domain_id], 'default'
    )
    FriendlyIdEntry.find_or_create_entry(
      'Project', default_params[:domain_id], default_params[:project_id],
      default_params[:project_id]
    )
  end

  before :each do
    stub_authentication

    client = double('arc_client').as_null_object
    @automation_service = double('automation_service').as_null_object
    automation_run_service = double('automation_run_service').as_null_object

    allow(UserProfile).to receive(:tou_accepted?).and_return(true)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(:client).and_return(client)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation_service).and_return(@automation_service)
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation_run_service).and_return(automation_run_service)
  end

  describe "GET 'index'" do

    it "returns http success" do
      get :index, default_params
      expect(response).to be_success
      expect(response).to render_template(:index)
    end

    describe "@pag_params" do

      it "should set up pagination object" do
        get :index, default_params
        expect(assigns(:pag_params)).to eq({:automation=>{:page=>0}, :run=>{:page=>0}})
      end

      it "should set the righ params when loading the page" do
        get :index, default_params.merge(:pag_params => {:automation=>{:page=>"2"}, :run=>{:page=>"3"}})
        expect(assigns(:pag_params)).to eq({:automation=>{:page=>"2"}, :run=>{:page=>"3"}})
      end

      it "should updated just the run param when ajax" do
        xhr :get, :index, default_params.merge({:page => "5", :model => "run"})
        expect(assigns(:pag_params)).to eq({:automation=>{:page=>0}, :run=>{:page=>"5"}})
      end

      it "should updated just the automation param when ajax" do
        xhr :get, :index, default_params.merge({:page => "5", :model => "automation"})
        expect(assigns(:pag_params)).to eq({:automation=>{:page=>"5"}, :run=>{:page=>0}})
      end

    end

  end

  describe "GET 'new'" do

    it "returns http success" do
      get :new, default_params
      expect(response).to be_success
      expect(response).to render_template(:new)
    end

  end

  describe "GET 'create'" do

    it "redirect when automation valid" do
      automation = ::Automation::FakeFactory.new.automation_form_chef
      expect(post :create, default_params.merge({forms_chef_automation: automation.attributes})).to redirect_to(automations_path(default_params))
    end

    it "return success and render new when automation invalid" do
      post :create, default_params
      expect(response).to be_success
      expect(response).to render_template(:new)
      expect(flash.now[:error]).to_not be_nil
    end

  end

  describe "GET 'show'" do

    it "returns http success" do
      allow(@automation_service).to receive(:attributes_to_form).and_return({})

      get :show, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template(:show)
    end

  end

  describe "GET 'edit'" do

    it "returns http success" do
      allow(@automation_service).to receive(:attributes_to_form).and_return({})

      get :edit, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template(:edit)
    end

  end

  describe "GET 'update'" do

    it "should return to the edit view with an error if type have been changed" do
      automation = ::Automation::FakeFactory.new.automation_form_chef
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation).and_return(automation)

      get :update, default_params.merge({id: 'automation_id', forms_chef_automation: automation.attributes.merge(type: 'other_type')})
      expect(response).to be_success
      expect(response).to render_template(:edit)
      expect(flash.now[:error]).to_not be_nil
    end

    it "returns http success and shows edit view when automation is invalid" do
      allow(@automation_service).to receive(:attributes_to_form).and_return({})

      get :update, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template(:edit)
    end

    it "should redirect to the automations index view when update is successful" do
      automation = ::Automation::FakeFactory.new.automation_form_chef
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation).and_return(automation)

      expect(get :update, default_params.merge({id: 'automation_id', forms_chef_automation: automation.attributes})).to redirect_to(automations_path(default_params))
    end

    it "something wrong happens show a flash error" do
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation).and_raise("boom")
      get :update, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template(:edit)
      expect(flash.now[:error]).to_not be_nil
    end

  end

  describe "GET 'destroy'" do

    it "returns http success and renders view" do
      delete :destroy, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template("automation/automations/update_item.js")
    end

    it "something wrong happens show a flash error" do
      allow_any_instance_of(ServiceLayer::AutomationService).to receive(:automation).and_raise("boom")
      delete :destroy, default_params.merge({id: 'automation_id'})
      expect(response).to be_success
      expect(response).to render_template("automation/automations/update_item.js")
      expect(flash.now[:error]).to_not be_nil
    end

  end

end
