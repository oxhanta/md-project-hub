/**
 * ============================================================
 *  components.js — LWC Intelligence Hub UI Components
 * ============================================================
 *
 *  All HTML-generating render functions live here so you can
 *  find and edit cards, rows, and forms in one place without
 *  digging through index.html.
 *
 *  HOW TO EDIT:
 *    • Project progress bars (dashboard)   → renderProjectCompletionBar()
 *    • Project table rows                  → renderProjectTableRow()
 *    • Engagement cards                    → renderEngagementCard()
 *    • Dashboard risk items                → renderRiskItem()
 *    • Dashboard recent-engagement rows    → renderRecentEngagementRow()
 *    • AI Analyzer metric card             → renderMetricCard()
 *    • AI Analyzer flag/risk item          → renderAnalyzerFlag()
 *    • AI Analyzer entity import row       → renderEntityRow()
 *    • Recent analysis history item        → renderHistoryItem()
 *    • Todo item (My Desk full list)       → renderTodoItem()
 *    • Todo item (Dashboard widget)        → renderDashboardTodoItem()
 * ============================================================
 */


/* ============================================================
   HELPERS  (shared colour / style utilities)
   ============================================================ */

/**
 * Returns Tailwind class strings for a project/engagement status.
 * @param {string} status
 */
