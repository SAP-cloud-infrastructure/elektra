import React from "react"
import {
  Button,
  Form,
  FormRow,
  TextInput,
  ButtonRow,
  Textarea,
  DateTimePicker,
  Checkbox,
} from "@cloudoperators/juno-ui-components"

export function NewForm({ onSubmit, onCancel, setError }) {
  const [formData, setFormData] = React.useState({})

  return (
    <Form>
      <FormRow>
        <TextInput
          label="Name"
          name="name"
          helptext="Enter a unique name for the credential."
          required
          onChange={(oEvent) => {
            setFormData({ ...formData, name: oEvent.target.value })
          }}
        />
      </FormRow>
      <FormRow>
        <Textarea
          label="Description"
          name="description"
          helptext="Provide a brief description of the credential."
          onChange={(oEvent) => {
            setFormData({ ...formData, description: oEvent.target.value })
          }}
        />
      </FormRow>
      <FormRow>
        <Checkbox
          label="Unrestricted"
          name="unrestricted"
          helptext="Unrestricted application credentials may be used for the creation or destruction of other application credentials or trusts"
          onChange={(oEvent) => {
            setFormData({ ...formData, unrestricted: oEvent.target.checked })
          }}
        />
      </FormRow>
      <FormRow>
        <DateTimePicker
          label="Expires At"
          placeholder="Unlimited"
          name="expires_at"
          helptext="Select expiration date and time, after which the credential will no longer be valid. If not set, the credential will not expire."
          onChange={(selectedDate) => {
            const currentDate = new Date()
            let selectedDateTime = new Date(selectedDate)
            if (isNaN(selectedDateTime.getTime())) {
              return
            } else if (selectedDateTime < currentDate) {
              setError("Selected date is in the past")
              return
            } else {
              selectedDateTime.setHours(23, 59, 59)
              // Update formData with the selected date and time
              // I need to use the function call because I need to access the previous state
              // to avoid overwriting other fields
              setFormData((prevFormData) => {
                const updatedFormData = { ...prevFormData, expires_at: selectedDateTime.toISOString() }
                //console.log("FormData before update:", prevFormData)
                //console.log("FormData after update:", updatedFormData)
                return updatedFormData
              })
            }
          }}
        />
      </FormRow>
      <ButtonRow>
        <Button label="Save" onClick={() => onSubmit(formData)} variant="primary" data-target="save-secret-btn" />
        <Button label="Cancel" onClick={onCancel} />
      </ButtonRow>
    </Form>
  )
}
