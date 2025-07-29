import { connect } from  'react-redux';
import { configureAutoscaling } from '../../../actions/castellum';
import CastellumConfigurationEditModal from '../../../components/castellum/configuration/edit';

export default connect(
  state => ({
    config: (state.castellum || {})['resources'],
  }),
  dispatch => ({
    configureAutoscaling: (projectID, shareType, cfg) => dispatch(configureAutoscaling(projectID, shareType, cfg)),
  }),
)(CastellumConfigurationEditModal);
