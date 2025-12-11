interface SnowfallConfig {
  count?: number
  minDuration?: number
  maxDuration?: number
  minSize?: number
  maxSize?: number
}

class Snowfall {
  private container: HTMLDivElement
  private styleElement: HTMLStyleElement
  private toggleButton: HTMLButtonElement
  private config: Required<SnowfallConfig>
  private animationFrame: number | null = null
  private readonly STORAGE_KEY = "snowfall-enabled"

  constructor(targetContainer: HTMLElement = document.body, config: SnowfallConfig = {}) {
    this.config = {
      count: config.count ?? 50,
      minDuration: config.minDuration ?? 10,
      maxDuration: config.maxDuration ?? 20,
      minSize: config.minSize ?? 0.5,
      maxSize: config.maxSize ?? 1.5,
    }

    // Inject styles
    this.styleElement = document.createElement("style")
    this.styleElement.textContent = `
      .snowfall-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        overflow: hidden;
      }

      .snowflake {
        position: absolute;
        top: -10px;
        color: #b0d4f1;
        font-size: 1em;
        user-select: none;
        pointer-events: none;
        animation: fall linear infinite;
        opacity: 0.8;
      }

      .snowflake:nth-child(3n) {
        animation: fall-spin linear infinite;
      }

      @keyframes fall {
        to {
          transform: translateY(100vh);
        }
      }

      @keyframes fall-spin {
        to {
          transform: translateY(100vh) rotate(360deg);
        }
      }

      .snowfall-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #b0d4f1;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .snowfall-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .snowfall-toggle.disabled {
        background: rgba(240, 240, 240, 0.5);
        border-color: #ccc;
        opacity: 0.6;
        width: 40px;
        height: 40px;
        font-size: 18px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }

      .snowfall-toggle.disabled:hover {
        opacity: 0.7;
        transform: scale(1.05);
      }

      @media (max-width: 768px) {
        .snowfall-container {
          display: none;
        }
        .snowfall-toggle {
          display: none;
        }
      }
    `
    document.head.appendChild(this.styleElement)

    // Create container
    this.container = document.createElement("div")
    this.container.className = "snowfall-container"

    // Create snowflakes
    for (let i = 0; i < this.config.count; i++) {
      this.createSnowflake()
    }

    targetContainer.appendChild(this.container)

    // Create toggle button
    this.toggleButton = document.createElement("button")
    this.toggleButton.className = "snowfall-toggle"
    this.toggleButton.textContent = "❄️"
    this.toggleButton.title = "Toggle snowfall"
    this.toggleButton.addEventListener("click", () => this.toggle())
    document.body.appendChild(this.toggleButton)

    // Check initial state
    this.updateVisibility()
  }

  private createSnowflake(): void {
    const snowflake = document.createElement("div")
    snowflake.className = "snowflake"
    snowflake.textContent = "❄"

    // Random horizontal position
    snowflake.style.left = `${Math.random() * 100}%`

    // Random size
    const size = this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize)
    snowflake.style.fontSize = `${size}em`

    // Random animation duration (fall speed)
    const duration = this.config.minDuration + Math.random() * (this.config.maxDuration - this.config.minDuration)
    snowflake.style.animationDuration = `${duration}s`

    // Random delay for staggered start
    snowflake.style.animationDelay = `${Math.random() * 5}s`

    // Random opacity
    snowflake.style.opacity = `${0.4 + Math.random() * 0.6}`

    this.container.appendChild(snowflake)
  }

  private isEnabled(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored === null ? true : stored === "true"
  }

  private setEnabled(enabled: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, enabled.toString())
  }

  private updateVisibility(): void {
    const enabled = this.isEnabled()
    if (enabled) {
      this.show()
      this.toggleButton.classList.remove("disabled")
      this.toggleButton.textContent = "❄️"
    } else {
      this.hide()
      this.toggleButton.classList.add("disabled")
      this.toggleButton.textContent = "❄️"
    }
  }

  private toggle(): void {
    const currentState = this.isEnabled()
    this.setEnabled(!currentState)
    this.updateVisibility()
  }

  public destroy(): void {
    this.container.remove()
    this.styleElement.remove()
    this.toggleButton.remove()
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
  }

  public hide(): void {
    this.container.style.display = "none"
  }

  public show(): void {
    this.container.style.display = "block"
  }
}

// Check if we're in the Christmas season (December 1st - January 2nd)
const isChristmasSeason = (): boolean => {
  const now = new Date()
  const month = now.getMonth() // 0-11 (0 = January, 11 = December)
  const day = now.getDate() // 1-31

  // December (month 11) from day 1 onwards
  if (month === 11 && day >= 1) {
    return true
  }

  // January (month 0) up to and including day 2
  if (month === 0 && day <= 2) {
    return true
  }

  return false
}

// Initialize
const initSnowfall = () => {
  if (isChristmasSeason()) {
    new Snowfall(document.body, {
      count: 50,
      minDuration: 10,
      maxDuration: 20,
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSnowfall)
} else {
  initSnowfall()
}
