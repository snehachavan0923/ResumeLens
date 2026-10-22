/**
 * ==============================================================================
 * ResumeLens — Student Resume Readiness Checker
 * script.js
 *
 * Core architecture:
 * - Data Definitions (Categories, Items, Priority weights, Suggestions)
 * - State Management & LocalStorage Persistence (Safe error-resilient handling)
 * - Dynamic Score Calculations & Metric Syncing
 * - DOM Rendering (Dashboard, Circular SVG Meter, Accordion Checklist, Suggestions)
 * - Event Handlers & Modal Interactions
 * ==============================================================================
 */

'use strict';

// ------------------------------------------------------------------------------
// 1. Constants & Configuration
// ------------------------------------------------------------------------------
const STORAGE_KEY = 'resumelens_state_v1';

// Circumference of the SVG score ring: 2 * PI * r (r = 74 -> ~464.9557)
const RING_RADIUS = 74;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Checklist items definitions grouped by category.
 * Each item contains:
 * - id: unique string identifier
 * - label: clear concise title
 * - desc: explanation of why this section is crucial for campus placements
 * - optional: boolean flag whether students can mark it "Not Applicable"
 * - priority: 'high' | 'medium' | 'low' for sorting suggestions
 * - suggestion: actionable recommendation displayed if incomplete
 */
const CHECKLIST_DATA = [
  {
    category: {
      id: 'contact',
      title: 'Contact & Profile',
      description: 'Foundational contact coordinates so recruiters and automated portals can reach you.',
      iconSvg: `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    },
    items: [
      {
        id: 'contact_name',
        label: 'Full Name prominently displayed',
        desc: 'Place your legal first and last name in large, clear, bold typography at the top.',
        optional: false,
        priority: 'high',
        suggestion: 'Place your full name prominently at the top of your resume in a clean, professional font (18-22pt).'
      },
      {
        id: 'contact_email',
        label: 'Professional Email address included',
        desc: 'Use an official university email or clean personal address (e.g., firstname.lastname@gmail.com).',
        optional: false,
        priority: 'high',
        suggestion: 'Add a professional email address and avoid nicknames, gamer tags, or informal handles.'
      },
      {
        id: 'contact_phone',
        label: 'Reliable Phone Number included',
        desc: 'Provide an active 10-digit mobile number with international country code (e.g., +91).',
        optional: false,
        priority: 'high',
        suggestion: 'Include an active phone number with country/area code so HR recruiters can coordinate interview calls.'
      },
      {
        id: 'contact_profiles',
        label: 'LinkedIn or GitHub profile link included',
        desc: 'Provides instant proof of code repositories, projects, or professional networking.',
        optional: true,
        priority: 'medium',
        suggestion: 'Add clickable links to your LinkedIn profile and GitHub portfolio to showcase projects and code quality.'
      }
    ]
  },
  {
    category: {
      id: 'education',
      title: 'Education & Academics',
      description: 'Your formal academic degree, institution, and performance records.',
      iconSvg: `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    },
    items: [
      {
        id: 'edu_degree',
        label: 'College Name & Degree specified',
        desc: 'Clearly list your undergraduate institution name and exact branch (e.g., B.Tech in CSE).',
        optional: false,
        priority: 'high',
        suggestion: 'Specify your current college/university name, degree program, and major clearly in the Education section.'
      },
      {
        id: 'edu_grad_year',
        label: 'Graduation Year / Timeline specified',
        desc: 'Specify your passing year (e.g., "Graduating June 2026") so recruiters filter your batch correctly.',
        optional: false,
        priority: 'high',
        suggestion: 'State your expected graduation month and year (e.g., "Batch of 2026") to confirm eligibility for placement drives.'
      },
      {
        id: 'edu_cgpa',
        label: 'CGPA or Percentage score included',
        desc: 'Campus recruitment teams frequently enforce strict CGPA cutoff eligibility criteria.',
        optional: true,
        priority: 'low',
        suggestion: 'List your current cumulative CGPA or percentage score if it meets cutoff criteria or reflects strong academic discipline.'
      }
    ]
  },
  {
    category: {
      id: 'skills',
      title: 'Skills & Experience',
      description: 'Technical proficiencies, internship history, and domain coursework.',
      iconSvg: `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="8 6 2 12 8 18" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    },
    items: [
      {
        id: 'skills_technical',
        label: 'Relevant Technical Skills categorized',
        desc: 'Group proficiencies into Languages, Frameworks, Developer Tools, and Core CS Fundamentals.',
        optional: false,
        priority: 'high',
        suggestion: 'Organize technical skills into distinct buckets (e.g., Languages, Frameworks, Databases, Tools) for quick skimming.'
      },
      {
        id: 'exp_internship',
        label: 'Internship or Work Experience included',
        desc: 'Detail relevant industry internships, research projects, or leadership roles if completed.',
        optional: true,
        priority: 'medium',
        suggestion: 'Detail any prior internships or work experience using bullet points focused on your responsibilities and tools used.'
      },
      {
        id: 'exp_coursework',
        label: 'Relevant Coursework or Academic Achievements',
        desc: 'Highlight core CS subjects (Data Structures, Algorithms, DBMS, OS, Computer Networks).',
        optional: true,
        priority: 'low',
        suggestion: 'Highlight 3-5 core computer science or specialization courses (e.g., DSA, Operating Systems, DBMS).'
      }
    ]
  },
  {
    category: {
      id: 'projects',
      title: 'Projects & Certifications',
      description: 'Practical demonstrations of your coding ability, architecture, and learning.',
      iconSvg: `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    },
    items: [
      {
        id: 'proj_described',
        label: 'At least one substantial project described',
        desc: 'Demonstrates end-to-end practical execution and problem-solving beyond textbook theory.',
        optional: false,
        priority: 'high',
        suggestion: 'Describe at least 1-2 substantial software or engineering projects highlighting the exact problem solved.'
      },
      {
        id: 'proj_tech',
        label: 'Project Technologies and Tools highlighted',
        desc: 'Explicitly specify the stack for each project (e.g., React, Express, MongoDB, Git).',
        optional: false,
        priority: 'medium',
        suggestion: 'List the specific tech stack (e.g., Python, PostgreSQL, REST APIs) directly below each project title.'
      },
      {
        id: 'proj_outcomes',
        label: 'Project Outcomes or Contributions explained',
        desc: 'Quantify impact with numbers, metrics, or capabilities (e.g., "Handled 500+ daily requests").',
        optional: false,
        priority: 'medium',
        suggestion: 'Explain your personal contribution and measurable outcomes (e.g., improved load speed, served users, handled errors).'
      },
      {
        id: 'proj_certifications',
        label: 'Relevant Certifications included',
        desc: 'Include recognized course certificates from AWS, Google Cloud, Coursera, or HackerRank.',
        optional: true,
        priority: 'low',
        suggestion: 'Add reputable technical certifications, credentials, or hackathon recognitions to validate extra initiative.'
      }
    ]
  }
];

