# frozen_string_literal: true

module Lbaas2
  module Loadbalancers
    class ListenersController < ::AjaxController
      authorization_context "lbaas2"
      authorization_required

      def index
        limit = (params[:limit] || 9).to_i
        sort_key = (params[:sort_key] || "name")
        sort_dir = (params[:sort_dir] || "asc")
        pagination_options = {
          sort_key: sort_key,
          sort_dir: sort_dir,
          limit: limit + 1,
        }
        pagination_options[:marker] = params[:marker] if params[:marker]
        listeners =
          services.lbaas2.listeners(
            { loadbalancer_id: params[:loadbalancer_id] }.merge(
              pagination_options,
            ),
          )
        # extend listener data with chached data
        extend_listener_data(listeners)

        render json: {
                 listeners: listeners,
                 has_next: listeners.length > limit,
                 limit: limit,
                 sort_key: sort_key,
                 sort_dir: sort_dir,
               }
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def show
        listener = services.lbaas2.find_listener(params[:id])
        # extend listener data with chached data
        extend_listener_data([listener])
        render json: { listener: listener }
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def create
        # add project id and filter params
        newParams =
          parseListenerParams.merge(
            project_id: @scoped_project_id,
            loadbalancer_id: params[:loadbalancer_id],
          )
        listener = services.lbaas2.new_listener(newParams)

        if listener.save
          audit_logger.info(current_user, "has created", listener)
          extend_listener_data([listener])
          render json: listener
        else
          render json: { errors: listener.errors }, status: 422
        end
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def update
        newParams = parseListenerParams
        listener = services.lbaas2.new_listener(newParams)

        if listener.update
          audit_logger.info(current_user, "has updated", listener)
          extend_listener_data([listener])
          render json: listener
        else
          render json: { errors: listener.errors }, status: 422
        end
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def destroy
        listener = services.lbaas2.new_listener
        listener.id = params[:id]

        if listener.destroy
          audit_logger.info(current_user, "has deleted", listener)
          head 202
        else
          render json: { errors: listener.errors }, status: 422
        end
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def itemsWithoutDefaultPoolForSelect
        listeners =
          services
            .lbaas2
            .listeners({ loadbalancer_id: params[:loadbalancer_id] })
            .keep_if { |l| l.default_pool_id.blank? }
        select_listeners =
          listeners.map do |listener|
            {
              label: "#{listener.name || listener.id} (#{listener.protocol})",
              value: listener.id,
              protocol: listener.protocol,
            }
          end

        render json: { listeners: select_listeners }
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      def itemsForSelect
        listeners =
          services.lbaas2.listeners(
            { loadbalancer_id: params[:loadbalancer_id] },
          )
        select_listeners =
          listeners.map do |listener|
            {
              label: "#{listener.name || listener.id} (#{listener.protocol})",
              value: listener.id,
              protocol: listener.protocol,
            }
          end

        render json: { listeners: select_listeners }
      rescue Elektron::Errors::ApiResponse => e
        render json: { errors: e.message }, status: e.code
      rescue Exception => e
        render json: { errors: e.message }, status: "500"
      end

      protected

      def extend_listener_data(listeners)
        listeners.each do |listener|
          # get cached listeners
          listener.l7policies = [] if listener.l7policies.blank?
          listener.cached_l7policies =
            ObjectCache
              .where(id: listener.l7policies.map { |l| l[:id] })
              .each_with_object({}) { |l, map| map[l[:id]] = l }

          # get insert headers with true value
          insert_headers = listener.insert_headers || {}
          listener.insert_headers =
            insert_headers.select { |_key, value| value == "true" }.keys
        end
      end

      def parseListenerParams
        listenerParams = params[:listener]
        # clear array with empty objects because backend can't deal with it
        unless listenerParams["sni_container_refs"].blank?
          listenerParams["sni_container_refs"].reject!(&:empty?)
        end
        # add boolean strings to the insert headers
        insert_headers = listenerParams[:insert_headers] || []
        octavia_headers = {}
        insert_headers.each { |h| octavia_headers[h.to_sym] = "true" }
        listenerParams[:insert_headers] = octavia_headers
        # parse to int
        unless listenerParams[:protocol_port].blank?
          listenerParams[:protocol_port] = listenerParams[:protocol_port].to_i
        end

        listenerParams
      end
    end
  end
end
