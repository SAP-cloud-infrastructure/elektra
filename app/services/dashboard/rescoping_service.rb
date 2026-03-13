# frozen_string_literal: true

module Dashboard
  # This class implements the friendly id handling for domains and projects
  class RescopingService
    def initialize(service_user)
      @service_user = service_user
    end

    ########################## FRIENDLY_ID_ENTRIES #########################
    # find or create friendly_id entry for domain
    def domain_friendly_id(domain_fid_id_or_key)
      # try to find an entry by given fid or key
      entry =
        FriendlyIdEntry.find_by_class_scope_and_key_or_slug(
          "Domain",
          nil,
          domain_fid_id_or_key,
        )

      if entry.nil? && @service_user.present?
        # Look up the domain directly by ID or name via the Keystone API.
        # Previously this used auth_domains (GET /v3/auth/domains), which
        # only returns domains where the token's user has an explicit role
        # assignment. With the cloud_admin token, the user can look up any
        # domain via find_domain/domains, but auth_domains would miss
        # domains without a direct role grant (e.g. new iaas-* domains).
        domain =
          @service_user.identity.find_domain(domain_fid_id_or_key) rescue nil
        domain ||=
          @service_user.identity.domains(name: domain_fid_id_or_key).first rescue nil

        if domain
          entry =
            FriendlyIdEntry.find_or_create_entry(
              "Domain",
              nil,
              domain.id,
              domain.attributes["name"],
            )
        end
      end
      entry
    end

    # find or create friendly_id entry for project
    def project_friendly_id(domain_id, project_fid_or_key)
      # try to find an entry by given fid or key
      entry =
        FriendlyIdEntry.find_by_class_scope_and_key_or_slug(
          "Project",
          domain_id,
          project_fid_or_key,
        )

      # no entry found -> create a new one
      if entry.nil? && @service_user
        project =
          @service_user
            .identity
            .projects(domain_id: domain_id, name: project_fid_or_key)
            .first || @service_user.identity.find_project(project_fid_or_key)

        # create friendly_id entry
        if project
          entry =
            FriendlyIdEntry.find_or_create_entry(
              "Project",
              project.domain_id,
              project.id,
              project.attributes["name"],
            )
        end
      end
      entry
    end
  end
end
