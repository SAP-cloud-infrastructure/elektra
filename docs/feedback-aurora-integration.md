# Feedback Endpoint - Aurora Integration Guide

## Overview

The feedback endpoint uses maximum security with four layers:
1. **CORS** - Only Aurora can make JavaScript requests
2. **SSO Authentication** - User must be logged in
3. **CSRF Protection** - Prevents cross-site attacks
4. **Rate Limiting** - Max 10 requests/hour per user

## Endpoints

### 1. Get CSRF Token

**Endpoint:** `GET /system/feedback_token`

**Purpose:** Retrieve a CSRF token needed for feedback submission

**Request:**
```javascript
fetch('https://dashboard.region.tld/system/feedback_token', {
  method: 'GET',
  credentials: 'include',  // Include SSO session cookie
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Response:**
```json
{
  "csrf_token": "xyz789abc123..."
}
```

**Status Codes:**
- `200 OK` - Token returned successfully
- `401 Unauthorized` - User not logged in

---

### 2. Submit Feedback

**Endpoint:** `POST /system/feedback`

**Purpose:** Submit user feedback

**Request:**
```javascript
fetch('https://dashboard.region.tld/system/feedback', {
  method: 'POST',
  credentials: 'include',  // Include SSO session cookie
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // Token from step 1
  },
  body: JSON.stringify({
    feedback: {
      feedback_message: "User's feedback text here",
      context: {
        page_url: "https://dashboard-aurora.../compute/instances",
        source: "feedback-button",
        browser: "Mozilla/5.0...",
        browser_version: "120.0",
        viewport: "1920x1080",
        feature: "compute",
        action: "create-instance"
      }
    }
  })
})
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Feedback submitted successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Error description"
}
```

**Status Codes:**
- `200 OK` - Feedback submitted successfully
- `400 Bad Request` - Missing or invalid parameters
- `401 Unauthorized` - User not logged in
- `422 Unprocessable Entity` - Invalid or missing CSRF token
- `429 Too Many Requests` - Rate limit exceeded (10/hour)
- `503 Service Unavailable` - Email delivery failed

---

## Aurora Implementation Example

### React Component

```typescript
// FeedbackButton.tsx
import React, { useState } from 'react';

interface FeedbackContext {
  page_url?: string;
  source?: string;
  browser?: string;
  browser_version?: string;
  viewport?: string;
  feature?: string;
  action?: string;
}

