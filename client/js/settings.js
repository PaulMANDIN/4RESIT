function showPageSuccess(message) {
  const el = document.getElementById('page-success');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function hideMessages() {
  document.getElementById('page-error').hidden = true;
  document.getElementById('page-success').hidden = true;
}

function splitList(value) {
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

async function loadProfile() {
  try {
    const { user } = await apiFetch('/auth/me');
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-avatar').value = user.avatar || '';
  } catch (err) {
    showPageError(err.message);
  }
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    hideMessages();
    submitBtn.disabled = true;

    try {
      const { user } = await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('profile-name').value.trim(),
          avatar: document.getElementById('profile-avatar').value.trim() || undefined,
        }),
      });
      localStorage.setItem('user', JSON.stringify(user));
      showPageSuccess('Profil mis à jour.');
    } catch (err) {
      showPageError(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initPasswordForm() {
  const form = document.getElementById('password-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    hideMessages();

    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    if (newPassword !== confirmNewPassword) {
      showPageError('Les mots de passe ne correspondent pas.');
      return;
    }

    submitBtn.disabled = true;
    try {
      await apiFetch('/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: document.getElementById('current-password').value || undefined,
          newPassword,
        }),
      });
      form.reset();
      showPageSuccess('Mot de passe changé.');
    } catch (err) {
      showPageError(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function loadPreferences() {
  try {
    const { preferences } = await apiFetch('/auth/me/preferences');
    document.getElementById('pref-diet').value = (preferences.diet || []).join(', ');
    document.getElementById('pref-allergies').value = (preferences.allergies || []).join(', ');
    document.getElementById('pref-cuisine-types').value = (preferences.cuisineTypes || []).join(', ');
    document.getElementById('pref-default-portions').value = preferences.defaultPortions ?? '';
  } catch (err) {
    showPageError(err.message);
  }
}

function initPreferencesForm() {
  const form = document.getElementById('preferences-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    hideMessages();

    const defaultPortions = document.getElementById('pref-default-portions').value;

    submitBtn.disabled = true;
    try {
      await apiFetch('/auth/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          diet: splitList(document.getElementById('pref-diet').value),
          allergies: splitList(document.getElementById('pref-allergies').value),
          cuisineTypes: splitList(document.getElementById('pref-cuisine-types').value),
          defaultPortions: defaultPortions || undefined,
        }),
      });
      showPageSuccess('Préférences enregistrées.');
    } catch (err) {
      showPageError(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initProfileForm();
  initPasswordForm();
  initPreferencesForm();
  loadProfile();
  loadPreferences();
});
