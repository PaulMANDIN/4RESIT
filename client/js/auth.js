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

async function handleGoogleLogin() {
  try {
    await apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({}) });
  } catch (err) {
    showFormError(err.message);
  }
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

  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleLogin);
  }
});
