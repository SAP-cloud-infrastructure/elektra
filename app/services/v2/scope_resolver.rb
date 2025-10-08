module V2 
  class ScopeResolver
    # Matches 32 hex chars (no dashes)
    UUID_REGEX = /\A[0-9a-f]{32}\z/i

    # Standard UUIDs have dashes 
    STANDARD_UUID_REGEX = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i

    # Support both formats
    def self.uuid?(value)
      !!(value =~ UUID_REGEX || value =~ STANDARD_UUID_REGEX)
    end

    def initialize(endpoint)
      @endpoint = endpoint
    end

    def resolve_domain(identifier)
      resolve_resource('Domain', identifier)
    end

    def resolve_project(identifier)
      resolve_resource('Project', identifier)
    end

    private

    def resolve_resource(class_name, identifier)
      return build_result(nil, nil, nil) unless identifier

      # Try database lookup first
      entry = find_friendly_id_entry(class_name, identifier)
      return build_result(entry.key, entry.slug, entry.name) if entry

      # Fallback to UUID detection
      if self.class.uuid?(identifier)
        build_result(identifier, nil, nil)
      else
        build_result(nil, nil, identifier)
      end
    end

    def find_friendly_id_entry(class_name, identifier)
      FriendlyIdEntry.where([
        "class_name = ? AND (LOWER(key) = ? OR LOWER(slug) = ? OR LOWER(name) = ?) AND endpoint = ?",
        class_name,
        identifier.downcase,
        identifier.downcase, 
        identifier.downcase,
        @endpoint
      ]).first
    end

    def build_result(id, fid, name)
      OpenStruct.new(id: id, fid: fid, name: name)
    end
  end
end