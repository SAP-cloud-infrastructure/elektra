import { Link, createFileRoute } from "@tanstack/react-router"
import React from "react"

function Index() {
  return (
    <div>
      Hello <Link to="/entries">Entries</Link>
    </div>
  )
}

export const Route = createFileRoute("/")({
  component: Index,
})
