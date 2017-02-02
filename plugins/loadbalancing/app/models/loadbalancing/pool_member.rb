module Loadbalancing
  class PoolMember < Core::ServiceLayer::Model
    attr_accessor :id
    validates :address, presence: true
    validates :weight, presence: true, inclusion: { in: '1'..'256' , message: "Choose a weight between 1 and 256" }
    validates :protocol_port, presence: true, inclusion: { in: '1'..'65535',  message: "Choose a port between 1 and 65535" }

    attr_accessor :in_transition

    def in_transition?
      false
    end

  end
end