function getStatusStyles(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delayed')
    return { bg: 'bg-tertiary-fixed/20 border-tertiary-container', text: 'text-tertiary-container', badge: 'bg-tertiary-fixed text-tertiary-container' };
  if (s === 'completed')
    return { bg: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' };
  if (s === 'critical')
    return { bg: 'bg-error-container/10 border-error', text: 'text-error dark:text-red-400', badge: 'bg-error-container text-error dark:bg-error/30 dark:text-red-400' };
  return { bg: 'bg-surface-container-low border-primary-container', text: 'text-primary dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' };
}

/**
 * Returns a Material Symbols icon name appropriate for a partner string.
 * @param {string} partner
 */
function getPartnerIcon(partner) {
  const p = (partner || '').toLowerCase();
  if (p.includes('wateraid') || p.includes('water')) return 'water_drop';
  if (p.includes('jica') || p.includes('ifc') || p.includes('bank')) return 'handshake';
  if (p.includes('gov') || p.includes('council')) return 'account_balance';
  if (p.includes('un-water') || p.includes('eco')) return 'eco';
  if (p.includes('suez') || p.includes('siemens')) return 'settings_applications';
  return 'groups';
}


/* ============================================================
   DASHBOARD — Project Completion Progress Bar
   Used in: renderDashboard() -> #projects-completion-list
   ============================================================ */

/**
 * Renders a project as a labelled progress bar row for the dashboard widget.
 *
 * EDIT HERE to change:
 *   - Colour thresholds (colorClass / textClass)
 *   - Label text, font size, spacing (space-y-xs etc.)
 *
 * @param {Object} p  Project object
 * @returns {string}  HTML string
 */
function renderProjectCompletionBar(p) {
  /* Colour thresholds */
  let colorClass = 'bg-amber-500';
  let textClass  = 'text-amber-600 dark:text-amber-400';
  if (p.completion >= 70) { colorClass = 'bg-green-500'; textClass = 'text-green-600 dark:text-green-400'; }
  else if (p.completion < 40) { colorClass = 'bg-red-500'; textClass = 'text-red-600 dark:text-red-400'; }

  return `
    <div class="space-y-xs">
      <div class="flex justify-between items-center font-body-sm text-body-sm">
        <span class="font-medium text-primary dark:text-white">${p.name}</span>
        <span class="${textClass} font-bold">${p.completion}%</span>
      </div>
      <div class="w-full bg-surface-container dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div class="${colorClass} h-full" style="width: ${p.completion}%"></div>
      </div>
    </div>
  `;
}


/* ============================================================
   DASHBOARD — Risk Flag Item
   Used in: renderDashboard() -> #risk-list
   ============================================================ */

/**
 * Renders a single risk flag item in the dashboard risk panel.
 *
 * EDIT HERE to change:
 *   - Background / border colours per severity
 *   - Title and description font sizes
 *   - Bottom margin between items (mb-3)
 *
 * @param {Object} r  Risk object { severity, title, description, statusText }
 * @returns {string}  HTML string
 */
function renderRiskItem(r) {
  const isCrit       = (r.severity || '').toLowerCase() === 'critical';
  const borderClass  = isCrit ? 'border-error' : 'border-[#8c4927]';
  const bgClass      = isCrit ? 'bg-[#fefafc] dark:bg-error/5' : 'bg-[#fcf5f0] dark:bg-orange-900/10';
  const topTextClass = isCrit ? 'text-error' : 'text-[#8c4927]';

  return `
    <div class="p-4 ${bgClass} border-l-4 ${borderClass} mb-3">
      <div class="flex justify-between items-start mb-2">
        <span class="font-bold text-[11px] ${topTextClass} uppercase tracking-wider">${r.severity || ''}</span>
        <span class="text-[11px] text-slate-400 font-medium">${r.statusText || ''}</span>
      </div>
      ${r.title && r.title !== 'Risk Flag' ? `<h3 class="font-bold text-[14px] text-[#003366] dark:text-blue-300 mb-1">${r.title}</h3>` : ''}
      <p class="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">${r.description}</p>
    </div>
  `;
}


/* ============================================================
   DASHBOARD — Recent Engagement Table Row
   Used in: renderDashboard() -> #recent-engagements-list
   ============================================================ */

/**
 * Renders one engagement as a <tr> for the dashboard recent-engagements table.
 *
 * EDIT HERE to change:
 *   - Columns shown (date, title, partner badge)
 *   - Stripe / hover row colours
 *
 * @param {Object} e      Engagement object
 * @param {number} index  Row index (used for alternating stripe colour)
 * @returns {string}      HTML string
 */
function renderRecentEngagementRow(e, index) {
  const bgClass = index % 2 === 0
    ? 'hover:bg-surface-container-lowest dark:hover:bg-slate-800'
    : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-surface-container-lowest dark:hover:bg-slate-800';

  return `
    <tr class="${bgClass} transition-colors">
      <td class="p-md text-outline dark:text-slate-400">${e.date}</td>
      <td class="p-md font-medium text-primary dark:text-white">${e.title}</td>
      <td class="p-md text-primary dark:text-slate-300">
        <span class="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">${e.partner}</span>
      </td>
    </tr>
  `;
}


/* ============================================================
   PROJECTS — Table Row
   Used in: renderProjects() -> #projects-table-body & #completed-projects-body
   ============================================================ */

/**
 * Renders one project as a <tr> for the Projects table.
 *
 * EDIT HERE to change:
 *   - Which columns are displayed
 *   - Progress bar width / colour thresholds
 *   - Status badge style (controlled by getStatusStyles())
 *   - Row click handler (viewProjectDetails)
 *
 * @param {Object} p      Project object
 * @param {number} index  Row index for alternating stripe colour
 * @returns {string}      HTML string
 */
function renderProjectTableRow(p, index) {
  const bgClass = index % 2 === 0
    ? 'hover:bg-surface-container-lowest dark:hover:bg-slate-800'
    : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-surface-container-lowest dark:hover:bg-slate-800';

  let pColor = 'bg-amber-500';
  if (p.completion >= 70) pColor = 'bg-green-500';
  else if (p.completion < 40) pColor = 'bg-red-500';

  const styles = getStatusStyles(p.status);

  return `
    <tr class="${bgClass} transition-colors cursor-pointer" onclick="viewProjectDetails(${p.id})" title="Click to view details">
      <td class="p-md font-medium text-primary dark:text-white">${p.name}</td>
      <td class="p-md text-outline dark:text-slate-400">${p.category || '—'}</td>
      <td class="p-md text-outline dark:text-slate-400">${p.region || '—'}</td>
      <td class="p-md font-medium text-primary dark:text-slate-300">${p.handler || 'Unassigned'}</td>
      <td class="p-md">
        <span class="px-2 py-0.5 rounded-full ${styles.badge} text-[11px] font-bold uppercase">${p.status}</span>
      </td>
      <td class="p-md">
        <div class="flex items-center gap-2">
          <span class="w-8 text-[12px] font-medium text-primary dark:text-slate-300">${p.completion}%</span>
          <div class="w-16 bg-surface-container dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div class="${pColor} h-full" style="width: ${p.completion}%"></div>
          </div>
        </div>
      </td>
    </tr>
  `;
}


/* ============================================================
   ENGAGEMENTS — Card
   Used in: renderEngagements() -> #engagements-grid
   ============================================================ */

/**
 * Renders one engagement as a card in the Engagements grid.
 *
 * EDIT HERE to change:
 *   - Card border, shadow, hover effects
 *   - Fields displayed (partner, location, notes, next steps)
 *   - "View Details" / "Delete" button layout
 *
 * @param {Object} e              Engagement object
 * @param {string} currentUserRole  Global role string ('Admin'|'Editor'|'Viewer')
 * @returns {string}              HTML string
 */
function renderEngagementCard(e, currentUserRole) {
  const engType    = e.engagementType || 'External';
  const loc        = e.location || 'Location not specified';
  const note       = e.notes   || 'No detailed notes provided.';
  const icon       = getPartnerIcon(e.partner);
  const isInternal = engType === 'Internal';

  const typeTag = isInternal
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';

  const savedRole = e.loggedByRole || '';
  let roleDot = 'bg-green-400';
  if (savedRole === 'Admin')  roleDot = 'bg-red-500';
  else if (savedRole === 'Editor') roleDot = 'bg-blue-500';

  const nextSteps = e.nextSteps ? e.nextSteps.split(',').map(s => s.trim()).filter(Boolean) : [];
  const stepsHtml = nextSteps.length ? `
    <div class="flex flex-wrap gap-1 mt-2">
      ${nextSteps.map(s => `<span class="text-[10px] bg-primary/10 text-primary dark:bg-[#003366]/40 dark:text-[#00FFFF] px-2 py-0.5 rounded-full font-medium">→ ${s}</span>`).join('')}
    </div>` : '';

  const deleteBtn = currentUserRole === 'Admin' ? `
    <button onclick="deleteEngagement(${e.id})" class="text-slate-400 hover:text-error transition-colors focus:outline-none" title="Delete Engagement">
      <span class="material-symbols-outlined text-[18px]">delete</span>
    </button>` : '';

  return `
    <div class="bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-lg p-6 flex flex-col h-full transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#00FFFF] dark:hover:border-[#00FFFF]">
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-2">
          <span class="${typeTag} text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">${engType}</span>
          <span class="w-2 h-2 rounded-full ${roleDot}" title="Logged by ${savedRole || 'Staff'}"></span>
        </div>
        <span class="text-slate-400 text-xs font-medium">${e.date}</span>
      </div>
      <h3 class="font-h2 text-lg mb-2 text-primary dark:text-white">${e.title}</h3>
      <div class="flex items-center gap-2 mb-4">
        <span class="material-symbols-outlined text-secondary dark:text-[#00FFFF] text-base" data-weight="fill">${icon}</span>
        <span class="font-semibold text-sm text-secondary dark:text-[#00FFFF]">${e.partner || '—'}</span>
      </div>
      <div class="space-y-3 mb-6 flex-grow">
        <div class="flex items-start gap-2">
          <span class="material-symbols-outlined text-outline dark:text-slate-500 text-sm">location_on</span>
          <span class="text-body-sm text-on-surface-variant dark:text-slate-400">${loc}</span>
        </div>
        <p class="text-body-sm text-on-surface-variant dark:text-slate-400 line-clamp-3">${note}</p>
        ${stepsHtml}
      </div>
      <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <button onclick="viewEngagementDetails(${e.id})" class="text-primary dark:text-[#00FFFF] text-xs font-bold hover:underline flex items-center gap-1 focus:outline-none">
          View Details <span class="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
        ${deleteBtn}
      </div>
    </div>
  `;
}


/* ============================================================
   AI ANALYZER — Metric Card
   Used in: triggerAnalysis() -> #out-metrics
   ============================================================ */

/**
 * Renders a single extracted metric as a card.
 *
 * EDIT HERE to change:
 *   - Card border / background
 *   - Value font size (currently text-2xl)
 *   - Key/note label styles
 *
 * @param {Object} m  Metric object { key, value, note }
 * @returns {string}  HTML string
 */
function renderMetricCard(m) {
  return `
    <div class="p-4 border border-outline-variant dark:border-slate-800 rounded bg-white dark:bg-slate-800">
      <div class="text-[11px] font-label text-outline dark:text-slate-500 uppercase">${m.key}</div>
      <div class="text-2xl font-h1 text-primary dark:text-[#00FFFF] my-1">${m.value}</div>
      <div class="text-[11px] text-outline dark:text-slate-400 leading-tight">${m.note || ''}</div>
    </div>
  `;
}


/* ============================================================
   AI ANALYZER — Flag / Risk Item
   Used in: triggerAnalysis() -> #out-flags
   ============================================================ */

/**
 * Renders a single AI-extracted risk/flag item.
 *
 * EDIT HERE to change:
 *   - Severity colour mapping (critical / safe / warning)
 *   - Title and description font sizes
 *   - "Add to Dashboard" button (top-right corner)
 *
 * @param {Object} f      Flag object { severity, title, description, statusText }
 * @param {number} index  Index in flags array (used by addToDashboard())
 * @returns {string}      HTML string
 */
function renderAnalyzerFlag(f, index) {
  if (typeof f === 'string') f = { title: '', severity: '', description: f, statusText: '' };

  const severity = (f.severity || '').toLowerCase();
  let borderClass, bgClass, topTextClass;

  if (severity === 'critical') {
    borderClass  = 'border-error';
    bgClass      = 'bg-[#fefafc] dark:bg-error/5';
    topTextClass = 'text-error';
  } else if (severity === 'safe' || severity === 'good') {
    borderClass  = 'border-[#008080] dark:border-[#00FFFF]';
    bgClass      = 'bg-teal-50 dark:bg-[#00FFFF]/5';
    topTextClass = 'text-[#008080] dark:text-[#00FFFF]';
  } else {
    borderClass  = 'border-[#8c4927] dark:border-orange-500';
    bgClass      = 'bg-[#fcf5f0] dark:bg-orange-900/10';
    topTextClass = 'text-[#8c4927] dark:text-orange-400';
  }

  return `
    <div class="p-4 ${bgClass} border-l-4 ${borderClass} mb-3 relative group transition-colors">
      <div class="flex justify-between items-start mb-2 pr-8">
        <span class="font-bold text-[11px] ${topTextClass} uppercase tracking-wider">${f.severity || ''}</span>
        <span class="text-[11px] text-slate-400 font-medium">${f.statusText || ''}</span>
      </div>
      ${f.title && f.title !== 'Risk Flag' ? `<h3 class="font-bold text-[14px] text-[#003366] dark:text-blue-300 mb-1 w-11/12">${f.title}</h3>` : ''}
      <p class="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">${f.description}</p>
      <button onclick="addToDashboard(${index})" class="absolute top-4 right-4 text-slate-300 hover:text-primary dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Add to Dashboard">
        <span class="material-symbols-outlined text-[20px]">add_circle</span>
      </button>
    </div>
  `;
}


/* ============================================================
   AI ANALYZER — Entity Import Row
   Used in: triggerAnalysis() -> #out-entities
   ============================================================ */

/**
 * Renders a <tr> for an entity (project or engagement) extracted by the analyzer.
 *
 * EDIT HERE to change:
 *   - Badge colours per entity type
 *   - Confidence % display
 *   - Import button style
 *
 * @param {string} type   'project' | 'engagement'
 * @param {Object} item   The extracted item object
 * @param {number} index  Index used by importEntity()
 * @returns {string}      HTML string
 */
function renderEntityRow(type, item, index) {
  const label      = type === 'project' ? item.name : item.title;
  const badgeCls   = type === 'project'
    ? 'bg-primary-container/20 dark:bg-blue-900 text-primary dark:text-blue-300'
    : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400';
  const badgeText  = type === 'project' ? 'Infrastructure' : 'Engagement';
  const confidence = type === 'project' ? '98%' : '92%';

  return `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <td class="p-3 font-bold text-primary dark:text-white">${label}</td>
      <td class="p-3"><span class="px-2 py-0.5 rounded ${badgeCls} text-[10px] uppercase font-bold">${badgeText}</span></td>
      <td class="p-3 text-center text-outline dark:text-slate-400 font-mono">${confidence}</td>
      <td class="p-3 text-right">
        <button onclick="importEntity('${type}', ${index})" class="px-3 py-1 bg-secondary dark:bg-[#00FFFF] text-white dark:text-slate-900 text-xs font-bold rounded hover:opacity-90">Import</button>
      </td>
    </tr>
  `;
}


/* ============================================================
   AI ANALYZER — Recent Docs History Item
   Used in: renderHistory() -> #recent-docs
   ============================================================ */

/**
 * Renders a single recent-analysis history card.
 *
 * EDIT HERE to change:
 *   - Card border / shadow
 *   - PDF icon background colour
 *   - Name truncation, date sub-label
 *
 * @param {Object} h  History object { name, date }
 * @returns {string}  HTML string
 */
function renderHistoryItem(h) {
  return `
    <div class="border border-outline-variant dark:border-slate-800 rounded p-4 flex items-center gap-3 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow cursor-pointer">
      <div class="w-10 h-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[24px] text-red-500">picture_as_pdf</span>
      </div>
      <div class="overflow-hidden">
        <div class="text-sm font-bold text-primary dark:text-white truncate">${h.name}</div>
        <div class="text-[11px] text-outline dark:text-slate-400 mt-0.5">Analyzed ${h.date}</div>
      </div>
    </div>
  `;
}


/* ============================================================
   MY DESK — Todo Item (full list view)
   Used in: renderTodos() -> #todo-list-{High|Medium|Low}
   ============================================================ */

/**
 * Renders a single to-do item row in the My Desk full list.
 *
 * EDIT HERE to change:
 *   - Row padding / hover colour
 *   - Complete-button ring colour (cfg.ring)
 *   - Delete button visibility and icon
 *
 * @param {Object} t    Todo object { id, text, priority, completed }
 * @param {Object} cfg  Priority config { dot, ring, label, emptyMsg }
 * @returns {string}    HTML string
 */
function renderTodoItem(t, cfg) {
  return `
    <div class="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
      <button onclick="completeTodo(${t.id})" title="Mark complete"
        class="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 ${cfg.ring} transition-all flex items-center justify-center shrink-0 group-hover:scale-110">
      </button>
      <p class="flex-1 text-sm font-medium text-primary dark:text-white truncate">${t.text}</p>
      <button onclick="deleteTodoItem(${t.id})" title="Delete"
        class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-error transition-all">
        <span class="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  `;
}


/* ============================================================
   MY DESK — Todo Item (Dashboard widget compact view)
   Used in: renderDashboardTodos() -> #dashboard-todo-list
   ============================================================ */

/**
 * Renders a compact to-do item for the dashboard widget.
 *
 * EDIT HERE to change:
 *   - Item height / gap
 *   - Priority emoji label
 *   - Complete-button size
 *
 * @param {Object} t    Todo object { id, text, priority }
 * @param {Object} cfg  Priority config { dot, ring, label }
 * @returns {string}    HTML string
 */
function renderDashboardTodoItem(t, cfg) {
  return `
    <div class="flex items-center gap-3 py-1.5">
      <button onclick="completeTodo(${t.id})" title="Mark complete"
        class="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 ${cfg.ring} transition-all shrink-0">
      </button>
      <span class="text-sm text-primary dark:text-slate-300 truncate flex-1">${t.text}</span>
      <span class="text-[10px] font-bold ${cfg.dot.replace('bg-', 'text-')} shrink-0">${cfg.label}</span>
    </div>
  `;
}
