# ResumeLens — Student Resume Readiness Checker

> A lightweight, client-side web application designed to help college students and freshers evaluate whether their resumes contain the essential sections, formatting, and technical details required for campus placements and internship drives.

---

## 📌 Problem Statement

During campus recruitment season, many undergraduate students and freshers struggle with resume screening rejections. The primary cause is often simple, preventable structural omissions:
- Missing contact coordinates or unprofessional email IDs.
- Ambiguous graduation years or missing degree credentials.
- Unstructured technical skills sections that automated systems and recruiters cannot easily scan.
- Projects described without outcomes, technical stacks, or proof of contribution.
- Irrelevant sections penalizing candidates who do not yet have prior corporate internships.

**ResumeLens** solves this by providing a structured, interactive completeness audit based on placement standards. Students can audit their physical or digital resumes against benchmark categories, exclude non-applicable sections without unfair penalty, receive instant prioritized suggestions, and review battle-tested resume tips.

---

## ✨ Features

- **Interactive 4-Category Checklist**:
  1. *Contact & Profile* (Full Name, Professional Email, Phone Number, LinkedIn/GitHub Links).
  2. *Education & Academics* (College & Degree, Graduation Year, CGPA/Percentage).
  3. *Skills & Experience* (Technical Skills Categorization, Internships, Coursework & Achievements).
  4. *Projects & Certifications* (Substantial Projects, Tech Stack Specification, Outcomes/Impact, Certifications).
- **Fair "Not Applicable" (N/A) Handling**:
  - Allows students without prior internships, certifications, or specific profiles to mark them as N/A.
  - Automatically adjusts the denominator so students are not penalized for optional items.
- **Dynamic Real-Time Readiness Score**:
  - Instant calculation with an animated SVG circular progress meter and synchronized dashboard metrics.
  - Clear benchmark readiness tiers:
    - `0% – 39%`: **Getting Started**
    - `40% – 69%`: **Making Progress**
    - `70% – 89%`: **Almost Ready**
    - `90% – 100%`: **Strong Foundation**
- **Prioritized Improvement Suggestions**:
  - Automatically generates actionable guidance from incomplete checklist items.
  - Sorted by impact priority (High, Medium, Low).
  - Celebratory completion view when all applicable requirements are verified.
- **Quick Placement Tips**:
  - 6 practical, battle-tested resume strategies (Action Verbs, Visual Hierarchy, Relevant Projects, Repository Links, Proofreading, Tailoring).
- **Persistent LocalStorage**:
  - Checklist progress auto-saves silently to browser storage on every interaction.
  - Restores state automatically on page reloads.
  - Fault-tolerant parsing protects against corrupt or malformed data.
- **Protected Progress Reset**:
  - Accessible native `<dialog>` confirmation modal before resetting.
  - Clears *only* ResumeLens storage keys without disturbing other site data.
- **Accessible & Responsive Design**:
  - Accessible color contrast, skip-link navigation, keyboard-accessible checkboxes and accordions.
  - Fully responsive from 320px mobile viewports up to large desktop monitors.
  - Print-ready stylesheet for generating hardcopy placement audit reports.

---

## 🛠️ Technology Stack

Built strictly with clean, modern web standards without external framework bloat or third-party trackers:

- **HTML5**: Semantic tags (`<header>`, `<main>`, `<section>`, `<article>`, `<dialog>`, `<footer>`), ARIA accessibility attributes, and inline vector SVGs.
- **CSS3**: Custom properties (CSS variables), Flexbox, CSS Grid, media queries, backdrop filters, and smooth micro-interactions.
- **Vanilla JavaScript (ES6+)**: Modular functions, clean state management, DOM event listeners, and safe string rendering.
- **Browser LocalStorage API**: Client-side persistence without external backend servers or database overhead.

---

## 📂 Project Folder Structure

```text
ResumeCheck/
├── .gitignore          # Git ignore rules for OS files, IDE caches, and logs
├── index.html          # Semantic HTML document structure and accessible UI
├── README.md           # Comprehensive project documentation and guides
├── script.js           # Application logic, scoring math, state, and DOM updates
└── style.css           # Styling system, tokens, typography, and responsive layouts
```

---

## 🚀 How to Run the Website Locally

Since ResumeLens is built using vanilla web standards, it requires no package managers, build steps, or server installations.

### Option 1: Direct Browser Launch
1. Clone or download the repository to your computer.
2. Double-click `index.html` or drag-and-drop it into any modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).

### Option 2: Using VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension by *Ritwick Dey* (if not already installed).
3. Right-click `index.html` and click **"Open with Live Server"**.
4. The site will launch automatically at `http://127.0.0.1:5500`.

---

## 📐 Readiness Score Formula

The readiness score reflects the proportion of completed items among applicable placement criteria:

