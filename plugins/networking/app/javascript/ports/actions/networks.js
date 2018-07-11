import * as constants from '../constants';
import { pluginAjaxHelper } from 'ajax_helper';
import { confirm } from 'lib/dialogs';
import { addNotice, addError } from 'lib/flashes';

import { ErrorsList } from 'lib/elektra-form/components/errors_list';

const ajaxHelper = pluginAjaxHelper('networking')

//################### NETWORKS #########################
const requestNetworks= () =>
  ({
    type: constants.REQUEST_NETWORKS,
    requestedAt: Date.now()
  })
;

const requestNetworksFailure= () => ({type: constants.REQUEST_NETWORKS_FAILURE});

const receiveNetworks= (json) =>
  ({
    type: constants.RECEIVE_NETWORKS,
    networks: json,
    receivedAt: Date.now()
  })
;

const fetchNetworks= () =>
  function(dispatch,getState) {
    dispatch(requestNetworks());

    return ajaxHelper.get('/ports/networks').then( (response) => {
      if (!response.data.errors) {
        dispatch(receiveNetworks(response.data.networks));
      }
    })
    .catch( (error) => {
      dispatch(requestNetworksFailure());
    });
  }
;

const shouldFetchNetworks= function(state) {
  if (state.networks.isFetching || state.networks.requestedAt) {
    return false;
  } else {
    return true;
  }
};

const fetchNetworksIfNeeded= () =>
  function(dispatch, getState) {
    if (shouldFetchNetworks(getState())) { return dispatch(fetchNetworks()); }
  }
;

export {
  fetchNetworksIfNeeded
}
