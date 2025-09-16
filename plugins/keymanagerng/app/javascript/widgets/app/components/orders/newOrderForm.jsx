import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Button, 
  Form,
  FormRow,
  TextInput,
  Select,
  SelectOption,
  Message,
  PanelBody,
  PanelFooter,
  DateTimePicker,
} from "@cloudoperators/juno-ui-components"
import { createOrder } from "../../orderActions"
import { parseError } from "../../helpers"

const NewOrderForm = ({ onSuccessfullyCloseForm, onClose }) => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: "",
    type: "key",
    algorithm: "aes",
    bit_length: 256,
    mode: "cbc",
    payload_content_type: "application/octet-stream",
    expiration: "",
  })

  const [errors, setErrors] = useState({})

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      try {
        // Extract order UUID from the response
        const orderUuid = data.order_ref ? data.order_ref.split('/').pop() : 'Unknown'
        
        // Invalidate queries to refresh the orders list (same pattern as secrets and containers)
        queryClient.invalidateQueries("orders")
        
        // Close the form
        onSuccessfullyCloseForm(orderUuid)
        
      } catch (error) {
        console.warn("Warning: Error during order creation success handler:", error)
        // Still close the form even if there's an error
        try {
          const orderUuid = data.order_ref ? data.order_ref.split('/').pop() : 'Unknown'
          onSuccessfullyCloseForm(orderUuid)
        } catch (closeError) {
          console.error("Error closing form:", closeError)
        }
      }
    },
    onError: (error) => {
      console.error("Error creating order:", error)
      setErrors({ submit: parseError(error) })
    },
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.algorithm) {
      newErrors.algorithm = "Algorithm is required"
    }

    if (!formData.bit_length || formData.bit_length < 1) {
      newErrors.bit_length = "Valid bit length is required"
    }

    // Validate bit length based on algorithm
    if (formData.algorithm === "aes" && ![128, 192, 256].includes(parseInt(formData.bit_length))) {
      newErrors.bit_length = "AES supports 128, 192, or 256 bits"
    }

    if (formData.algorithm === "rsa" && parseInt(formData.bit_length) < 1024) {
      newErrors.bit_length = "RSA requires at least 1024 bits"
    }

    if (formData.expiration) {
      const expirationDate = new Date(formData.expiration)
      const now = new Date()
      if (expirationDate <= now) {
        newErrors.expiration = "Expiration date must be in the future"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const orderData = {
      type: formData.type,
      meta: {
        name: formData.name || undefined,
        algorithm: formData.algorithm,
        bit_length: parseInt(formData.bit_length),
        mode: formData.mode,
        payload_content_type: formData.payload_content_type || undefined,
        expiration: formData.expiration || undefined,
      }
    }

    createOrderMutation.mutate(orderData)
  }

  const onConfirm = () => {
    if (!validateForm()) {
      return
    }

    const orderData = {
      type: formData.type,
      meta: {
        name: formData.name || undefined,
        algorithm: formData.algorithm,
        bit_length: parseInt(formData.bit_length),
        mode: formData.mode,
        payload_content_type: formData.payload_content_type || undefined,
        expiration: formData.expiration || undefined,
      }
    }

    createOrderMutation.mutate(orderData)
  }

  const getAlgorithmOptions = () => {
    return [
      { value: "aes", label: "AES" },
      { value: "rsa", label: "RSA" },
      { value: "des", label: "DES" },
      { value: "3des", label: "3DES" },
      { value: "hmac", label: "HMAC" },
    ]
  }

  const getModeOptions = () => {
    if (formData.algorithm === "aes") {
      return [
        { value: "cbc", label: "CBC" },
        { value: "gcm", label: "GCM" },
        { value: "ctr", label: "CTR" },
      ]
    }
    return []
  }

  const getBitLengthOptions = () => {
    if (formData.algorithm === "aes") {
      return [
        { value: 128, label: "128 bits" },
        { value: 192, label: "192 bits" },
        { value: 256, label: "256 bits" },
      ]
    }
    if (formData.algorithm === "rsa") {
      return [
        { value: 1024, label: "1024 bits" },
        { value: 2048, label: "2048 bits" },
        { value: 4096, label: "4096 bits" },
      ]
    }
    return []
  }

  return (
    <PanelBody
      footer={
        <PanelFooter>
          <Button label="Save" onClick={onConfirm} variant="primary" />
          <Button label="Cancel" onClick={onClose} />
        </PanelFooter>
      }
    >
      <Form>
        {errors.submit && (
          <Message variant="error" className="tw-mb-3">
            {errors.submit}
          </Message>
        )}

        <FormRow>
          <TextInput
            label="Name (Optional)"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter order name"
          />
        </FormRow>

        <FormRow>
          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={(value) => handleInputChange("type", value)}
            required
          >
            <SelectOption value="key">Key</SelectOption>
            <SelectOption value="asymmetric">Asymmetric</SelectOption>
          </Select>
        </FormRow>

        <FormRow>
          <Select
            label="Algorithm"
            name="algorithm"
            value={formData.algorithm}
            onChange={(value) => handleInputChange("algorithm", value)}
            invalid={errors.algorithm ? true : false}
            errortext={errors.algorithm}
            required
          >
            {getAlgorithmOptions().map(option => (
              <SelectOption key={option.value} value={option.value}>
                {option.label}
              </SelectOption>
            ))}
          </Select>
        </FormRow>

        <FormRow>
          <Select
            label="Bit Length"
            name="bit_length"
            value={formData.bit_length}
            onChange={(value) => handleInputChange("bit_length", parseInt(value))}
            invalid={errors.bit_length ? true : false}
            errortext={errors.bit_length}
            required
          >
            {getBitLengthOptions().map(option => (
              <SelectOption key={option.value} value={option.value}>
                {option.label}
              </SelectOption>
            ))}
          </Select>
        </FormRow>

        {formData.algorithm === "aes" && (
          <FormRow>
            <Select
              label="Mode"
              name="mode"
              value={formData.mode}
              onChange={(value) => handleInputChange("mode", value)}
            >
              {getModeOptions().map(option => (
                <SelectOption key={option.value} value={option.value}>
                  {option.label}
                </SelectOption>
              ))}
            </Select>
          </FormRow>
        )}

        <FormRow>
          <TextInput
            label="Payload Content Type"
            name="payload_content_type"
            value={formData.payload_content_type}
            onChange={(e) => handleInputChange("payload_content_type", e.target.value)}
            placeholder="application/octet-stream"
          />
        </FormRow>

        <FormRow>
          <DateTimePicker
            label="Expiration Date (Optional)"
            name="expiration"
            value={formData.expiration}
            onChange={(value) => {
              // Handle case where DateTimePicker returns an array instead of a single value
              const dateValue = Array.isArray(value) ? value[0] : value;
              handleInputChange("expiration", dateValue);
            }}
            invalid={errors.expiration ? true : false}
            errortext={errors.expiration}
          />
        </FormRow>
      </Form>
    </PanelBody>
  )
}

export default NewOrderForm
