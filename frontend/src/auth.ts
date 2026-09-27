/**
 * auth.ts — Authentication state, API wrappers, route guard, and UI renderer.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

// ── Auth state singleton ───────────────────────────────────────────────────

let _currentUser: AuthUser | null = null;

export function getCurrentUser(): AuthUser | null {
  return _currentUser;
}

export function isAuthenticated(): boolean {
  return _currentUser !== null;
}

// ── API helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Pull out headers from options so we can merge safely
  const { headers: callerHeaders, ...restOptions } = options;

  const res = await fetch(path, {
    ...restOptions,
    credentials: "include",   // always — never let caller override
    headers: {
      "Content-Type": "application/json",
      ...(callerHeaders as Record<string, string> | undefined),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data as { detail?: string }).detail ||
      "Something went wrong. Please try again.";
    throw new Error(msg);
  }

  return data as T;
}

interface AuthResponse { user: AuthUser; }
interface MeResponse   { user: AuthUser | null; }

export async function apiSignup(payload: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  _currentUser = data.user;
  return data.user;
}

export async function apiLogin(payload: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  _currentUser = data.user;
  return data.user;
}

export async function apiLogout(): Promise<void> {
  // Best-effort — don't block UI if backend is down
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  _currentUser = null;
}

export async function apiMe(): Promise<AuthUser | null> {
  const data = await apiFetch<MeResponse>("/api/auth/me");
  _currentUser = data.user;
  return data.user;
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Please enter a valid email address.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Please enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password))    return "Password must contain at least one number.";
  return null;
}

// ── UI builder ─────────────────────────────────────────────────────────────

type AuthView = "login" | "signup";

function buildAuthHTML(view: AuthView): string {
  const isLogin = view === "login";

  const loginForm = `
    <form id="authForm" class="authForm" novalidate>
      <div class="authFieldGroup">
        <label class="authLabel" for="authEmail">Email address</label>
        <input class="authInput" id="authEmail" type="email"
          placeholder="you@example.com" autocomplete="email" required />
        <span class="authFieldError" id="emailErr"></span>
      </div>
      <div class="authFieldGroup">
        <label class="authLabel" for="authPassword">Password</label>
        <div class="authInputWrap">
          <input class="authInput" id="authPassword" type="password"
            placeholder="••••••••" autocomplete="current-password" required />
          <button type="button" class="authEyeBtn" id="togglePw" aria-label="Show password">
            <svg id="eyeIcon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <span class="authFieldError" id="passwordErr"></span>
      </div>
      <span class="authFormError" id="formErr"></span>
      <button type="submit" class="authSubmitBtn" id="authSubmitBtn">Sign In</button>
    </form>
    <p class="authSwitch">
      Don't have an account?
      <button class="authSwitchBtn" id="switchViewBtn">Sign up</button>
    </p>`;

  const signupForm = `
    <form id="authForm" class="authForm" novalidate>
      <div class="authFieldGroup">
        <label class="authLabel" for="authName">Full name</label>
        <input class="authInput" id="authName" type="text"
          placeholder="Jane Doe" autocomplete="name" required />
        <span class="authFieldError" id="nameErr"></span>
      </div>
      <div class="authFieldGroup">
        <label class="authLabel" for="authEmail">Email address</label>
        <input class="authInput" id="authEmail" type="email"
          placeholder="you@example.com" autocomplete="email" required />
        <span class="authFieldError" id="emailErr"></span>
      </div>
      <div class="authFieldGroup">
        <label class="authLabel" for="authPassword">Password</label>
        <div class="authInputWrap">
          <input class="authInput" id="authPassword" type="password"
            placeholder="Min 8 chars, 1 letter, 1 number" autocomplete="new-password" required />
          <button type="button" class="authEyeBtn" id="togglePw" aria-label="Show password">
            <svg id="eyeIcon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <span class="authFieldError" id="passwordErr"></span>
      </div>
      <div class="authFieldGroup">
        <label class="authLabel" for="authConfirm">Confirm password</label>
        <input class="authInput" id="authConfirm" type="password"
          placeholder="Repeat your password" autocomplete="new-password" required />
        <span class="authFieldError" id="confirmErr"></span>
      </div>
      <span class="authFormError" id="formErr"></span>
      <button type="submit" class="authSubmitBtn" id="authSubmitBtn">Create Account</button>
    </form>
    <p class="authSwitch">
      Already have an account?
      <button class="authSwitchBtn" id="switchViewBtn">Sign in</button>
    </p>`;

  return `
    <div class="authOverlay" id="authOverlay">
      <div class="authBlob authBlob--amber"></div>
      <div class="authBlob authBlob--purple"></div>
      <div class="authCard" role="main">
        <div class="authBrand">
          <div class="authLogoWrap">
            <img src="/assets/images/logo.jfif" alt="Merry's Way" class="authLogo" />
          </div>
          <div>
            <div class="authBrandName">Merry's Way</div>
            <div class="authBrandSub">Greenwich Village Coffee</div>
          </div>
        </div>
        <div class="authTabs">
          <button class="authTab ${isLogin ? "active" : ""}" id="tabLogin">Sign In</button>
          <button class="authTab ${!isLogin ? "active" : ""}" id="tabSignup">Sign Up</button>
          <div class="authTabIndicator" style="transform: translateX(${isLogin ? "0%" : "100%"})"></div>
        </div>
        <div class="authFormArea" id="authFormArea">
          ${isLogin ? loginForm : signupForm}
        </div>
      </div>
    </div>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function attachEyeToggle() {
  const btn   = document.getElementById("togglePw") as HTMLButtonElement | null;
  const input = document.getElementById("authPassword") as HTMLInputElement | null;
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    const icon = document.getElementById("eyeIcon")!;
    icon.innerHTML = isHidden
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>`;
  });
}

function setFieldError(id: string, msg: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ["nameErr", "emailErr", "passwordErr", "confirmErr", "formErr"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

function setFormError(msg: string) {
  const el = document.getElementById("formErr");
  if (el) el.textContent = msg;
}

// Keep a ref to the dots interval so we can clear it
let _dotsInterval: ReturnType<typeof setInterval> | null = null;

function setLoading(loading: boolean) {
  const btn = document.getElementById("authSubmitBtn") as HTMLButtonElement | null;
  if (!btn) return;

  if (loading) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent ?? "";
    btn.disabled = true;
    btn.innerHTML = `
      <span class="authSpinner"></span>
      <span class="authLoadingText">Please wait<span id="authDots"></span></span>
    `;
    // Animate dots in JS — CSS content animation is unreliable cross-browser
    const dotsEl = document.getElementById("authDots");
    if (dotsEl) {
      const frames = ["", ".", "..", "..."];
      let i = 0;
      _dotsInterval = setInterval(() => {
        i = (i + 1) % frames.length;
        const el = document.getElementById("authDots");
        if (el) el.textContent = frames[i];
        else if (_dotsInterval) { clearInterval(_dotsInterval); _dotsInterval = null; }
      }, 400);
    }
  } else {
    if (_dotsInterval) { clearInterval(_dotsInterval); _dotsInterval = null; }
    btn.disabled = false;
    btn.textContent = btn.dataset.label ?? "Submit";
  }
}

/** Dismiss the overlay with a fade-out, then call cb. Always calls cb. */
function dismissOverlay(cb: () => void) {
  // Stop any running dot animation
  if (_dotsInterval) { clearInterval(_dotsInterval); _dotsInterval = null; }

  const overlay = document.getElementById("authOverlay");
  if (!overlay) { cb(); return; }

  overlay.classList.add("authOverlay--hiding");

  // Fallback: if animationend never fires within 600ms, proceed anyway
  const timer = setTimeout(() => { overlay.remove(); cb(); }, 600);
  overlay.addEventListener("animationend", () => {
    clearTimeout(timer);
    overlay.remove();
    cb();
  }, { once: true });
}

