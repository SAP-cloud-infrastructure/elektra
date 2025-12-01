module Image
  module Ng
    class MembersController < ::Image::ApplicationController
      before_action :find_member, only: %i[accept reject]
      def index
        members =
          services
            .image
            .members(params[:image_id])
            .map do |member|
              project =
                FriendlyIdEntry.find_project(
                  @scoped_domain_id,
                  member.member_id,
                )
              member.target_name = project.name if project
              member
            end
        render json: { members: members }
      rescue => e
        render json: { errors: e.message }
      end

      def create
        @image = services.image.find_image(params[:image_id])
        @member =
          services.image.new_member(
            image_id: @image.id,
            member: params[:member_id],
          )

        if @member.save
          cached_project = ObjectCache.where(id: params[:member_id]).first
          @member.target_name = cached_project.name if cached_project
          render json: @member
        else
          render json: { errors: @member.errors }
        end
      end

      def destroy
        @member =
          services.image.new_member(
            image_id: params[:image_id],
            member_id: params[:id],
          )
        if @member.destroy
          head :no_content
        else
          render json: { errors: @member.errors }
        end
      end

      # accept suggested image
      def accept
        if @member.errors.empty? && @member.accept
          @image = services.image.find_image(@member.image_id)
          render json: @image
        else
          render json: { errors: @member.errors }
        end
      end

      # reject suggested image
      def reject
        if @member.errors.empty? && @member.reject
          @image = services.image.find_image(@member.image_id)
          render json: @image
        else
          render json: { errors: @member.errors }
        end
      end

      protected

      def find_member
        @member = services.image.new_member(image_id: params[:image_id])

        members = services.image.members(params[:image_id])
        @member =
          members.find do |m|
            m.member_id == @scoped_project_id && (m.status == "pending" || m.status == "accepted") 
          end

        if @member.member_id.blank?
          @member.errors.add(member_id: "Could not find project")
        end
      end
    end
  end
end
