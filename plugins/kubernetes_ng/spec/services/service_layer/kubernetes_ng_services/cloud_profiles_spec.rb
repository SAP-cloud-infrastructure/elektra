require "spec_helper"
RSpec.describe ServiceLayer::KubernetesNgServices::CloudProfiles do
  include ServiceLayer::KubernetesNgServices::CloudProfiles
  
  describe "#list_cloud_profiles" do
    let(:mock_response) do
      double('response', body: {
        "items" => [
          {
            "metadata" => {
              "uid" => "f0ef648f-89f3-4ed6-bbe2-c7828b77bda5",
              "name" => "openstack",
              "resourceVersion" => "12345",
              "creationTimestamp" => "2023-01-01T00:00:00Z"
            },
            "spec" => {
              "type" => "openstack",
              "kubernetes" => {
                "versions" => [
                  { "version" => "1.31.5" },
                  { "version" => "1.30.0" },
                  { "version" => "1.29.0" },
                  { "version" => "1.28.2" },
                  { "version" => "1.27.1" },
                  { "version" => "1.26.0" },
                  { "version" => "1.25.4" }
                ]
              },
              "machineTypes" => [
                {
                  "name" => "g_c4_m16",
                  "architecture" => "amd64",
                  "cpu" => "4",
                  "memory" => "16Gi"
                }
              ],
              "machineImages" => [
                {
                  "name" => "flatcar",
                  "versions" => [
                    { "version" => "1.0.0" }
                  ]
                }
              ],
              "regions" => [
                {
                  "name" => "qa-de-1",
                  "zones" => [
                    { "name" => "qa-de-1a" }
                  ]
                }
              ],
              "volumeTypes" => []
            }
          }
        ]
      })
    end

    before do
      # Mock the elektron_gardener client
      allow(self).to receive(:elektron_gardener).and_return(double('elektron_gardener'))
      allow(elektron_gardener).to receive(:get).with("apis/core.gardener.cloud/v1beta1/cloudprofiles").and_return(mock_response)
    end

    it "returns cloud profiles in camelCase format" do
      result = list_cloud_profiles
      
      # Test that result is an array with one cloud profile
      expect(result).to be_an(Array)
      expect(result.length).to eq(1)
      
      cloud_profile = result.first
      
      # Test main cloud profile structure with camelCase keys
      expect(cloud_profile).to include(
        uid: "f0ef648f-89f3-4ed6-bbe2-c7828b77bda5",
        name: "openstack",
        provider: "openstack"
      )
      
      expect(cloud_profile).to have_key(:kubernetesVersions)
      expect(cloud_profile).to have_key(:machineTypes)
      expect(cloud_profile).to have_key(:machineImages)
      expect(cloud_profile).to have_key(:volumeTypes)
      expect(cloud_profile).to have_key(:regions)
    end

    it "correctly maps kubernetes versions" do
      result = list_cloud_profiles
      cloud_profile = result.first
      
      # Test kubernetesVersions array structure
      expect(cloud_profile[:kubernetesVersions]).to be_an(Array)
      expect(cloud_profile[:kubernetesVersions]).to contain_exactly(
        "1.31.5", "1.30.0", "1.29.0", "1.28.2", "1.27.1", "1.26.0", "1.25.4"
      )
    end

    it "correctly maps machine types with all expected fields" do
      result = list_cloud_profiles
      cloud_profile = result.first
      
      # Test machineTypes array structure
      expect(cloud_profile[:machineTypes]).to be_an(Array)
      expect(cloud_profile[:machineTypes].length).to eq(1)
      
      machine_type = cloud_profile[:machineTypes].first
      expect(machine_type).to include(
        name: "g_c4_m16",
        architecture: "amd64",
        cpu: "4",
        memory: "16Gi"
      )
    end

    it "correctly maps machine images with versions" do
      result = list_cloud_profiles
      cloud_profile = result.first
      
      # Test machineImages array structure
      expect(cloud_profile[:machineImages]).to be_an(Array)
      expect(cloud_profile[:machineImages].length).to eq(1)
      
      machine_image = cloud_profile[:machineImages].first
      expect(machine_image).to include(
        name: "flatcar",
        versions: ["1.0.0"]
      )
      expect(machine_image[:versions]).to be_an(Array)
    end

    it "correctly maps regions with zones" do
      result = list_cloud_profiles
      cloud_profile = result.first
      
      # Test regions array structure
      expect(cloud_profile[:regions]).to be_an(Array)
      expect(cloud_profile[:regions].length).to eq(1)
      
      region = cloud_profile[:regions].first
      expect(region).to include(
        name: "qa-de-1",
        zones: ["qa-de-1a"]
      )
      expect(region[:zones]).to be_an(Array)
    end

    it "correctly handles empty volume types" do
      result = list_cloud_profiles
      cloud_profile = result.first
      
      # Test volumeTypes array is empty but present
      expect(cloud_profile[:volumeTypes]).to be_an(Array)
      expect(cloud_profile[:volumeTypes]).to be_empty
    end

    context "when API returns empty response" do
      let(:empty_response) { double('response', body: { "items" => [] }) }

      before do
        allow(elektron_gardener).to receive(:get).and_return(empty_response)
      end

      it "returns empty array" do
        result = list_cloud_profiles
        expect(result).to eq([])
      end
    end

    context "when API returns nil response" do
      let(:nil_response) { double('response', body: nil) }

      before do
        allow(elektron_gardener).to receive(:get).and_return(nil_response)
      end

      it "returns empty array" do
        result = list_cloud_profiles
        expect(result).to eq([])
      end
    end

    context "when API response has malformed data" do
      let(:malformed_response) do
        double('response', body: {
          "items" => [
            {
              "metadata" => {
                "uid" => "test-uid",
                "name" => "test-profile"
              },
              "spec" => {
                "type" => "test-provider",
                "kubernetes" => {
                  "versions" => [
                    { "version" => "1.25.0" },
                    "invalid-version-format", # Invalid format
                    { "invalid" => "object" }  # Missing version key
                  ]
                },
                "machineTypes" => [
                  { "name" => "valid-machine" },
                  { "invalid" => "no-name" }, # Missing name
                  "invalid-machine-format"    # Invalid format
                ]
              }
            },
            "invalid-cloud-profile-format", # Invalid cloud profile format
            nil # Nil item
          ]
        })
      end

      before do
        allow(elektron_gardener).to receive(:get).and_return(malformed_response)
      end

      it "filters out invalid data and returns only valid items" do
        result = list_cloud_profiles
        
        # Should return one valid cloud profile
        expect(result).to be_an(Array)
        expect(result.length).to eq(1)
        
        cloud_profile = result.first
        expect(cloud_profile[:name]).to eq("test-profile")
        
        # Should only include valid kubernetes versions
        expect(cloud_profile[:kubernetesVersions]).to eq(["1.25.0"])
        
        # Should only include valid machine types
        expect(cloud_profile[:machineTypes].length).to eq(1)
        expect(cloud_profile[:machineTypes].first[:name]).to eq("valid-machine")
      end
    end

  end
end