// Flat lookup map of all items by ID for quick O(1) queries
const ITEMS_MAP = new Map();
CHECKLIST_DATA.forEach(cat => {
  cat.items.forEach(item => {
    ITEMS_MAP.set(item.id, { ...item, categoryTitle: cat.category.title, categoryId: cat.category.id });
  });
});

// ------------------------------------------------------------------------------
// 2. Application State Management
// ------------------------------------------------------------------------------
/**
 * Application state structure:
 * {
 *   items: {
 *     [itemId]: {
 *       completed: boolean,
 *       notApplicable: boolean
 *     }
 *   }
 * }
 */
let appState = {
  items: {}
};

/**
 * Returns a pristine default state object where all items are uncompleted and applicable.
 */
function getDefaultState() {
  const initialItems = {};
  ITEMS_MAP.forEach((item, id) => {
    initialItems[id] = {
      completed: false,
      notApplicable: false
    };
  });
  return { items: initialItems };
}

/**
 * Loads the saved state from browser LocalStorage.
 * Robust try-catch guard prevents crashes from corrupted or malformed data.
 */
function loadChecklistState() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return getDefaultState();
    }

    const parsed = JSON.parse(rawData);

    // Validate parsed structure
    if (!parsed || typeof parsed !== 'object' || !parsed.items || typeof parsed.items !== 'object') {
      console.warn('[ResumeLens] Malformed LocalStorage data encountered. Falling back to default state.');
      return getDefaultState();
    }

    // Merge with known items to ensure schema integrity even if checklist items evolve
    const mergedState = getDefaultState();
    Object.keys(mergedState.items).forEach(id => {
      if (parsed.items[id]) {
        mergedState.items[id].completed = Boolean(parsed.items[id].completed);
        mergedState.items[id].notApplicable = Boolean(parsed.items[id].notApplicable);
      }
    });

    return mergedState;
  } catch (err) {
    console.error('[ResumeLens] Error parsing saved checklist state:', err);
    return getDefaultState();
  }
}

