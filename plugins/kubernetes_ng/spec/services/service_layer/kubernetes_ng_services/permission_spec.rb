require "spec_helper"

RSpec.describe ServiceLayer::KubernetesNgServices::Permissions do
  include ServiceLayer::KubernetesNgServices::Permissions

  # Test data setup - mimicking real project and resource names
  let(:project_id) { "test-project" }
  let(:resource) { "shoots" }
  let(:elektron_gardener_mock) { double("elektron_gardener") }

  before do
    # Mock the elektron_gardener dependency that makes HTTP requests to Kubernetes API
    allow(self).to receive(:elektron_gardener).and_return(elektron_gardener_mock)
  end

  describe "#get_permission_by_project_and_resource_and_verb" do
    let(:verb) { "get" }
    
    # Expected request body structure that should be sent to Kubernetes API
    # This matches the SelfSubjectAccessReview API specification
    let(:expected_request_body) do
      {
        kind: "SelfSubjectAccessReview",
        apiVersion: "authorization.k8s.io/v1",
        metadata: { creationTimestamp: nil },
        spec: {
          resourceAttributes: {
            namespace: "garden-#{project_id}", # Gardener-specific namespace pattern
            verb: verb,
            resource: resource,
            group: "core.gardener.cloud" # Gardener API group
          }
        }
      }
    end

    context "when permission is allowed" do
      # Mock a successful API response where permission is granted
      let(:api_response) do
        double("response", body: {
          "kind" => "SelfSubjectAccessReview",
          "apiVersion" => "authorization.k8s.io/v1",
          "status" => {
            "allowed" => true,
            "denied" => false,
            "reason" => "RBAC allows access"
          }
        })
      end

      it "returns true" do
        # Expect the HTTP POST request to the Kubernetes authorization API
        expect(elektron_gardener_mock).to receive(:post)
          .with("apis/authorization.k8s.io/v1/selfsubjectaccessreviews")
          .and_yield # This allows the block with request body to be executed
          .and_return(api_response)

        result = get_permission_by_project_and_resource_and_verb(project_id, resource, verb)
        expect(result).to be true
      end
    end

        context "when permission is denied" do
      # Mock an API response where permission is explicitly denied
      let(:api_response) do
        double("response", body: {
          "kind" => "SelfSubjectAccessReview",
          "apiVersion" => "authorization.k8s.io/v1",
          "status" => {
            "allowed" => false,
            "denied" => true,
            "reason" => "RBAC denies access"
          }
        })
      end

      it "returns false" do
        expect(elektron_gardener_mock).to receive(:post)
          .with("apis/authorization.k8s.io/v1/selfsubjectaccessreviews")
          .and_yield
          .and_return(api_response)

        result = get_permission_by_project_and_resource_and_verb(project_id, resource, verb)
        expect(result).to be false
      end
    end

    context "when status.allowed is nil" do
      # Test edge case where API returns nil for allowed field
      # The method should default to false for safety
      let(:api_response) do
        double("response", body: {
          "kind" => "SelfSubjectAccessReview",
          "apiVersion" => "authorization.k8s.io/v1",
          "status" => {
            "allowed" => nil,
            "denied" => false
          }
        })
      end

      it "returns false" do
        expect(elektron_gardener_mock).to receive(:post)
          .with("apis/authorization.k8s.io/v1/selfsubjectaccessreviews")
          .and_yield
          .and_return(api_response)

        result = get_permission_by_project_and_resource_and_verb(project_id, resource, verb)
        expect(result).to be false
      end
    end
  end

  describe "#list_permissions_by_project_and_resource" do
    # The standard CRUD operations that are checked for permissions
    let(:verbs) { ["list", "get", "create", "update", "delete"] }

    context "when all permissions are allowed" do
      before do
        # Mock all permission checks to return true
        # This simulates a user with full access to the resource
        verbs.each do |verb|
          allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
            .with(project_id, resource, verb)
            .and_return(true)
        end
      end

      it "returns a hash with all permissions set to true" do
        result = list_permissions_by_project_and_resource(project_id, resource)
        
        # Verify that the method returns a hash mapping each verb to its permission status
        expect(result).to eq({
          "list" => true,
          "get" => true,
          "create" => true,
          "update" => true,
          "delete" => true
        })
      end
    end

    context "when some permissions are denied" do
      before do
        # Mock a realistic scenario where user has read permissions but not write permissions
        # This is common in RBAC setups where users have different levels of access
        allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
          .with(project_id, resource, "list").and_return(true)
        allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
          .with(project_id, resource, "get").and_return(true)
        allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
          .with(project_id, resource, "create").and_return(false)
        allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
          .with(project_id, resource, "update").and_return(false)
        allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
          .with(project_id, resource, "delete").and_return(false)
      end

      it "returns a hash with mixed permissions" do
        result = list_permissions_by_project_and_resource(project_id, resource)
        
        # Verify that the method correctly handles mixed permission scenarios
        expect(result).to eq({
          "list" => true,
          "get" => true,
          "create" => false,
          "update" => false,
          "delete" => false
        })
      end
    end

    context "when all permissions are denied" do
      before do
        # Mock scenario where user has no permissions at all
        # This could happen for unauthorized users or misconfigured RBAC
        verbs.each do |verb|
          allow(self).to receive(:get_permission_by_project_and_resource_and_verb)
            .with(project_id, resource, verb)
            .and_return(false)
        end
      end

      it "returns a hash with all permissions set to false" do
        result = list_permissions_by_project_and_resource(project_id, resource)
        
        # Verify that the method handles the "no permissions" case correctly
        expect(result).to eq({
          "list" => false,
          "get" => false,
          "create" => false,
          "update" => false,
          "delete" => false
        })
      end
    end
  end

  describe "integration test" do
    context "when checking permissions for different resources" do
      # Test with different Kubernetes/Gardener resources
      let(:shoots_resource) { "shoots" } # Gardener-specific resource for Kubernetes clusters

      it "handles different resources correctly" do
        # Mock API responses for a complete permission check cycle
        # This simulates checking all 5 verbs for the shoots resource
        shoots_response = double("response", body: { "status" => { "allowed" => true } })
        expect(elektron_gardener_mock).to receive(:post)
          .with("apis/authorization.k8s.io/v1/selfsubjectaccessreviews")
          .exactly(5).times # Once for each verb (list, get, create, update, delete)
          .and_yield
          .and_return(shoots_response)

        result = list_permissions_by_project_and_resource(project_id, shoots_resource)
        # Verify that all expected verbs are checked and returned
        expect(result.keys).to match_array(["list", "get", "create", "update", "delete"])
        expect(result.values).to all(be true)
      end
    end
  end
end
