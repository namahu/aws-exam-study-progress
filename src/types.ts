import * as z from "zod";

/**
 * 毎回の回答記録（日別のログ用）
 */
export const DailyAnswerLogSchema = z.object({
  logId: z.uuid(),
  problemId: z.string(),
  category: z.string(),
  categories: z.string().array(),
  isCorrect: z.boolean().default(false),
  answeredAt: z.iso.datetime(),
});

/**
 * 設問毎の回答記録（一覧画面での回答済み可視化用）
 */
export const ProblemStateSchema = z.object({
  problemId: z.string(),
  category: z.string(),
  categories: z.string().array(),
  lastAnsweredAt: z.iso.datetime(),
  lastIsCorrect: z.boolean().default(false),
  totalAttempts: z.number().default(0),
  correctCount: z.number().default(0),
});

/**
 * 試験毎のデータ構造
 */
export const ExamDataSchema = z.object({
  examId: z.string(),
  updatedAt: z.iso.datetime(),
  problemStates: z.record(z.string(), ProblemStateSchema),
  dailyLogs: z.record(z.string(), z.array(DailyAnswerLogSchema)),
});

/**
 * ストレージに保存するデータのスキーマ
 */
export const StorageSchemaZod = z.object({
  examList: z.array(z.string()),
  lastStudiedExamId: z.string(),
}).catchall(ExamDataSchema.optional());

export type DailyAnswerLog = z.infer<typeof DailyAnswerLogSchema>;
export type ProblemState = z.infer<typeof ProblemStateSchema>;
export type ExamData = z.infer<typeof ExamDataSchema>;
export type StorageSchema = z.infer<typeof StorageSchemaZod>;

/**
 * 集計結果の型
 */
export interface CategoryAccuracy {
  category: string;
  total: number;
  correct: number;
  accuracyRate: number
}

export interface AccuracySummary {
  total: number;
  correct: number;
  accuracyRate: number;
  categories: CategoryAccuracy[];
}
