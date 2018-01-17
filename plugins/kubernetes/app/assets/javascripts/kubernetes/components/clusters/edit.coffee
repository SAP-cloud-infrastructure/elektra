#= require components/form_helpers
#= require kubernetes/components/clusters/advancedoptions


{ div,form,input,textarea,h4, h5,label,span,button,abbr,select,option,optgroup,p,i,a } = React.DOM
{ connect } = ReactRedux
{ updateClusterForm, addNodePool, deleteNodePool, updateNodePoolForm, submitClusterForm, requestDeleteCluster, AdvancedOptions, toggleAdvancedOptions, updateSSHKey, updateKeyPair } = kubernetes


EditCluster = ({
  close,
  clusterForm,
  metaData,
  handleSubmit,
  handleChange,
  handleNodePoolChange,
  handleNodePoolAdd,
  handleNodePoolRemove,
  handleClusterDelete,
  handleAdvancedOptionsToggle,
  handleSSHKeyChange,
  handleKeyPairChange
}) ->
  cluster = clusterForm.data
  spec    = cluster.spec

  div null,
    div className: 'modal-body',
      if clusterForm.errors
        div className: 'alert alert-error', React.createElement ReactFormHelpers.Errors, errors: clusterForm.errors

      form className: 'form form-horizontal',
        # Name
        div className: "form-group string  cluster_name" ,
          label className: "string col-sm-4 control-label", htmlFor: "name",
            'Cluster Name'
          div className: "col-sm-8",
            div className: "input-wrapper",
              input
                className: "string form-control disabled",
                disabled: 'disabled',
                type: "text",
                name: "name",
                value: cluster.name || ''



        # Keypair
        div null,
          div className: "form-group required string" ,
            label className: "string required col-sm-4 control-label", htmlFor: "keypair",
              ' Key Pair'
            div className: "col-sm-8",
              div className: "input-wrapper",
                select
                  name: "keypair",
                  className: "select form-control",
                  value: (spec.keyPair || ''),
                  onChange: ((e) -> handleKeyPairChange(e.target.value)),

                    if metaData.keyPairs?
                      optgroup label: "Choose from personal keys or provide other",
                        option value: '', "None"

                        for keyPair in metaData.keyPairs
                          option value: keyPair.publicKey, key: keyPair.name, keyPair.name

                        option value: 'other', "Other"
                    else
                      option value: '', "Loading..."

        # SSH Public Key
        if metaData.keyPairs? && spec.keyPair == 'other'
          div null,
            div className: "form-group string" ,
              label className: "string required col-sm-4 control-label", htmlFor: "sshkey",
                ' SSH Public Key'
              div className: "col-sm-8",
                div className: "input-wrapper",
                  textarea
                    name: "sshkey",
                    className: "form-control",
                    value: (spec.sshPublicKey || ''),
                    onChange: ((e) -> handleSSHKeyChange(e.target.value)),
                    rows: 6,
                    placeholder: 'Please paste any valid SSH public key'



        p className: 'u-clearfix',
          a className: 'pull-right', onClick: ((e) => e.preventDefault(); handleAdvancedOptionsToggle()), href: '#',
            "#{if clusterForm.advancedOptionsVisible then 'Hide ' else ''}Advanced Options"

        if clusterForm.advancedOptionsVisible
            React.createElement AdvancedOptions, clusterForm: clusterForm, metaData: metaData, edit: true


      div className: 'toolbar toolbar-controlcenter',
        h4 null, "Nodepools"
        div className: 'main-control-buttons',
          button className: 'btn btn-primary', onClick: ((e) => e.preventDefault(); handleNodePoolAdd()),
            'Add Pool'

      for nodePool, index in cluster.spec.nodePools

        div className: 'nodepool-form', key: "nodepool-#{index}",
          form className: 'form form-inline form-inline-flex',
            h5 className: 'title', "Pool #{index+1}:"
            # Nodepool name
            div className: "form-group required string" ,
              label className: "string required control-label", htmlFor: "name",
                'Name '
                abbr title: "required", '*'


              input
                className: "string form-control",
                "data-index": index,
                disabled: 'disabled' if nodePool.name && !nodePool.new,
                type: "text",
                name: "name",
                placeholder: "lower case letters and numbers",
                value: nodePool.name || '',
                onChange: ((e) -> e.preventDefault; handleNodePoolChange(e.target.dataset.index, e.target.name, e.target.value))


            # Nodepool size
            div className: "form-group string" ,
              label className: "string control-label", htmlFor: "size",
                'Size '
                abbr title: "required", '*'

              input
                className: "string form-control",
                "data-index": index,
                type: "number",
                name: "size",
                placeholder: "Number of nodes",
                value: (if isNaN(nodePool.size) then '' else nodePool.size),
                onChange: ((e) -> e.preventDefault; handleNodePoolChange(e.target.dataset.index, e.target.name, parseInt(e.target.value, 10)))

            # Nodepool flavor
            div className: "form-group string" ,
              label className: "string control-label", htmlFor: "flavor",
                'Flavor '
                abbr title: "required", '*'


              select
                name: "flavor",
                "data-index": index,
                className: "string form-control",
                disabled: 'disabled' if nodePool.flavor && !nodePool.new,
                value: (nodePool.flavor || ''),
                onChange: ((e) -> e.preventDefault; handleNodePoolChange(e.target.dataset.index, e.target.name, e.target.value)),

                  if !metaData.loaded || (metaData.error? && metaData.errorCount <= 20)
                    option value: '', 'Loading...'
                  else
                    if metaData.flavors?
                      for flavor in metaData.flavors
                        flavorMetaData = if flavor.ram? && flavor.vcpus? then "(ram: #{flavor.ram}, vcpus: #{flavor.vcpus})" else ""
                        option value: flavor.name, key: flavor.name, "#{flavor.name} #{flavorMetaData}"


            button
              className: 'btn btn-default',
              "data-index": index,
              disabled: 'disabled' unless nodePool.new,
              onClick: ((e) -> e.preventDefault(); handleNodePoolRemove(e.target.dataset.index)),
                span className: "fa #{if nodePool.new then 'fa-trash' else 'fa-lock'}"





    div className: 'modal-footer',
      button className: 'btn btn-default hover-danger pull-left btn-icon-text', onClick: ((e) -> e.preventDefault(); close(); handleClusterDelete(cluster.name)),
        i className: 'fa fa-fw fa-trash-o'
        'Delete Cluster'

      button role: 'close', type: 'button', className: 'btn btn-default', onClick: close, 'Close'
      React.createElement ReactFormHelpers.SubmitButton,
        label: 'Update',
        loading: clusterForm.isSubmitting,
        disabled: !(clusterForm.isValid && clusterForm.updatePending)
        onSubmit: (() -> handleSubmit(close))

EditCluster = connect(
  (state) ->
    clusterForm: state.clusterForm
    metaData: state.metaData

  (dispatch) ->
    handleChange:               (name, value)         -> dispatch(updateClusterForm(name, value))
    handleAdvancedOptionsToggle:()                    -> dispatch(toggleAdvancedOptions())
    handleNodePoolChange:       (index, name, value)  -> dispatch(updateNodePoolForm(index, name, value))
    handleNodePoolAdd:          ()                    -> dispatch(addNodePool())
    handleNodePoolRemove:       (index)               -> dispatch(deleteNodePool(index))
    handleSubmit:               (callback)            -> dispatch(submitClusterForm(callback))
    handleClusterDelete:        (clusterName)         -> dispatch(requestDeleteCluster(clusterName))
    handleSSHKeyChange:         (value)               -> dispatch(updateSSHKey(value))
    handleKeyPairChange:        (value)               -> dispatch(updateKeyPair(value))




)(EditCluster)

kubernetes.EditClusterModal = ReactModal.Wrapper('Edit Cluster', EditCluster,
  large: true,
  closeButton: false,
  static: true
)
