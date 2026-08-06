function showFormError(message) {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function storeSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

async function handleGoogleCredential(response) {
  try {
    const { token, user } = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: response.credential }),
    });
    storeSession(token, user);
    window.location.href = '/index.html';
  } catch (err) {
    showFormError(err.message);
  }
}

async function initGoogleSignIn() {
  const container = document.getElementById('google-signin-button');
  if (!container || !window.google) return;

  const { clientId } = await apiFetch('/auth/google/config').catch(() => ({ clientId: null }));
  if (!clientId) return;

  google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential });
  google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 320 });
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const { token, user } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      storeSession(token, user);
      window.location.href = '/index.html';
    } catch (err) {
      showFormError(err.message);
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      showFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const { token, user } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      storeSession(token, user);
      window.location.href = '/index.html';
    } catch (err) {
      showFormError(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initGoogleSignIn();
});
