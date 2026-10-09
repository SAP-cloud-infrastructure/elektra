import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// React-19-compatible drop-in replacement for react-bootstrap@0.33 Modal.
// Emits Bootstrap 3 modal markup (single role="dialog", backdrop, .modal-dialog >
// .modal-content) via a portal to document.body, and unmounts cleanly on close
// (the 0.33 version renders nested role="dialog" nodes and leaks on close under
// React 19). Compound API mirrors react-bootstrap: Modal.Header/Title/Body/Footer.

type BackdropOption = boolean | "static"

interface ModalProps {
  show?: boolean
  onHide?: () => void
  onExited?: () => void
  onExit?: () => void
  onEnter?: () => void
  dialogClassName?: string
  className?: string
  // react-bootstrap 0.33 class prefix (default "modal"). Extra tokens like
  // "lbaas2 modal" are prefixed onto the modal/dialog/content classes so legacy
  // callers and the `.lbaas2.modal-dialog` scoping keep working.
  bsClass?: string
  size?: "lg" | "sm" | "large" | "small" | string
  bsSize?: "lg" | "sm" | "large" | "small" | string
  backdrop?: BackdropOption
  keyboard?: boolean
  animation?: boolean
  "aria-labelledby"?: string
  children?: React.ReactNode
}

const normalizeSize = (size?: string): string => {
  switch (size) {
    case "lg":
    case "large":
      return "modal-lg"
    case "sm":
    case "small":
      return "modal-sm"
    default:
      return ""
  }
}

interface HeaderProps {
  closeButton?: boolean
  onHide?: () => void
  children?: React.ReactNode
}

const ModalHeader: React.FC<HeaderProps> = ({ closeButton, onHide, children }) => (
  <div className="modal-header">
    {children}
    {closeButton && <button type="button" className="btn-close" aria-label="Close" onClick={onHide} />}
  </div>
)

interface TitleProps {
  id?: string
  className?: string
  children?: React.ReactNode
}

const ModalTitle: React.FC<TitleProps> = ({ id, className, children }) => (
  <h4 id={id} className={["modal-title", className].filter(Boolean).join(" ")}>
    {children}
  </h4>
)

const ModalBody: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={["modal-body", className].filter(Boolean).join(" ")}>{children}</div>
)

const ModalFooter: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={["modal-footer", className].filter(Boolean).join(" ")}>{children}</div>
)

interface ModalComponent extends React.FC<ModalProps> {
  Header: typeof ModalHeader
  Title: typeof ModalTitle
  Body: typeof ModalBody
  Footer: typeof ModalFooter
}

// Inject onHide into a Modal.Header child so its close button can trigger onHide.
const wireHeader = (children: React.ReactNode, onHide?: () => void): React.ReactNode =>
  React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === ModalHeader) {
      return React.cloneElement(child as React.ReactElement<HeaderProps>, { onHide })
    }
    return child
  })

const ModalBase: React.FC<ModalProps> = ({
  show = false,
  onHide,
  onExited,
  onExit,
  onEnter,
  dialogClassName,
  className,
  size,
  bsSize,
  bsClass,
  backdrop = true,
  keyboard = true,
  animation = true,
  "aria-labelledby": ariaLabelledBy,
  children,
}) => {
  // `mounted` keeps the DOM present through the closing transition; `visible`
  // toggles the `.show` class. On close: drop `.in`, then unmount + fire onExited.
  const [mounted, setMounted] = useState(show)
  const [visible, setVisible] = useState(show)
  const prevShow = useRef(show)

  useEffect(() => {
    if (show && !prevShow.current) {
      onEnter?.()
      setMounted(true)
      // next tick so the `.show` transition can apply
      requestAnimationFrame(() => setVisible(true))
    } else if (!show && prevShow.current) {
      onExit?.()
      setVisible(false)
      const finish = () => {
        setMounted(false)
        onExited?.()
      }
      if (animation) {
        const t = setTimeout(finish, 300)
        prevShow.current = show
        return () => clearTimeout(t)
      }
      finish()
    }
    prevShow.current = show
  }, [show, animation, onEnter, onExit, onExited])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && keyboard) onHide?.()
    },
    [keyboard, onHide]
  )

  useEffect(() => {
    if (!mounted) return
    document.addEventListener("keydown", handleKeyDown)
    document.body.classList.add("modal-open")
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("modal-open")
    }
  }, [mounted, handleKeyDown])

  if (!mounted) return null

  const sizeClass = normalizeSize(size ?? bsSize)
  const fadeClass = animation ? "fade" : ""
  // Bootstrap 5 uses `.show` (BS3 used `.in`) to toggle modal/backdrop visibility.
  const inClass = visible ? "show" : ""
  // react-bootstrap 0.33 treated bsClass as the class prefix: "lbaas2 modal"
  // yielded `.lbaas2.modal-dialog` etc. Reproduce that by prefixing every extra
  // token (anything other than "modal") onto the modal/dialog/content classes.
  const bsPrefix = (bsClass ?? "")
    .split(/\s+/)
    .filter((t) => t && t !== "modal")
    .join(" ")

  const onBackdropClick = () => {
    if (backdrop === "static") return
    onHide?.()
  }

  return createPortal(
    <>
      {backdrop !== false && <div className={["modal-backdrop", fadeClass, inClass].filter(Boolean).join(" ")} />}
      <div
        className={[bsPrefix, "modal", fadeClass, inClass, className].filter(Boolean).join(" ")}
        role="dialog"
        tabIndex={-1}
        aria-labelledby={ariaLabelledBy}
        style={{ display: "block" }}
        onClick={onBackdropClick}
      >
        <div
          className={[bsPrefix, "modal-dialog", sizeClass, dialogClassName].filter(Boolean).join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={[bsPrefix, "modal-content"].filter(Boolean).join(" ")} role="document">
            {wireHeader(children, onHide)}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export const Modal = ModalBase as ModalComponent
Modal.Header = ModalHeader
Modal.Title = ModalTitle
Modal.Body = ModalBody
Modal.Footer = ModalFooter