interface FeedbackButtonProps {
  feature?: string;
  action?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ feature, action }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Get CSRF token
      const tokenResponse = await fetch(
        'https://dashboard.region.tld/system/feedback_token',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!tokenResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrf_token } = await tokenResponse.json();

      // Step 2: Submit feedback
      const context: FeedbackContext = {
        page_url: window.location.href,
        source: 'feedback-button',
        browser: navigator.userAgent,
        browser_version: navigator.appVersion,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        feature: feature,
        action: action
      };

      const feedbackResponse = await fetch(
        'https://dashboard.region.tld/system/feedback',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
          },
          body: JSON.stringify({
            feedback: {
              feedback_message: feedback,
              context: context
            }
          })
        }
      );

      if (!feedbackResponse.ok) {
        const errorData = await feedbackResponse.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      setSuccess(true);
      setFeedback('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Send Feedback
      </button>

      {isOpen && (
        <div className="feedback-modal">
          <h2>Send Feedback</h2>
          
          {success ? (
            <div className="success-message">
              ✓ Thank you for your feedback!
            </div>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                rows={5}
                maxLength={10000}
              />
              
              {error && (
                <div className="error-message">{error}</div>
              )}
              
              <div className="actions">
                <button 
                  onClick={submitFeedback}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
                <button onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
```

### Reusable Service

```typescript
// feedbackService.ts
interface FeedbackPayload {
  feedback_message: string;
  context?: {
    page_url?: string;
    source?: string;
    browser?: string;
    browser_version?: string;
    viewport?: string;
    feature?: string;
    action?: string;
  };
}

class FeedbackService {
  private baseUrl = 'https://dashboard.region.tld/system';

  async getCsrfToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/feedback_token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    return data.csrf_token;
  }

  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    // Get CSRF token
    const csrfToken = await this.getCsrfToken();

    // Submit feedback
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ feedback: payload })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit feedback');
    }
  }

  // Helper to build context automatically
  buildContext(feature?: string, action?: string) {
    return {
      page_url: window.location.href,
      source: 'feedback-button',
      browser: navigator.userAgent,
      browser_version: navigator.appVersion,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      feature,
      action
    };
  }
}

export const feedbackService = new FeedbackService();
```

### Usage Example

```typescript
// In your component
import { feedbackService } from './feedbackService';

async function handleFeedbackSubmit(message: string) {
  try {
    await feedbackService.submitFeedback({
      feedback_message: message,
      context: feedbackService.buildContext('compute', 'create-instance')
    });
    
    // Show success message
    toast.success('Feedback submitted successfully!');
  } catch (error) {
    // Show error message
    toast.error('Failed to submit feedback');
    console.error(error);
  }
}
```

---

## Context Fields

The `context` object can contain the following optional fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `page_url` | string | Current page URL | `"https://dashboard-aurora.../compute"` |
| `source` | string | How feedback was triggered | `"feedback-button"`, `"error-dialog"` |
| `browser` | string | Browser user agent | `"Mozilla/5.0..."` |
| `browser_version` | string | Browser version | `"120.0"` |
| `viewport` | string | Screen resolution | `"1920x1080"` |
| `feature` | string | Feature being used | `"compute"`, `"networking"` |
| `action` | string | Action being performed | `"create-instance"`, `"delete-volume"` |

**Note:** Elektra automatically enriches the context with:
- `domain_id` - User's domain ID
- `domain_name` - User's domain name
- `project_id` - Current project ID
- `project_name` - Current project name

---

## Error Handling

### Rate Limiting

If a user exceeds 10 feedback submissions per hour:

```json
{
  "status": "error",
  "message": "Too many feedback submissions. Please try again later."
}
```

**HTTP Status:** `429 Too Many Requests`

**Recommendation:** Show a friendly message and disable the feedback button temporarily.

### Authentication Errors

If the user is not logged in:

```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

**HTTP Status:** `401 Unauthorized`

**Recommendation:** Redirect user to login page or show "Please log in to send feedback"

### CSRF Errors

If CSRF token is missing or invalid:

```json
{
  "status": "error",
  "message": "Invalid authenticity token"
}
```

**HTTP Status:** `422 Unprocessable Entity`

**Recommendation:** Retry getting a fresh CSRF token

### Validation Errors

If feedback message is missing or too long:

```json
{
  "status": "error",
  "message": "Missing required field: feedback_message"
}
```

**HTTP Status:** `400 Bad Request`

---

## Security Notes

1. **Always use `credentials: 'include'`** - This includes the SSO session cookie
2. **CSRF token is one-time use** - Get a fresh token for each feedback submission
3. **HTTPS only** - The endpoint only works over HTTPS
4. **CORS restricted** - Only Aurora's domain can make requests
5. **Rate limited** - Maximum 10 submissions per hour per user
6. **Message length** - Maximum 10,000 characters

---

## Testing

### Test in Development

```bash
# 1. Start Elektra
cd elektra
rails s

# 2. Get CSRF token
curl -X GET http://localhost:3000/system/feedback_token \
  -H "Cookie: session_id=your_session" \
  -H "Content-Type: application/json"

# 3. Submit feedback
curl -X POST http://localhost:3000/system/feedback \
  -H "Cookie: session_id=your_session" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: token_from_step_1" \
  -d '{
    "feedback": {
      "feedback_message": "Test feedback",
      "context": {
        "page_url": "http://localhost:3000/test",
        "source": "test"
      }
    }
  }'
```

### Test CORS

```javascript
// Should succeed from Aurora domain
fetch('https://dashboard.region.tld/system/feedback_token', {
  credentials: 'include'
});

// Should fail from other domains (CORS error)
```

### Test Rate Limiting

```javascript
// Send 11 feedback submissions rapidly
// 11th should fail with 429 Too Many Requests
```

---

## Troubleshooting

### "Failed to get CSRF token"
- Check user is logged in
- Verify CORS headers are set correctly
- Check browser console for CORS errors

### "Invalid authenticity token"
- CSRF token may have expired
- Get a fresh token before each submission
- Check that X-CSRF-Token header is being sent

### "Too many feedback submissions"
- User has exceeded 10 submissions/hour
- Wait for rate limit to reset
- Show user how long until they can submit again

### CORS errors in browser console
- Verify Aurora origin is configured correctly in Elektra
- Check that credentials: 'include' is set
- Ensure request is from the correct Aurora domain
