import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/clusters/")({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome to Clusters Overview!</h3>
    </div>
  )
}
