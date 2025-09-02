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
  Stack,
  Label,
  PanelBody,
  PanelFooter,
} from "@cloudoperators/juno-ui-components"
import { addOrder } from "../../orderActions"
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
    mutationFn: addOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      const orderUuid = data.order_ref.split('/').pop()
      onSuccessfullyCloseForm(orderUuid)
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
        payload_content_type: formData.payload_content_type,
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
    <>
      <PanelBody>
        <Form onSubmit={handleSubmit}>
          {errors.submit && (
            <Message variant="error" className="tw-mb-3">
              {errors.submit}
            </Message>
          )}

          <FormRow>
            <Label htmlFor="name">Name (Optional)</Label>
            <TextInput
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter order name"
            />
          </FormRow>

          <FormRow>
            <Label htmlFor="algorithm">Algorithm *</Label>
            <Select
              id="algorithm"
              value={formData.algorithm}
              onChange={(e) => handleInputChange("algorithm", e.target.value)}
              error={errors.algorithm}
            >
              {getAlgorithmOptions().map(option => (
                <SelectOption key={option.value} value={option.value}>
                  {option.label}
                </SelectOption>
              ))}
            </Select>
            {errors.algorithm && (
              <div className="tw-text-red-500 tw-text-sm tw-mt-1">{errors.algorithm}</div>
            )}
          </FormRow>

          <FormRow>
            <Label htmlFor="bit_length">Bit Length *</Label>
            <Select
              id="bit_length"
              value={formData.bit_length}
              onChange={(e) => handleInputChange("bit_length", parseInt(e.target.value))}
              error={errors.bit_length}
            >
              {getBitLengthOptions().map(option => (
                <SelectOption key={option.value} value={option.value}>
                  {option.label}
                </SelectOption>
              ))}
            </Select>
            {errors.bit_length && (
              <div className="tw-text-red-500 tw-text-sm tw-mt-1">{errors.bit_length}</div>
            )}
          </FormRow>

          {formData.algorithm === "aes" && (
            <FormRow>
              <Label htmlFor="mode">Mode</Label>
              <Select
                id="mode"
                value={formData.mode}
                onChange={(e) => handleInputChange("mode", e.target.value)}
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
            <Label htmlFor="payload_content_type">Payload Content Type</Label>
            <TextInput
              id="payload_content_type"
              value={formData.payload_content_type}
              onChange={(e) => handleInputChange("payload_content_type", e.target.value)}
              placeholder="application/octet-stream"
            />
          </FormRow>

          <FormRow>
            <Label htmlFor="expiration">Expiration Date (Optional)</Label>
            <TextInput
              id="expiration"
              type="datetime-local"
              value={formData.expiration}
              onChange={(e) => handleInputChange("expiration", e.target.value)}
            />
            {errors.expiration && (
              <div className="tw-text-red-500 tw-text-sm tw-mt-1">{errors.expiration}</div>
            )}
          </FormRow>
        </Form>
      </PanelBody>
      <PanelFooter>
        <Stack direction="row" gap="2" className="tw-justify-end">
          <Button variant="outline-secondary" onClick={onClose} disabled={createOrderMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="primary" 
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
          </Button>
        </Stack>
      </PanelFooter>
    </>
  )
}

export default NewOrderForm 