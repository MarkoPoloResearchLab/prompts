/** initializeAnalytics configures Google Analytics tracking */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
const ANALYTICS_ID = "G-R6J165F21E";
gtag("js", new Date());
gtag("config", ANALYTICS_ID);

let promptsList = [];
const PROMPTS_PATH = "prompts.json";
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
const TAG_CLASS = "tag";
const SPAN_ELEMENT = "span";
const DOM_CONTENT_LOADED_EVENT = "DOMContentLoaded";
const BUTTON_CLASS = "btn";
const SHARE_BUTTON_CLASS = "card-share";
const ARIA_SHARE_LABEL = "Copy card link:";
const SHARE_ICON_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11A3 3 0 1 1 18 6a3 3 0 0 1-2.05-.81L8.94 9.23a3 3 0 1 0 0 5.54l7.01 4.1A3 3 0 1 1 18 16.08z"/></svg>`;
const HASH_SYMBOL = "#";
const PLACEHOLDER_PATTERN = /\{([^}]+)\}/g;
const PLACEHOLDER_ATTRIBUTE = "data-placeholder";
const PLACEHOLDER_CLASS = "placeholder-input";
const INPUT_ELEMENT = "input";
const PLACEHOLDER_SELECTOR = INPUT_ELEMENT+"["+PLACEHOLDER_ATTRIBUTE+"]";
const NO_MATCH_MESSAGE = "No prompts match your search/filter.";
const COPIED_TEXT = "Copied ✓";
const SEARCH_SHORTCUT_KEY = "/";
const ENTER_KEY = "Enter";
const COPY_LABEL_TEXT = "Copy";
const COPY_PROMPT_LABEL_PREFIX = "Copy prompt:";
const CHIP_CLASS = "chip";
const CHIP_BAR_ID = "chipBar";
const CHIP_BAR_SELECTOR = `#${CHIP_BAR_ID}`;

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
    placeholderInput.className = PLACEHOLDER_CLASS;
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
    chipElement.className = CHIP_CLASS;
    chipElement.type = "button";
    chipElement.textContent = tagName;
    chipElement.setAttribute("data-active", tagName === state.tag ? "true" : "false");
    chipElement.onclick = () => selectTag(tagName);
    chipBarElement.appendChild(chipElement);
  });
}

/** highlightActiveChip updates chip states to reflect the current tag */
function highlightActiveChip() {
  selectAllElements(`${CHIP_BAR_SELECTOR} .${CHIP_CLASS}`).forEach(chipElement =>
    chipElement.setAttribute("data-active", String(chipElement.textContent === state.tag))
  );
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
  matchingPrompts.forEach(promptItem => gridElement.appendChild(createCard(promptItem)));
  if (matchingPrompts.length === 0) {
    const placeholderParagraph = document.createElement("p");
    placeholderParagraph.style.color = "var(--text-1)";
    placeholderParagraph.style.gridColumn = "1/-1";
    placeholderParagraph.textContent = NO_MATCH_MESSAGE;
    gridElement.appendChild(placeholderParagraph);
  }
}

/** createCard builds a card for a prompt, wiring tag selection */
function createCard(promptItem) {
  const cardElement = document.createElement("article");
  cardElement.className = "card";
  cardElement.id = promptItem.id;
  cardElement.setAttribute("role", "listitem");
  cardElement.tabIndex = 0;

  const headerElement = document.createElement("div");
  headerElement.className = "card-header";
  headerElement.innerHTML = `<span class="tag-dot" aria-hidden="true"></span><h3 class="card-title">${escapeHTML(promptItem.title)}</h3>`;
  cardElement.appendChild(headerElement);

  const tagsContainerElement = document.createElement("div");
  tagsContainerElement.className = "card-tags";
  promptItem.tags.forEach(tagName => {
    const tagElement = document.createElement(SPAN_ELEMENT);
    tagElement.className = TAG_CLASS;
    tagElement.textContent = tagName;
    tagElement.addEventListener(CLICK_EVENT, () => selectTag(tagName));
    tagsContainerElement.appendChild(tagElement);
  });
  cardElement.appendChild(tagsContainerElement);

  const textElement = document.createElement("pre");
  textElement.className = "card-text";
  textElement.appendChild(renderPromptContent(promptItem.text));
  cardElement.appendChild(textElement);

  const actionsElement = document.createElement("div");
  actionsElement.className = "card-actions";
  const copyButtonElement = document.createElement("button");
  copyButtonElement.className = BUTTON_CLASS;
  copyButtonElement.type = "button";
  copyButtonElement.setAttribute("aria-label", `${COPY_PROMPT_LABEL_PREFIX} ${promptItem.title}`);
  copyButtonElement.innerHTML = copyIcon() + `<span>${COPY_LABEL_TEXT}</span>`;
  copyButtonElement.onclick = () => copyPrompt(cardElement);
  actionsElement.appendChild(copyButtonElement);
  cardElement.appendChild(actionsElement);

  const shareButtonElement = document.createElement("button");
  shareButtonElement.className = `${BUTTON_CLASS} ${SHARE_BUTTON_CLASS}`;
  shareButtonElement.type = "button";
  shareButtonElement.setAttribute("aria-label", `${ARIA_SHARE_LABEL} ${promptItem.title}`);
  shareButtonElement.innerHTML = shareIcon();
  shareButtonElement.onclick = () => copyCardUrl(cardElement);
  cardElement.appendChild(shareButtonElement);

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
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
}

/** shareIcon returns the share icon SVG markup */
function shareIcon() {
  return SHARE_ICON_SVG;
}

/** escapeHTML escapes special characters for safe HTML insertion */
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
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

/** init loads prompts and wires search interactions */
async function init() {
  await loadPrompts();
  restore();
  renderChips();
  renderGrid();
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
