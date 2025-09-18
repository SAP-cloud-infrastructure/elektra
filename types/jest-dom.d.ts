declare module "@testing-library/jest-dom" {
  import { MatcherFunction } from "@testing-library/jest-dom/matchers"

  // Re-export the matchers
  const matchers: {
    toBeInTheDocument: MatcherFunction
    toHaveClass: MatcherFunction
    toHaveAttribute: MatcherFunction
    toHaveTextContent: MatcherFunction
    // Add other matchers you use
  }

  export default matchers
}
