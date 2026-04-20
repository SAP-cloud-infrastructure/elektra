require "spec_helper"

RSpec.describe ServiceLayer::KubernetesNgServices::VersionHelpers do
  # Create a test class that includes the module
  let(:test_class) do
    Class.new do
      include ServiceLayer::KubernetesNgServices::VersionHelpers
    end
  end
  let(:subject) { test_class.new }

  describe "#parse_semver" do
    it "parses a standard semver string" do
      expect(subject.parse_semver("1.27.5")).to eq({ major: 1, minor: 27, patch: 5 })
    end

    it "parses version with leading zeros" do
      expect(subject.parse_semver("1.02.03")).to eq({ major: 1, minor: 2, patch: 3 })
    end

    it "handles missing patch version" do
      expect(subject.parse_semver("1.27")).to eq({ major: 1, minor: 27, patch: 0 })
    end

    it "handles missing minor and patch" do
      expect(subject.parse_semver("2")).to eq({ major: 2, minor: 0, patch: 0 })
    end

    it "handles non-string input" do
      expect(subject.parse_semver(nil)).to eq({ major: 0, minor: 0, patch: 0 })
      expect(subject.parse_semver(123)).to eq({ major: 0, minor: 0, patch: 0 })
    end
  end

  describe "#semver_gt" do
    it "returns true when major version is greater" do
      expect(subject.semver_gt("2.0.0", "1.99.99")).to be true
    end

    it "returns true when minor version is greater" do
      expect(subject.semver_gt("1.28.0", "1.27.5")).to be true
    end

    it "returns true when patch version is greater" do
      expect(subject.semver_gt("1.27.5", "1.27.4")).to be true
    end

    it "returns false when versions are equal" do
      expect(subject.semver_gt("1.27.5", "1.27.5")).to be false
    end

    it "returns false when first version is less" do
      expect(subject.semver_gt("1.27.4", "1.27.5")).to be false
      expect(subject.semver_gt("1.26.5", "1.27.0")).to be false
      expect(subject.semver_gt("1.27.5", "2.0.0")).to be false
    end

    it "handles versions with different lengths" do
      expect(subject.semver_gt("1.28.0", "1.27")).to be true
      expect(subject.semver_gt("2.0", "1.27.5")).to be true
    end
  end

  describe "#semver_diff" do
    it "returns 'major' when major versions differ" do
      expect(subject.semver_diff("2.0.0", "1.27.5")).to eq("major")
      expect(subject.semver_diff("1.0.0", "2.5.3")).to eq("major")
    end

    it "returns 'minor' when only minor versions differ" do
      expect(subject.semver_diff("1.28.0", "1.27.5")).to eq("minor")
      expect(subject.semver_diff("1.27.0", "1.28.5")).to eq("minor")
    end

    it "returns 'patch' when only patch versions differ" do
      expect(subject.semver_diff("1.27.5", "1.27.4")).to eq("patch")
      expect(subject.semver_diff("1.27.1", "1.27.0")).to eq("patch")
    end

    it "returns nil when versions are equal" do
      expect(subject.semver_diff("1.27.5", "1.27.5")).to be_nil
    end

    it "handles versions with different lengths" do
      expect(subject.semver_diff("1.28.0", "1.27")).to eq("minor")
      expect(subject.semver_diff("1.27.1", "1.27")).to eq("patch")
    end
  end

  describe "#is_next_minor_version" do
    it "returns true for next minor version" do
      expect(subject.is_next_minor_version("1.27.5", "1.28.0")).to be true
      expect(subject.is_next_minor_version("1.27.5", "1.28.3")).to be true
    end

    it "returns false for same minor version" do
      expect(subject.is_next_minor_version("1.27.5", "1.27.6")).to be false
    end

    it "returns false for skipped minor version" do
      expect(subject.is_next_minor_version("1.27.5", "1.29.0")).to be false
      expect(subject.is_next_minor_version("1.27.5", "1.30.0")).to be false
    end

    it "returns false for different major version" do
      expect(subject.is_next_minor_version("1.27.5", "2.0.0")).to be false
    end

    it "returns false for older version" do
      expect(subject.is_next_minor_version("1.28.0", "1.27.5")).to be false
    end
  end

  describe "#sort_versions" do
    it "sorts versions in ascending order" do
      versions = ["1.28.0", "1.27.5", "1.28.5", "1.27.0"]
      sorted = subject.sort_versions(versions)
      expect(sorted).to eq(["1.27.0", "1.27.5", "1.28.0", "1.28.5"])
    end

    it "sorts versions with different major numbers" do
      versions = ["2.1.0", "1.29.0", "2.0.0", "1.28.5"]
      sorted = subject.sort_versions(versions)
      expect(sorted).to eq(["1.28.5", "1.29.0", "2.0.0", "2.1.0"])
    end

    it "handles empty array" do
      expect(subject.sort_versions([])).to eq([])
    end
  end

  describe "#calculate_available_updates" do
    let(:available_versions) do
      ["1.31.5", "1.31.0", "1.30.5", "1.30.0", "1.29.8", "1.29.0", "1.28.5", "1.28.2", "1.28.0", "1.27.5", "1.27.0"]
    end

    it "returns nil when current version is nil" do
      expect(subject.calculate_available_updates(nil, available_versions)).to be_nil
    end

    it "returns empty arrays when no newer versions available" do
      result = subject.calculate_available_updates("1.31.5", available_versions)
      expect(result).to eq({ patch: [], minor: [], major: [] })
    end

    it "groups patch versions correctly" do
      updates = subject.calculate_available_updates("1.28.0", available_versions)
      expect(updates).not_to be_nil
      expect(updates[:patch]).to eq(["1.28.2", "1.28.5"])
    end

    it "groups minor versions correctly" do
      updates = subject.calculate_available_updates("1.28.5", available_versions)
      expect(updates).not_to be_nil
      expect(updates[:minor]).to eq(["1.29.0", "1.29.8", "1.30.0", "1.30.5", "1.31.0", "1.31.5"])
    end

    it "groups both patch and minor versions" do
      updates = subject.calculate_available_updates("1.28.0", available_versions)
      expect(updates).not_to be_nil
      expect(updates[:patch]).to eq(["1.28.2", "1.28.5"])
      expect(updates[:minor]).to eq(["1.29.0", "1.29.8", "1.30.0", "1.30.5", "1.31.0", "1.31.5"])
    end

    it "handles major version upgrades" do
      versions_with_major = available_versions + ["2.0.0", "2.1.0"]
      updates = subject.calculate_available_updates("1.31.5", versions_with_major)
      expect(updates).not_to be_nil
      expect(updates[:major]).to eq(["2.0.0", "2.1.0"])
    end

    it "only includes versions greater than current" do
      updates = subject.calculate_available_updates("1.29.5", available_versions)
      expect(updates).not_to be_nil
      expect(updates[:patch]).to eq(["1.29.8"])
      expect(updates[:minor]).to eq(["1.30.0", "1.30.5", "1.31.0", "1.31.5"])

      # Should not include 1.27.x, 1.28.x, or 1.29.0
      expect(updates[:patch]).not_to include("1.29.0")
      expect(updates[:minor]).not_to include("1.27.5", "1.28.5")
    end

    it "returns nil for non-array input" do
      expect(subject.calculate_available_updates("1.28.0", nil)).to be_nil
      expect(subject.calculate_available_updates("1.28.0", "not-an-array")).to be_nil
    end

    it "sorts results in ascending order" do
      updates = subject.calculate_available_updates("1.27.0", available_versions)
      expect(updates[:patch]).to eq(["1.27.5"])
      expect(updates[:minor].first).to eq("1.28.0")
      expect(updates[:minor].last).to eq("1.31.5")
    end
  end
end