// ── Form handlers ──────────────────────────────────────────────────────────

function attachLoginHandler(onSuccess: () => void) {
  const form      = document.getElementById("authForm") as HTMLFormElement;
  const submitBtn = document.getElementById("authSubmitBtn") as HTMLButtonElement;
  submitBtn.dataset.label = "Sign In";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email    = (document.getElementById("authEmail")    as HTMLInputElement).value.trim();
    const password = (document.getElementById("authPassword") as HTMLInputElement).value;

    let valid = true;
    const emailErr = validateEmail(email);
    if (emailErr)  { setFieldError("emailErr", emailErr); valid = false; }
    if (!password) { setFieldError("passwordErr", "Please enter your password."); valid = false; }
    if (!valid) return;

    setLoading(true);
    try {
      await apiLogin({ email, password });
      dismissOverlay(onSuccess);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  });
}

function attachSignupHandler(onSuccess: () => void) {
  const form      = document.getElementById("authForm") as HTMLFormElement;
  const submitBtn = document.getElementById("authSubmitBtn") as HTMLButtonElement;
  submitBtn.dataset.label = "Create Account";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const name     = (document.getElementById("authName")     as HTMLInputElement).value.trim();
    const email    = (document.getElementById("authEmail")    as HTMLInputElement).value.trim();
    const password = (document.getElementById("authPassword") as HTMLInputElement).value;
    const confirm  = (document.getElementById("authConfirm") as HTMLInputElement).value;

    let valid = true;
    if (!name) { setFieldError("nameErr", "Please enter your full name."); valid = false; }
    const emailErr = validateEmail(email);
    if (emailErr) { setFieldError("emailErr", emailErr); valid = false; }
    const pwErr = validatePassword(password);
    if (pwErr) { setFieldError("passwordErr", pwErr); valid = false; }
    if (password && confirm !== password) {
      setFieldError("confirmErr", "Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      await apiSignup({ name, email, password, confirm_password: confirm });
      dismissOverlay(onSuccess);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  });
}

// ── Auth wall ──────────────────────────────────────────────────────────────

export async function guardAuth(): Promise<void> {
  // 1. Try to restore session from cookie — with a short timeout so a
  //    dead backend doesn't block the UI for a long time.
  let user: AuthUser | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 s max
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = (await res.json()) as MeResponse;
      user = data.user ?? null;
      _currentUser = user;
    }
  } catch {
    // Backend unreachable — fall through to show login screen
    user = null;
  }

  if (user) return; // already authenticated — mount the app immediately

  // 2. No valid session — show login/signup wall and wait for success
  return new Promise<void>((resolve) => {
    let currentView: AuthView = "login";

    function render(view: AuthView) {
      currentView = view;
      document.getElementById("authOverlay")?.remove();
      document.body.insertAdjacentHTML("beforeend", buildAuthHTML(view));
      attachEyeToggle();

      if (view === "login") {
        attachLoginHandler(resolve);
      } else {
        attachSignupHandler(resolve);
      }

      // Tab buttons
      document.getElementById("tabLogin")?.addEventListener("click", () => {
        if (currentView !== "login") render("login");
      });
      document.getElementById("tabSignup")?.addEventListener("click", () => {
        if (currentView !== "signup") render("signup");
      });

      // In-form switch link
      document.getElementById("switchViewBtn")?.addEventListener("click", () => {
        render(currentView === "login" ? "signup" : "login");
      });
    }

    render("login");
  });
}
