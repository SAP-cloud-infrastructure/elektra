import { useEffect, useMemo } from 'react'
import usePool from '../../../lib/hooks/usePool'
import {DefeatableLink} from 'lib/components/defeatable_link';
import PoolItem from './PoolItem'
import queryString from 'query-string'
import { Link } from 'react-router-dom';
import HelpPopover from '../shared/HelpPopover'
import useCommons from '../../../lib/hooks/useCommons'
import { useGlobalState } from '../StateProvider'
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { addError } from 'lib/flashes';

const PoolList = ({props, loadbalancerID}) => {
  const {persistPool, persistPools, setSearchTerm, setSelected, onSelectPool} = usePool()
  const {searchParamsToString} = useCommons()
  const state = useGlobalState().pools

  useEffect(() => {  
    persistPools(loadbalancerID, null).then((data) => {
      selectPool(data)
    }).catch( error => {
      // TODO
    })
  }, [loadbalancerID]);

  const selectPool = (data) => {
    const values = queryString.parse(props.location.search)
    const id = values.pool
    if (id) {
      // check if id belows to the lb object
      const index = data.pools.findIndex((item) => item.id==id);
      if (index>=0) {
        // pool was selected
        setSelected(id)
        // filter the pool list to show just the one item
        setSearchTerm(id)
      } else {
        addError(<React.Fragment>Pool <b>{id}</b> not found.</React.Fragment>)
      }
    }
  }

  const restoreUrl = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onSelectPool(props)
  }

  const loadNext = event => {
    if(!state.isLoading && state.hasNext) {
      persistPools(loadbalancerID, state.marker)
    }
  }

  const error = state.error
  const hasNext = state.hasNext
  const items = state.items
  const selected = state.selected
  const searchTerm = state.searchTerm

  const filterItems = (searchTerm, items) => {
    if(!searchTerm) return items;
    // filter items      
    if (selected) {
      return items.filter((i) =>
        i.id == searchTerm.trim()
      )
    } else {
      const regex = new RegExp(searchTerm.trim(), "i");
      return items.filter((i) =>
      `${i.id} ${i.name} ${i.description}`.search(regex) >= 0
    )
    }
  }

  const pools = filterItems(searchTerm, items)
  const isLoading = state.isLoading

  return useMemo(() => {
    console.log("RENDER pool list")
    return ( 
      <div className="details-section">
        <div className="display-flex">
          <h4>Pools</h4>
          <HelpPopover text="Object representing the grouping of members to which the listener forwards client requests. Note that a pool is associated with only one listener, but a listener might refer to several pools (and switch between them using layer 7 policies)." />
        </div>
        
        {error ?
          <ErrorPage headTitle="Load Balancers Pools" error={error}/>
          :
          <React.Fragment>

            <div className='toolbar'>
              { selected &&
                <Link className="back-link" to="#" onClick={restoreUrl}>
                  <i className="fa fa-chevron-circle-left"></i>
                  Back to Pools
                </Link>
              }

              <div className="main-buttons">
                {!selected &&
                  <DefeatableLink
                    disabled={isLoading}
                    to={`/loadbalancers/${loadbalancerID}/pools/new?${searchParamsToString(props)}`}
                    className='btn btn-primary'>
                    New Pool
                  </DefeatableLink>
                }
              </div>
            </div>
            
            <table className={selected ? "table table-section pools" : "table table-hover pools"}>
              <thead>
                  <tr>
                    <th>
                      <div className="display-flex">
                        Name
                        <div className="margin-left">
                        <OverlayTrigger placement="top" overlay={<Tooltip id="defalult-pool-tooltip">Sorted by Name ASC</Tooltip>}>
                          <i className="fa fa-sort-asc" />
                        </OverlayTrigger>  
                        </div>
                        /ID/Description
                      </div>
                    </th>
                    <th>State/Prov. Status</th>
                    <th>Tags</th>
                    <th>Algorithm</th>
                    <th>Protocol</th>
                    <th>Session Persistence</th>
                    <th>Assigned to</th>
                    <th>TLS enabled/Secrets</th>
                    <th>#Members</th>
                    <th className='snug'></th>
                  </tr>
              </thead>
              <tbody>
                {pools && pools.length>0 ?
                  pools.map( (pool, index) =>
                    <PoolItem
                    props={props} 
                    pool={pool} 
                    searchTerm={searchTerm} 
                    key={index} 
                    disabled={selected ? true : false}
                    />
                  )
                  :
                  <tr>
                    <td colSpan="9">
                      { isLoading ? <span className='spinner'/> : 'No pools found.' }
                    </td>
                  </tr>  
                }
              </tbody>
            </table>  

          </React.Fragment>
        }
      </div>
    );
  } , [ JSON.stringify(pools), error, isLoading, searchTerm, selected, props])
}
 
export default PoolList
;