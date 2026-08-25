import { use } from "react";
import { Summary } from "./summary";
import { AccuracySummary } from "@/types";

export type WeeklySummaryProps = {
  summaryPromise: Promise<AccuracySummary>;
  endDate: Date;
};

export function WeeklySummary({ summaryPromise, endDate}: WeeklySummaryProps) {
  const summary = use(summaryPromise);
  const dateStringOption: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const endDateString = endDate.toLocaleDateString("ja-JP", dateStringOption);
  const startDate = new Date(endDate).setDate(endDate.getDate() - 6);
  const startDateString = new Date(startDate).toLocaleDateString("ja-jp", dateStringOption);

  return <Summary summary={summary} dateString={`${startDateString} ~ ${endDateString}`} />
};
