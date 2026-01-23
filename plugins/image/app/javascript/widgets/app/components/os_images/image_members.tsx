/* eslint-disable no-undef */
import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import ImageMemberItem from "./image_member_item"
import ImageMemberForm from "./image_member_form"
import { FormErrors } from "lib/elektra-form/components/form_errors"

// TypeScript Interfaces
interface Image {
  id: string
  name: string
  visibility: string
  owner: string
  owner_project_name: string
}

interface ImageMember {
  member_id: string
  target_name: string
  status: string
}

interface ImageMembers {
  isFetching: boolean
  items: ImageMember[]
}

interface History {
  replace: (path: string) => void
}

interface ImageMembersModalProps {
  image: Image | null
  imageMembers: ImageMembers | null
  activeTab: string
  history: History
  loadMembersOnce: (imageId: string) => Promise<void> | void
  resetImageMembers: (imageId: string) => void
  handleSubmit: (imageId: string, memberId: string) => Promise<void>
  handleDelete: (imageId: string, memberId: string) => Promise<void>
  handleReject: (imageId: string) => Promise<void>
  handleVisibilityChange: (imageId: string, visibility: string) => void
  reloadMembers: (imageId: string) => Promise<void>
}

// FadeTransition component
const FadeTransition: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={500} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

// Main component converted to functional component
const ImageMembersModal: React.FC<ImageMembersModalProps> = ({
  image,
  imageMembers,
  activeTab,
  history,
  loadMembersOnce,
  resetImageMembers,
  handleSubmit: handleSubmitProp,
  handleDelete: handleDeleteProp,
  handleReject: handleRejectProp,
  handleVisibilityChange,
  reloadMembers,
}) => {
  // State hooks
  const [show, setShow] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // Event handlers
  const restoreUrl = () => {
    if (!show) {
      history.replace(`/os-images/${activeTab}`)
    }
  }

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const toggleForm = () => {
    setShowForm((prev) => !prev)
  }

  const handleSubmit = (imageId: string, memberId: string) => {
    return handleSubmitProp(imageId, memberId).then(() => setShowForm(false))
  }

  // Effect to load dependencies on mount and when props change
  // Replaces componentDidMount and UNSAFE_componentWillReceiveProps
  useEffect(() => {
    if (!image || image.visibility !== "shared") return

    const promise = loadMembersOnce(image.id)
    if (promise) {
      promise.catch((err) => setError(err))
    }
  }, [image, loadMembersOnce])

  // Effect to cleanup on unmount
  // Replaces componentWillUnmount
  useEffect(() => {
    return () => {
      if (image?.id) {
        resetImageMembers(image.id)
      }
    }
  }, [image?.id, resetImageMembers])

  return (
    <Modal show={show} onExited={restoreUrl} onHide={hide} bsSize="large" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Access Control for Image {image ? image.name : ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {image && image.visibility !== "shared" ? (
          <div className="alert alert-notice">
            Only shared images may contain members
            <br />
            {policy.isAllowed("image:image_visibility_to_shared", {
              image,
            }) && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleVisibilityChange(image.id, "shared")
                }}
              >
                Set to shared
              </a>
            )}
          </div>
        ) : (
          <>
            {error && <FormErrors errors={error as any} />}
            {!imageMembers || imageMembers.isFetching ? (
              <div>
                <span className="spinner" />
                Loading...
              </div>
            ) : (
              <table className="table share-rules">
                <thead>
                  <tr>
                    <th>Owner Project</th>
                    <th>Target Project</th>
                    <th className="snug">Status</th>
                    <th className="actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {!imageMembers || imageMembers.items.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No members found.</td>
                    </tr>
                  ) : (
                    imageMembers.items.map((member, index) => (
                      <ImageMemberItem
                        key={index}
                        member={member}
                        image={image}
                        handleDelete={() => handleDeleteProp(image!.id, member.member_id)}
                        handleReject={() => handleRejectProp(image!.id).then(() => reloadMembers(image!.id))}
                      />
                    ))
                  )}

                  {policy.isAllowed("image:member_create", {
                    image: image,
                  }) && (
                    <tr>
                      <td>
                        <TransitionGroup>
                          {showForm && (
                            <FadeTransition>
                              <ImageMemberForm handleSubmit={(memberId: string) => handleSubmit(image!.id, memberId)} />
                            </FadeTransition>
                          )}
                        </TransitionGroup>
                      </td>
                      <td></td>
                      <td></td>
                      <td>
                        <a
                          className={`btn btn-${showForm ? "default" : "primary"} btn-sm pull-right`}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleForm()
                          }}
                        >
                          <i className={`fa ${showForm ? "fa-close" : "fa-plus"}`} />
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ImageMembersModal
