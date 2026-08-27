import React, { Suspense, use, useMemo, useState } from "react";
import { DailySummary } from "../features/summary/components/daily-summary";
import { WeeklySummary } from "../features/summary/components/weekly-summary";
import { getDailySummary, getWeeklySummary } from "@/storage";

type RootLayoutProps = {
  lastStudiedExamIdPromise: Promise<string>;
  examListPromise: Promise<string[]>;
};

export function RootLayout({ lastStudiedExamIdPromise, examListPromise }: RootLayoutProps) {
  const lastStudiedExamId = use(lastStudiedExamIdPromise);
  const examList = use(examListPromise);
  const targetDate = useMemo(() => new Date(), []);

  const [selectedExam, setSelectedExam] = useState<string>(
    lastStudiedExamId || examList[0] || ""
  );

  const dailySummaryPromise = useMemo(
    () => getDailySummary(selectedExam, targetDate),
    [selectedExam, targetDate],
  );
  const weeklySummaryPromise = useMemo(
    () => getWeeklySummary(selectedExam, targetDate),
    [selectedExam, targetDate],
  );

  const handleExamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExam(event.target.value);
  };

  return (
    <main className="w-full h-full m-2 flex flex-col gap-4">
      <div className="bg-orange-400 text-white rounded-sm px-4 py-2 flex flex-row justify-between items-center">
        <h2 className="text-lg font-bold">
          {selectedExam ? `${selectedExam.toUpperCase()} の学習実績` : "学習実績"}
        </h2>
        <div className="text-sm flex flex-row items-center">
          <span>参照する試験の切り替え： </span>
          <select className="font-bold"
            value={selectedExam}
            onChange={handleExamChange}
          >
            {examList.map(exam => (
              <option key={exam} value={exam}
                className="text-stone-900"
              >{exam.toUpperCase()}</option>
            ))}
          </select>
        </div>
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