/**
 * Saves current state to LocalStorage under the dedicated ResumeLens key.
 */
function saveChecklistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (err) {
    console.error('[ResumeLens] Failed to write state to LocalStorage:', err);
  }
}

// ------------------------------------------------------------------------------
// 3. Score Calculations & Readiness Logic
// ------------------------------------------------------------------------------
/**
 * Calculates current readiness score and relevant counts.
 *
 * Rules:
 * - Excludes items marked "Not applicable" from denominator.
 * - Handles zero-item denominator safely (never returns NaN or Infinity).
 * - Clamps percentage strictly between 0 and 100%.
 * - Rounds to nearest integer.
 */
function calculateReadinessScore() {
  let totalApplicable = 0;
  let completedApplicable = 0;
  let totalNa = 0;

  ITEMS_MAP.forEach((item, id) => {
    const itemState = appState.items[id] || { completed: false, notApplicable: false };

    if (item.optional && itemState.notApplicable) {
      totalNa++;
    } else {
      totalApplicable++;
      if (itemState.completed) {
        completedApplicable++;
      }
    }
  });

  const remainingApplicable = Math.max(0, totalApplicable - completedApplicable);

  // Safe division: guard against zero denominator
  let percentage = 0;
  if (totalApplicable > 0) {
    percentage = Math.round((completedApplicable / totalApplicable) * 100);
  }

  // Strict clamp
  const score = Math.min(100, Math.max(0, percentage));

  return {
    score,
    completed: completedApplicable,
    remaining: remainingApplicable,
    applicableTotal: totalApplicable,
    naCount: totalNa
  };
}

/**
 * Maps numeric score to readiness tier badge and descriptive label.
 *
 * Tiers:
 * 0–39%: Getting Started
 * 40–69%: Making Progress
 * 70–89%: Almost Ready
 * 90–100%: Strong Foundation
 */
function getReadinessTier(score) {
  if (score >= 90) {
    return {
      name: 'Strong Foundation',
      badgeClass: 'tier-strong',
      description: 'Outstanding! Your resume covers all critical benchmarks expected by recruiters and hiring managers.',
      color: '#059669'
    };
  } else if (score >= 70) {
    return {
      name: 'Almost Ready',
      badgeClass: 'tier-almost',
      description: 'Great progress! Address the remaining missing sections below to reach full benchmark readiness.',
      color: '#4f46e5'
    };
  } else if (score >= 40) {
    return {
      name: 'Making Progress',
      badgeClass: 'tier-progress',
      description: 'Solid start. Keep adding your academic history, technical stack, and substantial project entries.',
      color: '#2563eb'
    };
  } else {
    return {
      name: 'Getting Started',
      badgeClass: 'tier-starter',
      description: 'Begin checking off sections on your physical resume to identify missing pieces and build strength.',
      color: '#d97706'
    };
  }
}

// ------------------------------------------------------------------------------
// 4. UI Rendering & Synchronization
// ------------------------------------------------------------------------------
/**
 * Renders the circular SVG progress ring based on percentage.
 */
function updateProgressRing(score) {
  const meterCircle = document.getElementById('scoreMeterCircle');
  if (!meterCircle) return;

  // Calculate stroke offset
  // Offset = circumference * (1 - score / 100)
  const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
  meterCircle.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  meterCircle.style.strokeDashoffset = `${offset}`;
}

/**
 * Updates all dashboard metrics, hero preview card, and score badges.
 */
