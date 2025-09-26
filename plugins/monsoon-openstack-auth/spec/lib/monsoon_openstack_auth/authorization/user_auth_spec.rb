require 'spec_helper'

describe MonsoonOpenstackAuth::Authorization::PolicyEngine do
  describe "User authorizations" do
    before :all do
      MonsoonOpenstackAuth.configuration.authorization.policy_file_path = File.expand_path("../../../config/policy_test.json",__dir__)
      MonsoonOpenstackAuth.load_policy
      @policy_engine = MonsoonOpenstackAuth.policy_engine
    end

    context "user allowed actions when user is admin" do
      before do |x|
        # Create admin user stub with is_allowed? method
        @current_user = double("admin_user",
          id: 1,
          name: "Admin User",
          email: "admin@example.com",
          admin?: true,
          member?: false,
          domain_id: "admin-domain-123",
          role_names: ["admin"]
        ).as_null_object
        
        # Mock the is_allowed? method to use the policy engine
        allow(@current_user).to receive(:is_allowed?) do |action, params = {}|
          policy = @policy_engine.policy(@current_user)
          policy.enforce(action, params)
        end
        
        @action = [x.metadata[:description_args].first]
      end

      it "returns true if user is admin" do
        expect(@current_user.admin?).to eq(true)
      end

      it "identity:domain_list" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:domain_create" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:domain_change" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:project_list" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:project_create" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:project_change" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end

      it "identity:project_default_check" do
        expect(@current_user.is_allowed?(@action)).to eq(true)
      end
    end

    context "user allowed actions when user is domain member/owner" do
      before do |x|
        # Create member user stub
        @current_user = double("member_user",
          id: 2,
          name: "Member User",
          email: "member@example.com",
          admin?: false,
          member?: true,
          domain_id: "member-domain-456",
          role_names: ["member"]
        ).as_null_object
        
        # Mock the is_allowed? method to use the policy engine
        allow(@current_user).to receive(:is_allowed?) do |action, params = {}|
          policy = @policy_engine.policy(@current_user)
          policy.enforce(action, params)
        end
        
        @action = [x.metadata[:description_args].first]
        
        # Create domain stub that member owns
        @domain = double("member_domain",
          id: "member-domain-456",
          name: "Member Domain",
          description: "Domain owned by member",
          user_id: @current_user.id,
          owner_id: @current_user.id
        )
        
        # Create project stub that member owns
        @project = double("member_project",
          id: "member-project-789",
          name: "Member Project",
          description: "Project owned by member",
          user_id: @current_user.id,
          owner_id: @current_user.id,
          domain_id: @domain.id
        )
        
        # Use Hashie::Mash if available, otherwise regular hash
        @params = if defined?(Hashie::Mash)
                    Hashie::Mash.new({ domain: { id: @domain.id }, project: { id: @project.id } })
                  else
                    { domain: { id: @domain.id }, project: { id: @project.id } }
                  end
      end

      it "returns false if user is domain member/owner" do
        expect(@current_user.admin?).to eq(false)
      end

      it "identity:domain_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:domain_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:domain_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_default_check" do
        expect(@current_user.is_allowed?(@action)).to eq(false)
      end
    end

    context "user allowed actions when user is member" do
      before do |x|
        # Create member user stub
        @current_user = double("member_user",
          id: 3,
          name: "Project Member User",
          email: "projectmember@example.com",
          admin?: false,
          member?: true,
          domain_id: "member-domain-789",
          role_names: ["member"]
        ).as_null_object
        
        # Mock the is_allowed? method to use the policy engine
        allow(@current_user).to receive(:is_allowed?) do |action, params = {}|
          policy = @policy_engine.policy(@current_user)
          policy.enforce(action, params)
        end
        
        @action = [x.metadata[:description_args].first]
        
        # Create domain stub that member owns
        @domain = double("member_domain",
          id: "member-domain-789",
          name: "Member Domain",
          description: "Domain owned by member",
          user_id: @current_user.id,
          owner_id: @current_user.id
        )
        
        # Create project stub that member owns
        @project = double("member_project",
          id: "member-project-101",
          name: "Member Project",
          description: "Project owned by member",
          user_id: @current_user.id,
          owner_id: @current_user.id,
          domain_id: @domain.id
        )
        
        # Use Hashie::Mash if available, otherwise regular hash
        @params = if defined?(Hashie::Mash)
                    Hashie::Mash.new({ domain: { id: @domain.id }, project: { id: @project.id } })
                  else
                    { domain: { id: @domain.id }, project: { id: @project.id } }
                  end
      end

      it "returns false if user is project member/owner" do
        expect(@current_user.admin?).to eq(false)
      end

      it "identity:domain_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:domain_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:domain_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:project_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_default_check" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end
    end

    context "user allowed actions when user is neither admin nor member" do
      before do |x|
        # Create regular user stub (neither admin nor member)
        @current_user = double("regular_user",
          id: 4,
          name: "Regular User",
          email: "regular@example.com",
          admin?: false,
          member?: false,
          domain_id: "regular-domain-999",
          role_names: []
        ).as_null_object
        
        # Mock the is_allowed? method to use the policy engine
        allow(@current_user).to receive(:is_allowed?) do |action, params = {}|
          policy = @policy_engine.policy(@current_user)
          policy.enforce(action, params)
        end
        
        @action = [x.metadata[:description_args].first]
        
        # Create domain stub that user doesn't own
        @domain = double("other_domain",
          id: "other-domain-555",
          name: "Other Domain",
          description: "Domain not owned by user",
          user_id: "different-user-id",
          owner_id: "different-user-id"
        )
        
        # Create project stub that user doesn't own
        @project = double("other_project",
          id: "other-project-666",
          name: "Other Project",
          description: "Project not owned by user",
          user_id: "different-user-id",
          owner_id: "different-user-id",
          domain_id: @domain.id
        )
        
        # Use Hashie::Mash if available, otherwise regular hash
        @params = if defined?(Hashie::Mash)
                    Hashie::Mash.new({ domain: { id: @domain.id }, project: { id: @project.id } })
                  else
                    { domain: { id: @domain.id }, project: { id: @project.id } }
                  end
      end

      it "returns false if user is neither admin nor member" do
        expect(@current_user.admin?).to eq(false)
      end

      it "identity:domain_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:domain_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(true)
      end

      it "identity:domain_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_list" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_create" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_change" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end

      it "identity:project_default_check" do
        expect(@current_user.is_allowed?(@action, @params)).to eq(false)
      end
    end
  end
end
