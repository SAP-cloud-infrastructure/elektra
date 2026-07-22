/**
 * SSO Precheck - Attempts automatic SSO login before showing login form
 * Falls back to manual login if SSO is unavailable or fails
 */

const SSO_TIMEOUT = 5000; // 5 seconds

async function performSsoPrecheck() {
  const configEl = document.getElementById('sso-config');
  if (!configEl) {
    return;
  }

  const keystoneUrl = configEl.dataset.keystoneUrl;
  const domainName = configEl.dataset.domainName;
  const verifyUrl = configEl.dataset.verifyUrl;

  if (!keystoneUrl || !domainName) {
    showLoginForm();
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SSO_TIMEOUT);

    const response = await fetch(keystoneUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Domain-Name': domainName
      },
      body: JSON.stringify({
        "auth": {
          "identity": {
            "methods": ["external"],
            "external": {}
          }
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const subjectToken = response.headers.get('X-Subject-Token');
      if (subjectToken) {
        await verifyAndRedirect(verifyUrl, subjectToken);
        return;
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('SSO precheck timed out');
    } else {
      console.error('SSO precheck failed:', error);
    }
  }

  showLoginForm();
}

async function verifyAndRedirect(url, token) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token })
    });

    if (response.ok) {
      const html = await response.text();
      document.open();
      document.write(html);
      document.close();
    } else {
      showLoginForm();
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    showLoginForm();
  }
}

function showLoginForm() {
  const spinner = document.getElementById('sso-precheck-container');
  const content = document.getElementById('login-content');
  if (spinner) spinner.style.display = 'none';
  if (content) content.style.display = 'block';
}

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', performSsoPrecheck);

// Export for testing
export { performSsoPrecheck, verifyAndRedirect, showLoginForm };
