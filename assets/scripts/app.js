let promptsList = [];
const PROMPTS_PATH = "./assets/data/prompts.json";
/** loadPrompts retrieves prompt data from a JSON file and assigns it to the global list */
async function loadPrompts() {
  const response = await fetch(PROMPTS_PATH);
  const promptData = await response.json();
  promptsList = promptData;
}

const TAG_ALL = "all";
const LOCAL_STORAGE_KEY = "prompt-bubbles-state";
const state = { search: "", tag: TAG_ALL };

const CLICK_EVENT = "click";
const INPUT_EVENT = "input";
const KEYDOWN_EVENT = "keydown";
const SPAN_ELEMENT = "span";
const DOM_CONTENT_LOADED_EVENT = "DOMContentLoaded";
const BUTTON_CLASS = "btn btn-primary btn-sm";
const SHARE_BUTTON_CLASS = "card-share btn btn-outline-secondary btn-sm";
const ARIA_SHARE_LABEL = "Copy card link:";
const SHARE_ICON_IMAGE_SOURCE = "https://cdn.jsdelivr.net/npm/@material-design-icons/svg@0.14.15/filled/share.svg";
const SHARE_ICON_ALTERNATIVE_TEXT = "Share icon";
const COPY_ICON_SVG = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z\"/></svg>";
const HASH_SYMBOL = "#";
const PLACEHOLDER_PATTERN = /\{([^}]+)\}/g;
const PLACEHOLDER_ATTRIBUTE = "data-placeholder";
const INPUT_ELEMENT = "input";
const PLACEHOLDER_SELECTOR = INPUT_ELEMENT+"["+PLACEHOLDER_ATTRIBUTE+"]";
const NO_MATCH_MESSAGE = "No prompts match your search/filter.";
const COPIED_TEXT = "Copied ✓";
const SEARCH_SHORTCUT_KEY = "/";
const ENTER_KEY = "Enter";
const COPY_PROMPT_LABEL_PREFIX = "Copy prompt:";
const CHIP_CLASS = "chip";
const CHIP_BASE_CLASSES = `${CHIP_CLASS} btn btn-sm`;
const CHIP_ACTIVE_CLASS = "btn-primary";
const CHIP_INACTIVE_CLASS = "btn-outline-primary";
const CHIP_BAR_ID = "chipBar";
const CHIP_BAR_SELECTOR = `#${CHIP_BAR_ID}`;
const TAG_BADGE_CLASSES = "tag badge bg-secondary me-1";
const GRID_COLUMN_CLASS = "col";
const CARD_CLASS = "prompt-card card d-flex flex-column h-100";
const CARD_BODY_CLASS = "card-body d-flex flex-column";
const CARD_ACTIONS_CLASS = "card-actions";
const GRID_NO_MATCH_COLUMN_CLASS = "col-12 text-center text-muted";
const LINKED_CARD_ATTRIBUTE = "data-linked-card";
const SCROLL_BEHAVIOR_SMOOTH = "smooth";
const SCROLL_BLOCK_CENTER = "center";
const THEME_TOGGLE_ID = "themeToggle";
const THEME_LOCAL_STORAGE_KEY = "prompt-bubbles-theme";
const DATA_BS_THEME_ATTRIBUTE = "data-bs-theme";
const DATA_MDB_THEME_ATTRIBUTE = "data-mdb-theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

/** selectSingle returns the first element matching selector within root */
const selectSingle = (selector, root=document) => root.querySelector(selector);
/** selectAllElements returns all elements matching selector within root */
const selectAllElements = (selector, root=document) => Array.from(root.querySelectorAll(selector));
/** debounce delays invoking callbackFunction until delayMilliseconds pass */
const debounce = (callbackFunction, delayMilliseconds=120) => {
  let timeoutIdentifier;
  return (...argumentsList) => {
    clearTimeout(timeoutIdentifier);
    timeoutIdentifier = setTimeout(() => callbackFunction(...argumentsList), delayMilliseconds);
  };
};
/** sanitize removes carriage returns from inputString */
const sanitize = (inputString) => inputString.replace(/\r/g,"");
/** matches determines if item satisfies the query and tag criteria */
const matches = (item, query, selectedTag) => {
  const tagMatches = selectedTag === TAG_ALL || item.tags.includes(selectedTag);
  if (!query) return tagMatches;
  const haystack = (item.title+" "+item.text+" "+item.tags.join(" ")).toLowerCase();
  return tagMatches && query.split(/\s+/).every(token => haystack.includes(token));
};