function renderDashboard() {
  const metrics = calculateReadinessScore();
  const tier = getReadinessTier(metrics.score);

  // 1. Main Dashboard Score Display
  const scorePercentEl = document.getElementById('scorePercentValue');
  const scoreTierBadgeEl = document.getElementById('scoreTierBadge');
  const scoreTierDescEl = document.getElementById('scoreTierDesc');
  const statCompletedEl = document.getElementById('statCompletedCount');
  const statRemainingEl = document.getElementById('statRemainingCount');
  const statNaEl = document.getElementById('statNaCount');
  const statApplicableEl = document.getElementById('statApplicableCount');

  if (scorePercentEl) scorePercentEl.textContent = `${metrics.score}%`;

  if (scoreTierBadgeEl) {
    scoreTierBadgeEl.textContent = tier.name;
    scoreTierBadgeEl.className = `tier-badge ${tier.badgeClass}`;
  }

  if (scoreTierDescEl) {
    scoreTierDescEl.textContent = tier.description;
  }

  if (statCompletedEl) statCompletedEl.textContent = `${metrics.completed}`;
  if (statRemainingEl) statRemainingEl.textContent = `${metrics.remaining}`;
  if (statNaEl) statNaEl.textContent = `${metrics.naCount}`;
  if (statApplicableEl) statApplicableEl.textContent = `${metrics.applicableTotal}`;

  // Update SVG Ring
  updateProgressRing(metrics.score);

  // 2. Hero Mini Preview Card Synchronized
  const heroScoreEl = document.getElementById('heroPreviewScore');
  const heroBarEl = document.getElementById('heroPreviewBar');
  const heroStatusChipEl = document.getElementById('heroPreviewStatusChip');
  const heroCompletedEl = document.getElementById('heroPreviewCompleted');
  const heroRemainingEl = document.getElementById('heroPreviewRemaining');

  if (heroScoreEl) heroScoreEl.textContent = `${metrics.score}%`;
  if (heroBarEl) heroBarEl.style.width = `${metrics.score}%`;
  if (heroStatusChipEl) {
    heroStatusChipEl.textContent = tier.name;
    heroStatusChipEl.className = `preview-status-chip ${tier.badgeClass}`;
  }
  if (heroCompletedEl) heroCompletedEl.textContent = `${metrics.completed}`;
  if (heroRemainingEl) heroRemainingEl.textContent = `${metrics.remaining}`;

  // Update category headers & progress
  updateCategoryProgress();

  // Update dynamic personalized recommendations
  generateImprovementSuggestions();
}

/**
 * Updates progress indicators for each of the 4 category headers.
 */
function updateCategoryProgress() {
  CHECKLIST_DATA.forEach(cat => {
    let catApplicable = 0;
    let catCompleted = 0;

    cat.items.forEach(item => {
      const state = appState.items[item.id] || { completed: false, notApplicable: false };
      if (item.optional && state.notApplicable) {
        // Excluded from category progress
      } else {
        catApplicable++;
        if (state.completed) {
          catCompleted++;
        }
      }
    });

    const percent = catApplicable > 0 ? Math.round((catCompleted / catApplicable) * 100) : 100;

    const countEl = document.getElementById(`cat-count-${cat.category.id}`);
    const fillEl = document.getElementById(`cat-fill-${cat.category.id}`);

    if (countEl) {
      countEl.textContent = `${catCompleted} / ${catApplicable}`;
    }
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
    }
  });
}

/**
 * Renders the interactive checklist categories and item rows into the DOM.
 */
