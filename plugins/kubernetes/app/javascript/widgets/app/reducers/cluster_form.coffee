import * as constants from "../constants"
########################## CLUSTER FORM ###########################
# TODO: remove hardcoded flavor selection
initialClusterFormState =
  method: 'post'
  action: ''
  data: {
    name: ''
    spec: {
      nodePools: [
        {
          flavor: 'm1.small'
          image: ''
          name: ''
          size: ''
          availabilityZone: ''
          new: true
          config: {
            allowReboot: true
            allowReplace: true
          }
        }
      ]
      openstack: {}
      sshPublicKey: ''
      keyPair: ''
      version: null
    }
    status: {
      nodePools: []
    }
  }
  isSubmitting: false
  errors: null
  isValid: false
  nodePoolsValid: false
  advancedOptionsValid: true
  updatePending: false
  advancedOptionsVisible: false




resetClusterForm = (state, {}) ->
  initialClusterFormState

updateClusterForm = (state, {name, value}) ->
  data = ReactHelpers.mergeObjects({}, state.data, {"#{name}":value})
  ReactHelpers.mergeObjects({}, state, {
    data: data
    errors: null
    isSubmitting: false
    updatePending: true
    isValid: (data.name.length > 0 && state.nodePoolsValid && state.advancedOptionsValid)
  })

updateAdvancedValue = (state, {name, value}) ->
  dataClone = JSON.parse(JSON.stringify(state.data))
  dataClone.spec.openstack[name] = value
  ReactHelpers.mergeObjects({},state,{
    data: dataClone
    updatePending: true
  })

changeVersion = (state, {value}) ->
  dataClone = JSON.parse(JSON.stringify(state.data))
  dataClone.spec.version = value
  ReactHelpers.mergeObjects({}, state, {
    data: dataClone
    updatePending: true
  })

updateSSHKey = (state, {value}) ->
  dataClone = JSON.parse(JSON.stringify(state.data))
  dataClone.spec.sshPublicKey = value
  ReactHelpers.mergeObjects({},state,{
    data: dataClone
    updatePending: true
  })

updateKeyPair = (state, {value}) ->
  dataClone = JSON.parse(JSON.stringify(state.data))
  dataClone.spec.keyPair = value
  ReactHelpers.mergeObjects({},state,{
    data: dataClone
    updatePending: true
  })

updateNodePoolForm = (state, {index, name, value}) ->
  nodePool = if /allowReboot|allowReplace/.test(name) 
              configClone = JSON.parse(JSON.stringify(state.data.spec.nodePools[index].config))
              configClone[name] = value
              ReactHelpers.mergeObjects({}, state.data.spec.nodePools[index], {config: configClone})
            else 
              ReactHelpers.mergeObjects({}, state.data.spec.nodePools[index], {"#{name}":value})

  nodePoolsClone = state.data.spec.nodePools.slice(0)
  if index>=0 then nodePoolsClone[index] = nodePool else nodePoolsClone.push nodePool
  stateClone = JSON.parse(JSON.stringify(state))
  stateClone.data.spec.nodePools = nodePoolsClone
  poolValidity = nodePool.name.length > 0 && nodePool.size >= 0 && nodePool.flavor.length > 0 && nodePool.availabilityZone.length > 0
  
  ReactHelpers.mergeObjects(state, stateClone, {
    nodePoolsValid: poolValidity
    isValid: (state.data.name.length > 0 && poolValidity && state.advancedOptionsValid)
    updatePending: true
  })


addNodePool = (state, {defaultAZ}) ->
  # TODO: remove hardcoded flavor selection
  newPool = {
              flavor: 'm1.small'
              image: ''
              name: ''
              size: ''
              availabilityZone: defaultAZ
              config: {
                allowReboot: true
                allowReplace: true
              }
              new: true
            }

  nodePoolsClone = state.data.spec.nodePools.slice(0)
  nodePoolsClone.push newPool
  stateClone = JSON.parse(JSON.stringify(state))
  stateClone.data.spec.nodePools = nodePoolsClone
  stateClone.updatePending = true
  stateClone.isValid = false
  stateClone.nodePoolsValid = false
  ReactHelpers.mergeObjects({}, state, stateClone)



deleteNodePool = (state, {index}) ->
  # remove pool with given index
  deletedPool = state.data.spec.nodePools[index]
  updateNeeded = if deletedPool.new then false else true
  nodePoolsFiltered = state.data.spec.nodePools.filter((pool) -> pool != deletedPool )
  stateClone = JSON.parse(JSON.stringify(state))
  stateClone.data.spec.nodePools = nodePoolsFiltered
  stateClone.updatePending = updateNeeded
  ReactHelpers.mergeObjects({}, state, stateClone)



submitClusterForm = (state, {})->
  ReactHelpers.mergeObjects({}, state, {
    isSubmitting: true
    errors: null
  })