$$\text{Readiness Score} = \left(\frac{\text{Completed Applicable Items}}{\text{Total Applicable Items}}\right) \times 100$$

### Mathematical Rules & Edge Cases:
1. **Exclusion of N/A Items**:
   - Total items = 14.
   - Any optional item marked as "Not Applicable" is subtracted from the denominator ($\text{Total Applicable}$).
2. **Zero-Denominator Safety**:
   - If a candidate marks all optional items as N/A and has 0 applicable items, the calculation guards against division by zero:
     $$\text{Total Applicable} = 0 \implies \text{Score} = 0\%$$
   - Prevents `NaN` or `Infinity` from appearing in the user interface.
3. **Integer Rounding & Clamping**:
   - The computed score is rounded to the nearest whole integer using `Math.round()`.
   - The value is strictly clamped between $0\%$ and $100\%$ using `Math.min(100, Math.max(0, score))`.
4. **Synchronization**:
   - The main score percentage, circular SVG ring meter offset, hero preview card, category counters, and stat blocks update synchronously on every single toggle.

---

## 💾 LocalStorage Behavior

- **Storage Key**: `resumelens_state_v1`
- **Data Payload**:
  ```json
  {
    "items": {
      "contact_name": { "completed": true, "notApplicable": false },
      "contact_email": { "completed": true, "notApplicable": false },
      "exp_internship": { "completed": false, "notApplicable": true }
    }
  }
  ```
- **Safety Measures**:
  - Wrapped inside `try...catch` blocks to handle storage quota issues or browser privacy restrictions.
  - Validates object schemas and restores fallback defaults if corrupted data is found.
  - Resetting specifically calls `localStorage.removeItem('resumelens_state_v1')`, ensuring zero impact on other websites or application data.

---

## 🧪 Manual Testing & Verification Checklist

Use this checklist to verify functional correctness:

| Test Case | Steps to Test | Expected Behavior |
| :--- | :--- | :--- |
| **Initial Load** | Open `index.html` in an empty browser session. | Page loads cleanly; Score shows `0%`; Getting Started tier badge displayed; no console errors. |
| **Check Item** | Check "Full Name prominently displayed". | Score increases to `7%` (1/14); Completed counter shows `1`; item highlighted; suggestions update. |
| **Uncheck Item** | Uncheck "Full Name". | Score decreases back to `0%`; Completed counter shows `0`. |
| **Mark as N/A** | Click "Mark N/A" on "Internship or Work Experience". | Item row greys out; checkbox disables; Total Applicable drops from 14 to 13; score recalculated based on 13. |
| **Reverse N/A** | Click "Set as Applicable" on same item. | Checkbox re-enables; Total Applicable returns to 14. |
| **Readiness Tiers** | Check items to reach 40%, 70%, and 90%. | Badges shift appropriately: Making Progress (40%+), Almost Ready (70%+), Strong Foundation (90%+). |
| **Full Completion** | Check all applicable items (100%). | Score shows `100%`; suggestions list switches to celebratory "Outstanding!" card. |
| **Page Refresh** | Check 5 items, mark 2 as N/A, and refresh the browser. | Exact state is restored from LocalStorage without loss. |
| **Reset Confirmation** | Click "Reset Progress" in top nav. | Accessible modal opens with backdrop; clicking "Keep Progress" aborts; clicking "Yes, Reset" clears data and resets score to 0%. |
| **Mobile Responsiveness** | Resize browser to <768px width. | Hamburger icon appears; menu expands/collapses cleanly; cards and grids stack neatly. |
| **Keyboard Accessibility** | Use `Tab`, `Shift+Tab`, `Space`, and `Enter` to navigate. | Focus indicators visible; checkboxes toggle via Space; accordion headers expand via Enter. |

---

## ⚠️ Limitations & Future Enhancements

### Current Scope
- ResumeLens is an **interactive structural completeness auditor**, not a resume text parser or grammar classifier.
- It verifies presence and compliance with essential placement sections; it does not predict company shortlisting or recruiter decisions.

### Future Roadmap Ideas
1. **Client-side PDF Text Extraction**: Using an open-source client-side library (such as PDF.js) to auto-detect email, phone, and section headings from uploaded resumes.
2. **ATS Keyword Scanner**: Matching student resume text against specific job description keywords.
3. **Resume Export & Template Generator**: One-click generation of placement-ready Markdown or LaTeX resume templates.

---

## 💻 Git & GitHub Commands

To initialize Git and push this project to your GitHub profile, run the following commands in the terminal from the project directory:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all project files
git add .

# 3. Create initial commit
git commit -m "feat: initial commit for ResumeLens readiness checker"

# 4. Set default branch to main
git branch -M main

# 5. Link your remote GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/ResumeLens.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📄 License & Credits

Developed as a college mini-project for students and freshers. Free to use, adapt, and build upon.
