import { connect } from  'react-redux';
import CastellumOperationsList from '../../components/castellum/operations_list';
import { fetchCastellumDataIfNeeded } from '../../actions/castellum';
import { deleteShare, forceDeleteShare } from '../../actions/shares';
import { CASTELLUM_RECENTLY_SUCCEEDED } from '../../constants';

const path = CASTELLUM_RECENTLY_SUCCEEDED.endpoint;
export default connect(
  state => ({
    operations: (state.castellum || {})[CASTELLUM_RECENTLY_SUCCEEDED.key],
    shares:     (state.shares || {}).items,
  }),
  dispatch => ({
    loadOpsOnce: (projectID) =>
      dispatch(fetchCastellumDataIfNeeded(projectID, path.concat(`?project=${projectID}`), CASTELLUM_RECENTLY_SUCCEEDED.key)),
    handleDelete:      (shareID) => dispatch(deleteShare(shareID)),
    handleForceDelete: (shareID) => dispatch(forceDeleteShare(shareID))
  }),
)(CastellumOperationsList);
