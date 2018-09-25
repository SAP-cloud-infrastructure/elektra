import { connect } from  'react-redux';
import AttachVolumeModal from '../../components/volumes/attach';
import {attachVolume,fetchVolume} from '../../actions/volumes';
import { fetchNextServers } from '../../actions/servers'

export default connect(
  (state,ownProps ) => {
    let volume;
    let id = ownProps.match && ownProps.match.params && ownProps.match.params.id

    if (id) {
      volume = state.volumes.items.find(item => item.id == id)
    }
    return { volume, id, servers: state.servers }
  },
  (dispatch,ownProps) => {
    let id = ownProps.match && ownProps.match.params && ownProps.match.params.id
    return {
      attachVolume: (values) => id ? dispatch(attachVolume(id, values.server_id)) : null,
      loadVolume: () => id ? dispatch(fetchVolume(id)) : null,
      loadNextServers:() => dispatch(fetchNextServers())
    }
  }
)(AttachVolumeModal);
