import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import "@testing-library/jest-dom"
import { parseMarkdown } from "./markdownParser"
import { CodeBlockProps } from "@cloudoperators/juno-ui-components"

// Mock CodeBlock component matching CodeBlockProps
const MockCodeBlock: React.FC<CodeBlockProps> = ({ content }) => (
  <pre data-testid="code-block">
    <code>{typeof content === "string" ? content : JSON.stringify(content)}</code>
  </pre>
)

describe("parseMarkdown", () => {
  it("parses simple paragraphs", () => {
    const markdown = "First paragraph.\n\nSecond paragraph."
    const result = parseMarkdown(markdown, MockCodeBlock)

    const { container } = render(<div>{result}</div>)
    const paragraphs = container.querySelectorAll("p")

    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toHaveTextContent("First paragraph.")
    expect(paragraphs[1]).toHaveTextContent("Second paragraph.")
  })

  it("parses code blocks with bash syntax", () => {
    const markdown = "Install:\n\n```bash\nbrew install tool\n```"
    const result = parseMarkdown(markdown, MockCodeBlock)

    render(<div>{result}</div>)
    const codeBlock = screen.getByTestId("code-block")

    expect(codeBlock).toBeInTheDocument()
    expect(codeBlock).toHaveTextContent("brew install tool")
  })

  it("parses code blocks with sh syntax", () => {
    const markdown = "```sh\necho hello\n```"
    const result = parseMarkdown(markdown, MockCodeBlock)

    render(<div>{result}</div>)
    const codeBlock = screen.getByTestId("code-block")

    expect(codeBlock).toBeInTheDocument()
    expect(codeBlock).toHaveTextContent("echo hello")
  })

  it("parses code blocks without language syntax", () => {
    const markdown = "```\nsome code\n```"
    const result = parseMarkdown(markdown, MockCodeBlock)

    render(<div>{result}</div>)
    const codeBlock = screen.getByTestId("code-block")

    expect(codeBlock).toBeInTheDocument()
    expect(codeBlock).toHaveTextContent("some code")
  })

  it("parses markdown links with external icon", () => {
    const markdown = "Check the [documentation](https://example.com) for more info."
    const result = parseMarkdown(markdown, MockCodeBlock)

    render(<div>{result}</div>)
    const link = screen.getByRole("link", { name: /documentation/i })

    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://example.com")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("parses multiple links in a paragraph", () => {
    const markdown = "See [link1](https://one.com) and [link2](https://two.com) for details."
    const result = parseMarkdown(markdown, MockCodeBlock)

    render(<div>{result}</div>)
    const links = screen.getAllByRole("link")

    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute("href", "https://one.com")
    expect(links[1]).toHaveAttribute("href", "https://two.com")
  })

  it("parses mixed content with paragraphs, code blocks, and links", () => {
    const markdown = `For managing clusters, install the [CLI](https://example.com):

\`\`\`bash
brew install tool
\`\`\`

Then run the command.`

    const result = parseMarkdown(markdown, MockCodeBlock)

    const { container } = render(<div>{result}</div>)
    const paragraphs = container.querySelectorAll("p")
    const codeBlock = screen.getByTestId("code-block")
    const link = screen.getByRole("link")

    expect(paragraphs).toHaveLength(2)
    expect(codeBlock).toBeInTheDocument()
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://example.com")
  })

  it("handles empty markdown", () => {
    const markdown = ""
    const result = parseMarkdown(markdown, MockCodeBlock)

    const { container } = render(<div>{result}</div>)
    expect(container.firstChild?.childNodes).toHaveLength(0)
  })

  it("handles markdown with only whitespace", () => {
    const markdown = "   \n\n   "
    const result = parseMarkdown(markdown, MockCodeBlock)

    const { container } = render(<div>{result}</div>)
    expect(container.firstChild?.childNodes).toHaveLength(0)
  })

  it("preserves text before and after links", () => {
    const markdown = "Before [link](https://example.com) after."
    const result = parseMarkdown(markdown, MockCodeBlock)

    const { container } = render(<div>{result}</div>)
    const paragraph = container.querySelector("p")

    expect(paragraph).toHaveTextContent("Before")
    expect(paragraph).toHaveTextContent("after.")
    expect(screen.getByRole("link")).toBeInTheDocument()
  })
})
