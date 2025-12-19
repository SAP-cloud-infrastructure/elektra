/* eslint-disable react/no-unescaped-entities */
import React from "react"
import queryString from "query-string"
import { Highlighter } from "react-bootstrap-typeahead"

function isRecord(value) {
  return typeof value === "object" && value !== null
}

export function isSerializedServerError(error) {
  if (!isRecord(error)) return false
  const data = error.data
  if (!isRecord(data)) return false
  return typeof data.message === "string"
}

// Normalize different error shapes into render-safe strings
export function normalizeError(error) {
  if (isSerializedServerError(error)) {
    return {
      title: "API Error",
      message: error.data.message.replace(/^[,\s]+/, "") || "Please try again later.",
    }
  }

  if (error && typeof error === "object" && error.data) {
    const data = error.data

    if (Array.isArray(data.errors)) {
      const msg = data.errors
        .map((e) => e?.message || e?.description)
        .filter(Boolean)
        .join(", ")
      if (msg) return { title: "API Error", message: msg }
    }

    if (data.error && typeof data.error === "object") {
      const msg = data.error.message || data.error.description || data.error.title
      if (msg) return { title: "API Error", message: msg }
    }
  }

  if (error instanceof Error) {
    return {
      title: error.name || "Error",
      message: error.message.replace(/^[,\s]+/, "") || "An unknown error occurred.",
    }
  }

  if (typeof error === "string") {
    return { title: "Error", message: error }
  }

  return {
    title: "Unknown Error",
    message: "An unexpected error occurred. Please try again.",
  }
}

export const errorMessage = (error) => normalizeError(error).message

export const formErrorMessage = (error) => {
  if (error?.data?.errors && Object.keys(error.data.errors).length > 0) {
    return error.data.errors
  } else {
    return error?.message || JSON.stringify(error)
  }
}

export const createNameTag = (name) => {
  return name ? (
    <>
      <b>name:</b> {name} <br />
    </>
  ) : (
    ""
  )
}

export const secretRefLabel = (secretRef) => {
  const label = secretRef || ""
  return label.replace(/.*\/\/[^/]*/, "https://...")
}

export const toManySecretsWarning = (total, length) => {
  total = total || 0
  length = length || 0
  if (total > length) {
    return (
      <div className="alert alert-warning">
        This project has <b>{total}</b> secrets and it is not possible to display all of them. If you don't find the
        secret you are looking for enter the secret ref manually. <br />
        Ex: https://keymanager-3.region.cloud.sap:443/v1/secrets/secretID
      </div>
    )
  }
}

export const sortObjectByKeys = (o) => {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {})
}

export const helpBlockTextForSelect = (options = []) => {
  return (
    <ul className="help-block-popover-scroll small">
      {options.map((t, index) => (
        <li key={index}>
          <b>{t.label}</b>: {t.description}
        </li>
      ))}
    </ul>
  )
}

export const matchParams = (props) => {
  return (props.match && props.match.params) || {}
}

export const queryStringSearchValues = (props) => {
  return queryString.parse(props.location.search)
}

export const searchParamsToString = (props) => {
  const searchParams = new URLSearchParams(props.location.search)
  return searchParams.toString()
}

export const MyHighlighter = ({ search, children }) => {
  if (!search || !children) return children
  return <Highlighter search={search}>{children + ""}</Highlighter>
}