function renderChecklist() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  container.innerHTML = '';

  CHECKLIST_DATA.forEach((catData, catIndex) => {
    const { category, items } = catData;

    // Create Category Wrapper
    const catCard = document.createElement('div');
    catCard.className = `category-card ${catIndex === 0 ? 'is-open' : ''}`;
    catCard.id = `cat-card-${category.id}`;

    // Header HTML
    const header = document.createElement('div');
    header.className = 'category-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', catIndex === 0 ? 'true' : 'false');
    header.setAttribute('aria-controls', `cat-content-${category.id}`);

    header.innerHTML = `
      <div class="category-header-main">
        <div class="category-badge-icon" aria-hidden="true">
          ${category.iconSvg}
        </div>
        <div class="category-info">
          <h3>${category.title}</h3>
          <p class="category-meta">${category.description}</p>
        </div>
      </div>
      <div class="category-header-progress">
        <div class="cat-progress-meta">
          <span class="cat-progress-count" id="cat-count-${category.id}">0 / 0</span>
          <div class="cat-progress-bar-wrap" aria-hidden="true">
            <div class="cat-progress-bar-fill" id="cat-fill-${category.id}" style="width: 0%;"></div>
          </div>
        </div>
        <svg class="cat-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M5 7.5L10 12.5L15 7.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    // Accordion Toggle Behavior
    const toggleAccordion = () => {
      const isOpen = catCard.classList.toggle('is-open');
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    header.addEventListener('click', toggleAccordion);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion();
      }
    });

    // Content container
    const content = document.createElement('div');
    content.className = 'category-content';
    content.id = `cat-content-${category.id}`;

    const itemsList = document.createElement('div');
    itemsList.className = 'items-list';

    // Populate Items
    items.forEach(item => {
      const itemRow = createItemElement(item);
      itemsList.appendChild(itemRow);
    });

    content.appendChild(itemsList);
    catCard.appendChild(header);
    catCard.appendChild(content);
    container.appendChild(catCard);
  });
}

/**
 * Creates and binds DOM elements for an individual checklist item.
 */
function createItemElement(item) {
  const itemState = appState.items[item.id] || { completed: false, notApplicable: false };

  const row = document.createElement('div');
  row.className = `checklist-item ${itemState.completed ? 'is-completed' : ''} ${itemState.notApplicable ? 'is-na' : ''}`;
  row.id = `item-row-${item.id}`;

  // Custom checkbox markup
  const checkboxWrap = document.createElement('div');
  checkboxWrap.className = 'item-checkbox-wrap';

  const checkboxLabel = document.createElement('label');
  checkboxLabel.className = 'custom-checkbox';
  checkboxLabel.setAttribute('for', `checkbox-${item.id}`);

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `checkbox-${item.id}`;
  input.checked = itemState.completed;
  input.disabled = itemState.notApplicable;
  input.setAttribute('aria-label', `${item.label} checkbox`);

  input.addEventListener('change', (e) => {
    handleItemToggle(item.id, e.target.checked);
  });

  const skin = document.createElement('span');
  skin.className = 'checkbox-skin';
  skin.setAttribute('aria-hidden', 'true');
  skin.innerHTML = `
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M3 8l3 3 7-7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  checkboxLabel.appendChild(input);
  checkboxLabel.appendChild(skin);
  checkboxWrap.appendChild(checkboxLabel);

  // Item details (title, badges, description)
  const details = document.createElement('div');
  details.className = 'item-details';

  const labelWrap = document.createElement('div');
  labelWrap.className = 'item-label-wrap';

  const labelText = document.createElement('label');
  labelText.className = 'item-label-text';
  labelText.setAttribute('for', `checkbox-${item.id}`);
  labelText.textContent = item.label;

  labelWrap.appendChild(labelText);

  // Optional badge or status badge
  if (item.optional) {
    const optBadge = document.createElement('span');
    optBadge.className = 'item-badge-optional';
    optBadge.textContent = 'Optional';
    labelWrap.appendChild(optBadge);
  }

  // Not applicable badge indicator
  const naBadge = document.createElement('span');
  naBadge.className = 'item-badge-na';
  naBadge.id = `badge-na-${item.id}`;
  naBadge.textContent = 'Marked N/A';
  naBadge.style.display = itemState.notApplicable ? 'inline-block' : 'none';
  labelWrap.appendChild(naBadge);

  const desc = document.createElement('p');
  desc.className = 'item-desc';
  desc.textContent = item.desc;

  details.appendChild(labelWrap);
  details.appendChild(desc);

  // Actions column (Not Applicable toggle for optional items)
  const actions = document.createElement('div');
  actions.className = 'item-actions';

  if (item.optional) {
    const naBtn = document.createElement('button');
    naBtn.type = 'button';
    naBtn.className = `na-toggle-btn ${itemState.notApplicable ? 'is-active' : ''}`;
    naBtn.id = `na-btn-${item.id}`;
    naBtn.setAttribute('aria-pressed', itemState.notApplicable ? 'true' : 'false');
    naBtn.title = 'Exclude this item from readiness calculation';
    naBtn.innerHTML = `
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="8" cy="8" r="6"/>
        <line x1="3" y1="13" x2="13" y2="3"/>
      </svg>
      <span>${itemState.notApplicable ? 'Set as Applicable' : 'Mark N/A'}</span>
    `;

    naBtn.addEventListener('click', () => {
      const currentNa = appState.items[item.id]?.notApplicable || false;
      handleNaToggle(item.id, !currentNa);
    });

    actions.appendChild(naBtn);
  }

  row.appendChild(checkboxWrap);
  row.appendChild(details);
  row.appendChild(actions);

  return row;
}

// ------------------------------------------------------------------------------
// 5. User Interaction Handlers
// ------------------------------------------------------------------------------
/**
 * Handles completing/unchecking a checklist item.
 */
