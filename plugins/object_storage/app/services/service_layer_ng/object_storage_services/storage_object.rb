# frozen_string_literal: true

module ServiceLayerNg
  module ObjectStorageServices
    # implements Openstack SWIFT API
    module StorageObject
      # OBJECTS #

      OBJECTS_ATTRMAP = {
        # name in API response => name in our model (that is part of this class's interface)
        'bytes'         => 'size_bytes',
        'content_type'  => 'content_type',
        'hash'          => 'md5_hash',
        'last_modified' => 'last_modified_at',
        'name'          => 'path',
        'subdir'        => 'path', # for subdirectories, only this single attribute is given
      }

      OBJECT_ATTRMAP = {
        'content-length' => 'size_bytes',
        'content-type'   => 'content_type',
        'etag'           => 'md5_hash',
        'last-modified'  => 'last_modified_at',
        'x-timestamp'    => 'created_at',
        'x-delete-at'    => 'expires_at',
      }

      OBJECT_WRITE_ATTRMAP = {
        # name in our model => name in create/update API request
        'content_type'   => 'Content-Type',
        # 'expires_at'     => 'X-Delete-At', # this is special-cased in update_object()
      }

      def object_map
        @object_map ||= class_map_proc(ObjectStorage::Object)
      end

      def object_metadata(container_name,object_path)
        return nil if container_name.blank? || object_path.blank?
        response = elektron_object_storage.head(
          "#{container_name}/#{object_path}"
        )
        data = extract_object_header_data(response,container_name, object_path)
        object_map.call(data)
      end

      def object_content(container_name, object_path)
        body = elektron_object_storage.get(
          "#{container_name}/#{object_path}"
        ).body
        # default behavior from misty -> converts returned json to an object
        # normaly thats fine but in some cases we want to download a json file
        # from the object storage if thats the case convert it back to json
        return body if body.is_a?(String)
        body.to_json
      end

      def list_objects(container_name, options={})
        # prevent prefix and delimiter with slash, if this happens
        # an empty list is returned
        if options[:prefix] == '/' && options[:delimiter] == '/'
          options[:prefix] = ''
        end

        list = elektron_object_storage.get(container_name, options).body
        result = list.map! do |o|
          object = map_attribute_names(o, OBJECTS_ATTRMAP)
          # path also serves as id() for Core::ServiceLayer::Model
          object['id'] = object['path']
          object['container_name'] = container_name
          if object.key?('last_modified_at')
            # parse date
            object['last_modified_at'] = DateTime.iso8601(
              object['last_modified_at']
            )
          end
          object
        end
        result
      end

      def list_objects_at_path(container_name, object_path, filter = {})
        object_path += '/' if !object_path.end_with?('/') && !object_path.empty?
        result = list_objects(
          container_name, filter.merge(prefix: object_path, delimiter: '/')
        )
        # if there is a pseudo-folder at `object_path`, it will be in the result, too;
        # filter this out since we only want stuff below `object_path`
        objects = result.reject { |obj| obj['id'] == object_path }
        objects.collect { |data| object_map.call(data) }
      end

      def list_objects_below_path(container_name, object_path, filter={})
        list_objects(container_name, filter.merge(prefix: object_path))
          .collect { |data| object_map.call(data) }
      end

      def copy_object(source_container_name, source_path, target_container_name, target_path, options = {})
        header_attrs = {
          'Destination' => "/#{target_container_name}/#{target_path}"
        }.merge(options)
        elektron_object_storage.copy(
          "#{source_container_name}/#{source_path}",
          headers: stringify_header_values(header_attrs)
        )
      end

      def move_object(source_container_name, source_path, target_container_name, target_path, options = {})
        copy_object(source_container_name, source_path, target_container_name, target_path, options.merge(with_metadata: true))
        delete_object(source_container_name, source_path)
      end

      def bulk_delete(targets)
        capabilities = list_capabilities
        if capabilities.attributes.key?('bulk_delete')
          # https://docs.openstack.org/swift/latest/middleware.html#bulk-delete
          # assemble the request object_list containing the paths to all targets
          object_list = ''
          targets.each do |target|
            unless target.key?(:container)
              raise ArgumentError, "malformed target #{target.inspect}"
            end
            object_list += target[:container]
            if target.key?(:object)
              object_list += '/' + target[:object]
            end
            object_list += "\n"
          end

          elektron_object_storage.post(
            '',
            'bulk-delete' => true, headers: { 'Content-Type' => 'text/plain' }
          ) { object_list }
        else
          targets.each do |target|
            unless target.key?(:container)
              raise ArgumentError, "malformed target #{target.inspect}"
            end

            if target.key?(:object)
              delete_object(target[:container], target[:object])
            else
              delete_container(target[:container])
            end
          end
        end
      end

      def create_object(container_name, object_path, contents)
        object_path = sanitize_path(object_path)

        # content type "application/directory" is needed on pseudo-dirs for
        # staticweb container listing to work correctly
        header_attrs = {}
        if object_path.end_with?('/')
          header_attrs['Content-Type'] = 'application/directory'
        end
        header_attrs['Content-Type'] = ''
        # Note: `contents` is an IO object to allow for easy future expansion to
        # more clever upload strategies (e.g. SLO); for now, we just send
        # everything at once
        elektron_object_storage.put(
          "#{container_name}/#{object_path}",
          headers: stringify_header_values(header_attrs)
        ) { contents.read }
      end

      def delete_object(container_name, object_path)
        elektron_object_storage.delete("#{container_name}/#{object_path}")
        # return nil because nothing usable is returned from the API
        return nil
      end

      def update_object(object_path, params)
        container_name = params[:container_name]
        header_attrs = map_attribute_names(params, OBJECT_WRITE_ATTRMAP)

        unless params['expires_at'].nil?
          header_attrs['x-delete-at'] = params['expires_at'].getutc.strftime('%s')
        end

        (params['metadata'] || {}).each do |key, value|
          header_attrs["x-object-meta-#{key}"] = value
        end

        # stringify keys and values
        header_attrs.deep_merge!(header_attrs) { |_, _, v| v.to_s }
        header_attrs.stringify_keys!

        elektron_object_storage.post(
          "#{container_name}/#{object_path}", headers: header_attrs
        )
        # return nil because nothing usable is returned from the API
        nil
      end

      def create_folder(container_name, object_path)
        # a pseudo-folder is created by writing an empty object at its path, with
        # a "/" suffix to indicate the folder-ness
        elektron_object_storage.put(
          "#{container_name}/#{sanitize_path(object_path)}/",
          headers: { 'Content-Type' => 'application/directory' }
        )
      end

      def delete_folder(container_name, object_path)
        targets = list_objects_below_path(
          container_name, sanitize_path(object_path) + '/'
        ).map do |obj|
          { container: container_name, object: obj.path }
        end
        bulk_delete(targets)
      end

      protected

      def extract_object_header_data(response, container_name = nil, object_path = nil)
        header_hash = map_attribute_names(extract_header_data(response), OBJECT_ATTRMAP)
        header_hash['id']               = header_hash['path'] = object_path
        header_hash['container_name']   = container_name
        header_hash['public_url']       = public_url(container_name, object_path)
        header_hash['last_modified_at'] = DateTime.httpdate(header_hash['last_modified_at']) # parse date
        header_hash['created_at']       = DateTime.strptime(header_hash['created_at'], '%s') # parse UNIX timestamp
        header_hash['expires_at']       = DateTime.strptime(header_hash['expires_at'], '%s') if header_hash.key?('expires_at') # optional!
        header_hash['metadata']         = extract_metadata_data(extract_header_data(response), 'x-object-meta-')
        header_hash
      end
    end
  end
end
