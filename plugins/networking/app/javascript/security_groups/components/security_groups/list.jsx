import { Link } from 'react-router-dom';
import { DefeatableLink } from 'lib/components/defeatable_link';
import { SearchField } from 'lib/components/search_field';
import SecurityGroupItem from './item';
import { AjaxPaginate } from 'lib/components/ajax_paginate';

export default class List extends React.Component {
  componentWillReceiveProps(nextProps) {
    // load dependencies unless already loaded
    this.loadDependencies(nextProps)
  }

  componentDidMount() {
    // load dependencies unless already loaded
    this.loadDependencies(this.props)
  }

  loadDependencies = (props) => {
    props.loadSecurityGroupsOnce()
  }

  filterItems = () => {
    return this.props.securityGroups.items || []
  }


  render() {
    if(!policy.isAllowed("networking:security_group_list")) {
      return <span>You are not allowed to see this page</span>
    }

    const items = this.filterItems()
    const {isFetching,hasNext,loadNext} = this.props.securityGroups

    return (
      <React.Fragment>
        <div className='toolbar'>
          <SearchField
            onChange={(term) => console.log('search for',term)}
            placeholder='ID, name or description'
            text='Searches by ID, name or description in visible security group list only.
                  Entering a search term will automatically start loading the next pages
                  and filter the loaded items using the search term. Emptying the search
                  input field will show all currently loaded items.'/>

          <div className="main-buttons">
            {policy.isAllowed("networking:security_group_create") &&
              <DefeatableLink
                to='/new'
                className='btn btn-primary'>
                New Security Group
              </DefeatableLink>
            }
          </div>
        </div>

        <table className='table shares'>
          <thead>
            <tr>
              <th>Name / ID</th>
              <th>Description</th>
              <th className='snug'></th>
            </tr>
          </thead>
          <tbody>
            { items && items.length>0 ?
              items.map( (securityGroup, index) =>
                <SecurityGroupItem
                  key={index}
                  securityGroup={securityGroup}
                  handleDelete={this.props.handleDelete}
                />
              )
              :
              <tr>
                <td colSpan="4">
                  { isFetching ?
                    <span className='spinner'/>
                    :
                    'No security groups found.'
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        {/*<AjaxPaginate
          hasNext={this.props.securityGroups.hasNext}
          isFetching={this.props.securityGroups.isFetching}
          onLoadNext={this.props.securityGroups.loadNext}/>
        */}
      </React.Fragment>
    )
  }
}