/** renderPromptContent builds DOM nodes for prompt text and placeholders */
function renderPromptContent(rawText) {
  PLACEHOLDER_PATTERN.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let cursorIndex = 0;
  let matchResult;
  while ((matchResult = PLACEHOLDER_PATTERN.exec(rawText)) !== null) {
    const precedingSegment = rawText.slice(cursorIndex, matchResult.index);
    if (precedingSegment) fragment.appendChild(document.createTextNode(precedingSegment));
    const placeholderName = matchResult[1];
    const placeholderInput = document.createElement(INPUT_ELEMENT);
    placeholderInput.setAttribute(PLACEHOLDER_ATTRIBUTE, placeholderName);
    placeholderInput.placeholder = placeholderName;
    placeholderInput.style.width = `${placeholderName.length}ch`;
    fragment.appendChild(placeholderInput);
    cursorIndex = PLACEHOLDER_PATTERN.lastIndex;
  }
  const trailingSegment = rawText.slice(cursorIndex);
  if (trailingSegment) fragment.appendChild(document.createTextNode(trailingSegment));
  return fragment;
}

/** resolvePlaceholders creates the final text for copying */
function resolvePlaceholders(textElement) {
  const clonedElement = textElement.cloneNode(true);
  selectAllElements(PLACEHOLDER_SELECTOR, clonedElement).forEach(inputElement => {
    const placeholderName = inputElement.getAttribute(PLACEHOLDER_ATTRIBUTE);
    const userValue = inputElement.value || placeholderName;
    inputElement.replaceWith(userValue);
  });
  return clonedElement.textContent;
}

/** uniqueTags returns an array of all unique tags including 'all' */
function uniqueTags() {
  const tagSet = new Set();
  promptsList.forEach(promptItem => promptItem.tags.forEach(tagName => tagSet.add(tagName)));
  return [TAG_ALL, ...Array.from(tagSet).sort((firstTag, secondTag) => firstTag.localeCompare(secondTag))];
}

/** renderChips shows filter chips for all unique tags */
function renderChips() {
  const chipBarElement = selectSingle(CHIP_BAR_SELECTOR);
  chipBarElement.innerHTML = "";
  uniqueTags().forEach(tagName => {
    const chipElement = document.createElement("button");
    chipElement.className = `${CHIP_BASE_CLASSES} ${tagName === state.tag ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}`;
    chipElement.type = "button";
    chipElement.textContent = tagName;
    chipElement.onclick = () => selectTag(tagName);
    chipBarElement.appendChild(chipElement);
  });
}

/** highlightActiveChip updates chip states to reflect the current tag */
function highlightActiveChip() {
  selectAllElements(`${CHIP_BAR_SELECTOR} .${CHIP_CLASS}`).forEach(chipElement => {
    const isActive = chipElement.textContent === state.tag;
    chipElement.classList.toggle(CHIP_ACTIVE_CLASS, isActive);
    chipElement.classList.toggle(CHIP_INACTIVE_CLASS, !isActive);
  });
}

/** selectTag updates the selected tag and refreshes the grid and chip states */
function selectTag(tagName) {
  state.tag = tagName;
  persist();
  renderGrid();
  highlightActiveChip();
}

/** renderGrid builds the card grid using the current search and tag state */
function renderGrid() {
  const gridElement = selectSingle("#grid");
  const searchQuery = state.search.trim().toLowerCase();
  const matchingPrompts = promptsList.filter(promptItem => matches(promptItem, searchQuery, state.tag));
  gridElement.innerHTML = "";
  matchingPrompts.forEach(promptItem => {
    const columnElement = document.createElement("div");
    columnElement.className = GRID_COLUMN_CLASS;
    columnElement.appendChild(renderCard(promptItem));
    gridElement.appendChild(columnElement);
  });
  if (matchingPrompts.length === 0) {
    const columnElement = document.createElement("div");
    columnElement.className = GRID_NO_MATCH_COLUMN_CLASS;
    columnElement.textContent = NO_MATCH_MESSAGE;
    gridElement.appendChild(columnElement);
  }
  highlightHashTarget();
}

