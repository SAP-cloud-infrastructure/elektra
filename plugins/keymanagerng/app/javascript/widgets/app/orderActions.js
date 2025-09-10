import apiClient from "./apiClient"

export const getOrders = ({ queryKey }) => {
  const [_key, paginationOptions] = queryKey
  return fetchOrders(paginationOptions)
}

export const fetchOrders = (options) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/orders", {
      params: {
        ...options,
        sort: "created:desc",
      },
    })
    .then((response) => {
      return response?.data
    })
}

export const getOrder = ({ queryKey }) => {
  const [_key, uuid] = queryKey
  return fetchOrder(uuid)
}

export const fetchOrder = (uuid) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/orders/" + uuid)
    .then((response) => {
      return response?.data
    })
    .catch((error) => {
      return error
    })
}

// Function to find the order that generated a specific secret
export const findOrderBySecretRef = ({ queryKey }) => {
  const [_key, secretRef] = queryKey
  return fetchOrderBySecretRef(secretRef)
}

export const fetchOrderBySecretRef = (secretRef) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/orders", {
      params: {
        limit: 1000, // Large limit to get all orders
        sort: "created:desc",
      },
    })
    .then((response) => {
      const orders = response?.data?.orders || []
      
      // Find the order with matching secret_ref
      const matchingOrder = orders.find(order => 
        order.secret_ref && order.secret_ref.includes(secretRef)
      )
      
      return matchingOrder || null
    })
    .catch((error) => {
      console.error("Error finding order by secret ref:", error)
      return null
    })
}

export const delOrder = ({ queryKey }) => {
  const [_key, uuid] = queryKey
  return deleteOrder(uuid)
}

export const deleteOrder = (delObj) => {
  return apiClient
    .osApi("key-manager")
    .delete(`v1/orders/${delObj.id}`)
    .then((response) => {
      return response?.data
    })
}

export const addOrder = ({ queryKey }) => {
  const [_key, formData] = queryKey
  return createOrder(formData)
}

export const createOrder = (formData) => {
  return apiClient
    .osApi("key-manager")
    .post("v1/orders", formData)
    .then((response) => {
      return response?.data
    })
} 