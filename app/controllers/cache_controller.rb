# frozen_string_literal: true

require 'csv'

class CacheController < ::ScopeController
  include ApiLookup

  RELATED_OBJECTS_KEYS = {
    'port' => %w[network_id device_id security_groups],
    'floatingip' => %w[router_id floating_network_id port_id],
    'router' => %w[
      network_id
      external_gateway_info.network_id
      external_gateway_info.external_fixed_ips.subnet_id
      subnet_id
      port_id
    ],
    'subnet' => %w[network_id],
    'server' => %w[image.id]
  }.freeze

  class NotFound < StandardError
  end
  authentication_required domain: lambda { |c|
    c.instance_variable_get(:@scoped_domain_id)
  },
                          domain_name: lambda { |c|
                            c.instance_variable_get(:@scoped_domain_name)
                          },
                          project: lambda { |c|
                            c.instance_variable_get(:@scoped_project_id)
                          },
                          rescope: true # , except: %i[related_objects]

  before_action do
    @enforce_scope =
      if params[:enforce_scope].nil? ||
         params[:enforce_scope] =~ (/(false|f|no|n|0)$/i)
        false
      elsif params[:enforce_scope].empty? ||
            params[:enforce_scope] =~ (/(true|t|yes|y|1)$/i)
        true
      end
  end

  def index
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 30).to_i

    items =
      ObjectCache.find_objects(
        type: params[:type],
        term: params[:term],
        include_scope: true,
        paginate: {
          page: page,
          per_page: per_page
        }
      ) { |sql| where_current_token_scope(sql).order(:name) }

    render json: { items: items, total: items.total, has_next: items.has_next }
  rescue StandardError
    render json: { items: [] }
  end

  def objects_by_ids
    ids = params[:ids]
    ids = ids.split(',') if ids.is_a?(String)

    objects =
      ObjectCache.find_objects(include_scope: true) do |scope|
        where_current_token_scope(scope).where(id: ids)
      end

    render json: objects
  end

  def cache_objects
    type = params[:type]
    objects = params[:objects]

    if type && objects && objects.length > 0
      objects.map! do |o|
        o[:cached_object_type] = type
        o[:id] = o[:id] || "#{@scoped_project_id}_#{o[:name]}"
        o[:domain_id] = o[:domain_id] || @scoped_domain_id
        o[:project_id] = o[:project_id] || @scoped_project_id
        o.to_unsafe_hash
      end

      ::ObjectCache.cache_objects(objects)
    end
    head :ok
  end

  def csv
    items =
      ObjectCache.find_objects(
        type: params[:type],
        term: params[:term],
        include_scope: true,
        paginate: false
      ) { |sql| where_current_token_scope(sql).order(:name) }

    csv_string =
      CSV.generate do |csv|
        csv << [
          'Type',
          'Name',
          'ID',
          'Details',
          'Domain Name',
          'Domain ID',
          '(Parent) Project Name',
          'Project Name'
        ]
        items.each do |item|
          next unless item.payload['scope']

          csv << [
            item.cached_object_type,
            item.name,
            item.id,
            item.search_label,
            item.payload['scope']['domain_name'],
            item.payload['scope']['domain_id'],
            item.payload['scope']['project_name'],
            item.payload['scope']['project_id']
          ]
        end
      end

    filename = []
    filename << params[:type].to_s unless params[:type].blank?
    filename << params[:term].to_s unless params[:term].blank?
    filename = filename.join('_')
    filename = 'all' if filename.blank?

    send_data csv_string, filename: "#{filename}.csv"
  end

  def live_search
    data =
      begin
        api_search(services, params[:type], params[:term])
      rescue StandardError => e
        p e
        { items: [] }
      end
    render json: data
  end

  def show
    objects =
      ObjectCache.find_objects(include_scope: true) do |scope|
        where_current_token_scope(scope).where(id: params[:id])
      end

    render json: objects.first
  end

  def types
    cached_types =
      ::ObjectCache.distinct.pluck(:cached_object_type).delete_if(&:blank?)

    types = (cached_types + ObjectCache::TYPE_SEARCH_LABEL_KEYS.keys).uniq

    # filter types by policy rule (see: APP_ROOT/config/policy.json)
    types.select! do |type|
      current_user.is_allowed?('can_see_cache_type', target: { type: type })
    end

    render json: types
  end

  def domain_projects
    unless current_user.is_allowed?('cloud_admin')
      render json: { projects: [], has_next: false, total: 0 }
      return
    end

    page = (params[:page] || 1).to_i

    domain = params[:domain]
    project = params[:project]

    unless domain.blank?
      domain_ids =
        ObjectCache
        .where(cached_object_type: 'domain')
        .where(
          [
            'object_cache.name ILIKE :domain OR object_cache.id ILIKE :domain',
            { domain: "%#{domain}%" }
          ]
        )
        .pluck(:id)
    end

    items =
      ObjectCache.find_objects(
        paginate: {
          page: page,
          per_page: 30
        },
        type: 'project',
        include_scope: true
      ) do |scope|
        projects = domain_ids.nil? ? scope : scope.where(domain_id: domain_ids)
        unless project.blank?
          projects =
            projects.where(
              [
                'object_cache.name ILIKE :project OR object_cache.id ILIKE :project',
                { project: "%#{project}%" }
              ]
            )
        end
        projects
      end

    render json: {
      projects: items,
      has_next: items.has_next,
      total: items.total
    }
  end

  def users
    # Skip cache for user lookups to prevent reassigning roles to outdated/deleted users.
    # The ObjectCache may contain stale user records for users that have been deleted
    # or deactivated in the identity service. By fetching directly from the API, we ensure
    # only currently active and valid users can be found and assigned roles.
    skip_cache = !!params[:nocache]
    term = params[:term]
    domain_id = params[:domain]

    
    # Try cache first unless skip_cache is true
    items = unless skip_cache
      cached_users = ObjectCache.find_objects(
        type: 'user',
        term: params[:name] || term || '',
        include_scope: false,
        paginate: false
      ) do |scope|
        scope.where(domain_id: domain_id).order(:name)
      end
      
      # Map cached results if found
      if cached_users.present?
        cached_users.to_a.map do |u|
          {
            id: u.payload['description'],
            name: u.name,
            key: u.name,
            uid: u.id,
            full_name: u.payload['description'],
            email: u.payload['email']
          }
        end
      end
    end
    
    # If cache didn't return results, fetch from API
    if items.blank?
      # Try by ID first if term is provided
      if term.present?
        user = service_user.identity.find_user(term, format: :raw)
        if user
          items = [format_user(user)]
          render json: items
          return
        end
      end
      
      # Build filter for users query
      filter = { domain_id: domain_id }
      
      # If term provided, search by both name and description
      all_users = if term.present?
        # Get users matching name
        items_by_name = service_user.identity.users(
          filter.merge(name__contains: term),
          format: :raw
        )
        
        # Get users matching description
        items_by_description = service_user.identity.users(
          filter.merge(description__contains: term),
          format: :raw
        )
        
        # Combine and deduplicate by id
        (items_by_name + items_by_description).uniq { |u| u['id'] }
      else
        # Get all users in domain
        service_user.identity.users(filter, format: :raw)
      end
      
      # Format results
      items = all_users.map { |u| format_user(u) }
    end
    
    render json: items
  end

  def groups
    items =
      ObjectCache.find_objects(
        type: 'group',
        term: params[:name] || params[:term] || '',
        include_scope: false,
        paginate: false
      ) do |scope|
        if current_user.is_allowed?('cloud_admin')
          scope.where(domain_id: params[:domain]).order(:name)
        else
          where_current_token_scope(scope).order(:name)
        end
      end
      
    unless items.nil? || items.empty?
      items = items.to_a.map { |g| { id: g.id, name: g.name } }
    else 
      filter = {domain_id: params[:domain]}
      if params[:term]
        filter[:name__contains] = params[:term]
      end
      
      items = service_user.identity.groups(filter, format: :raw)
      if params[:term]
        group = service_user.identity.find_group(params[:term], format: :raw)
        items << group if group
      end
      items = items.map { |g| {id: g['id'], name: g['name']}}
    end

    render json: items
  end

  def projects
    items =
      ObjectCache.find_objects(
        type: 'project',
        term: params[:name] || params[:term] || '',
        include_scope: false,
        paginate: false
      ) do |scope|
        if current_user.is_allowed?('cloud_admin')
          scope.where(domain_id: params[:domain]).order(:name)
        else
          where_current_token_scope(scope).order(:name)
        end
      end

    items = items.to_a.uniq(&:name).map { |prj| { id: prj.id, name: prj.name } }

    render json: items
  end

  def related_object_values(key, payload)
    return payload.collect { |data| related_object_values(key, data) } if payload.is_a?(Array)

    if key.include?('.')
      nested_keys = key.split('.')

      data = payload
      nested_keys.each do |nested_key|
        data = related_object_values(nested_key, data) if data
      end

      return data
    end

    payload[key]
  end

  def related_objects
    unless current_user.is_allowed?('cloud_admin')
      render json: []
      return
    end

    sql = ['payload::text ILIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(params[:id])}%"]

    cached_object = ObjectCache.where(id: params[:id]).first

    if cached_object
      if cached_object.project_id
        sql[0] += ' OR id = ?'
        sql << cached_object.project_id
      end

      keys = RELATED_OBJECTS_KEYS[cached_object.cached_object_type] || []
      values =
        keys
        .collect { |key| related_object_values(key, cached_object.payload) }
        .flatten
        .uniq

      if values && values.length.positive?
        sql[0] += ' OR id IN (?)'
        sql << values
      end
    end

    render json:
             ObjectCache
               .where.not(cached_object_type: %w[error flavor], id: params[:id])
               .where(sql)
  end

  protected

  def where_current_token_scope(scope, enforce_scope = @enforce_scope)
    if !enforce_scope &&
       current_user.is_allowed?('cloud_admin_or_support_or_dns_ops')
      return scope
    end

    scope = scope.where(id: current_user.project_id) if current_user.project_id && params[:type] == 'project'

    project_id = current_user.project_id
    domain_id = current_user.project_domain_id || current_user.domain_id

    if project_id
      scope.where(
        [
          'project_id = :project_id OR id = :project_id',
          { project_id: project_id }
        ]
      )
    elsif domain_id
      project_ids =
        ObjectCache.where(
          cached_object_type: 'project',
          domain_id: domain_id
        ).pluck(:id)

      scope.where(
        [
          'domain_id = :domain_id OR id = :domain_id OR project_id IN (:project_ids)',
          { domain_id: domain_id,
            project_ids: project_ids }
        ]
      )
    else
      scope.where('domain_id IS NULL OR project_id IS NULL')
    end
  end

  private 

  def format_user(user)
    {
      id: user['description'],
      name: user['name'],
      key: user['name'],
      uid: user['id'],
      full_name: user['description'],
      email: user['email']
    }
  end
end
