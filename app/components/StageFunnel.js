"use client";

const ORDER = [
  { key: "STAGE_1_GENTLE", label: "Gentle reminder", color: "var(--accent)" },
  { key: "STAGE_2_FIRM", label: "Firm reminder", color: "var(--warn)" },
  { key: "STAGE_3_FINAL_NOTICE", label: "Final notice", color: "var(--stop)" },
  { key: "STAGE_4_HUMAN_HANDOFF", label: "Human handoff", color: "#8a93a3" },
  { key: "STOPPED_DISPUTED", label: "Stopped (disputed)", color: "#c7cbd3" },
  { key: "STOPPED_LOW_VALUE", label: "Stopped (low value)", color: "#c7cbd3" },
];

export default function StageFunnel({ classified }) {
  const counts = {};
  for (const inv of classified) counts[inv.stage] = (counts[inv.stage] || 0) + 1;
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className="funnel">
      {ORDER.filter((s) => counts[s.key]).map((s) => (
        <div className="funnel-row" key={s.key}>
          <div className="funnel-label">{s.label}</div>
          <div className="funnel-track">
            <div
              className="funnel-fill"
              style={{ width: `${(counts[s.key] / max) * 100}%`, background: s.color }}
            />
          </div>
          <div className="funnel-count">{counts[s.key]}</div>
        </div>
      ))}
    </div>
  );
}
