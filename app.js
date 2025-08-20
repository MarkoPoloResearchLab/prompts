const THEME_STORAGE_KEY = "preferred-theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";
const THEME_BUTTON_ID = "themeButton";
const THEME_ICON_ID = "themeIcon";
const JUMP_ANIMATION_CLASS = "jump";
const JUMP_ANIMATION_DURATION_MS = 300;
const PROMPTS_JSON_PATH = "prompts.json";

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const selectedTheme = savedTheme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
    document.body.classList.remove(LIGHT_THEME, DARK_THEME);
    document.body.classList.add(selectedTheme);
    return selectedTheme;
}
// ---------- Constants ----------
const DARK_MODE_ICON = "dark_mode";
const LIGHT_MODE_ICON = "light_mode";

const CLASS_CARD = "card";
const CLASS_CONTENT = "content";
const CLASS_ACTIONS = "actions";
const CLASS_BUTTON = "button";
const CLASS_CHIPS = "chips";
const CLASS_CHIP = "chip";
const CLASS_SMALL = "small";
const GRID_ITEM_CLASSES = "s12 m6 l4";
const TEXT_CLASS = "text";
const CLASS_PROMPT_BODY = "prompt-body";
const CLASS_GROW = "grow";
const CLASS_COLUMN = "column";
const CLASS_ROW_END = "row end";

const SNACKBAR_CLASS_NAME = "snackbar";
const COPY_SNACKBAR_ID = "copySnackbar";
const COPY_BUTTON_LABEL = "Copy";

const TAG_ALL = "all";
const state = {search: "", tag: TAG_ALL};
const STORAGE_KEY_PROMPT_STATE = "prompt-bubbles-state";

const EVENT_INPUT = "input";
const EVENT_CLICK = "click";
const EVENT_KEYDOWN = "keydown";
const EVENT_DOM_CONTENT_LOADED = "DOMContentLoaded";
const KEY_ENTER = "Enter";
const KEY_SLASH = "/";

// ---------- Helpers ----------
const selectOne = (sel, root = document) => root.querySelector(sel);
const selectAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const debounce = (fn, ms = 120) => {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
    };
};
const sanitize = s => s.replace(/\r/g, "");
const escapeHTML = raw => raw.replace(/[&<>\"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[ch]));
const withLineBreaks = raw => escapeHTML(raw).replace(/\n/g, "<br>");

/**
 * loadPrompts retrieves the prompt definitions from the JSON file.
 */
async function loadPrompts() {
    const response = await fetch(PROMPTS_JSON_PATH);
    return await response.json();
}

let PROMPTS = [];
// ---------- UI builders ----------
function uniqueTags() {
    const s = new Set();
    PROMPTS.forEach(p => p.tags.forEach(t => s.add(t)));
    return [TAG_ALL, ...Array.from(s).sort((a, b) => a.localeCompare(b))];
}

/**
 * renderChips builds the tag filter buttons and binds their click handlers.
 */
function renderChips() {
    const host = selectOne("#chipBar");
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = CLASS_CHIPS;
    uniqueTags().forEach(tagName => {
        const chip = document.createElement("button");
        chip.className = `${CLASS_CHIP} ${CLASS_SMALL}`;
        chip.type = "button";
        chip.textContent = tagName;
        chip.setAttribute("data-active", tagName === state.tag ? "true" : "false");
        chip.onclick = () => {
            state.tag = tagName;
            persistState();
            renderGrid();
            highlightActiveChip();
        };
        wrap.appendChild(chip);
    });
    host.appendChild(wrap);
    ui(CLASS_CHIPS, wrap);
}

function highlightActiveChip() {
    selectAll(`#chipBar .${CLASS_CHIP}`).forEach(el =>
        el.setAttribute("data-active", String(el.textContent === state.tag))
    );
}

function matches(p, q, tag) {
    const tagOK = tag === TAG_ALL || p.tags.includes(tag);
    if (!q) return tagOK;
    const text = (p.title + " " + p.text + " " + p.tags.join(" ")).toLowerCase();
    return tagOK && q.split(/\s+/).every(tok => text.includes(tok));
}

function renderGrid() {
    const grid = selectOne("#grid");
    const q = state.search.trim().toLowerCase();
    const items = PROMPTS.filter(p => matches(p, q, state.tag));
    grid.innerHTML = "";
    items.forEach(p => grid.appendChild(createCard(p)));
    ui(CLASS_CARD, grid);
    if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "text secondary center s12";
        empty.textContent = "No prompts match your search/filter.";
        grid.appendChild(empty);
    }
}

/**
 * createCard constructs a prompt card with header, tags, body, and actions.
 */
function createCard(p) {
    const card = document.createElement("article");
    card.className = `${CLASS_CARD} ${GRID_ITEM_CLASSES}`;
    card.setAttribute("role", "listitem");
    card.tabIndex = 0;

    const content = document.createElement("div");
    content.className = `${CLASS_CONTENT} ${CLASS_GROW} ${CLASS_COLUMN}`;

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.innerHTML = escapeHTML(p.title);
    header.appendChild(title);
    content.appendChild(header);

    const tags = document.createElement("div");
    tags.className = CLASS_CHIPS;
    p.tags.forEach(tag => {
        const chip = document.createElement("div");
        chip.className = CLASS_CHIP;
        chip.textContent = tag;
        tags.appendChild(chip);
    });
    content.appendChild(tags);

    const bodyWrap = document.createElement("div");
    bodyWrap.className = CLASS_GROW;
    const body = document.createElement("div");
    body.className = `${TEXT_CLASS} ${CLASS_PROMPT_BODY}`;
    body.innerHTML = withLineBreaks(p.text);
    bodyWrap.appendChild(body);
    content.appendChild(bodyWrap);

    card.appendChild(content);

    const actions = document.createElement("nav");
    actions.className = `${CLASS_ACTIONS} ${CLASS_ROW_END}`;

    const copyBtn = document.createElement("button");
    copyBtn.className = CLASS_BUTTON;
    copyBtn.type = "button";
    copyBtn.setAttribute("aria-label", `Copy prompt: ${p.title}`);
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg><span>${COPY_BUTTON_LABEL}</span>`;
    copyBtn.onclick = () => copyPrompt(p);
    actions.appendChild(copyBtn);

    card.appendChild(actions);

    card.addEventListener(EVENT_KEYDOWN, e => {
        if (e.key === KEY_ENTER) {
            e.preventDefault();
            copyPrompt(p);
        }
    });
    return card;
}

function copyPrompt(p) {
    const content = `${p.text}`.trim();
    navigator.clipboard.writeText(sanitize(content)).then(() => {
        const s = selectOne(`#${COPY_SNACKBAR_ID}`);
        s.textContent = "Copied ✓";
        ui(SNACKBAR_CLASS_NAME, s); // Beer snackbar trigger
    }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = content;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
    });
}

