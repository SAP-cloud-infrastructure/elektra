import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import React from "react"
import List from "./list.tsx"

interface Project {
  id: string
  name: string
  description: string
  domain_id: string
  parent_id: string | null
}

// Mock project data
const createProject = (id: string, name: string, description: string, domainId: string, parentId: string): Project => ({
  id,
  name,
  description,
  domain_id: domainId,
  parent_id: parentId,
})

describe("List Component", () => {
  let mockLoadAuthProjectsOnce: ReturnType<typeof vi.fn>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    mockLoadAuthProjectsOnce = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props: Partial<React.ComponentProps<typeof List>> = {}) => {
    const defaultProps: React.ComponentProps<typeof List> = {
      items: [],
      isFetching: false,
      loadAuthProjectsOnce: mockLoadAuthProjectsOnce,
      ...props,
    }

    return render(<List {...defaultProps} />)
  }

  describe("Initial Rendering", () => {
    it("renders with default props", () => {
      renderComponent()
      expect(screen.getByText("Your Projects")).toBeInTheDocument()
    })

    it("calls loadAuthProjectsOnce on mount", () => {
      renderComponent()
      expect(mockLoadAuthProjectsOnce).toHaveBeenCalledTimes(1)
    })

    it("shows title with project count when showCount is true", () => {
      const projects = [
        createProject("proj-1", "Project 1", "Description 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Description 2", "domain-1", "domain-1"),
      ]
      renderComponent({ items: projects, showCount: true })

      expect(screen.getByText(/Your Projects/)).toBeInTheDocument()
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument()
    })

    it("does not show count when showCount is false", () => {
      const projects = [createProject("proj-1", "Project 1", "Description 1", "domain-1", "domain-1")]
      renderComponent({ items: projects, showCount: false })

      expect(screen.getByText("Your Projects")).toBeInTheDocument()
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
    })

    it("shows loading spinner when isFetching is true", () => {
      renderComponent({ isFetching: true })

      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("shows 'None available.' when no projects", () => {
      renderComponent({ items: [], isFetching: false })

      expect(screen.getByText("None available.")).toBeInTheDocument()
    })

    it("renders custom title when provided", () => {
      renderComponent({ title: "My Custom Projects" })

      expect(screen.getByText("My Custom Projects")).toBeInTheDocument()
      expect(screen.queryByText("Your Projects")).not.toBeInTheDocument()
    })

    it("does not show search icon when less than 10 projects", () => {
      const projects = Array.from({ length: 5 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchIcon = document.querySelector(".fa-search")
      expect(searchIcon).not.toBeInTheDocument()
    })

    it("shows search icon when 11 or more projects", () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchIcon = document.querySelector(".fa-search")
      expect(searchIcon).toBeInTheDocument()
    })

    it("hides search input when showSearchInput prop is false", () => {
      const projects = Array.from({ length: 15 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects, showSearchInput: false })

      expect(screen.queryByPlaceholderText("Search name or description")).not.toBeInTheDocument()
    })
  })

  describe("Hierarchy Building", () => {
    it("builds flat list when no parent-child relationships", () => {
      const projects = [
        createProject("proj-1", "Project 1", "Description 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Description 2", "domain-1", "domain-1"),
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Project 1")).toBeInTheDocument()
      expect(screen.getByText("Project 2")).toBeInTheDocument()
    })

    it("builds single-level hierarchy with parent and children", () => {
      const projects = [
        createProject("parent-1", "Parent Project", "Parent description", "domain-1", "domain-1"),
        createProject("child-1", "Child Project", "Child description", "domain-1", "parent-1"),
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Parent Project")).toBeInTheDocument()
      expect(screen.getByText("Child Project")).toBeInTheDocument()

      // Parent should have children class
      const parentLi = screen.getByText("Parent Project").closest("li")
      expect(parentLi).toHaveClass("has-children")
    })

    it("builds multi-level hierarchy with grandchildren", () => {
      const projects = [
        createProject("grandparent", "Grandparent", "Grandparent desc", "domain-1", "domain-1"),
        createProject("parent", "Parent", "Parent desc", "domain-1", "grandparent"),
        createProject("child", "Child", "Child desc", "domain-1", "parent"),
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Grandparent")).toBeInTheDocument()
      expect(screen.getByText("Parent")).toBeInTheDocument()
      expect(screen.getByText("Child")).toBeInTheDocument()
    })

    it("treats projects with domain_id as parent_id as root projects", () => {
      const projects = [createProject("proj-1", "Root Project", "Description", "domain-1", "domain-1")]
      renderComponent({ items: projects })

      const projectLi = screen.getByText("Root Project").closest("li")
      expect(projectLi).not.toHaveClass("has-children")
    })

    it("filters by root prop when provided", () => {
      const projects = [
        createProject("root-1", "Root 1", "Root 1 desc", "domain-1", "domain-1"),
        createProject("child-1", "Child 1", "Child 1 desc", "domain-1", "root-1"),
        createProject("root-2", "Root 2", "Root 2 desc", "domain-1", "domain-1"),
      ]
      renderComponent({ items: projects, root: "root-1" })

      // Should only show children of root-1
      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.queryByText("Root 1")).not.toBeInTheDocument()
      expect(screen.queryByText("Root 2")).not.toBeInTheDocument()
    })

    it("handles projects without parent in map gracefully", () => {
      const projects = [
        createProject("child-orphan", "Orphan Child", "Child with missing parent", "domain-1", "missing-parent"),
      ]
      renderComponent({ items: projects })

      // Orphan should be treated as root level
      expect(screen.getByText("Orphan Child")).toBeInTheDocument()
    })
  })

  describe("Search Functionality", () => {
    // Need 11+ projects for search input to appear
    const searchProjects = [
      createProject("proj-1", "Production Environment", "Prod env description", "domain-1", "domain-1"),
      createProject("proj-2", "Development Environment", "Dev env description", "domain-1", "domain-1"),
      createProject("proj-3", "Testing Area", "For production testing", "domain-1", "domain-1"),
      createProject("proj-4", "Staging Environment", "Staging desc", "domain-1", "domain-1"),
      createProject("proj-5", "QA Environment", "Quality assurance", "domain-1", "domain-1"),
      createProject("proj-6", "Demo Environment", "Demo desc", "domain-1", "domain-1"),
      createProject("proj-7", "Integration Tests", "Integration desc", "domain-1", "domain-1"),
      createProject("proj-8", "Performance Tests", "Performance desc", "domain-1", "domain-1"),
      createProject("proj-9", "Security Tests", "Security desc", "domain-1", "domain-1"),
      createProject("proj-10", "User Acceptance", "UAT desc", "domain-1", "domain-1"),
      createProject("proj-11", "Backup Environment", "Backup desc", "domain-1", "domain-1"),
    ]

    it("shows search input when more than 10 projects", () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      expect(searchInput).toBeInTheDocument()
    })

    it("toggles search input visibility when search icon clicked", async () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchIcon = document.querySelector(".fa-search")!
      expect(screen.getByPlaceholderText("Search name or description")).toBeInTheDocument()

      await user.click(searchIcon)
      expect(screen.queryByPlaceholderText("Search name or description")).not.toBeInTheDocument()

      await user.click(searchIcon)
      expect(screen.getByPlaceholderText("Search name or description")).toBeInTheDocument()
    })

    it("auto-focuses search input when toggled on", async () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchIcon = document.querySelector(".fa-search")!

      // Hide search input
      await user.click(searchIcon)
      expect(screen.queryByPlaceholderText("Search name or description")).not.toBeInTheDocument()

      // Show it again - should auto-focus
      await user.click(searchIcon)
      const searchInput = screen.getByPlaceholderText("Search name or description")

      await waitFor(() => {
        expect(searchInput).toHaveFocus()
      })
    })

    it("filters projects by name (case-insensitive)", async () => {
      renderComponent({ items: searchProjects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      await user.type(searchInput, "production")

      expect(screen.getByText("Production Environment")).toBeInTheDocument()
      expect(screen.queryByText("Development Environment")).not.toBeInTheDocument()
    })

    it("filters projects by description (case-insensitive)", async () => {
      renderComponent({ items: searchProjects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      await user.type(searchInput, "dev env")

      expect(screen.getByText("Development Environment")).toBeInTheDocument()
      expect(screen.queryByText("Production Environment")).not.toBeInTheDocument()
    })

    it("shows parent with info-text class when only child matches search", async () => {
      // Need 11+ projects for search input to appear
      const projects = [
        createProject("parent", "Parent Name", "Parent description", "domain-1", "domain-1"),
        createProject("child", "Matching Child", "Child description", "domain-1", "parent"),
        ...Array.from({ length: 9 }, (_, i) =>
          createProject(`filler-${i}`, `Filler ${i}`, `Desc ${i}`, "domain-1", "domain-1")
        ),
      ]
      renderComponent({ items: projects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      await user.type(searchInput, "matching")

      const parentLink = screen.getByText("Parent Name")
      expect(parentLink).toHaveClass("info-text")
      expect(screen.getByText("Matching Child")).toBeInTheDocument()
    })

    it("clears search term when X icon is clicked", async () => {
      renderComponent({ items: searchProjects })

      const searchInput = screen.getByPlaceholderText("Search name or description") as HTMLInputElement
      await user.type(searchInput, "production")

      expect(searchInput).toHaveValue("production")

      const clearIcon = document.querySelector(".fa-times-circle")!
      await user.click(clearIcon)

      expect(searchInput).toHaveValue("")
    })

    it("expands all nodes during search", async () => {
      // Need 11+ projects for search input to appear
      const projects = [
        createProject("parent", "Parent", "Parent desc", "domain-1", "domain-1"),
        createProject("child", "Child", "Child desc", "domain-1", "parent"),
        ...Array.from({ length: 9 }, (_, i) =>
          createProject(`filler-${i}`, `Filler ${i}`, `Desc ${i}`, "domain-1", "domain-1")
        ),
      ]
      renderComponent({ items: projects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      await user.type(searchInput, "child")

      const parentLi = screen.getByText("Parent").closest("li")
      expect(parentLi).toHaveClass("node-expanded")
    })

    it("updates filtered results as search term changes", async () => {
      renderComponent({ items: searchProjects })

      const searchInput = screen.getByPlaceholderText("Search name or description")

      await user.type(searchInput, "prod")
      expect(screen.getByText("Production Environment")).toBeInTheDocument()
      expect(screen.queryByText("Development Environment")).not.toBeInTheDocument()

      await user.clear(searchInput)
      await user.type(searchInput, "dev")
      expect(screen.getByText("Development Environment")).toBeInTheDocument()
      expect(screen.queryByText("Production Environment")).not.toBeInTheDocument()
    })
  })

  describe("Tree Expansion and Collapse", () => {
    const hierarchicalProjects = [
      createProject("parent-1", "Parent 1", "Parent 1 desc", "domain-1", "domain-1"),
      createProject("child-1", "Child 1", "Child 1 desc", "domain-1", "parent-1"),
      createProject("child-2", "Child 2", "Child 2 desc", "domain-1", "parent-1"),
      createProject("parent-2", "Parent 2", "Parent 2 desc", "domain-1", "domain-1"),
      createProject("child-3", "Child 3", "Child 3 desc", "domain-1", "parent-2"),
    ]

    it("expands node when icon is clicked", async () => {
      renderComponent({ items: hierarchicalProjects })

      const parentLi = screen.getByText("Parent 1").closest("li")!
      expect(parentLi).not.toHaveClass("node-expanded")

      const expandIcon = parentLi.querySelector(".node-icon")!
      await user.click(expandIcon)

      expect(parentLi).toHaveClass("node-expanded")
    })

    it("collapses node when icon is clicked again", async () => {
      renderComponent({ items: hierarchicalProjects })

      const parentLi = screen.getByText("Parent 1").closest("li")!
      const expandIcon = parentLi.querySelector(".node-icon")!

      await user.click(expandIcon)
      expect(parentLi).toHaveClass("node-expanded")

      await user.click(expandIcon)
      expect(parentLi).not.toHaveClass("node-expanded")
    })

    it("maintains expansion state for multiple nodes independently", async () => {
      renderComponent({ items: hierarchicalProjects })

      const parent1Li = screen.getByText("Parent 1").closest("li")!
      const parent2Li = screen.getByText("Parent 2").closest("li")!

      const expandIcon1 = parent1Li.querySelector(".node-icon")!
      const expandIcon2 = parent2Li.querySelector(".node-icon")!

      await user.click(expandIcon1)
      expect(parent1Li).toHaveClass("node-expanded")
      expect(parent2Li).not.toHaveClass("node-expanded")

      await user.click(expandIcon2)
      expect(parent1Li).toHaveClass("node-expanded")
      expect(parent2Li).toHaveClass("node-expanded")

      await user.click(expandIcon1)
      expect(parent1Li).not.toHaveClass("node-expanded")
      expect(parent2Li).toHaveClass("node-expanded")
    })

    it("shows children when node is expanded", async () => {
      renderComponent({ items: hierarchicalProjects })

      // Children should be in DOM but may not be visible initially
      const parentLi = screen.getByText("Parent 1").closest("li")!
      const expandIcon = parentLi.querySelector(".node-icon")!

      await user.click(expandIcon)

      // Check children are visible
      const childrenUl = parentLi.querySelector("ul")
      expect(childrenUl).toBeInTheDocument()
      expect(screen.getByText("Child 1")).toBeInTheDocument()
      expect(screen.getByText("Child 2")).toBeInTheDocument()
    })

    it("children remain in DOM when collapsed", async () => {
      renderComponent({ items: hierarchicalProjects })

      const parentLi = screen.getByText("Parent 1").closest("li")!
      const expandIcon = parentLi.querySelector(".node-icon")!

      await user.click(expandIcon)
      expect(screen.getByText("Child 1")).toBeInTheDocument()

      await user.click(expandIcon)
      // Children should still be in DOM (CSS handles visibility)
      const childrenUl = parentLi.querySelector("ul")
      expect(childrenUl).toBeInTheDocument()
    })
  })

  describe("Props Updates (UNSAFE_componentWillReceiveProps)", () => {
    it("rebuilds hierarchy when items prop changes", () => {
      const initialProjects = [createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1")]

      const { rerender } = renderComponent({ items: initialProjects })
      expect(screen.getByText("Project 1")).toBeInTheDocument()

      const updatedProjects = [
        createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Desc 2", "domain-1", "domain-1"),
      ]

      rerender(<List items={updatedProjects} isFetching={false} loadAuthProjectsOnce={mockLoadAuthProjectsOnce} />)

      expect(screen.getByText("Project 1")).toBeInTheDocument()
      expect(screen.getByText("Project 2")).toBeInTheDocument()
    })

    it("maintains expansion state when items update", async () => {
      const projects = [
        createProject("parent", "Parent", "Parent desc", "domain-1", "domain-1"),
        createProject("child", "Child", "Child desc", "domain-1", "parent"),
      ]

      const { rerender } = renderComponent({ items: projects })

      const parentLi = screen.getByText("Parent").closest("li")!
      const expandIcon = parentLi.querySelector(".node-icon")!
      await user.click(expandIcon)

      expect(parentLi).toHaveClass("node-expanded")

      // Add a new project
      const updatedProjects = [...projects, createProject("child-2", "Child 2", "Child 2 desc", "domain-1", "parent")]

      rerender(<List items={updatedProjects} isFetching={false} loadAuthProjectsOnce={mockLoadAuthProjectsOnce} />)

      const updatedParentLi = screen.getByText("Parent").closest("li")!
      expect(updatedParentLi).toHaveClass("node-expanded")
    })

    it("handles adding new root projects", () => {
      const initialProjects = [createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1")]

      const { rerender } = renderComponent({ items: initialProjects })

      const updatedProjects = [
        ...initialProjects,
        createProject("proj-2", "Project 2", "Desc 2", "domain-1", "domain-1"),
      ]

      rerender(<List items={updatedProjects} isFetching={false} loadAuthProjectsOnce={mockLoadAuthProjectsOnce} />)

      expect(screen.getByText("Project 1")).toBeInTheDocument()
      expect(screen.getByText("Project 2")).toBeInTheDocument()
    })

    it("handles removing projects", () => {
      const initialProjects = [
        createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Desc 2", "domain-1", "domain-1"),
      ]

      const { rerender } = renderComponent({ items: initialProjects })
      expect(screen.getByText("Project 2")).toBeInTheDocument()

      const updatedProjects = [createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1")]

      rerender(<List items={updatedProjects} isFetching={false} loadAuthProjectsOnce={mockLoadAuthProjectsOnce} />)

      expect(screen.getByText("Project 1")).toBeInTheDocument()
      expect(screen.queryByText("Project 2")).not.toBeInTheDocument()
    })

    it("updates hierarchy structure when parent-child relationships change", () => {
      const flatProjects = [
        createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Desc 2", "domain-1", "domain-1"),
      ]

      const { rerender } = renderComponent({ items: flatProjects })

      const proj1Li = screen.getByText("Project 1").closest("li")!
      expect(proj1Li).not.toHaveClass("has-children")

      // Make proj-2 a child of proj-1
      const hierarchicalProjects = [
        createProject("proj-1", "Project 1", "Desc 1", "domain-1", "domain-1"),
        createProject("proj-2", "Project 2", "Desc 2", "domain-1", "proj-1"),
      ]

      rerender(<List items={hierarchicalProjects} isFetching={false} loadAuthProjectsOnce={mockLoadAuthProjectsOnce} />)

      const updatedProj1Li = screen.getByText("Project 1").closest("li")!
      expect(updatedProj1Li).toHaveClass("has-children")
    })
  })

  describe("Navigation and Links", () => {
    it("renders project links with correct URLs", () => {
      const projects = [createProject("proj-1", "Project 1", "Description 1", "domain-1", "domain-1")]
      renderComponent({ items: projects })

      const link = screen.getByText("Project 1") as HTMLAnchorElement
      expect(link.tagName).toBe("A")
      expect(link).toHaveAttribute("href", "/domain-1/proj-1/home")
    })

    it("shows project descriptions as title attribute (tooltip)", () => {
      const projects = [createProject("proj-1", "Project 1", "This is the description", "domain-1", "domain-1")]
      renderComponent({ items: projects })

      const link = screen.getByText("Project 1")
      expect(link).toHaveAttribute("title", "This is the description")
    })

    it("displays description text next to project name", () => {
      const projects = [createProject("proj-1", "Project 1", "Description text", "domain-1", "domain-1")]
      renderComponent({ items: projects })

      expect(screen.getByText("Description text")).toBeInTheDocument()
      expect(screen.getByText("Description text")).toHaveClass("info-text")
      expect(screen.getByText("Description text")).toHaveClass("small")
    })

    it("applies correct CSS classes for tree structure", () => {
      const projects = [
        createProject("parent", "Parent", "Parent desc", "domain-1", "domain-1"),
        createProject("child", "Child", "Child desc", "domain-1", "parent"),
      ]
      renderComponent({ items: projects })

      const parentLi = screen.getByText("Parent").closest("li")!
      expect(parentLi).toHaveClass("has-children")

      const treeUl = parentLi.closest("ul")!
      expect(treeUl).toHaveClass("tree")
      expect(treeUl).toHaveClass("tree-expandable")
    })
  })

  describe("Edge Cases", () => {
    it("handles empty items array gracefully", () => {
      renderComponent({ items: [] })
      expect(screen.getByText("None available.")).toBeInTheDocument()
    })

    it("handles projects without descriptions", () => {
      const projects: Project[] = [
        {
          id: "proj-1",
          name: "Project 1",
          description: "",
          domain_id: "domain-1",
          parent_id: "domain-1",
        },
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Project 1")).toBeInTheDocument()
    })

    it("handles projects with null parent_id as root", () => {
      const projects: Project[] = [
        {
          id: "proj-1",
          name: "Project 1",
          description: "Desc",
          domain_id: "domain-1",
          parent_id: null,
        },
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Project 1")).toBeInTheDocument()
    })

    it("handles undefined items prop", () => {
      renderComponent({ items: undefined as unknown as Project[] })
      expect(screen.getByText("None available.")).toBeInTheDocument()
    })

    it("handles very long project names", () => {
      const longName = "A".repeat(200)
      const projects = [createProject("proj-1", longName, "Description", "domain-1", "domain-1")]
      renderComponent({ items: projects })

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it("handles search with special characters", async () => {
      // Need 11+ projects for search input to appear
      const projects = [
        createProject("proj-1", "Project (Test)", "Description with [brackets]", "domain-1", "domain-1"),
        ...Array.from({ length: 10 }, (_, i) =>
          createProject(`filler-${i}`, `Filler ${i}`, `Desc ${i}`, "domain-1", "domain-1")
        ),
      ]
      renderComponent({ items: projects })

      const searchInput = screen.getByPlaceholderText("Search name or description")
      await user.type(searchInput, "(test)")

      expect(screen.getByText("Project (Test)")).toBeInTheDocument()
    })

    it("handles root prop with non-existent project id", () => {
      const projects = [createProject("proj-1", "Project 1", "Description", "domain-1", "domain-1")]
      renderComponent({ items: projects, root: "non-existent-id" })

      // When root doesn't exist, falls back to showing all projects
      expect(screen.getByText("Project 1")).toBeInTheDocument()
    })

    it("handles deeply nested hierarchy (5+ levels)", () => {
      const projects = [
        createProject("level-1", "Level 1", "Desc 1", "domain-1", "domain-1"),
        createProject("level-2", "Level 2", "Desc 2", "domain-1", "level-1"),
        createProject("level-3", "Level 3", "Desc 3", "domain-1", "level-2"),
        createProject("level-4", "Level 4", "Desc 4", "domain-1", "level-3"),
        createProject("level-5", "Level 5", "Desc 5", "domain-1", "level-4"),
      ]
      renderComponent({ items: projects })

      expect(screen.getByText("Level 1")).toBeInTheDocument()
      expect(screen.getByText("Level 5")).toBeInTheDocument()
    })
  })

  describe("Search Input Focus Behavior", () => {
    it("auto-focuses search input on mount when more than 10 projects", async () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects })

      const searchInput = screen.getByPlaceholderText("Search name or description")

      await waitFor(() => {
        expect(searchInput).toHaveFocus()
      })
    })

    it("does not focus search input when showSearchInput is false", () => {
      const projects = Array.from({ length: 11 }, (_, i) =>
        createProject(`proj-${i}`, `Project ${i}`, `Description ${i}`, "domain-1", "domain-1")
      )
      renderComponent({ items: projects, showSearchInput: false })

      const searchInput = screen.queryByPlaceholderText("Search name or description")
      expect(searchInput).not.toBeInTheDocument()
    })
  })
})
