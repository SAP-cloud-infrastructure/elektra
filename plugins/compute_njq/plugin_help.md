#### Servers

##### Creating new servers

By default, newly created servers are not accessible from outside their deployment network. To create a VM with external access, follow these steps:

1. Create a new VM instance: As you'll likely want to log in via SSH eventually, ensure you create or import an SSH public key (if you haven't already) and specify it during VM creation. Note that you cannot add a key to an existing VM later.

2. Once the instance is created and assigned an IP from the private network, associate a Floating IP with the instance. Before doing this, you'll need to allocate one to your project from the External network pool.

3. The instance is now accessible via the assigned Floating IP. However, during creation (unless specified otherwise), it was assigned to your project's Default security group. Before you can access the instance via SSH or ping it, ensure the security group has rules allowing ingress for TCP port 22 and/or ICMP Type 8 Code 0, respectively. Corresponding egress rules are also required.

4. You should now be able to access the instance via SSH using the command: ssh [user]@[floating ip]. In most cases, the user is 'ccloud' (for CoreOS, use 'core'). On older images (before March 2017), the user depends on the image operating system: for Ubuntu use 'ubuntu', for Cirros use 'cirros', for RHEL use 'fedora', and for SLES use 'root'. Ensure your SSH client is using the private key corresponding to the public key you assigned during machine creation.
