import { connect } from "react-redux"
import SecurityScanPoliciesEditModal from "../../components/security_scan_policies/edit"
import {
  fetchSecurityScanPoliciesIfNeeded,
  putSecurityScanPolicies,
} from "../../actions/keppel"

export default connect(
  (state, props) => {
    const { account: accountName } = props.match.params
    const extraProps = {
      account: (state.keppel.accounts.data || []).find(
        (a) => a.name == accountName
      ),
      policies: state.keppel.securityPoliciesFor[accountName] || {},
    }

    return extraProps
  },
  (dispatch, props) => {
    const { account: accountName } = props.match.params
    return {
      loadPoliciesOnce: () =>
        dispatch(fetchSecurityScanPoliciesIfNeeded(accountName)),
      putPolicies: (...args) =>
        dispatch(putSecurityScanPolicies(accountName, ...args)),
    }
  }
)(SecurityScanPoliciesEditModal)
