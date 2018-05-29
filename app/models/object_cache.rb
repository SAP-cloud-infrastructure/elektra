class ObjectCache < ApplicationRecord
  self.table_name = 'object_cache'
  ATTRIBUTE_KEYS = %w[name project_id domain_id cached_object_type].freeze

  belongs_to :project, class_name: 'ObjectCache', primary_key: 'id',
                       foreign_key: 'project_id', optional: true
  belongs_to :domain, class_name: 'ObjectCache', primary_key: 'id',
                      foreign_key: 'domain_id', optional: true

  @cache_objects_mutex = Mutex.new
  @cache_object_mutex = Mutex.new

  def self.cache_objects(objects)
    # create a id => object map
    id_object_map = objects.each_with_object({}) { |o, map| map[o['id']] = o }
    # load already cached object ids with payload
    registered_ids = where(id: id_object_map.keys).pluck(:id, :payload)

    # Devide objects in to be created and updated
    objects_to_be_updated = {}
    objects_to_be_created = []

    id_object_map.each do |id, data|
      attributes = object_attributes(data)
      index = registered_ids.index { |id_payload| id_payload[0] == id }

      if index # object is already registered
        if (registered_ids[index][1])
          # merge old payload with the new one
          attributes[:payload] = registered_ids[index][1].merge(attributes[:payload])
        end
        objects_to_be_updated[id] = attributes
      else
        objects_to_be_created << attributes.merge(id: data['id'])
      end
    end

    @cache_objects_mutex.synchronize do
      # update all objects at once
      transaction do
        update(objects_to_be_updated.keys, objects_to_be_updated.values)
      end

      # create all objects at once
      transaction do
        create(objects_to_be_created)
      end
    end
  end

  def self.cache_object(data)
    attributes = object_attributes(data)
    id = data['id']

    @cache_object_mutex.synchronize do
      transaction do
        item = find_by_id(id)
        if item
          item.update(attributes)
        else
          item = create(attributes.merge(id: id))
        end
        item
      end
    end
  end

  # search for objects by a term
  def self.search(args)
    return where(args) if args.is_a?(Hash)
    return nil unless args.is_a?(String)
    where(
      [
        'id ILIKE :term or name ILIKE :term or project_id ILIKE :term or ' \
        "domain_id ILIKE :term or payload::json->>'description' ilike :term",
        term: "%#{args}%"
      ]
    )
  end

  # Advanced search method with block. If a block is given then it is
  # called by passing scope into it.
  # options:
  # => :term a search string
  # => :type a string which identifies the type of objects
  # => :include_scope a boolean
  # => :paginate is a hash of :page, :per_page
  # Example: find_objects(
  #            term: 'D0', type: 'user', include_scope: true,
  #            paginate: {page: 1, per_page: 30}
  #          ) { |scope| scope.where(name: 'Mustermann') }
  # Returns an Array of found objects. If paginate options is provided then
  # it adds a "total" and "has_next" methods to it.
  def self.find_objects(options = {})
    scope = ObjectCache.all
    # reduce scope to objects with the given type
    unless options[:type].blank?
      scope = scope.where(cached_object_type: options[:type])
    end

    # search objects by term
    scope = scope.search(options[:term]) unless options[:term].blank?
    # include associations domain and project (two more queries)
    scope = scope.includes(:domain, project: :domain) if options[:include_scope]
    scope = yield scope if block_given?

    if options[:paginate]
      page = (options[:paginate][:page] || 1).to_i
      per_page = (options[:paginate][:per_page] || 30).to_i

      objects = scope.limit(per_page + 1).offset((page - 1) * per_page)
      total = objects.except(:offset, :limit, :order).count
      has_next = objects.length > per_page
      objects = objects.to_a
      objects.pop if has_next

      extend_object_payload_with_scope(objects) if options[:include_scope]
      objects.define_singleton_method(:total) { total }
      objects.define_singleton_method(:has_next) { has_next }
    else
      objects = scope.respond_to?(:to_a) ? scope.to_a : [scope]
      extend_object_payload_with_scope(objects) if options[:include_scope]
    end
    objects
  end

  def self.object_attributes(data)
    data['project_id'] = data['project_id'] || data['tenant_id']
    data.select do |k, v|
      ATTRIBUTE_KEYS.include?(k) && !v.blank?
    end.merge(payload: data)
  end

  def self.extend_object_payload_with_scope(objects)
    objects.each do |obj|
      project = obj.cached_object_type == 'project' ? obj : obj.project
      domain = project ? project.domain : obj.domain

      obj.payload['scope'] = {
        'domain_id' => domain ? domain.id : nil,
        'domain_name' => domain ? domain.name : nil
      }

      if obj.cached_object_type == 'project'
        # type of object is project -> use parent project data for scope
        if obj.payload['parent_id'] != obj.payload['domain_id']
          # parent project is presented
          obj.payload['scope']['project_id'] = obj.payload['parent_id']
          obj.payload['scope']['project_name'] = obj.payload['parent_name']
        end
      else
        # object belongs to a project
        obj.payload['scope']['project_id'] = project ? project.id : nil
        obj.payload['scope']['project_name'] = project ? project.name : nil
      end
    end
  end
end
