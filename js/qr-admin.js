/* ============================================================
   Crystalina Admin QR Code Generator
   Uses the locally bundled qrcode-generator encoder, then draws
   Crystalina-specific designs to a downloadable canvas.
   ============================================================ */

(() => {
  const form = document.getElementById('qrForm');
  if (!form || typeof qrcode !== 'function') return;

  const canvas = document.getElementById('qrCanvas');
  const stage = document.getElementById('qrPreviewStage');
  const error = document.getElementById('qrError');
  const downloadButton = document.getElementById('qrDownloadBtn');
  const typeLabels = {
    standard: 'Standard QR',
    minimal: 'Minimalistic',
    serial: 'QR + Serial Number',
    logo: 'QR + Crystalina Logo',
    discount: 'QR + Discount Code'
  };
  let currentConfig = null;

  const selectedType = () => form.querySelector('[name="qrType"]:checked').value;
  const safeFileName = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'crystalina-qr';
  const serialNumber = () => `CRY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const localDateKey = () => { const date = new Date(); const part = value => String(value).padStart(2, '0'); return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`; };
  const qrDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  function setError(message = '') {
    error.textContent = message;
    error.classList.toggle('show', Boolean(message));
  }

  function hexRGB(hex) {
    const normalized = hex.replace('#', '');
    return [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16));
  }

  function hasScanContrast(foreground, background) {
    const fg = hexRGB(foreground); const bg = hexRGB(background);
    const brightness = color => (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;
    return brightness(bg) - brightness(fg) >= 105;
  }

  function encodedPayload(config) {
    if (!['serial', 'discount'].includes(config.type)) return config.payload;
    const key = config.type === 'serial' ? 'serial' : 'discount';
    const value = config.type === 'serial' ? config.serial : config.discount;
    try {
      const url = new URL(config.payload);
      url.searchParams.set(key, value);
      return url.toString();
    } catch {
      return `${config.payload}\n${key.toUpperCase()}: ${value}`;
    }
  }

  function collectConfig() {
    const type = selectedType();
    const config = {
      id: document.getElementById('qrEditingId').value,
      name: document.getElementById('qrName').value.trim(),
      type,
      payload: document.getElementById('qrPayload').value.trim(),
      serial: type === 'serial' ? document.getElementById('qrSerial').value.trim() : '',
      discount: type === 'discount' ? document.getElementById('qrDiscount').value : '',
      size: Number(document.getElementById('qrSize').value),
      foreground: document.getElementById('qrForeground').value,
      background: document.getElementById('qrBackground').value
    };
    if (!config.name || !config.payload) throw new Error('Add a name and destination before generating the QR code.');
    if (config.type === 'serial' && !config.serial) throw new Error('Add or generate a serial number for this design.');
    if (config.type === 'discount' && !config.discount) throw new Error('Choose a discount code for this design.');
    if (!hasScanContrast(config.foreground, config.background)) throw new Error('Choose a much darker QR color and a lighter background so phones can scan it reliably.');
    return config;
  }

  function isFinderCell(row, column, count) {
    return (row < 7 && column < 7) || (row < 7 && column >= count - 7) || (row >= count - 7 && column < 7);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function drawMatrix(ctx, qr, config, area) {
    const count = qr.getModuleCount();
    const quiet = 4;
    const cell = Math.floor(area.size / (count + quiet * 2));
    const actual = cell * (count + quiet * 2);
    const startX = area.x + Math.floor((area.size - actual) / 2) + quiet * cell;
    const startY = area.y + Math.floor((area.size - actual) / 2) + quiet * cell;
    ctx.fillStyle = config.foreground;
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (!qr.isDark(row, column)) continue;
        const x = startX + column * cell; const y = startY + row * cell;
        if (config.type === 'minimal' && !isFinderCell(row, column, count)) {
          const inset = cell * .13;
          roundedRect(ctx, x + inset, y + inset, cell - inset * 2, cell - inset * 2, cell * .28);
          ctx.fill();
        } else ctx.fillRect(x, y, cell, cell);
      }
    }
    return { startX, startY, matrixSize: count * cell };
  }

  function loadLogo() {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = '/logo-mark.png';
    });
  }

  async function renderQRCode(config) {
    setError();
    const size = config.size;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = config.background; ctx.fillRect(0, 0, size, size);
    const correction = config.type === 'logo' ? 'H' : ['minimal', 'serial', 'discount'].includes(config.type) ? 'Q' : 'M';
    const qr = qrcode(0, correction);
    qr.addData(encodedPayload(config)); qr.make();

    const labelDesign = ['serial', 'discount'].includes(config.type);
    const qrAreaSize = labelDesign ? Math.floor(size * .79) : size;
    const area = { x: Math.floor((size - qrAreaSize) / 2), y: labelDesign ? Math.floor(size * .015) : 0, size: qrAreaSize };
    const matrix = drawMatrix(ctx, qr, config, area);

    if (config.type === 'logo') {
      const logo = await loadLogo();
      if (logo) {
        const logoSize = matrix.matrixSize * .2;
        const x = matrix.startX + (matrix.matrixSize - logoSize) / 2;
        const y = matrix.startY + (matrix.matrixSize - logoSize) / 2;
        ctx.fillStyle = config.background;
        roundedRect(ctx, x - logoSize * .13, y - logoSize * .13, logoSize * 1.26, logoSize * 1.26, logoSize * .18); ctx.fill();
        ctx.drawImage(logo, x, y, logoSize, logoSize);
      }
    }

    if (labelDesign) {
      const labelY = size * .83;
      ctx.textAlign = 'center';
      ctx.fillStyle = config.foreground;
      ctx.font = `700 ${Math.round(size * .027)}px Poppins, Arial, sans-serif`;
      ctx.fillText(config.type === 'serial' ? 'CRYSTALINA PRODUCT ID' : 'CRYSTALINA DISCOUNT', size / 2, labelY);
      ctx.font = `800 ${Math.round(size * .055)}px Poppins, Arial, sans-serif`;
      ctx.fillText(config.type === 'serial' ? config.serial : config.discount, size / 2, labelY + size * .07);
      if (config.type === 'discount') {
        const discount = Store.getAdminData().discounts.find(item => item.id === config.discount);
        ctx.font = `600 ${Math.round(size * .024)}px Inter, Arial, sans-serif`;
        ctx.fillText(discount?.type || 'Scan to redeem', size / 2, labelY + size * .115);
      }
    }

    currentConfig = config;
    stage.classList.add('has-code');
    downloadButton.disabled = false;
    document.getElementById('qrPreviewMeta').textContent = `${typeLabels[config.type]} · ${size} px`;
    document.getElementById('qrScanBadge').textContent = config.type === 'logo' ? 'High correction' : 'Ready to scan';
    return config;
  }

  async function generatePreview(config = null) {
    try { return await renderQRCode(config || collectConfig()); }
    catch (problem) { setError(problem.message || 'Unable to generate this QR code.'); return null; }
  }

  function refreshDiscounts(selected = '') {
    const discounts = Store.getAdminData().discounts;
    document.getElementById('qrDiscount').innerHTML = discounts.map(item => `<option value="${escapeHTML(item.id)}" ${item.id === selected ? 'selected' : ''}>${escapeHTML(item.id)} · ${escapeHTML(item.type)}</option>`).join('') || '<option value="">Add a discount code in Marketing first</option>';
  }

  function renderSavedCodes() {
    const codes = Store.getAdminData().qrCodes || [];
    document.getElementById('qrSavedCount').textContent = `${codes.length} saved`;
    document.querySelector('#qrCodesTable tbody').innerHTML = codes.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong><br><small>${escapeHTML(item.id)}</small></td><td><span class="qr-design-chip">${escapeHTML(typeLabels[item.type] || item.type)}</span></td><td><span class="qr-destination" title="${escapeHTML(item.payload)}">${escapeHTML(item.payload)}</span></td><td>${escapeHTML(item.type === 'serial' ? item.serial : item.type === 'discount' ? item.discount : '—')}</td><td>${qrDate(item.created)}</td><td>${Number(item.scans || 0).toLocaleString()}</td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="QRAdminUI.preview('${item.id}')">Preview</button><button class="btn btn-sm btn-ghost" onclick="QRAdminUI.edit('${item.id}')">Edit</button><button class="btn btn-sm btn-ghost" onclick="QRAdminUI.download('${item.id}')">Download</button><button class="btn btn-sm btn-danger" onclick="QRAdminUI.remove('${item.id}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="7">No QR codes saved yet.</td></tr>';
    refreshDiscounts(document.getElementById('qrDiscount').value);
  }

  function populateForm(item) {
    document.getElementById('qrEditingId').value = item.id || '';
    document.getElementById('qrName').value = item.name || '';
    const radio = form.querySelector(`[name="qrType"][value="${item.type}"]`); if (radio) radio.checked = true;
    document.getElementById('qrPayload').value = item.payload || '';
    document.getElementById('qrSerial').value = item.serial || '';
    document.getElementById('qrSize').value = String(item.size || 480);
    document.getElementById('qrForeground').value = item.foreground || '#15375d';
    document.getElementById('qrBackground').value = item.background || '#ffffff';
    refreshDiscounts(item.discount || '');
    updateTypeFields(); updateColorLabels();
  }

  function resetBuilder() {
    form.reset();
    document.getElementById('qrEditingId').value = '';
    document.getElementById('qrPayload').value = 'https://crystalina.org/';
    document.getElementById('qrForeground').value = '#15375d';
    document.getElementById('qrBackground').value = '#ffffff';
    currentConfig = null; setError(); updateTypeFields(); updateColorLabels(); refreshDiscounts();
    stage.classList.remove('has-code'); downloadButton.disabled = true;
    document.getElementById('qrPreviewMeta').textContent = 'Choose a design and generate your code.';
    document.getElementById('qrScanBadge').textContent = 'Ready to scan';
    document.getElementById('qrName').focus();
  }

  function updateTypeFields() {
    const type = selectedType();
    document.getElementById('qrSerialField').hidden = type !== 'serial';
    document.getElementById('qrDiscountField').hidden = type !== 'discount';
    document.getElementById('qrPayloadHelp').textContent = type === 'discount' ? 'The selected discount code is automatically added to this destination.' : type === 'serial' ? 'The serial number is automatically added to this destination or encoded text.' : 'This is what phones open or display after scanning.';
  }

  function updateColorLabels() {
    document.getElementById('qrForegroundValue').textContent = document.getElementById('qrForeground').value.toUpperCase();
    document.getElementById('qrBackgroundValue').textContent = document.getElementById('qrBackground').value.toUpperCase();
  }

  function downloadCurrent() {
    if (!currentConfig) return;
    const link = document.createElement('a');
    link.download = `${safeFileName(currentConfig.name)}-${currentConfig.type}.png`;
    link.href = canvas.toDataURL('image/png'); link.click();
  }

  window.QRAdminUI = {
    render: renderSavedCodes,
    async preview(id) {
      const item = Store.getAdminData().qrCodes.find(code => code.id === id); if (!item) return;
      populateForm(item); await generatePreview(item); document.getElementById('view-qrcodes').scrollIntoView({ behavior: 'smooth' });
    },
    async edit(id) { await this.preview(id); document.getElementById('qrName').focus(); },
    async download(id) { const item = Store.getAdminData().qrCodes.find(code => code.id === id); if (!item) return; if (await generatePreview(item)) downloadCurrent(); },
    remove(id) {
      const item = Store.getAdminData().qrCodes.find(code => code.id === id); if (!item || !confirm(`Delete ${item.name}?`)) return;
      Store.deleteAdminItem('qrCodes', id); renderSavedCodes(); toast('QR code deleted');
    }
  };

  form.querySelectorAll('[name="qrType"]').forEach(input => input.addEventListener('change', updateTypeFields));
  ['qrForeground', 'qrBackground'].forEach(id => document.getElementById(id).addEventListener('input', updateColorLabels));
  document.getElementById('generateSerialBtn').addEventListener('click', () => { document.getElementById('qrSerial').value = serialNumber(); });
  document.getElementById('qrNewBtn').addEventListener('click', resetBuilder);
  document.getElementById('qrPreviewBtn').addEventListener('click', () => generatePreview());
  downloadButton.addEventListener('click', downloadCurrent);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    let config;
    try { config = collectConfig(); } catch (problem) { setError(problem.message); return; }
    if (!await generatePreview(config)) return;
    const existing = config.id && Store.getAdminData().qrCodes.find(item => item.id === config.id);
    const saved = { ...config, id: existing?.id || `QR-${String(Date.now()).slice(-6)}`, created: existing?.created || localDateKey(), scans: existing?.scans || 0 };
    if (existing) Store.updateAdminItem('qrCodes', existing.id, saved); else Store.addAdminItem('qrCodes', saved);
    document.getElementById('qrEditingId').value = saved.id; currentConfig = saved; renderSavedCodes(); toast('QR code saved');
  });

  document.getElementById('qrPayload').value = 'https://crystalina.org/';
  refreshDiscounts(); updateTypeFields(); updateColorLabels(); renderSavedCodes();
})();
