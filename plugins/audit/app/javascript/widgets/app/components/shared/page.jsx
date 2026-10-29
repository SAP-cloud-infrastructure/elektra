import React from "react"
const Page = ({ page, label, disabled, currentPage, handlePageChange }) => {
  let className = "page-item"
  if (disabled) className += " disabled"
  if (page == currentPage) className += " active"

  return (
    <li className={className}>
      <a
        className="page-link"
        href="#"
        onClick={(e) => {
          e.preventDefault()
          disabled ? null : handlePageChange(page)
        }}
      >
        {label ? label : page}
      </a>
    </li>
  )
}

export default Page
