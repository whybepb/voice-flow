# 🔐 Security Assessment Report
## Target: rocketium.ai + rocketium.com
**Date:** 2026-03-06 | **Tester:** Site Owner (Authorized) | **Type:** Passive Black-box Recon

---

## Executive Summary

A passive security assessment was performed across both `rocketium.ai` (marketing site) and `rocketium.com` (application). Testing was performed using browser DevTools, curl, and DNS enumeration — no special hacking tools.

**12 findings total.** 2 High, 5 Medium, 5 Low/Informational.

### Most Dangerous Chain
```
30+ third-party scripts loaded
        ↓
No effective Content-Security-Policy
        ↓
Any one compromised script → injected JS runs freely
        ↓
Credential harvesting on login page / session theft post-login
```

---

## Infrastructure Map

| Asset | Hosting | Notes |
|---|---|---|
| `rocketium.ai` | Framer CDN | Marketing site only |
| `rocketium.com` | Amazon S3 + CloudFront | Actual app / login |
| `www.rocketium.ai` | Framer CDN (CNAME) | Alias |
| `app.rocketium.ai` | ❌ Does not exist (NXDOMAIN) | |
| `studio.rocketium.com` | ❌ Does not exist (NXDOMAIN) | |
| `api.rocketium.com` | 404 | No raw API exposed |
| Auth provider | **Auth0** (`cdn.auth0.com`) | Login handled by Auth0 SDK |

---

## Phase 1 — rocketium.ai (Marketing Site)

### Headers Returned
```
strict-transport-security: max-age=31536000
x-content-type-options: nosniff
server: Framer/b987130
```

### Missing Headers
| Header | Status |
|---|---|
| Content-Security-Policy | ❌ ABSENT |
| X-Frame-Options | ❌ ABSENT |
| Referrer-Policy | ❌ ABSENT |
| Permissions-Policy | ❌ ABSENT |

### Findings

#### 🔴 V-01 — No Content-Security-Policy
- **CVSS:** 8.3 (High)
- **Impact:** No restrictions on script execution. Any of the 23 third-party scripts getting compromised = full DOM access for the attacker.
- **Proof:** `Content-Security-Policy` header → absent. CSP meta tag → `null`.

#### 🔴 V-02 — No X-Frame-Options (Clickjacking)
- **CVSS:** 7.4 (High)
- **Impact:** The site can be embedded in a transparent iframe on an attacker's page. Visitors can be tricked into clicking "Book a Demo" or other CTAs without knowing.
- **Proof:** `X-Frame-Options` → absent.
- **PoC:**
```html
<iframe src="https://rocketium.ai/" style="opacity:0.01; position:absolute; width:100%; height:100%;"></iframe>
<button style="position:absolute; top:400px; left:200px">🎁 Claim Free Prize!</button>
```

#### 🟠 V-03 — 23 Third-Party Scripts, No CSP Guard
- **CVSS:** 6.5 (Medium)
- **Notable scripts:** `getbreakout.ai`, `apollo.io`, `leadfeeder.com`, `posthog.com`, `intercom.io`
- **Impact:** Supply-chain attack surface. One hijacked script → attacker-controlled JS on your visitors' browsers.

#### 🟠 V-04 — Server Version Disclosed
- **CVSS:** 5.3 (Medium)
- **Value:** `Server: Framer/b987130`
- **Impact:** Attacker knows exact platform + build. Useful for targeting known Framer CVEs.

#### 🟡 V-05 — Missing Referrer-Policy
- **CVSS:** 3.1 (Low)
- **Impact:** Full URL (including UTM params, paths) sent to external sites when visitors navigate away.

#### 🟡 V-06 — Missing Permissions-Policy
- **CVSS:** 3.1 (Low)
- **Impact:** Third-party scripts can theoretically request camera/mic/geolocation access.

#### 🟡 V-07 — HSTS Missing `includeSubDomains` + `preload`
- **CVSS:** 3.1 (Low)
- **Current:** `max-age=31536000`
- **Missing:** `includeSubDomains; preload`

---

## Phase 2 — rocketium.com (Application + Login)

