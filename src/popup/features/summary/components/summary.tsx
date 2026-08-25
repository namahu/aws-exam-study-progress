import { AccuracySummary } from "@/types";
import { useState } from "react";

export type SummaryProps = {
  summary: AccuracySummary;
  dateString: string;
};

export function Summary({ summary, dateString }: SummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border rounded-md px-2 py-2 flex flex-col">
      {/* Content Title */}
      <h3 className="text-lg">{dateString}の実績</h3>

      {/* Content Body */}
      { summary.total === 0
        ? (
          <div>
            <span className="text-base">まだ回答実績がありません</span>
          </div>
        )
        : (
          <div className="flex flex-col gap-2">
            <div className={`rounded-md font-bold text-white text-center py-2 flex flex-row justify-center items-center gap-2
              ${summary.accuracyRate >= 70
                ? "bg-green-500" : "bg-red-500"
              }  
            `}>
              <span className="text-lg">
                正答率: {summary.accuracyRate} %
              </span>
              <div>
                <span>（回答数: {summary.total}、正答数: {summary.correct}）</span>
              </div>
            </div>
            <div className="bg-zinc-200 rounded-sm p-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="text-base flex flex-row justify-between items-center cursor-pointer"
              >
                <span>分野別の内訳</span>
                <span className={`inline-block size-2 border-t border-l mx-4 transition-transform duration-300
                  ${isOpen ? "rotate-45": "rotate-225"}`}
                ></span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div
                  className="overflow-hidden flex flex-col gap-2"
                >
                  {summary.categories.map((category, index) => (
                    <div key={category.category || index} className={`bg-white font-semibold rounded-md px-2 py-1 ${
                      category.accuracyRate >= 70 ? "text-green-500" : "text-red-500"
                    }`}>
                      <span>{category.category || "未分類の分野"}</span>
                      <div className="mx-2 flex flex-row gap-4">
                        <span>正答率: {category.accuracyRate} %</span>
                        <span>回答数: {category.total} ( 正答数: {category.correct} )</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};
