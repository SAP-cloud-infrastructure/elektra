import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react"
import { Form } from "react-bootstrap"
import { Tooltip } from "lib/components/Overlay"
import { useFormState, useFormDispatch, generateMemberItem } from "./FormState"
import NewEditMemberListItem from "./NewEditMemberListItem"
import uniqueId from "lodash/uniqueId"
import { Link } from "react-router-dom"
import { ErrorsList } from "lib/elektra-form"
import { addNotice } from "lib/flashes"
import useMember, {
  validateForm,
  formAttrForSubmit,
} from "../../lib/hooks/useMember"
import usePool from "../../lib/hooks/usePool"
import { errorMessage } from "../../helpers/commonHelpers"

const AddNewMemberButton = ({ disabled, addMembersCallback }) => {
  return (
    <>
      {disabled ? (
        <Tooltip
          placement="top"
          content="You reach the maximum of 5 new members"
        >
          <Link
            to={""}
            className="btn btn-secondary btn-xs"
            disabled={true}
            onClick={(e) => {
              e.preventDefault()
            }}
          >
            Add another
          </Link>
        </Tooltip>
      ) : (
        <Link
          to={""}
          className="btn btn-secondary btn-xs"
          onClick={(e) => {
            e.preventDefault()
            addMembersCallback()
          }}
        >
          Add another
        </Link>
      )}
    </>
  )
}

const NewMemberForm = (
  { loadbalancerID, poolID, servers, onFormCallback },
  ref
) => {
  const state = useFormState()
  const dispatch = useFormDispatch()
  const [formErrors, setFormErrors] = useState(null)
  const { create, persistMembers } = useMember()
  const { persistPool } = usePool()

  useEffect(() => {
    if (loadbalancerID && poolID) {
      addMembers()
    }
  }, [loadbalancerID, poolID])

  const addMembers = () => {
    const item = generateMemberItem()
    dispatch({
      type: "ADD_ITEM",
      item: item,
    })
  }

  useImperativeHandle(ref, () => ({
    onSubmit() {
      if (!validateForm(state.items)) {
        return onFormCallback({ isSubmitting: false, isValid: false })
      }
      // transform values since batch update do no use model. Empty values should be nil and id when creating
      // should not be send
      const memberItems = formAttrForSubmit(state.items, "create")
      setFormErrors(null)
      onFormCallback({ isSubmitting: true, isValid: true })
      return create(loadbalancerID, poolID, memberItems)
        .then((response) => {
          onFormCallback({ isSubmitting: true, isValid: false })
          if (response && response.data) {
            if (state.items.length == 1) {
              addNotice(
                <>
                  Member <b>{response.data.name}</b> ({response.data.id}) is
                  being created.
                </>
              )
            } else {
              addNotice(<>Members are being created.</>)
            }
          }
          // update pool info
          persistPool(loadbalancerID, poolID)
          // reload members list if batch update
          if (state.items.length > 1) {
            persistMembers(loadbalancerID, poolID)
          }
          onFormCallback({ shouldClose: true })
        })
        .catch((error) => {
          onFormCallback({ isSubmitting: false, isValid: true })
          setFormErrors(errorMessage(error))
        })
    },
  }))

  useEffect(() => {
    return onFormCallback({
      isSubmitting: false,
      isValid: validateForm(state.items),
    })
  }, [JSON.stringify(state.items)])

  return (
    <Form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      {formErrors && (
        <div className="alert alert-error">
          <ErrorsList errors={formErrors} />
        </div>
      )}

      <div className="new-members-container">
        <div className="new-members">
          {state.items.length > 0 ? (
            <>
              {state.items.map((member, index) => (
                <NewEditMemberListItem
                  id={member.id}
                  key={member.id}
                  index={index}
                  servers={servers}
                />
              ))}
            </>
          ) : (
            <p>No new members added yet.</p>
          )}

          <div className="add-more-section">
            <AddNewMemberButton
              disabled={state.items.length > 4}
              addMembersCallback={addMembers}
            />
          </div>
        </div>
      </div>
    </Form>
  )
}

export default forwardRef(NewMemberForm)
