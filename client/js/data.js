function filenameFromContentDisposition(header, fallback) {
  const match = /filename="([^"]+)"/.exec(header || '');
  return match ? match[1] : fallback;
}

async function handleExportSubmit(e) {
  e.preventDefault();
  const format = document.getElementById('export-format').value;
  const token = localStorage.getItem('token');

  const confirmed = window.confirm(
    'Ce fichier contiendra toutes tes recettes et tous tes cookbooks en texte brut, lisible par quiconque y a accès (aucun chiffrement). Continuer ?'
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || "Échec de l'export.");
    }

    const blob = await res.blob();
    const filename = filenameFromContentDisposition(res.headers.get('Content-Disposition'), `supmeal-export.${format}`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showPageError(err.message);
  }
}

async function handleImportSubmit(e) {
  e.preventDefault();
  const format = document.getElementById('import-format').value;
  const fileInput = document.getElementById('import-file');
  const successEl = document.getElementById('import-success');
  successEl.hidden = true;

  if (!fileInput.files.length) {
    showPageError('Sélectionne un fichier à importer.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/import?format=${format}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Échec de l'import.");
    }

    document.getElementById('page-error').hidden = true;
    successEl.textContent = `Import réussi : ${data.cookbooksCreated} cookbook(s) et ${data.recipesCreated} recette(s) créés.`;
    successEl.hidden = false;
    fileInput.value = '';
  } catch (err) {
    showPageError(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  document.getElementById('export-form').addEventListener('submit', handleExportSubmit);
  document.getElementById('import-form').addEventListener('submit', handleImportSubmit);
});
