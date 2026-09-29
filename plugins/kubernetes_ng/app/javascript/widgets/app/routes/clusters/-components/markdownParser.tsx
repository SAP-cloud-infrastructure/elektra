import React from "react"
import { Icon, CodeBlockProps } from "@cloudoperators/juno-ui-components"

/**
 * Parses simple markdown and renders it with custom components
 * Supports:
 * - Code blocks (```bash or ``` syntax)
 * - Links with external icon ([text](url))
 * - Paragraphs
 */
export const parseMarkdown = (markdown: string, CodeBlock: React.FC<CodeBlockProps>) => {
  const elements: React.ReactNode[] = []
  let key = 0

  // Split by code blocks (```...```)
  const parts = markdown.split(/(```[\s\S]*?```)/g)

  parts.forEach((part) => {
    if (part.startsWith("```")) {
      // Extract code content, remove opening/closing ```
      const code = part
        .replace(/```(?:bash|sh)?\n?/, "")
        .replace(/```$/, "")
        .trim()
      elements.push(<CodeBlock key={key++} content={code} />)
    } else if (part.trim()) {
      // Split by paragraphs (double newline)
      part.split("\n\n").forEach((paragraph) => {
        if (!paragraph.trim()) return

        // Parse markdown links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const segments: React.ReactNode[] = []
        let lastIndex = 0
        let match: RegExpExecArray | null

        while ((match = linkRegex.exec(paragraph)) !== null) {
          // Text before link
          if (match.index > lastIndex) {
            segments.push(paragraph.slice(lastIndex, match.index))
          }
          // Link with external icon
          segments.push(
            <a
              key={`link-${key++}`}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-theme-link hover:tw-underline"
            >
              {match[1]} <Icon size="18" icon="openInNew" className="tw-inline" />
            </a>
          )
          lastIndex = match.index + match[0].length
        }

        // Remaining text after last link
        if (lastIndex < paragraph.length) {
          segments.push(paragraph.slice(lastIndex))
        }

        elements.push(
          <p key={key++} className="tw-my-4">
            {segments}
          </p>
        )
      })
    }
  })

  return elements
}