function handleItemToggle(itemId, isChecked) {
  if (!appState.items[itemId]) {
    appState.items[itemId] = { completed: false, notApplicable: false };
  }

  // If item is marked N/A, ignore completion
  if (appState.items[itemId].notApplicable) return;

  appState.items[itemId].completed = isChecked;

  // Update Item Row class
  const row = document.getElementById(`item-row-${itemId}`);
  if (row) {
    if (isChecked) {
      row.classList.add('is-completed');
    } else {
      row.classList.remove('is-completed');
    }
  }

  saveChecklistState();
  renderDashboard();
}

/**
 * Handles marking an optional item as Not Applicable (or reversing it).
 */
function handleNaToggle(itemId, isNa) {
  if (!appState.items[itemId]) {
    appState.items[itemId] = { completed: false, notApplicable: false };
  }

  appState.items[itemId].notApplicable = isNa;

  // If marking N/A, clear completion flag so it doesn't count
  if (isNa) {
    appState.items[itemId].completed = false;
  }

  // Update UI Elements for this item
  const row = document.getElementById(`item-row-${itemId}`);
  const checkbox = document.getElementById(`checkbox-${itemId}`);
  const naBadge = document.getElementById(`badge-na-${itemId}`);
  const naBtn = document.getElementById(`na-btn-${itemId}`);

  if (row) {
    if (isNa) {
      row.classList.add('is-na');
      row.classList.remove('is-completed');
    } else {
      row.classList.remove('is-na');
    }
  }

  if (checkbox) {
    checkbox.checked = false;
    checkbox.disabled = isNa;
  }

  if (naBadge) {
    naBadge.style.display = isNa ? 'inline-block' : 'none';
  }

  if (naBtn) {
    naBtn.className = `na-toggle-btn ${isNa ? 'is-active' : ''}`;
    naBtn.setAttribute('aria-pressed', isNa ? 'true' : 'false');
    naBtn.querySelector('span').textContent = isNa ? 'Set as Applicable' : 'Mark N/A';
  }

  saveChecklistState();
  renderDashboard();

  showToast(isNa ? 'Item marked as Not Applicable (excluded from score).' : 'Item restored as applicable.');
}

/**
 * Generates dynamic, prioritized suggestions from incomplete applicable items.
 */
function generateImprovementSuggestions() {
  const listEl = document.getElementById('suggestionsList');
  const badgeEl = document.getElementById('suggestionsBadge');
  if (!listEl) return;

  const incompleteItems = [];

  ITEMS_MAP.forEach((item, id) => {
    const state = appState.items[id] || { completed: false, notApplicable: false };
    // Only suggest items that are applicable and NOT completed
    if (!state.completed && !(item.optional && state.notApplicable)) {
      incompleteItems.push(item);
    }
  });

  // Sort by priority order: high -> medium -> low
  const priorityWeight = { high: 1, medium: 2, low: 3 };
  incompleteItems.sort((a, b) => (priorityWeight[a.priority] || 99) - (priorityWeight[b.priority] || 99));

  if (badgeEl) {
    badgeEl.textContent = `${incompleteItems.length} action${incompleteItems.length === 1 ? '' : 's'} remaining`;
  }

  listEl.innerHTML = '';

  // Zero-incomplete celebratory message
  if (incompleteItems.length === 0) {
    const allNa = Array.from(ITEMS_MAP.values()).every(item => item.optional && appState.items[item.id]?.notApplicable);

    const completeWrap = document.createElement('div');
    completeWrap.className = 'suggestions-complete-card';
    completeWrap.innerHTML = `
      <div class="complete-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="complete-title">Outstanding! All Applicable Sections Verified</h3>
      <p class="complete-desc">
        ${allNa ? 'You have marked all optional items as N/A and verified the core essentials.' : 'Your resume fulfills all core structural placement standards. Review the Quick Tips below for final polishing.'}
      </p>
    `;
    listEl.appendChild(completeWrap);
    return;
  }

  // Render individual suggestions
  incompleteItems.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'suggestion-item';

    const priorityClass = `priority-${item.priority}`;

    itemCard.innerHTML = `
      <div class="suggestion-priority-icon ${priorityClass}" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          ${
            item.priority === 'high'
              ? '<path d="M10 4v8m0 4h.01" stroke-linecap="round"/>'
              : item.priority === 'medium'
                ? '<circle cx="10" cy="10" r="7"/><line x1="10" y1="9" x2="10" y2="14"/><line x1="10" y1="6" x2="10.01" y2="6"/>'
                : '<path d="M5 10l3 3 7-7" stroke-linecap="round" stroke-linejoin="round"/>'
          }
        </svg>
      </div>
      <div class="suggestion-body">
        <div class="suggestion-title-row">
          <span class="suggestion-title">${item.label}</span>
          <span class="priority-badge ${item.priority}">${item.priority} impact</span>
          <span class="suggestion-category-tag">&bull; ${item.categoryTitle}</span>
        </div>
        <p class="suggestion-text">${item.suggestion}</p>
      </div>
    `;

    listEl.appendChild(itemCard);
  });
}

