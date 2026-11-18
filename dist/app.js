"use strict";

const bank = window.CAT_QUESTION_BANK;
const dayLength = 86_400_000;
const indiaDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric",
});
const fullDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "UTC", weekday: "short", day: "numeric", month: "short",
});

function currentDay(now = new Date()) {
  const parts = Object.fromEntries(indiaDate.formatToParts(now).map(({ type, value }) => [type, value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / dayLength;
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

const ui = Object.fromEntries([
  "bank-label", "hero-date", "page-title", "hero-summary", "solutions-link",
  "question-list", "solutions", "solution-list", "toggle-solutions", "prev-day",
  "next-day", "selected-date", "today-button", "progress-text", "progress-bar", "question-grid",
].map(id => [id, document.getElementById(id)]));

let today = currentDay();
let selectedDay = today;
let selections = {};
let selectionKey = "";
let cards = [];

function firstDay() {
  return bank.releaseDate ? Date.parse(bank.releaseDate + "T00:00:00Z") / dayLength : today;
}

function practiceFor(day) {
  return bank.sets[day - firstDay()];
}

function readSelections(key) {
  try {
    const values = JSON.parse(localStorage.getItem(key));
    return values && typeof values === "object" && !Array.isArray(values) ? values : {};
  } catch {
    return {};
  }
}

function saveSelection(number, value) {
  selections[number] = value;
  try {
    localStorage.setItem(selectionKey, JSON.stringify(selections));
  } catch {
    // Keep practice usable when local storage is unavailable.
  }
  updateProgress();
}

function questionCard(question, section, number) {
  const card = element("article", "question-card");
  card.id = "question-" + number;
  card.tabIndex = -1;

  const meta = element("div", "question-meta");
  const tag = element("span", "tag", section);
  tag.dataset.section = section;
  meta.append(element("span", "number", "Q" + String(number).padStart(2, "0")), tag);
  if (question.topic) meta.append(element("span", "number", question.topic));

  const field = element("fieldset");
  field.append(element("legend", "", question.prompt));
  if (question.options?.length) {
    const choices = element("div", "choices");
    question.options.forEach((option, index) => {
      const row = element("label", "choice");
      const input = element("input");
      input.type = "radio";
      input.name = "response-" + number;
      input.value = String(index);
      input.checked = selections[number] === input.value;
      input.addEventListener("change", () => saveSelection(number, input.value));
      row.append(input, element("span", "choice-copy", String.fromCharCode(65 + index) + ". " + option));
      choices.append(row);
    });
    field.append(choices);
  } else {
    const input = element("input");
    input.type = "text";
    input.placeholder = "Enter your answer";
    input.setAttribute("aria-label", "Your answer to question " + number);
    input.autocomplete = "off";
    input.value = selections[number] ?? "";
    input.addEventListener("input", () => saveSelection(number, input.value));
    field.append(input);
  }
  card.append(meta, field);
  return card;
}

function solutionCard(question, number) {
  const card = element("details");
  card.append(element("summary", "", "Question " + number));
  const body = element("div", "solution-body");
  body.append(
    element("strong", "answer", "Answer: " + question.answer),
    element("p", "worked-solution", question.solution),
  );
  card.append(body);
  card.addEventListener("toggle", updateSolutionToggle);
  return card;
}

function contextCard(group) {
  const card = element("section", "context-card");
  card.append(element("h3", "", group.title || "Use the following information"), element("p", "", group.context));
  return card;
}

function updateSolutionToggle() {
  const solutions = [...ui["solution-list"].children];
  ui["toggle-solutions"].textContent = solutions.every(item => item.open) ? "Hide all" : "Show all";
}

function updateProgress() {
  let answered = 0;
  cards.forEach(({ link }, index) => {
    const number = index + 1;
    const hasResponse = Boolean(selections[number]?.trim());
    if (hasResponse) answered += 1;
    link.classList.toggle("answered", hasResponse);
    link.setAttribute("aria-label", "Question " + number + (hasResponse ? ", answered" : ", unanswered"));
  });
  ui["progress-bar"].max = Math.max(1, cards.length);
  ui["progress-bar"].value = answered;
  ui["progress-text"].textContent = answered + " / " + cards.length;
}

function render() {
  const set = practiceFor(selectedDay);
  const date = new Date(selectedDay * dayLength);
  ui["hero-date"].textContent = fullDate.format(date);
  ui["page-title"].textContent = selectedDay === today ? "Today’s practice" : "Daily practice";
  ui["selected-date"].textContent = shortDate.format(date);
  const latestReleased = Math.min(today, firstDay() + bank.sets.length - 1);
  ui["prev-day"].disabled = Math.min(selectedDay - 1, latestReleased) < firstDay();
  ui["next-day"].disabled = selectedDay >= latestReleased;
  ui["today-button"].hidden = selectedDay === today;
  ui["bank-label"].textContent = "Sample set";
  ui["bank-label"].hidden = !bank.sample;

  ui["question-list"].replaceChildren();
  ui["solution-list"].replaceChildren();
  ui["question-grid"].replaceChildren();
  ui["solutions"].hidden = !set;
  ui["solutions-link"].hidden = !set;
  cards = [];
  selections = {};

  if (set) {
    selectionKey = "cat-prep:" + set.id + ":" + selectedDay;
    selections = readSelections(selectionKey);
    const questions = document.createDocumentFragment();
    const solutions = document.createDocumentFragment();
    const grid = document.createDocumentFragment();
    for (const group of set.groups) {
      if (group.context) questions.append(contextCard(group));
      for (const question of group.questions) {
        const number = cards.length + 1;
        const card = questionCard(question, group.section, number);
        const link = element("a", "", number);
        link.href = "#" + card.id;
        questions.append(card);
        solutions.append(solutionCard(question, number));
        grid.append(link);
        cards.push({ link });
      }
    }
    ui["question-list"].append(questions);
    ui["solution-list"].append(solutions);
    ui["question-grid"].append(grid);
    const sections = [...new Set(set.groups.map(group => group.section))];
    ui["hero-summary"].textContent = cards.length + " questions  ·  " + sections.join("  ·  ");
  } else {
    ui["hero-summary"].textContent = "There’s no practice set for this date.";
    const empty = element("div", "empty-state");
    const message = selectedDay < firstDay()
      ? "Your first practice set is available on " + fullDate.format(firstDay() * dayLength) + "."
      : "You’ve reached the end of the question bank. Use the calendar to revisit earlier sets.";
    empty.append(element("p", "", message));
    ui["question-list"].append(empty);
  }
  updateProgress();
  updateSolutionToggle();
}

ui["toggle-solutions"].addEventListener("click", () => {
  const solutions = [...ui["solution-list"].children];
  const show = solutions.some(item => !item.open);
  solutions.forEach(item => { item.open = show; });
  updateSolutionToggle();
});

ui["prev-day"].addEventListener("click", () => {
  selectedDay = Math.min(selectedDay - 1, firstDay() + bank.sets.length - 1);
  render();
});
ui["next-day"].addEventListener("click", () => {
  selectedDay += 1;
  render();
});
ui["today-button"].addEventListener("click", () => {
  selectedDay = today;
  render();
  ui["page-title"].scrollIntoView();
});

function refreshToday() {
  const newDay = currentDay();
  if (today === newDay) return;
  if (selectedDay === today || selectedDay > newDay) selectedDay = newDay;
  today = newDay;
  render();
}

document.addEventListener("visibilitychange", refreshToday);
setInterval(refreshToday, 60_000);
render();
