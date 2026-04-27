module ServiceLayer
  module KubernetesNgServices
    # Simple semver parsing and comparison utilities for Kubernetes versions
    module VersionHelpers
      # Parse a semantic version string into its components
      # @param version [String] Version string (e.g., "1.27.0")
      # @return [Hash] Object with major, minor, patch numbers
      def parse_semver(version)
        return { major: 0, minor: 0, patch: 0 } unless version.is_a?(String)

        parts = version.split('.').map(&:to_i)
        {
          major: parts[0] || 0,
          minor: parts[1] || 0,
          patch: parts[2] || 0
        }
      end

      # Check if version v1 is greater than v2
      # @param v1 [String] First version string
      # @param v2 [String] Second version string
      # @return [Boolean] true if v1 > v2
      def semver_gt(v1, v2)
        a = parse_semver(v1)
        b = parse_semver(v2)
        return a[:major] > b[:major] if a[:major] != b[:major]
        return a[:minor] > b[:minor] if a[:minor] != b[:minor]
        a[:patch] > b[:patch]
      end

      # Get the semantic version difference type between two versions
      # @param v1 [String] First version string
      # @param v2 [String] Second version string
      # @return [String, nil] 'major', 'minor', 'patch', or nil if equal
      def semver_diff(v1, v2)
        a = parse_semver(v1)
        b = parse_semver(v2)
        return 'major' if a[:major] != b[:major]
        return 'minor' if a[:minor] != b[:minor]
        return 'patch' if a[:patch] != b[:patch]
        nil
      end

      # Validate if a minor version upgrade is to the next minor version only
      # Gardener constraint: Can only upgrade one minor version at a time
      # @param current_version [String] Current version string
      # @param target_version [String] Target version string
      # @return [Boolean] true if target is exactly the next minor version
      def is_next_minor_version(current_version, target_version)
        current = parse_semver(current_version)
        target = parse_semver(target_version)

        # For minor upgrades, must be exactly +1 and same major version
        target[:minor] - current[:minor] == 1 && target[:major] == current[:major]
      end

      # Sort versions in ascending order (oldest to newest)
      # @param versions [Array<String>] Array of version strings
      # @return [Array<String>] Sorted versions
      def sort_versions(versions)
        versions.sort do |a, b|
          a_parts = parse_semver(a)
          b_parts = parse_semver(b)

          if a_parts[:major] != b_parts[:major]
            a_parts[:major] <=> b_parts[:major]
          elsif a_parts[:minor] != b_parts[:minor]
            a_parts[:minor] <=> b_parts[:minor]
          else
            a_parts[:patch] <=> b_parts[:patch]
          end
        end
      end

      # Groups available Kubernetes updates by semantic version type (patch, minor, major)
      # Based on frontend implementation in useClusterVersionUpdates.ts
      # @param current_version [String] The current cluster Kubernetes version
      # @param available_versions [Array<String>] All available versions from cloud profile
      # @return [Hash, nil] Grouped updates by type (sorted in ascending order), hash with empty arrays if no updates, or nil if invalid input
      def calculate_available_updates(current_version, available_versions)
        return nil unless current_version && available_versions.is_a?(Array)

        # Find all versions greater than current
        newer_versions = available_versions.select { |v| semver_gt(v, current_version) }

        # Return explicit structure if no updates available (different from nil which means error/invalid input)
        return { patch: [], minor: [], major: [] } if newer_versions.empty?

        # Group by semantic version diff type
        grouped = { patch: [], minor: [], major: [] }

        newer_versions.each do |version|
          diff = semver_diff(version, current_version)
          next unless diff

          diff_key = diff.to_sym
          grouped[diff_key] << version
        end

        # Sort each group in ascending order
        grouped[:patch] = sort_versions(grouped[:patch]) if grouped[:patch].any?
        grouped[:minor] = sort_versions(grouped[:minor]) if grouped[:minor].any?
        grouped[:major] = sort_versions(grouped[:major]) if grouped[:major].any?

        grouped
      end
    end
  end
end
