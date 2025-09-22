import { createFileRoute, Link } from "@tanstack/react-router"

function EntriesList() {
  return (
    <div>
      Entries <Link to="/">Home</Link>
    </div>
  )
}

export const Route = createFileRoute("/entries/")({
  component: EntriesList,
})