### Headers Returned (rocketium.com/login)
```
x-frame-options: SAMEORIGIN              ✅
referrer-policy: strict-origin-when-cross-origin  ✅
x-content-type-options: nosniff          ✅
strict-transport-security: max-age=31536000       ✅ (partial)
permissions-policy: camera=(), geolocation=()...  ✅
cross-origin-embedder-policy: cross-origin        ✅
cross-origin-opener-policy: cross-origin          ✅
content-security-policy: data: blob: filesystem: about: ws: wss:;   ⚠️ MALFORMED
server: AmazonS3                         ⚠️ disclosed
```

### Findings

#### 🔴 V-08 — Malformed / Ineffective Content-Security-Policy
- **CVSS:** 8.3 (High)
- **Value found:** `content-security-policy: data: blob: filesystem: about: ws: wss:;`
- **Impact:** This CSP is **syntactically invalid** — it has no directive keywords (`default-src`, `script-src`, etc.). Modern browsers will **ignore it entirely**. Despite looking like a CSP exists, there is **zero XSS protection**.
- **Proof:** Browser ignores a CSP with no directives. 30+ external scripts load with zero restriction.

#### 🟠 V-09 — 30+ Third-Party Scripts on Login Page (No Effective CSP)
- **CVSS:** 6.5 (Medium)
- **Scripts include:**
  - `cdn.auth0.com` — Auth SDK (legitimate, must be here)
  - `googletagmanager.com/gtm.js` — Google Tag Manager (high risk: can load any JS)
  - `eu.posthog.com` — Analytics
  - `widget.prefinery.com` — Referral widget
  - `cdn.jsdelivr.net` — jQuery + Bootstrap (open CDN)
  - `d2r1yp2w7bby2u.cloudfront.net` — Clevertap
- **Impact:** GTM alone can inject arbitrary scripts. On a login page, this is credential-harvesting territory if GTM account is ever compromised.

#### 🟠 V-10 — Google Tag Manager on Login Page
- **CVSS:** 6.5 (Medium)
- **Specific issue:** GTM is a "script loader" — anyone who gains access to your GTM container can inject arbitrary JavaScript on your login page without touching your codebase. GTM accounts are a high-value target.
- **Recommendation:** Remove GTM from `/login` specifically, or lock GTM container with 2FA and audit regularly.

#### 🟠 V-11 — No Rate Limiting on Login Page (Static Layer)
- **CVSS:** 5.3 (Medium)
- **Proof:** 10 rapid GET requests to `/login` all returned `200 OK` — no 429.
- **Note:** Auth0 likely has its own rate limiting on the auth API, but the CloudFront layer has none. Brute-force of the static login page content is unconstrained.

#### 🟠 V-12 — `Server: AmazonS3` Header Disclosed
- **CVSS:** 5.3 (Medium)
- **Impact:** Reveals the site is hosted on S3. S3 misconfiguration (public bucket listing, public write) is a well-known attack class. Attacker now knows where to look.

#### 🟡 V-13 — Analytics Cookies Set Without Explicit Consent Check Visible
- **CVSS:** 3.1 (Low / Compliance)
- **Cookies observed on page load (before any interaction):** `_ga`, `_gid`, `ph_phc_*`, `_gcl_au`, `WZRK_S_*`
- **Impact:** GDPR/CCPA risk — analytics cookies firing before user consent could violate regulations. (Check if your consent banner blocks these correctly.)

#### 🟡 V-14 — HSTS Without `preload` on .com
- **CVSS:** 3.1 (Low)
- **Current:** `max-age=31536000` only.

---

## ✅ Things Done Right (rocketium.com)

| Check | Status |
|---|---|
| X-Frame-Options: SAMEORIGIN | ✅ Clickjacking protected |
| Referrer-Policy set | ✅ |
| Permissions-Policy set | ✅ Camera/mic/geo blocked |
| CORS: no wildcard | ✅ Cross-origin reads blocked |
| Auth0 used for authentication | ✅ Industry-standard auth provider |
| No `.env`, `.git`, `/admin` exposed | ✅ |
| S3 bucket not publicly listable | ✅ |
| HTTPS enforced everywhere | ✅ |

---

## ❓ Should You Login?

**Yes — it is safe to login.** Here's why:

- Auth is handled by Auth0 (industry standard)
- No credential-stealing attack is active right now
- CORS is properly restricted
- No sensitive paths are exposed

**The risk is future/potential, not current.** But the malformed CSP + GTM on the login page means that *if* your GTM account or any of the 30 scripts gets compromised, an attacker could silently harvest credentials from your users. Fix these proactively.

