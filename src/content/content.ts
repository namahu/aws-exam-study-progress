import { getExamData, recordAnswer } from "@/storage";
import { ProblemState } from "@/types";

import "./content.css";

const CONFIG = {
  getExamId: (): string => {
    return window.location.pathname.split("/")[1];
  },

  resultPage: {
    containerSelector: "[id^='target_ans_']",
    extractData: (container: Element) => {
      const urlParams = new URLSearchParams(window.location.search);
      const qGuideTagElements = document.querySelectorAll(".q-guide-tag");
      const regexp = /^分野\d+：/;
      
      const problemId = urlParams.get("q_id") || "";
      const categories = Array.from(qGuideTagElements)
        .filter(tag => regexp.test(tag.textContent))
        .map(tag => tag.textContent);
        console.log(categories);
      const isCorrect = container.getAttribute("id")?.includes("_correct") || false;

      return { problemId, categories, isCorrect };
    },
  },

  listPage: {
    pagePath: "_q_category.php",
    itemSelector: ".menu",
    getProblemId: (element: Element) => {
      const anchorElement = element.querySelector("a");
      const href = anchorElement?.getAttribute("href");
      const result = href?.match(/q_id=(?<problemId>\d+)/);
      if (!result || !result.groups) return null;

      return result.groups.problemId;
    },
  },
};

const BADGE_PROCESSED_ATTR = 'data-extension-badge-attached';

let lastRecordedProblemId: string | null = null;

// 結果画面での回答データの記録
const handleResultPage = async (): Promise<void> => {
  const resultContainer = document.querySelector(CONFIG.resultPage.containerSelector);
  if (!resultContainer) return;

  const extracted = CONFIG.resultPage.extractData(resultContainer);
  if (!extracted || !extracted.problemId) return;

  if (lastRecordedProblemId === extracted.problemId) return;

  const examId = CONFIG.getExamId();

  try {
    await recordAnswer({
      examId,
      problemId: extracted.problemId,
      categories: extracted.categories,
      isCorrect: extracted.isCorrect,
    });

    lastRecordedProblemId = extracted.problemId;
    console.log(`[Extension]Saved result for ${extracted.problemId}:`, extracted.isCorrect ? "Correct" : "Incorrect");
  } catch(err) {
    console.error("[Extension] Failed to save answer result:", err);
  }
};

// 問題一覧画面での回答済みの可視化
const checkPagePath = (): boolean => {
  const urlPath = window.location.pathname;
  return urlPath.includes(CONFIG.listPage.pagePath);
};

const createBadgeElement = (state: ProblemState) => {
  const badge = document.createElement("span");

  badge.className = "ext-status-badge !px-2 !py-1 !text-xs !text-zinc-100 !rounded-xl"

  if (state.lastIsCorrect) {
    badge.classList.add("!bg-sky-600");
    badge.innerText = "回答済み（正解）";
  } else {
    badge.classList.add("!bg-red-600");
    badge.innerText = "回答済み（不正解）";
  }

  return badge;

};

const injectBadgesToList = async (): Promise<void> => {
  const isTargetPage = checkPagePath();
  if (!isTargetPage) return;

  const problemListElement = document.querySelector(CONFIG.listPage.itemSelector);
  if (!problemListElement) return;
  
  const examId = CONFIG.getExamId();
  const examData = await getExamData(examId);
  const { problemStates } = examData;
  
  Array.from((problemListElement.children) as HTMLCollectionOf<HTMLLIElement>).forEach((item) => {
    if (item.getAttribute(BADGE_PROCESSED_ATTR) === "true") return;
    
    const problemId = CONFIG.listPage.getProblemId(item);
    if (!problemId) return;

    item.setAttribute(BADGE_PROCESSED_ATTR, "true");

    const state = problemStates[problemId];
    if (state) {
      const anchorElement = item.firstElementChild as HTMLAnchorElement | null;
      if (!anchorElement) return;
      const badge = createBadgeElement(state);
      anchorElement.appendChild(badge);
      anchorElement.style.display = "flex";
      anchorElement.style.flexDirection = "row";
      anchorElement.style.alignItems = "center";
      anchorElement.style.gap = "16px";
    }
  });
};

const processPage = async (): Promise<void> => {
  await handleResultPage();
  await injectBadgesToList();
};

const initContentScript = () => {
  processPage();

  let debounceTimer: number | null = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      processPage();
    }, 100);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContentScript);
} else {
  initContentScript();
}