// ------------------------------------------------------------------------------
// 6. Reset Modal & Progress Management
// ------------------------------------------------------------------------------
const resetModal = document.getElementById('resetConfirmModal');
const cancelResetBtn = document.getElementById('cancelResetBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');
const navResetBtn = document.getElementById('navResetBtn');

function openResetModal() {
  if (resetModal && typeof resetModal.showModal === 'function') {
    resetModal.showModal();
  } else if (resetModal) {
    resetModal.setAttribute('open', '');
  }
}

function closeResetModal() {
  if (resetModal && typeof resetModal.close === 'function') {
    resetModal.close();
  } else if (resetModal) {
    resetModal.removeAttribute('open');
  }
}

/**
 * Resets ONLY ResumeLens localStorage data and restores default application state.
 */
function resetChecklist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[ResumeLens] Failed to clear LocalStorage:', err);
  }

  // Restore state in memory
  appState = getDefaultState();

  // Re-render checklist UI
  renderChecklist();

  // Re-render dashboard metrics & suggestions
  renderDashboard();

  closeResetModal();
  showToast('Checklist reset to default state.');
}

// ------------------------------------------------------------------------------
// 7. Accessible Toast Notifications
// ------------------------------------------------------------------------------
let toastTimeoutId = null;

function showToast(message) {
  const toastEl = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  if (!toastEl || !msgEl) return;

  msgEl.textContent = message;
  toastEl.classList.add('show');

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3200);
}

// ------------------------------------------------------------------------------
// 8. Mobile Navigation & Accordion Controls
// ------------------------------------------------------------------------------
function setupNavigation() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile nav when a link is clicked
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('is-open')) {
          mainNav.classList.remove('is-open');
          mobileBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Accordion Expand/Collapse All toggle button
  const collapseAllBtn = document.getElementById('collapseAllBtn');
  const collapseText = document.getElementById('collapseBtnText');

  if (collapseAllBtn && collapseText) {
    let allExpanded = false;

    collapseAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      const categoryCards = document.querySelectorAll('.category-card');

      categoryCards.forEach(card => {
        const header = card.querySelector('.category-header');
        if (allExpanded) {
          card.classList.add('is-open');
          if (header) header.setAttribute('aria-expanded', 'true');
        } else {
          card.classList.remove('is-open');
          if (header) header.setAttribute('aria-expanded', 'false');
        }
      });

      collapseText.textContent = allExpanded ? 'Collapse All' : 'Expand All';
    });
  }

  // Smooth scroll for footer category deep links
  document.querySelectorAll('a[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      const catId = link.getAttribute('data-category');
      const targetCard = document.getElementById(`cat-card-${catId}`);
      if (targetCard) {
        targetCard.classList.add('is-open');
        const header = targetCard.querySelector('.category-header');
        if (header) header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ------------------------------------------------------------------------------
// 9. Event Listeners Setup
// ------------------------------------------------------------------------------
function setupEventListeners() {
  // Reset modal triggers
  if (navResetBtn) {
    navResetBtn.addEventListener('click', openResetModal);
  }

  if (cancelResetBtn) {
    cancelResetBtn.addEventListener('click', closeResetModal);
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', resetChecklist);
  }

  // Close modal when clicking on backdrop
  if (resetModal) {
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) {
        closeResetModal();
      }
    });
  }

  // Set current year in footer dynamically
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ------------------------------------------------------------------------------
// 10. Application Initialization
// ------------------------------------------------------------------------------
function initApp() {
  // Load saved state or default
  appState = loadChecklistState();

  // Render checklist components
  renderChecklist();

  // Setup navigation & listeners
  setupNavigation();
  setupEventListeners();

  // Render initial dashboard calculations
  renderDashboard();

  console.log('[ResumeLens] Application successfully initialized.');
}

// Launch app after DOM is fully parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
