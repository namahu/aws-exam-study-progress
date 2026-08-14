import z from "zod";
import { StorageSchemaZod } from "./types";
import type {
  AccuracySummary,
  CategoryAccuracy,
  DailyAnswerLog,
  ExamData,
  ProblemState,
  StorageSchema
} from "./types";

export function getTodayKey(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2 ,"0");
  return `${year}-${month}-${day}`;
};

export async function getExamList() {
  const result = (await chrome.storage.local.get("examList")) as Pick<StorageSchema, "examList">;
  return result.examList ?? [];
};

export async function getLastStudiedExamId() {
  const result = (await chrome.storage.local.get("lastStudiedExamId")) as Pick<StorageSchema, "lastStudiedExamId">;
  return result.lastStudiedExamId ?? [];
};

async function recordLastStudiedExamId(examId: string) {
  await chrome.storage.local.set({ lastStudiedExamId: examId });
};

/**
 * 試験データの取得（存在しない場合は初期値を返す）
 * @param examId 
 * @returns 
 */
export async function getExamData(examId: string): Promise<ExamData> {
  const key = `data-${examId}` as const;
  const result = await chrome.storage.local.get(key);
  const data = result[key] as ExamData | undefined;

  if (data) {
    return data;
  }

  return {
    examId,
    updatedAt: new Date().toISOString(),
    problemStates: {},
    dailyLogs: {},
  }
};

/**
 * 試験データを記録
 */

let recordAnswerQueue = Promise.resolve();

export function recordAnswer(params: {
  examId: string;
  problemId: string;
  categories: string[];
  isCorrect: boolean;
}): Promise<void> {
  recordAnswerQueue = recordAnswerQueue
    .catch(() => {})
    .then(() => executeRecordAnswer(params));

  return recordAnswerQueue;
};

async function executeRecordAnswer(params: {
  examId: string;
  problemId: string;
  categories: string[];
  isCorrect: boolean;
}): Promise<void> {
  const { examId, problemId, categories, isCorrect } = params;
  const now = new Date();
  const nowISO = now.toISOString();
  const todayKey = getTodayKey(now);

  const examList = await getExamList();
  const examData = await getExamData(examId);

  // 未登録のexamIdだった場合はexamListに登録する
  if (!examList.includes(examId)) {
    examList.push(examId);
    await chrome.storage.local.set({ examList });
  }

  // 最後に学習した試験のIDを記録
  await recordLastStudiedExamId(examId);

  // 直近に同じデータがあるかチェック（直近10秒の重複登録チェック）
  const todayLogs = examData.dailyLogs[todayKey] || [];
  const lastLog = todayLogs[todayLogs.length - 1];
  if (lastLog && lastLog.problemId === problemId) {
    const lastTime = new Date(lastLog.answeredAt).getTime();
    if (now.getTime() - lastTime < 10000) {
      console.warn("Duplicate answer detected within 10s. Skipping record.");
      return;
    }
  }

  // problemStateの更新
  const existingState: ProblemState = examData.problemStates[problemId] || {
    problemId,
    categories,
    lastAnsweredAt: nowISO,
    lastIsCorrect: isCorrect, 
    totalAttempts: 0, // 回答回数の累計
    correctCount: 0,
  };

  const updatedState: ProblemState = {
    ...existingState,
    categories,
    lastIsCorrect: isCorrect,
    lastAnsweredAt: nowISO,
    totalAttempts: existingState.totalAttempts + 1,
    correctCount: isCorrect
      ? existingState.correctCount + 1
      : existingState.correctCount, 
  };

  // dailyLogsの更新
  const newLog: DailyAnswerLog = {
    logId: crypto.randomUUID(),
    problemId,
    category: "",
    categories,
    isCorrect,
    answeredAt: nowISO,
  };

  // examDataの更新
  const updatedExamData: ExamData = {
    ...examData,
    updatedAt: nowISO,
    problemStates: {
      ...examData.problemStates,
      [problemId]: updatedState,
    },
    dailyLogs: {
      ...examData.dailyLogs,
      [todayKey]: [...todayLogs, newLog],
    }
  }

  // 保存
  await chrome.storage.local.set({ [`data-${examId}`]: updatedExamData });
};

export function calculateAccuracy(logs: DailyAnswerLog[]): AccuracySummary {
  if (logs.length === 0) {
    return { total: 0, correct: 0, accuracyRate: 0, categories: [] };
  }

  let totalCorrect = 0;
  const categoryMap: Record<string, { total: number; correct: number }> = {};

  logs.forEach(log => {
    if (log.isCorrect) totalCorrect++;

    const cateogries = log.categories
      ? log.categories.length > 0
        ? log.categories
        : [""]
      : [log.category];

    cateogries.forEach(category => {
      if (!categoryMap[category]) {
        categoryMap[category] = { total: 0, correct: 0};
      }
      categoryMap[category].total++;
      if (log.isCorrect) {
        categoryMap[category].correct++;
      }
    });
  });

  const categories: CategoryAccuracy[] = Object.entries(categoryMap).map(([category, stat]) => ({
    category,
    total: stat.total,
    correct: stat.correct,
    accuracyRate: stat.total > 0
      ? Math.round((stat.correct / stat.total) * 100)
      : 0,
  }));

  return {
    total: logs.length,
    correct: totalCorrect,
    accuracyRate: Math.round((totalCorrect / logs.length) * 100),
    categories
  };
}; 

/**
 * 指定日の正答率を集計
 * @param examId 
 * @param targetDate 
 * @returns 
 */
export async function getDailySummary(
  examId: string,
  targetDate: Date = new Date(),
): Promise<AccuracySummary> {
  const examData = await getExamData(examId);
  const dateKey = getTodayKey(targetDate);
  const logs = examData.dailyLogs[dateKey] || [];
  return calculateAccuracy(logs);
};

/**
 * endDateを基準に過去7日間の正答率を集計
 * @param examId 
 * @param endDate 
 * @returns 
 */
export async function getWeeklySummary(
  examId: string,
  endDate: Date = new Date(),
): Promise<AccuracySummary> {
  const examData = await getExamData(examId);
  const weeklyLogs: DailyAnswerLog[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateKey = getTodayKey(d);
    const logs = examData.dailyLogs[dateKey] || [];
    weeklyLogs.push(...logs);
  }
  return calculateAccuracy(weeklyLogs);
};

/**
 * 全データのエクスポート
 * @returns 
 */
export async function exportAllData(): Promise<string> {
  const allData = await chrome.storage.local.get(null);
  return JSON.stringify(allData, null, 2);
};

/**
 * 全データのインポート
 * @param jsonString 
 */
export async function importData(jsonString: string): Promise<void> {
  let parseJson;
  try {
    parseJson = JSON.parse(jsonString);
  } catch(err) {
    throw new Error("The JSON syntax is incorrect.");
  }

  const result = StorageSchemaZod.safeParse(parseJson);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
    console.error("Validation failed: ", tree);
    throw new Error("The data structure of the backup file is invalid.");
  }

  await chrome.storage.local.clear();
  await chrome.storage.local.set(result.data);
};