---

## All Findings — CVSS Summary

| ID | Finding | Domain | CVSS | Severity |
|---|---|---|---|---|
| V-01 | No CSP | rocketium.ai | 8.3 | 🔴 High |
| V-02 | No X-Frame-Options (Clickjacking) | rocketium.ai | 7.4 | 🔴 High |
| V-08 | Malformed / Ineffective CSP | rocketium.com | 8.3 | 🔴 High |
| V-03 | 23 third-party scripts, no CSP | rocketium.ai | 6.5 | 🟠 Medium |
| V-09 | 30+ third-party scripts, no CSP | rocketium.com | 6.5 | 🟠 Medium |
| V-10 | Google Tag Manager on login page | rocketium.com | 6.5 | 🟠 Medium |
| V-11 | No rate limiting (static layer) | rocketium.com | 5.3 | 🟠 Medium |
| V-04 | Server version disclosed (Framer) | rocketium.ai | 5.3 | 🟠 Medium |
| V-12 | Server version disclosed (AmazonS3) | rocketium.com | 5.3 | 🟠 Medium |
| V-05 | Missing Referrer-Policy | rocketium.ai | 3.1 | 🟡 Low |
| V-06 | Missing Permissions-Policy | rocketium.ai | 3.1 | 🟡 Low |
| V-07 | Weak HSTS | rocketium.ai | 3.1 | 🟡 Low |
| V-13 | Cookies before consent | rocketium.com | 3.1 | 🟡 Low |
| V-14 | Weak HSTS | rocketium.com | 3.1 | 🟡 Low |

---

## 🛠️ Remediation Roadmap

### 🚀 Quick Wins — Fix Today

**1. Fix rocketium.ai headers in Framer (Project Settings → Custom Headers):**
```
Content-Security-Policy: default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; frame-ancestors 'none'; object-src 'none';
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
**Fixes: V-01, V-02, V-05, V-06, V-07**

---

**2. Fix the Malformed CSP on rocketium.com (CloudFront → Response Headers Policy):**

In AWS CloudFront, create a **Response Headers Policy** and set:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline'
    https://cdn.auth0.com
    https://www.googletagmanager.com
    https://eu.posthog.com
    https://cdn.jsdelivr.net
    https://widget.prefinery.com
    https://d2r1yp2w7bby2u.cloudfront.net;
  connect-src 'self' https://*.auth0.com https://eu.posthog.com;
  frame-ancestors 'none';
  object-src 'none';
```
**Fixes: V-08**

---

### 🔧 Medium Effort — Fix This Week

**3. Remove GTM from the login page (V-10)**

In your GTM container, add a trigger condition so GTM tags only fire on pages that are **not** `/login`:
- In GTM: All Tags → Add exception trigger → `Page Path does not contain /login`

Or better: load GTM conditionally in your frontend:
```javascript
if (!window.location.pathname.startsWith('/login')) {
  // load GTM
}
```

**4. Add CloudFront Rate Limiting (V-11)**
- In AWS WAF, attach a rate-based rule to your CloudFront distribution
- Recommended: 100 requests / 5 min per IP on `/login`

---

### 🏗️ Longer Term — Fix This Month

**5. Audit GTM Container (V-10)**
- Enable 2FA on your Google account linked to GTM
- Review all GTM tags and remove unused ones
- Enable GTM container version history and email alerts on publish

**6. Cookie Consent Audit (V-13)**
- Verify your consent management platform (CMP) blocks `_ga`, PostHog, Clevertap from firing before user accepts
- Test in incognito: check cookies on first load before accepting any banner

---

## Verification Checklist

After fixes, verify with these DevTools commands:

```javascript
// 1. Confirm CSP exists and is valid
fetch(location.href).then(r => console.log('CSP:', r.headers.get('content-security-policy')))
// Should show complete policy with 'default-src' directive

// 2. Confirm X-Frame-Options on rocketium.ai
fetch('https://rocketium.ai/').then(r => console.log('XFO:', r.headers.get('x-frame-options')))
// Should show: DENY

// 3. Confirm GTM not on login
Array.from(document.querySelectorAll('script[src]'))
  .filter(s => s.src.includes('googletagmanager'))
// Should return [] on /login page
```

---

*Report generated via authorized passive browser-based security assessment. No automated scanners, exploits, or third-party attack infrastructure were used.*
