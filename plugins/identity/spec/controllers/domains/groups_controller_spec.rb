# frozen_string_literal: true

require "spec_helper"

describe Identity::Domains::GroupsController, type: :controller do
  routes { Identity::Engine.routes }

  let(:identity_service) { double("identity_service") }
  let(:services_mock) { double("services", identity: identity_service) }
  let(:service_user_identity) { double("identity") }
  let(:service_user_mock) { double("service_user", identity: service_user_identity) }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
  }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      "Domain",
      nil,
      default_params[:domain_id],
      "default",
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:service_user).and_return(service_user_mock)
    allow(controller).to receive(:enforce_permissions)
    controller.instance_variable_set(:@scoped_domain_id, default_params[:domain_id])

    # Mock service_user for current_user lookup
    allow(service_user_identity).to receive(:find_user).and_return(nil)
  end

  describe "GET index" do
    context "when successful" do
      let(:groups) do
        [
          double("group", id: "1", name: "Group 1", domain_id: default_params[:domain_id]),
          double("group", id: "2", name: "Group 2", domain_id: default_params[:domain_id])
        ]
      end

      before do
        allow(identity_service).to receive(:groups).and_return(groups)
      end

      it "returns http success and lists groups" do
        get :index, params: default_params

        expect(response).to be_successful
        expect(assigns(:groups)).to eq(groups)
      end

      it "calls identity service with domain_id" do
        get :index, params: default_params

        expect(identity_service).to have_received(:groups).with(domain_id: default_params[:domain_id])
      end
    end
  end

  describe "GET show" do
    let(:group) { double("group", id: "1", name: "Test Group", domain_id: default_params[:domain_id]) }
    let(:members) { [double("user", id: "u1", name: "User 1")] }

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
      allow(identity_service).to receive(:group_members).with("1").and_return(members)
    end

    it "returns http success and shows group details" do
      get :show, params: default_params.merge(id: "1")

      expect(response).to be_successful
      expect(assigns(:group)).to eq(group)
      expect(assigns(:group_members)).to eq(members)
    end

    it "calls identity service methods" do
      get :show, params: default_params.merge(id: "1")

      expect(identity_service).to have_received(:find_group).with("1")
      expect(identity_service).to have_received(:group_members).with("1")
    end
  end

  describe "GET new" do
    let(:new_group) { double("group") }

    before do
      allow(identity_service).to receive(:new_group).and_return(new_group)
    end

    it "returns http success and initializes new group" do
      get :new, params: default_params

      expect(response).to be_successful
      expect(assigns(:group)).to eq(new_group)
    end
  end

  describe "POST create" do
    let(:group_params) { { name: "New Group", description: "Test description" } }

    context "with valid attributes" do
      let(:group) do
        double("group",
          save: true,
          name: "New Group",
          domain_id: default_params[:domain_id]
        )
      end

      before do
        allow(identity_service).to receive(:new_group).and_return(group)
      end

      it "creates group and redirects with success message" do
        post :create, params: default_params.merge(group: group_params)

        expect(response).to redirect_to(domains_groups_path(domain_id: default_params[:domain_id]))
        expect(flash[:notice]).to eq("Group 'New Group' successfully created.")
      end

      it "calls identity service to create group" do
        post :create, params: default_params.merge(group: group_params)

        expect(identity_service).to have_received(:new_group)
        expect(group).to have_received(:save)
      end
    end

    context "with invalid attributes" do
      let(:group) { double("group", save: false) }

      before do
        allow(identity_service).to receive(:new_group).and_return(group)
      end

      it "re-renders new template" do
        post :create, params: default_params.merge(group: { name: "" })

        expect(response).to render_template(:new)
        expect(flash[:notice]).to be_nil
      end
    end
  end

  describe "GET edit" do
    let(:group) { double("group", id: "1", name: "Test Group", domain_id: default_params[:domain_id]) }

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
    end

    it "returns http success and loads group for editing" do
      get :edit, params: default_params.merge(id: "1")

      expect(response).to be_successful
      expect(assigns(:group)).to eq(group)
    end
  end

  describe "PUT update" do
    let(:group) do
      double("group",
        id: "1",
        name: "Test Group",
        domain_id: default_params[:domain_id]
      )
    end

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
    end

    context "with valid attributes" do
      before do
        allow(group).to receive(:update).and_return(true)
      end

      it "updates group and redirects with success message" do
        put :update, params: default_params.merge(id: "1", group: { description: "Updated description" })

        expect(response).to redirect_to(domains_group_path(domain_id: default_params[:domain_id], id: "1"))
        expect(flash[:notice]).to eq("Group 'Test Group' successfully updated.")
      end

      it "calls update on group" do
        put :update, params: default_params.merge(id: "1", group: { description: "Updated description" })

        expect(group).to have_received(:update)
      end
    end

    context "with invalid attributes" do
      before do
        allow(group).to receive(:update).and_return(false)
      end

      it "re-renders edit template" do
        put :update, params: default_params.merge(id: "1", group: { description: "" })

        expect(response).to render_template(:edit)
        expect(flash[:notice]).to be_nil
      end
    end
  end

  describe "DELETE destroy" do
    let(:group) do
      double("group",
        id: "1",
        name: "Test Group",
        domain_id: default_params[:domain_id]
      )
    end

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
    end

    context "when deletion succeeds" do
      before do
        allow(group).to receive(:destroy).and_return(true)
      end

      it "deletes group and redirects with success message" do
        delete :destroy, params: default_params.merge(id: "1")

        expect(response).to redirect_to(domains_groups_path(domain_id: default_params[:domain_id]))
        expect(flash[:notice]).to eq("Group successfully deleted.")
      end

      it "calls destroy on group" do
        delete :destroy, params: default_params.merge(id: "1")

        expect(group).to have_received(:destroy)
      end
    end

    context "when deletion fails" do
      let(:errors) { double("errors", full_messages: double(to_sentence: "Cannot delete group")) }

      before do
        allow(group).to receive(:destroy).and_return(false)
        allow(group).to receive(:errors).and_return(errors)
      end

      it "redirects with error message" do
        delete :destroy, params: default_params.merge(id: "1")

        expect(response).to redirect_to(domains_groups_path(domain_id: default_params[:domain_id]))
        expect(flash[:error]).to eq("Cannot delete group")
      end
    end
  end

  describe "GET new_member" do
    let(:group) { double("group", id: "1", domain_id: default_params[:domain_id]) }

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
    end

    it "returns http success and loads group" do
      get :new_member, params: default_params.merge(group_id: "1")

      expect(response).to be_successful
      expect(assigns(:group)).to eq(group)
    end
  end

  describe "POST add_member" do
    let(:group) { double("group", id: "1", name: "Test Group", domain_id: default_params[:domain_id]) }
    let(:user) { double("user", id: "u1", name: "Test User", domain_id: default_params[:domain_id]) }

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
      allow(identity_service).to receive(:group_members).with("1").and_return([])
    end

    context "with valid user" do
      before do
        allow(service_user_identity).to receive(:find_user).and_return(nil)
        allow(service_user_identity).to receive(:users)
          .with({domain_id: default_params[:domain_id], name: "testuser"})
          .and_return([user])
        allow(identity_service).to receive(:add_group_member).with("1", "u1")
      end

      it "adds user to group and redirects with success message" do
        post :add_member, params: default_params.merge(group_id: "1", user_name: "testuser")

        expect(response).to redirect_to(domains_group_path(domain_id: default_params[:domain_id], id: "1"))
        expect(flash[:notice]).to eq("User 'Test User' successfully added to group 'Test Group'.")
      end

      it "calls identity service to add member" do
        post :add_member, params: default_params.merge(group_id: "1", user_name: "testuser")

        expect(identity_service).to have_received(:add_group_member).with("1", "u1")
      end
    end

    context "when user not found" do
      before do
        allow(service_user_identity).to receive(:users).and_return([])
      end

      it "re-renders new_member with error" do
        post :add_member, params: default_params.merge(group_id: "1", user_name: "nonexistent")

        expect(response).to render_template(:new_member)
        expect(assigns(:error)).to eq("User not found.")
      end
    end

    context "when user is already a member" do
      let(:existing_member) { double("user", id: "u1") }

      before do
        allow(service_user_identity).to receive(:find_user).and_return(nil)
        allow(service_user_identity).to receive(:users).and_return([user])
        allow(identity_service).to receive(:group_members).with("1").and_return([existing_member])
      end

      it "re-renders new_member with error" do
        post :add_member, params: default_params.merge(group_id: "1", user_name: "testuser")

        expect(response).to render_template(:new_member)
        expect(assigns(:error)).to eq("User is already a member of this domain.")
      end
    end

    context "when user is from different domain" do
      let(:other_domain_user) do
        double("user",
          id: "u1",
          name: "Test User",
          domain_id: "other_domain_id"
        )
      end

      before do
        allow(service_user_identity).to receive(:find_user).and_return(nil)
        allow(service_user_identity).to receive(:users).and_return([other_domain_user])
      end

      it "re-renders new_member with error" do
        post :add_member, params: default_params.merge(group_id: "1", user_name: "testuser")

        expect(response).to render_template(:new_member)
        expect(assigns(:error)).to eq("User is not a member of this domain.")
      end
    end
  end

  describe "DELETE remove_member" do
    let(:group) { double("group", id: "1", name: "Test Group", domain_id: default_params[:domain_id]) }

    before do
      allow(identity_service).to receive(:find_group).with("1").and_return(group)
      allow(identity_service).to receive(:remove_group_member).with("1", "u1")
    end

    context "when user is found" do
      let(:user) { double("user", id: "u1", name: "Test User") }

      before do
        allow(identity_service).to receive(:find_user).with("u1").and_return(user)
      end

      it "removes user and redirects with success message showing user name" do
        delete :remove_member, params: default_params.merge(group_id: "1", id: "u1")

        expect(response).to redirect_to(domains_group_path(domain_id: default_params[:domain_id], id: "1"))
        expect(flash[:notice]).to eq("User 'Test User' successfully removed from group 'Test Group'.")
      end

      it "calls identity service to remove member" do
        delete :remove_member, params: default_params.merge(group_id: "1", id: "u1")

        expect(identity_service).to have_received(:remove_group_member).with("1", "u1")
      end
    end

    context "when user is not found" do
      before do
        allow(identity_service).to receive(:find_user).with("u1").and_return(nil)
      end

      it "removes user and redirects with success message showing user ID" do
        delete :remove_member, params: default_params.merge(group_id: "1", id: "u1")

        expect(response).to redirect_to(domains_group_path(domain_id: default_params[:domain_id], id: "1"))
        expect(flash[:notice]).to eq("User 'u1' successfully removed from group 'Test Group'.")
      end
    end

    context "when find_user raises an error" do
      before do
        allow(identity_service).to receive(:find_user).with("u1").and_raise(StandardError, "API Error")
      end

      it "removes user and redirects with success message showing user ID" do
        delete :remove_member, params: default_params.merge(group_id: "1", id: "u1")

        expect(response).to redirect_to(domains_group_path(domain_id: default_params[:domain_id], id: "1"))
        expect(flash[:notice]).to eq("User 'u1' successfully removed from group 'Test Group'.")
      end
    end
  end
end
