# Keymanagerng

This README serves as a central location for plugin-specific information, including setup instructions, configurations, usage examples, or any other relevant details specific to this plugin.

## Features

The Keymanagerng plugin provides a modern web interface for managing OpenStack Barbican secrets, containers, and orders.

### Secrets Management
- View and manage cryptographic secrets
- Create new secrets with various algorithms and parameters
- Download secret payloads
- Delete secrets

### Containers Management
- View and manage secret containers
- Create new containers
- Delete containers

### Orders Management (New Feature)
- Create and manage secret orders for asynchronous secret generation
- Track order status (Pending, Active, Error, Completed)
- View order details and specifications
- Navigate to generated secrets once orders are completed
- Delete orders

## Orders Feature

The Orders feature allows users to request the generation of cryptographic secrets with specific parameters through OpenStack Barbican's order API. This provides a controlled, asynchronous method for creating complex cryptographic materials.

### Order Creation
Users can create orders with the following parameters:
- **Name** (optional): A human-readable name for the order
- **Algorithm**: AES, RSA, DES, 3DES, HMAC
- **Bit Length**: Varies by algorithm (128/192/256 for AES, 1024/2048/4096 for RSA)
- **Mode**: CBC, GCM, CTR (for AES algorithms)
- **Payload Content Type**: MIME type for the generated secret
- **Expiration Date** (optional): When the order should expire

### Order Status Tracking
Orders have the following statuses:
- **PENDING**: Order is being processed
- **ACTIVE**: Order completed successfully, secret generated
- **ERROR**: Order failed to process
- **COMPLETED**: Order completed successfully

### Order-Secret Relationship
- When an order is completed, a secret is generated and linked to the order
- Users can navigate from a completed order to view the generated secret
- Deleting an order does not delete the generated secret
- Deleting a secret does not delete the order, but the order becomes unusable

## Usage

### Accessing the Plugin
1. Navigate to the Key Manager in your dashboard
2. Use the tabs to switch between Secrets, Containers, and Orders

### Creating an Order
1. Click on the "Orders" tab
2. Click "Create Order" button
3. Fill in the required fields:
   - Select an algorithm (AES, RSA, etc.)
   - Choose appropriate bit length
   - Select mode if applicable
   - Optionally add a name and expiration date
4. Click "Create Order"

### Managing Orders
- View all orders in the Orders list
- Click on an order to view detailed information
- Use the Actions dropdown to:
  - View order details
  - View generated secret (if completed)
  - Delete the order
- Monitor order status through the status badges

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'keymanagerng'
```

And then execute:

```bash
$ bundle
```

Or install it yourself as:

```bash
$ gem install keymanagerng
```

## API Integration

The plugin integrates with OpenStack Barbican's REST API:
- **Orders Endpoint**: `/v1/orders`
- **Secrets Endpoint**: `/v1/secrets`
- **Containers Endpoint**: `/v1/containers`

All API calls are made through the OpenStack service layer with proper authentication and authorization.

## Contributing

Contribution directions go here.
