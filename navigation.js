/* global tableau */

console.log('[BCG Navigation] Auto-detect version loading...');

// ─── Toast notifications ──────────────────────────────────────────────────────
function showToast(message, isError = false, duration = 4000) {
  const existing = document.getElementById('navToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'navToast';
  toast.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    background:${isError ? '#c0392b' : '#1e7a3d'};color:#fff;
    padding:12px 24px;border-radius:4px;font-size:13px;font-weight:500;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:999999;
    font-family:'Helvetica Neue',Arial,sans-serif;text-align:center;
    max-width:360px;line-height:1.5;
  `;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
}

function toggleDropdown(id) {
  const dd = document.getElementById(id);
  if (!dd) return;
  const isOpen = dd.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) dd.classList.add('show');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-item')) closeAllDropdowns();
});

// ─── Help menu ────────────────────────────────────────────────────────────────
window.submitTicket = () =>
  window.location.href = 'mailto:gpateam@bcg.com?cc=saini.aashish@bcg.com&subject=Support';
window.emailUs = () =>
  window.location.href = 'mailto:gpateam@bcg.com?cc=saini.aashish@bcg.com';
window.openGlossary = () =>
  window.open('https://peopleanalytics.bcg.com/', '_blank');

function setupHelp() {
  const help = document.getElementById('helpDropdown');
  if (help) {
    help.innerHTML = `
      <div class="dropdown-item" onclick="submitTicket()">Submit a Ticket</div>
      <div class="dropdown-item" onclick="emailUs()">Email Us</div>
      <div class="dropdown-item" onclick="openGlossary()">Glossary</div>
    `;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function getSavedDashboards() {
  try {
    const raw = tableau.extensions.settings.get('dashboardNames');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[Settings] Error:', e);
    return [];
  }
}

function saveDashboards(names) {
  tableau.extensions.settings.set('dashboardNames', JSON.stringify(names));
  return tableau.extensions.settings.saveAsync();
}

// ─── Get available dashboards from workbook ───────────────────────────────────
function getAvailableDashboards() {
  try {
    const wb = tableau.extensions.workbook;
    if (!wb) return [];
    
    const published = wb.publishedSheetsInfo || [];
    const dashboards = published
      .filter(s => String(s.sheetType).toLowerCase() === 'dashboard')
      .map(s => s.name);
    
    console.log('[Auto-detect] Found dashboards:', dashboards);
    return dashboards;
  } catch (e) {
    console.error('[Auto-detect] Error:', e);
    return [];
  }
}

// ─── Configure dialog with CHECKBOXES ─────────────────────────────────────────
function openConfigureDialog() {
  const existing = document.getElementById('configOverlay');
  if (existing) existing.remove();

  const saved = getSavedDashboards();
  const available = getAvailableDashboards();

  console.log('[Config] Saved:', saved);
  console.log('[Config] Available:', available);

  const overlay = document.createElement('div');
  overlay.id = 'configOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.45);
    display:flex;align-items:center;justify-content:center;z-index:99999;
  `;

  let checkboxesHTML = '';
  
  if (available.length > 0) {
    checkboxesHTML = '<div style="max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;padding:12px;background:#f9f9f9;">';
    available.forEach(name => {
      const checked = saved.includes(name) ? 'checked' : '';
      checkboxesHTML += `
        <label style="display:block;margin-bottom:8px;cursor:pointer;user-select:none;">
          <input type="checkbox" value="${name}" ${checked} style="margin-right:8px;">
          <span style="font-family:monospace;font-size:13px;">${name}</span>
        </label>
      `;
    });
    checkboxesHTML += '</div>';
  } else {
    checkboxesHTML = `
      <div style="padding:20px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;margin-bottom:12px;">
        <strong style="color:#856404;">⚠ No dashboards detected</strong><br>
        <span style="font-size:12px;color:#856404;">Make sure your workbook has multiple dashboards published.</span>
      </div>
      <textarea id="configTextarea" style="
        width:100%;height:100px;border:1px solid #ccc;border-radius:4px;
        padding:10px;font-size:13px;resize:vertical;outline:none;
        font-family:monospace;line-height:1.6;
      " placeholder="Dashboard 1&#10;Dashboard 2&#10;Dashboard 3">${saved.join('\n')}</textarea>
    `;
  }

  overlay.innerHTML = `
    <div style="
      background:#fff;border-radius:6px;padding:28px 32px;
      width:480px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.28);
      font-family:'Helvetica Neue',Arial,sans-serif;color:#333;
    ">
      <h2 style="margin:0 0 6px;font-size:17px;color:#1e7a3d;">Configure Navigation</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#666;line-height:1.5;">
        ${available.length > 0 
          ? 'Select which dashboards to show in the Navigate menu:' 
          : 'Enter dashboard names manually (one per line):'}
      </p>
      ${checkboxesHTML}
      <p id="configError" style="color:#c0392b;font-size:12px;margin:6px 0 0;display:none;"></p>
      <div style="display:flex;gap:10px;margin-top:18px;justify-content:flex-end;">
        <button id="configCancel" style="
          padding:8px 20px;border:1px solid #ccc;border-radius:4px;
          background:#fff;cursor:pointer;font-size:13px;
        ">Cancel</button>
        <button id="configSave" style="
          padding:8px 20px;border:none;border-radius:4px;
          background:#1e7a3d;color:#fff;cursor:pointer;font-size:13px;font-weight:600;
        ">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  document.getElementById('configCancel').onclick = () => overlay.remove();
  
  document.getElementById('configSave').onclick = () => {
    const errEl = document.getElementById('configError');
    let names = [];

    if (available.length > 0) {
      // Get checked items
      const checkboxes = overlay.querySelectorAll('input[type="checkbox"]:checked');
      names = Array.from(checkboxes).map(cb => cb.value);
    } else {
      // Get from textarea
      const textarea = document.getElementById('configTextarea');
      if (textarea) {
        names = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }

    console.log('[Config] User selected:', names);

    if (names.length === 0) {
      errEl.textContent = 'Please select at least one dashboard.';
      errEl.style.display = 'block';
      return;
    }

    saveDashboards(names)
      .then(() => {
        overlay.remove();
        showToast(`Saved ${names.length} dashboard(s)!`);
      })
      .catch(err => {
        console.error('[Config] Save failed:', err);
        errEl.textContent = `Save failed: ${err.message || err}`;
        errEl.style.display = 'block';
      });
  };
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function restoreTitle() {
  try {
    document.getElementById('dashboardTitle').textContent =
      tableau.extensions.dashboardContent.dashboard.name || 'Dashboard';
  } catch(e) {}
}

window.navigateToDashboard = function (name) {
  console.log('[Nav] Navigating to:', name);
  closeAllDropdowns();

  const wb = tableau.extensions.workbook;
  if (!wb) {
    showToast('Workbook unavailable.', true);
    return;
  }

  document.getElementById('dashboardTitle').textContent = 'Navigating...';

  const timeout = setTimeout(() => {
    restoreTitle();
    console.error('[Nav] Timeout - activateSheetAsync did not complete');
    showToast(`Navigation to "${name}" timed out. The dashboard name may not match exactly.`, true, 6000);
  }, 8000);

  wb.activateSheetAsync(name)
    .then(() => {
      clearTimeout(timeout);
      console.log('[Nav] Success:', name);
      document.getElementById('dashboardTitle').textContent = name;
      showToast(`Navigated to ${name}`);
    })
    .catch(err => {
      clearTimeout(timeout);
      console.error('[Nav] Failed:', err);
      restoreTitle();
      
      // Better error message
      const availableDashboards = getAvailableDashboards();
      const suggestion = availableDashboards.find(d => 
        d.toLowerCase() === name.toLowerCase()
      );
      
      let errorMsg = `Could not navigate to "${name}".`;
      if (suggestion && suggestion !== name) {
        errorMsg += ` Did you mean "${suggestion}"?`;
      } else {
        errorMsg += ' Check that the name matches exactly (case-sensitive).';
      }
      
      showToast(errorMsg, true, 8000);
    });
};

// ─── Load dashboards ──────────────────────────────────────────────────────────
function renderSheets(names, currentName) {
  const dd = document.getElementById('dashboardDropdown');
  dd.innerHTML = '';

  const filtered = names.filter(n => n !== currentName);

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-item disabled';
    empty.textContent = 'No other dashboards';
    dd.appendChild(empty);
  } else {
    filtered.forEach(name => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = name;
      item.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        window.navigateToDashboard(name);
      });
      dd.appendChild(item);
    });
  }

  const sep = document.createElement('div');
  sep.style.cssText = 'height:1px;background:#e8e8e8;margin:4px 0;';
  dd.appendChild(sep);

  const configItem = document.createElement('div');
  configItem.className = 'dropdown-item';
  configItem.style.cssText = 'font-size:12px;color:#888;';
  configItem.textContent = '⚙ Edit navigation list';
  configItem.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    openConfigureDialog();
  });
  dd.appendChild(configItem);
}

function loadDashboards() {
  const dd = document.getElementById('dashboardDropdown');
  if (!dd) return;

  const currentName = tableau.extensions.dashboardContent.dashboard.name;
  const saved = getSavedDashboards();

  if (saved.length > 0) {
    renderSheets(saved, currentName);
    return;
  }

  // Auto-detect fallback
  const available = getAvailableDashboards();
  if (available.length > 0) {
    renderSheets(available, currentName);
    return;
  }

  dd.innerHTML = `
    <div class="dropdown-item disabled" style="font-size:12px;color:#999;">
      No dashboards configured yet.
    </div>
    <div class="dropdown-item" style="font-size:13px;color:#1e7a3d;font-weight:600;" id="setupNavBtn">
      ⚙ Set up navigation
    </div>
  `;
  const btn = document.getElementById('setupNavBtn');
  if (btn) {
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      openConfigureDialog();
    });
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
function setup() {
  try {
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    document.getElementById('dashboardTitle').textContent = dashboard.name || 'Dashboard';

    const env = tableau.extensions.environment;
    let user = 'Guest User';
    if (env && env.tableauServerUser) {
      user = env.tableauServerUser.fullName || env.tableauServerUser.username || user;
    }
    document.getElementById('userName').textContent = user;

    console.log('[Setup] Ready. Dashboard:', dashboard.name, '| User:', user);
  } catch (e) {
    console.error('[Setup] Error:', e);
  }
}

function attachListeners() {
  const nav = document.getElementById('navigateBtn');
  if (nav) {
    nav.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown('dashboardDropdown');
      if (document.getElementById('dashboardDropdown').classList.contains('show')) {
        loadDashboards();
      }
    });
  }

  const help = document.getElementById('helpBtn');
  if (help) {
    help.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown('helpDropdown');
    });
  }

  const home = document.getElementById('homeBtn');
  if (home) {
    home.addEventListener('click', () => closeAllDropdowns());
  }
}

// ─── Initialize ───────────────────────────────────────────────────────────────
function init() {
  console.log('[BCG Navigation] Initializing auto-detect version...');

  tableau.extensions.initializeAsync({ configure: openConfigureDialog })
    .then(() => {
      console.log('[BCG Navigation] Ready');
      attachListeners();
      setupHelp();
      setup();

      // Auto-open config if no dashboards saved AND dashboards are available
      const saved = getSavedDashboards();
      const available = getAvailableDashboards();
      
      if (saved.length === 0 && available.length > 0) {
        console.log('[Init] Auto-opening config with', available.length, 'detected dashboards');
        setTimeout(openConfigureDialog, 400);
      }
    })
    .catch(err => {
      console.error('[BCG Navigation] Init failed:', err);
      showToast('Extension failed to load. Check console for details.', true, 8000);
    });
}

init();