const onSearch = debounce(v => {
    state.search = v;
    persistState();
    renderGrid();
}, 80);

function persistState() {
    try {
        localStorage.setItem(STORAGE_KEY_PROMPT_STATE, JSON.stringify(state));
    } catch {
    }
}

function restoreState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PROMPT_STATE);
        if (raw) {
            const p = JSON.parse(raw);
            if (typeof p.search === "string") state.search = p.search;
            if (typeof p.tag === "string") state.tag = p.tag;
        }
    } catch {
    }
}

// ---------- Theme toggle ----------
function setThemeControls(theme) {
    const isDarkTheme = theme === DARK_THEME;
    selectOne(`#${THEME_ICON_ID}`).textContent = isDarkTheme ? LIGHT_MODE_ICON : DARK_MODE_ICON;
}

/**
 * animateThemeIcon briefly moves the theme icon upward.
 */
function animateThemeIcon() {
    const iconElement = selectOne(`#${THEME_ICON_ID}`);
    iconElement.classList.add(JUMP_ANIMATION_CLASS);
    setTimeout(() => iconElement.classList.remove(JUMP_ANIMATION_CLASS), JUMP_ANIMATION_DURATION_MS);
}

/**
 * toggleTheme switches the document theme and animates the icon.
 */
function toggleTheme() {
    const nextTheme = document.body.classList.contains(DARK_THEME) ? LIGHT_THEME : DARK_THEME;
    document.body.classList.remove(LIGHT_THEME, DARK_THEME);
    document.body.classList.add(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeControls(nextTheme);
    animateThemeIcon();
}

/**
 * initializeApplication configures theme, restores state, loads prompts, and binds event handlers.
 */
async function initializeApplication() {
    const activeTheme = initializeTheme();
    setThemeControls(activeTheme);

    restoreState();
    PROMPTS = await loadPrompts();
    renderChips();
    renderGrid();

    const searchInput = selectOne("#searchInput");
    searchInput.value = state.search;
    searchInput.addEventListener(EVENT_INPUT, event => onSearch(event.target.value));
    selectOne(`#${THEME_BUTTON_ID}`).addEventListener(EVENT_CLICK, toggleTheme);

    window.addEventListener(EVENT_KEYDOWN, event => {
        if (event.key === KEY_SLASH && document.activeElement !== searchInput) {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    ui();
}

document.addEventListener(EVENT_DOM_CONTENT_LOADED, initializeApplication);
