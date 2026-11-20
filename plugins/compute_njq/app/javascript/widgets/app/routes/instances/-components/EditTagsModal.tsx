import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useInstanceDetailQuery } from "../../../hooks/useInstanceQueries"
import { useSetInstanceTagsMutation } from "../../../hooks/useSetInstanceTagsMutation"

interface EditTagsModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

interface TagRowProps {
  tag: string
  busy: boolean
  // Returns true if the rename is accepted (unique, non-empty); the row leaves
  // edit mode only then, so an invalid value keeps the input open.
  onRename: (next: string) => boolean
  onRemove: () => void
}

// One tag as a table row. Mirrors the legacy server_tags Item: a pencil enters
// inline edit (seeded with the current value, Enter/check saves, × cancels), and
// a trash click asks for inline confirmation (confirm/cancel) before removing.
function TagRow({ tag, busy, onRename, onRemove }: TagRowProps) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [value, setValue] = useState(tag)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    const next = value.trim()
    if (!next) return
    if (next === tag || onRename(next)) setEditing(false)
  }
  const cancelEdit = () => {
    setValue(tag)
    setEditing(false)
  }

  return (
    <tr>
      <td>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className="form-control"
            value={value}
            disabled={busy}
            aria-label={`edit ${tag}`}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                save()
              } else if (e.key === "Escape") {
                cancelEdit()
              }
            }}
          />
        ) : (
          <span className="juno-badge juno-badge-info juno-badge-lg">
            <i className="fa fa-tag" /> {tag}
          </span>
        )}
      </td>
      <td className="text-end">
        <div className="btn-group">
          {editing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label={`cancel editing ${tag}`}
                onClick={cancelEdit}
              >
                <i className="fa fa-times" />
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm"
                aria-label={`save ${tag}`}
                disabled={busy || !value.trim()}
                onClick={save}
              >
                <i className="fa fa-check" />
              </button>
            </>
          ) : confirming ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label={`keep ${tag}`}
                onClick={() => setConfirming(false)}
              >
                <i className="fa fa-times" />
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                aria-label={`confirm delete ${tag}`}
                disabled={busy}
                onClick={onRemove}
              >
                <i className="fa fa-check" /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label={`edit ${tag}`}
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                <i className="fa fa-pencil" />
              </button>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                aria-label={`delete ${tag}`}
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                <i className="fa fa-trash" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

// Edit Tags: a live tag manager modeled on the legacy server_tags widget. The
// current tags are read from the instanceDetail query (the authoritative source,
// warm when opened from the detail modal, fetched on open from the list menu).
// Add (button or Enter), inline rename (pencil), and delete (trash + confirm)
// each persist immediately via the whole-set setTags mutation — there is no
// batch Save step. The mutation optimistically patches instanceDetail(id).tags,
// so the list updates instantly and reconciles against Nova on settle.
export function EditTagsModal({ instance, apiClient, onClose }: EditTagsModalProps) {
  const queryClient = useQueryClient()
  const detailQuery = useInstanceDetailQuery(apiClient, instance.id)
  const mutation = useSetInstanceTagsMutation(apiClient, queryClient)
  const [input, setInput] = useState("")

  const tags = detailQuery.data?.tags ?? []
  const loading = detailQuery.isLoading && !detailQuery.data
  const busy = mutation.isPending

  const persist = (next: string[]) => mutation.mutate({ id: instance.id, tags: next })

  const addTag = () => {
    const t = input.trim()
    setInput("")
    if (!t || tags.includes(t) || busy) return
    persist([...tags, t])
  }

  const renameTag = (from: string, to: string): boolean => {
    if (busy || tags.includes(to)) return false
    persist(tags.map((t) => (t === from ? to : t)))
    return true
  }

  const removeTag = (tag: string) => {
    if (busy) return
    persist(tags.filter((t) => t !== tag))
  }

  return (
    <Modal
      show
      onHide={onClose}
      dialogClassName="modal-lg"
      bsClass="compute-njq modal"
      aria-labelledby="edit-tags-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="edit-tags-title">Edit Tags</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="input-group mb-3">
          <input
            id="edit-tags-input"
            type="text"
            className="form-control"
            placeholder="Add a tag"
            aria-label="Add tag"
            value={input}
            autoFocus
            disabled={busy || loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || loading || !input.trim()}
            onClick={addTag}
          >
            <i className="fa fa-plus fa-fw" /> Add
          </button>
        </div>
        {loading ? (
          <span className="spinner" role="status" aria-label="loading tags" />
        ) : tags.length === 0 ? (
          <p className="text-muted mb-0">No tags found.</p>
        ) : (
          <table className="table table-striped table-align-center mb-0">
            <tbody>
              {tags.map((tag) => (
                <TagRow
                  key={tag}
                  tag={tag}
                  busy={busy}
                  onRename={(next) => renameTag(tag, next)}
                  onRemove={() => removeTag(tag)}
                />
              ))}
            </tbody>
          </table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}