/** highlightHashTarget scrolls and marks the card matching the location hash */
function highlightHashTarget() {
  const hashValue = location.hash.slice(HASH_SYMBOL.length);
  if (!hashValue) return;
  const linkedCard = selectSingle(`#${CSS.escape(hashValue)}`);
  if (linkedCard) {
    linkedCard.setAttribute(LINKED_CARD_ATTRIBUTE, "true");
    linkedCard.scrollIntoView({ behavior: SCROLL_BEHAVIOR_SMOOTH, block: SCROLL_BLOCK_CENTER });
  }
}

/** renderCard builds a card for a prompt, wiring tag selection */
function renderCard(promptItem) {
  const cardElement = document.createElement("div");
  cardElement.className = CARD_CLASS;
  cardElement.id = promptItem.id;
  cardElement.setAttribute("role", "listitem");
  cardElement.tabIndex = 0;

  const bodyElement = document.createElement("div");
  bodyElement.className = CARD_BODY_CLASS;
  cardElement.appendChild(bodyElement);

  const titleElement = document.createElement("h3");
  titleElement.className = "card-title fs-6";
  titleElement.textContent = promptItem.title;
  bodyElement.appendChild(titleElement);

  const tagsContainerElement = document.createElement("div");
  tagsContainerElement.className = "mb-2";
  promptItem.tags.forEach(tagName => {
    const tagElement = document.createElement(SPAN_ELEMENT);
    tagElement.className = TAG_BADGE_CLASSES;
    tagElement.textContent = tagName;
    tagElement.addEventListener(CLICK_EVENT, () => selectTag(tagName));
    tagsContainerElement.appendChild(tagElement);
  });
  bodyElement.appendChild(tagsContainerElement);

  const textElement = document.createElement("pre");
  textElement.className = "card-text";
  textElement.appendChild(renderPromptContent(promptItem.text));
  bodyElement.appendChild(textElement);

  const actionsElement = document.createElement("div");
  actionsElement.className = CARD_ACTIONS_CLASS;
  const copyButtonElement = document.createElement("button");
  copyButtonElement.className = BUTTON_CLASS;
  copyButtonElement.type = "button";
  copyButtonElement.setAttribute("aria-label", `${COPY_PROMPT_LABEL_PREFIX} ${promptItem.title}`);
  copyButtonElement.innerHTML = copyIcon();
  copyButtonElement.onclick = () => copyPrompt(cardElement);
  actionsElement.appendChild(copyButtonElement);

  const shareButtonElement = document.createElement("button");
  shareButtonElement.className = SHARE_BUTTON_CLASS;
  shareButtonElement.type = "button";
  shareButtonElement.setAttribute("aria-label", `${ARIA_SHARE_LABEL} ${promptItem.title}`);
  shareButtonElement.innerHTML = shareIcon();
  shareButtonElement.onclick = () => copyCardUrl(cardElement);
  actionsElement.appendChild(shareButtonElement);

  cardElement.appendChild(actionsElement);

  const toastElement = document.createElement("div");
  toastElement.className = "copied";
  toastElement.textContent = COPIED_TEXT;
  cardElement.appendChild(toastElement);

  cardElement.addEventListener(KEYDOWN_EVENT, event => {
    if (event.key === ENTER_KEY) {
      event.preventDefault();
      copyPrompt(cardElement);
    }
  });
  return cardElement;
}

