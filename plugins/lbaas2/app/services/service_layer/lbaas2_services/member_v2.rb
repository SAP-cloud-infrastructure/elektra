module ServiceLayer
  module Lbaas2Services
    module MemberV2
      def member_map
        @member_map ||= class_map_proc(::Lbaas2::Member)
      end

      def members(id, filter = {})
        elektron_lb2.get("pools/#{id}/members", filter).map_to(
          "body.members",
          &member_map
        )
      end

      def find_member(pool_id, member_id)
        elektron_lb2.get("pools/#{pool_id}/members/#{member_id}").map_to(
          "body.member",
          &member_map
        )
      end

      def new_member(attributes = {})
        member_map.call(attributes)
      end

      # do not remove the parameter additive_only, this would remove existing members and save the ones send per body
      def batch_update_members(pool_id, members)
        elektron_lb2.put("pools/#{pool_id}/members?additive_only=true") do
          members
        end
      end

      ################# INTERFACE METHODS ######################

      def create_member(pool_id, params)
        elektron_lb2
          .post("pools/#{pool_id}/members") { { member: params } }
          .body[
          "member"
        ]
      end

      def update_member(pool_id, member_id, params)
        elektron_lb2
          .put("pools/#{pool_id}/members/#{member_id}") { { member: params } }
          .body[
          "member"
        ]
      end

      def delete_member(pool_id, member_id)
        elektron_lb2.delete("pools/#{pool_id}/members/#{member_id}")
      end
    end
  end
end
