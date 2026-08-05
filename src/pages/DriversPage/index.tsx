import { useState } from "react";
import { Tabs } from "@navyug/ui";
import { DriverListTab } from "./DriverListTab";
import { ScorecardsTab } from "./ScorecardsTab";

const TABS = [
  { id: "list", label: "Drivers" },
  { id: "scorecards", label: "Scorecards" },
];

export function DriversPage() {
  const [tab, setTab] = useState("list");

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-[18px]">
      <Tabs items={TABS} activeId={tab} onChange={setTab} className="mb-3.5" />
      {tab === "list" ? <DriverListTab /> : <ScorecardsTab />}
    </div>
  );
}
