import { use } from "react";
import { Summary } from "./summary";
import { AccuracySummary } from "@/types";

export type DailySummaryProps = {
  summaryPromise: Promise<AccuracySummary>;
  targetDate: Date;
};

export function DailySummary({ summaryPromise, targetDate}: DailySummaryProps) {
  const summary = use(summaryPromise);
  const dateString = targetDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return <Summary summary={summary} dateString={dateString} />
};
