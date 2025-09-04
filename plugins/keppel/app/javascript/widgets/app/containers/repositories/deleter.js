import { connect } from "react-redux"
import RepositoryDeleter from "../../components/repositories/deleter"
import { deleteRepository } from "../../actions/keppel"

export default connect(
  null,
  (dispatch, props) => {
    const { accountName, repoName } = props
    return {
      deleteRepository: () => dispatch(deleteRepository(accountName, repoName)),
    }
  }
)(RepositoryDeleter)
