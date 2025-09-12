export const getOrderUuid = (order) => {
  if (!order || !order.order_ref) return null
  
  // If order_ref is already just an ID (no slashes), return it as is
  if (!order.order_ref.includes('/')) {
    return order.order_ref
  }
  
  // Extract the ID from the full URL path
  // order_ref format: https://keymanager-3.qa-de-1.cloud.sap:443/v1/orders/37b31b20-5ece-4eae-af6f-03d63e0b9d34
  // We want: 37b31b20-5ece-4eae-af6f-03d63e0b9d34
  return order.order_ref.split('/').pop()
}

export const getOrderName = (order) => {
  if (!order || !order.meta) return ""
  
  // Return the name from meta.name, or empty string if null/undefined
  return order.meta.name || ""
}
