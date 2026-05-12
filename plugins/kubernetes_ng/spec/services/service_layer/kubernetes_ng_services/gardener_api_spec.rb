require "spec_helper"

RSpec.describe ServiceLayer::KubernetesNgServices::GardenerApi do
  include ServiceLayer::KubernetesNgServices::GardenerApi

  let(:project_id) { "test-project" }
  let(:region_name) { "qa-de-1" }
  let(:namespace) { "garden-#{region_name}-#{project_id}" }
  let(:api_url) { "https://gardener.example.com" }
  let(:token) { "test-token-123" }
  let(:env_region) { "eu-de-1" }

  # Set up scoped variables and mocks before each test
  before do
    @scoped_project_id = project_id
    @scoped_region = region_name

    # Mock the dependencies
    allow(self).to receive(:garden_namespace).and_return(namespace)
    allow(self).to receive(:region).and_return(env_region)

    # Mock elektron_gardener
    mock_elektron_gardener = double('elektron_gardener')
    allow(mock_elektron_gardener).to receive(:endpoint_url).and_return(api_url)
    allow(self).to receive(:elektron_gardener).and_return(mock_elektron_gardener)

    # Mock elektron for token
    mock_elektron = double('elektron')
    allow(mock_elektron).to receive(:token).and_return(token)
    allow(self).to receive(:elektron).and_return(mock_elektron)
  end

  describe "#gardener_api_kubeconfig" do
    it "returns a valid YAML kubeconfig string" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to be_a(String)
      expect(kubeconfig).to include("apiVersion: v1")
      expect(kubeconfig).to include("kind: Config")
      expect(kubeconfig).to include("clusters:")
      expect(kubeconfig).to include("contexts:")
      expect(kubeconfig).to include("users:")
    end

    it "includes the correct API server URL" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("server: #{api_url}")
    end

    it "includes the correct namespace" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("namespace: #{namespace}")
    end

    it "includes the authentication token with region prefix" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("token: #{env_region}:#{token}")
    end

    it "sets the correct cluster name" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("name: garden")
    end

    it "sets the correct context as current" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("current-context: garden")
    end

    it "sets the correct user name" do
      kubeconfig = gardener_api_kubeconfig

      expect(kubeconfig).to include("name: garden-user")
    end
  end

  describe "#build_garden_kubeconfig" do
    it "creates a properly structured kubeconfig hash" do
      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      expect(kubeconfig).to be_a(Hash)
      expect(kubeconfig["apiVersion"]).to eq("v1")
      expect(kubeconfig["kind"]).to eq("Config")
    end

    it "includes cluster configuration" do
      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      expect(kubeconfig["clusters"]).to be_an(Array)
      expect(kubeconfig["clusters"].length).to eq(1)

      cluster = kubeconfig["clusters"].first
      expect(cluster["name"]).to eq("garden")
      expect(cluster["cluster"]["server"]).to eq(api_url)
    end

    it "includes context configuration" do
      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      expect(kubeconfig["contexts"]).to be_an(Array)
      expect(kubeconfig["contexts"].length).to eq(1)

      context = kubeconfig["contexts"].first
      expect(context["name"]).to eq("garden")
      expect(context["context"]["cluster"]).to eq("garden")
      expect(context["context"]["user"]).to eq("garden-user")
      expect(context["context"]["namespace"]).to eq(namespace)
    end

    it "includes user configuration with token" do
      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      expect(kubeconfig["users"]).to be_an(Array)
      expect(kubeconfig["users"].length).to eq(1)

      user = kubeconfig["users"].first
      expect(user["name"]).to eq("garden-user")
      expect(user["user"]["token"]).to eq("#{env_region}:#{token}")
    end

    it "sets current-context to garden" do
      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      expect(kubeconfig["current-context"]).to eq("garden")
    end

    it "raises KubeconfigGenerationError on exception" do
      # Simulate an error by making elektron_gardener raise
      allow(elektron_gardener).to receive(:endpoint_url).and_raise(StandardError.new("Connection failed"))

      expect {
        send(:build_garden_kubeconfig)
      }.to raise_error(ServiceLayer::KubernetesNgServices::GardenerApi::KubeconfigGenerationError, /Connection failed/)
    end

    it "handles nil token gracefully" do
      allow(elektron).to receive(:token).and_return(nil)

      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      user = kubeconfig["users"].first
      expect(user["user"]["token"]).to eq("#{env_region}:")
    end

    it "handles nil region gracefully" do
      allow(self).to receive(:region).and_return(nil)

      kubeconfig_yaml = send(:build_garden_kubeconfig)
      kubeconfig = YAML.load(kubeconfig_yaml)

      user = kubeconfig["users"].first
      expect(user["user"]["token"]).to eq(":#{token}")
    end
  end
end
