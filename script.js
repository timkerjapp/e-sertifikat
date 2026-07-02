// ============================================================
// GANTI INI sesuai link deployment "Publik" Apps Script lo.
// Ambil dari: Deploy > Manage deployments > Web app URL
// ============================================================
const API_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT_LO/exec';

const kegiatanSelect = document.getElementById('kegiatanSelect');
const pesertaSelect = document.getElementById('pesertaSelect');
const pesertaWrap = document.getElementById('pesertaWrap');
const viewerWrap = document.getElementById('viewerWrap');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const pdfFrame = document.getElementById('pdfFrame');
const downloadBtn = document.getElementById('downloadBtn');
const fileNameLabel = document.getElementById('fileNameLabel');

async function apiGet(action, params) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Server error (' + res.status + ')');
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

function showError(msg) {
  errorState.textContent = msg;
  errorState.style.display = 'block';
}

function resetDownstream() {
  pesertaWrap.style.display = 'none';
  viewerWrap.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  pesertaSelect.innerHTML = '<option value="">-- Pilih nama --</option>';
}

async function loadKegiatan() {
  try {
    const list = await apiGet('listKegiatan');
    kegiatanSelect.innerHTML = '<option value="">-- Pilih kegiatan --</option>';
    if (list.length === 0) {
      kegiatanSelect.innerHTML = '<option value="">Belum ada kegiatan</option>';
      return;
    }
    list.forEach((k) => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = k.nama;
      kegiatanSelect.appendChild(opt);
    });
  } catch (err) {
    kegiatanSelect.innerHTML = '<option value="">Gagal memuat data</option>';
    showError('Gagal terhubung ke server: ' + err.message + '. Coba refresh halaman.');
    console.error(err);
  }
}

kegiatanSelect.addEventListener('change', async () => {
  resetDownstream();
  const kegiatanId = kegiatanSelect.value;
  if (!kegiatanId) return;

  pesertaSelect.innerHTML = '<option value="">Memuat…</option>';
  pesertaWrap.style.display = 'block';

  try {
    const list = await apiGet('listPeserta', { kegiatanId });
    if (list.length === 0) {
      pesertaWrap.style.display = 'none';
      emptyState.textContent = 'Belum ada sertifikat untuk kegiatan ini.';
      emptyState.style.display = 'block';
      return;
    }
    pesertaSelect.innerHTML = '<option value="">-- Pilih nama --</option>';
    list.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.fileId;
      opt.textContent = p.nama;
      pesertaSelect.appendChild(opt);
    });
  } catch (err) {
    pesertaSelect.innerHTML = '<option value="">Gagal memuat data</option>';
    showError('Gagal memuat daftar peserta: ' + err.message);
    console.error(err);
  }
});

pesertaSelect.addEventListener('change', async () => {
  const fileId = pesertaSelect.value;
  if (!fileId) { viewerWrap.style.display = 'none'; return; }

  try {
    const info = await apiGet('getFile', { fileId });
    fileNameLabel.textContent = info.fileName;
    pdfFrame.src = info.viewUrl;
    downloadBtn.href = info.downloadUrl;
    viewerWrap.style.display = 'block';
  } catch (err) {
    showError('Gagal memuat sertifikat: ' + err.message);
    console.error(err);
  }
});

loadKegiatan();
