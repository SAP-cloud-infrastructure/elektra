import React, { useState, useEffect, useRef } from "react"
import { SearchField } from "lib/components/search_field"
import MembersTable from "./MembersTable"
import { filterItems } from "../../lib/hooks/useMember"
import { useGlobalState } from "../StateProvider"
import { formErrorMessage } from "../../helpers/commonHelpers"

const ExistingMembersDropDown = (props, poolID) => {
  const state = useGlobalState().members
  const [showExistingMembers, setShowExistingMembers] = useState(false)
  const [searchTerm, setSearchTerm] = useState(null)
  const [filteredItems, setFilteredItems] = useState([])

  useEffect(() => {
    const newItems = filterItems(searchTerm, state.items)
    setFilteredItems(newItems)
  }, [searchTerm, state.items])

  return (
    <div className="existing-members">
      <div className="display-flex">
        <div
          className="action-link"
          onClick={() => setShowExistingMembers(!showExistingMembers)}
          data-bs-toggle="collapse"
          data-bs-target="#collapseExistingMembers"
          aria-expanded={showExistingMembers}
          aria-controls="collapseExistingMembers"
        >
          {showExistingMembers ? (
            <>
              <span>Hide existing members</span>
              <i className="fa fa-chevron-circle-up" />
            </>
          ) : (
            <>
              <span>Show existing members</span>
              <i className="fa fa-chevron-circle-down" />
            </>
          )}
        </div>
      </div>

      <div className="collapse" id="collapseExistingMembers">
        <div className="toolbar searchToolbar">
          <SearchField
            value={searchTerm}
            onChange={(term) => setSearchTerm(term)}
            placeholder="Name, ID, IPs or ports"
            text="Searches by Name, ID, IPs or protocols."
          />
        </div>

        <MembersTable
          members={filteredItems}
          props={props}
          poolID={poolID}
          searchTerm={searchTerm}
          isLoading={state.isLoading}
        />
        {state.error ? (
          <span className="text-danger">{formErrorMessage(state.error)}</span>
        ) : (
          ""
        )}
      </div>
    </div>
  )
}

export default ExistingMembersDropDown