prepareClusterForm = (state, {action, method, data})->
  values =
    method: method
    action: action
    errors: null
  values['data'] = data if data
  # deep copy spec
  values.data.spec = ReactHelpers.mergeObjects({}, initialClusterFormState.data.spec, data.spec) if data

  # validity check
  if data
    nodePoolsValid = true
    for nodePool in data.spec.nodePools
      unless nodePool.name.length > 0 && nodePool.size >= 0 && nodePool.flavor.length > 0 && nodePool.availabilityZone && nodePool.availabilityZone.length > 0
        nodePoolsValid = false

    values['isValid'] = data.name.length > 0 && nodePoolsValid && state.advancedOptionsValid

  ReactHelpers.mergeObjects({}, initialClusterFormState,values)


clusterFormFailure=(state, {errors})->
  ReactHelpers.mergeObjects({}, state, {
    isSubmitting: false
    errors: errors
  })

toggleAdvancedOptions=(state, {})->
  optionsVisible = state.advancedOptionsVisible
  ReactHelpers.mergeObjects({}, state, {
    advancedOptionsVisible: !optionsVisible
  })

setClusterFormDefaultVersion = (state, {info}) ->
  stateClone = JSON.parse(JSON.stringify(state))
  stateClone.data.spec.version = info.defaultClusterVersion
  ReactHelpers.mergeObjects({},state,stateClone)


setClusterFormDefaults = (state, {metaData}) ->
  # set default values in cluster form
  defaults = {}
  # router -> network -> subnet chain
  if metaData.routers?
    router = metaData.routers[0]
    defaults.routerID = if router? then router.id else ""

    if router.networks?
      network = router.networks[0]
      defaults.networkID = if network? then network.id else ""

      if network.subnets?
        defaults.lbSubnetID = if network.subnets[0]? then network.subnets[0].id else ""

  # securityGroups
  if metaData.securityGroups?
    defaults.securityGroupName = if metaData.securityGroups[0] then metaData.securityGroups[0].name else ""

  # ensure already selected values aren't overwritten by the defaults
  dataMerged = ReactHelpers.mergeObjects({},defaults,state.data.spec.openstack)


  # keyPair
  keyPair = ''
  if metaData.keyPairs?
    sshPublicKey = state.data.spec.sshPublicKey
    if sshPublicKey? && sshPublicKey.length > 0
      index = ReactHelpers.findIndexInArray(metaData.keyPairs, sshPublicKey, 'publicKey')
      if index >= 0
        # in this case the key belongs to a key pair
        keyPair = sshPublicKey
      else
        # in this case the key is a key that can't be found in the user's key pairs
        keyPair = 'other'


  # nodepools set default AZ
  nodePoolsClone = []
  if metaData.availabilityZones?
    defaultAZName = metaData.availabilityZones[0].name
    nodePoolsClone = state.data.spec.nodePools
    for pool in nodePoolsClone
      unless pool.availabilityZone && pool.availabilityZone.length > 0
        pool.availabilityZone = defaultAZName


  stateClone = JSON.parse(JSON.stringify(state))
  stateClone.data.spec.openstack = dataMerged
  stateClone.data.spec.keyPair = keyPair
  stateClone.data.spec.nodePools = nodePoolsClone
  ReactHelpers.mergeObjects({},state,stateClone)



clusterForm = (state = initialClusterFormState, action) ->
  switch action.type
    when constants.RESET_CLUSTER_FORM                   then resetClusterForm(state,action)
    when constants.UPDATE_CLUSTER_FORM                  then updateClusterForm(state,action)
    when constants.UPDATE_NODE_POOL_FORM                then updateNodePoolForm(state,action)
    when constants.ADD_NODE_POOL                        then addNodePool(state,action)
    when constants.DELETE_NODE_POOL                     then deleteNodePool(state,action)
    when constants.SUBMIT_CLUSTER_FORM                  then submitClusterForm(state,action)
    when constants.PREPARE_CLUSTER_FORM                 then prepareClusterForm(state,action)
    when constants.CLUSTER_FORM_FAILURE                 then clusterFormFailure(state,action)
    when constants.FORM_TOGGLE_ADVANCED_OPTIONS         then toggleAdvancedOptions(state,action)
    when constants.FORM_UPDATE_ADVANCED_VALUE           then updateAdvancedValue(state,action)
    when constants.FORM_CHANGE_VERSION                  then changeVersion(state,action)
    when constants.FORM_UPDATE_SSH_KEY                  then updateSSHKey(state,action)
    when constants.FORM_UPDATE_KEY_PAIR                 then updateKeyPair(state,action)
    when constants.SET_CLUSTER_FORM_DEFAULTS            then setClusterFormDefaults(state,action)
    when constants.SET_CLUSTER_FORM_DEFAULT_VERSION     then setClusterFormDefaultVersion(state,action)
    else state

export default clusterForm