/** copyPrompt writes the card text with filled placeholders to the clipboard */
function copyPrompt(cardElement) {
  const textElement = selectSingle(".card-text", cardElement);
  const content = resolvePlaceholders(textElement).trim();
  navigator.clipboard.writeText(sanitize(content)).then(() => {
    const toastElement = selectSingle(".copied", cardElement);
    toastElement.setAttribute("data-show", "true");
    setTimeout(() => toastElement.setAttribute("data-show", "false"), 1200);
  }).catch(() => {
    const fallbackTextArea = document.createElement("textarea");
    fallbackTextArea.value = content;
    fallbackTextArea.style.position = "fixed";
    fallbackTextArea.style.left = "-9999px";
    document.body.appendChild(fallbackTextArea);
    fallbackTextArea.select();
    document.execCommand("copy");
    fallbackTextArea.remove();
  });
}

/** copyCardUrl writes the card URL to the clipboard */
function copyCardUrl(cardElement) {
  const baseUrl = location.href.split(HASH_SYMBOL)[0];
  const cardUrl = baseUrl + HASH_SYMBOL + cardElement.id;
  navigator.clipboard.writeText(cardUrl).then(() => {
    const toastElement = selectSingle(".copied", cardElement);
    toastElement.setAttribute("data-show", "true");
    setTimeout(() => toastElement.setAttribute("data-show", "false"), 1200);
  }).catch(() => {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = cardUrl;
    fallbackInput.style.position = "fixed";
    fallbackInput.style.left = "-9999px";
    document.body.appendChild(fallbackInput);
    fallbackInput.select();
    document.execCommand("copy");
    fallbackInput.remove();
  });
}

/** copyIcon returns the SVG for the copy button */
function copyIcon() {
  return COPY_ICON_SVG;
}

/** shareIcon returns the markup for the share icon image element */
function shareIcon() {
  return `<img src="${SHARE_ICON_IMAGE_SOURCE}" alt="${SHARE_ICON_ALTERNATIVE_TEXT}" />`;
}

/** handleSearch persists and renders the grid for the provided searchText */
const handleSearch = debounce(searchText => { state.search = searchText; persist(); renderGrid(); }, 80);

/** persist saves state to localStorage */
function persist() { try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)); } catch {} }

/** restore loads state from localStorage if available */
function restore() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.search === "string") state.search = parsed.search;
      if (typeof parsed.tag === "string") state.tag = parsed.tag;
    }
  } catch {}
}

/** applyTheme sets Bootstrap and MDB theme attributes on the document body */
function applyTheme(themeName) {
  document.body.setAttribute(DATA_BS_THEME_ATTRIBUTE, themeName);
  document.body.setAttribute(DATA_MDB_THEME_ATTRIBUTE, themeName);
}

/** initThemeToggle restores and wires the theme switch for Bootstrap and MDB */
function initThemeToggle() {
  const themeToggleElement = selectSingle(`#${THEME_TOGGLE_ID}`);
  const storedTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY) || LIGHT_THEME;
  applyTheme(storedTheme);
  themeToggleElement.checked = storedTheme === DARK_THEME;
  themeToggleElement.addEventListener(INPUT_EVENT, () => {
    const selectedTheme = themeToggleElement.checked ? DARK_THEME : LIGHT_THEME;
    applyTheme(selectedTheme);
    try { localStorage.setItem(THEME_LOCAL_STORAGE_KEY, selectedTheme); } catch {}
  });
}

/** init loads prompts and wires search interactions */
async function init() {
  await loadPrompts();
  restore();
  renderChips();
  renderGrid();
  initThemeToggle();
  const searchInputElement = selectSingle("#searchInput");
  const clearSearchButton = selectSingle("#clearSearch");
  searchInputElement.value = state.search;
  searchInputElement.addEventListener(INPUT_EVENT, event => handleSearch(event.target.value));
  clearSearchButton.addEventListener(CLICK_EVENT, () => {
    searchInputElement.value = "";
    searchInputElement.focus();
    handleSearch("");
  });
  window.addEventListener(KEYDOWN_EVENT, event => {
    if (event.key === SEARCH_SHORTCUT_KEY && document.activeElement !== searchInputElement) {
      event.preventDefault();
      searchInputElement.focus();
      searchInputElement.select();
    }
  });
}

document.addEventListener(DOM_CONTENT_LOADED_EVENT, init);
