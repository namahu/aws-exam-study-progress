import { Suspense, use } from "react";
import { DailySummary } from "../features/summary/components/daily-summary";
import { WeeklySummary } from "../features/summary/components/weekly-summary";
import { getDailySummary, getWeeklySummary } from "@/storage";

type RootLayoutProps = {
  lastStudiedExamIdPromise: Promise<string>;
};

export function RootLayout({ lastStudiedExamIdPromise }: RootLayoutProps) {
  const lastStudiedExamId = use(lastStudiedExamIdPromise);
  const targetDate = new Date();

  const dailySummaryPromise = getDailySummary(lastStudiedExamId, targetDate);
  const weeklySummaryPromise = getWeeklySummary(lastStudiedExamId, targetDate);

  return (
    <main className="w-full h-full m-2 flex flex-col gap-4">
      {/* Calendar Area */}
      <div className="flex-2 w-full h-full bg-zinc-100">
        <h1>calendar</h1>
      </div>

      {/* Summary Area */}
      <Suspense fallback={<div>集計中...</div>}>
        <div className="flex-1 w-full h-full grid grid-rows-1 grid-cols-2 gap-4">
          <DailySummary summaryPromise={dailySummaryPromise} targetDate={targetDate} />
          <WeeklySummary summaryPromise={weeklySummaryPromise} endDate={targetDate} />
        </div>
      </Suspense>
    </main>
  );
};
