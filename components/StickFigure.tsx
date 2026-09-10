export function StickFigure({
  variant = "door",
}: {
  variant?: "door" | "leaving" | "microphone" | "working" | "chart";
}) {
  return (
    <svg
      className={`doodle doodle-${variant}`}
      viewBox="0 0 230 190"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(variant === "door" || variant === "leaving") && (
        <>
          <path d="M119 165V26l77-4 2 144M120 27l49 17 1 132-50-12M161 105h-4M89 168l123 1" />
          <text
            x="133"
            y="74"
            stroke="none"
            fill="currentColor"
            fontSize="16"
            fontFamily="monospace"
            transform="rotate(8 133 74)"
          >
            404
          </text>
          <circle cx="77" cy="78" r="13" />
          <path d="M77 93l-4 39-22 32m22-32 25 30M77 104l22 12 38-18M74 105l-24 22-13-6" />
          {variant === "leaving" && <path d="M45 48H15l10-9m-10 9 10 9" />}
        </>
      )}
      {variant === "microphone" && (
        <>
          <circle cx="50" cy="56" r="13" />
          <path d="m50 70-2 44-23 37m23-37 24 37M48 82l24 16 12-33M47 83 25 107M82 66l4-14" />
          <rect
            x="82"
            y="38"
            width="10"
            height="17"
            rx="5"
            transform="rotate(12 82 38)"
          />
          <path d="m101 41 9-8m-6 20 14 1" />
          {[128, 168, 208].map((x) => (
            <g key={x}>
              <circle cx={x} cy="90" r="10" />
              <path
                d={`M${x} 101v29m0-18-14 12m14-12 12 12m-12 6-12 24m12-24 12 24`}
              />
            </g>
          ))}
        </>
      )}
      {variant === "working" && (
        <>
          <circle cx="68" cy="60" r="13" />
          <path d="m67 75-6 45 35 3-1 39M64 88l26 18h30M44 95v36h27M50 132l-5 30m85-42v45M89 118h112M139 110l-12-39 56 1 10 38zM145 110h52" />
          <path d="m174 38 6-12m9 18 13-5" />
        </>
      )}
      {variant === "chart" && (
        <>
          <path d="M87 33h114v87H87zM101 104l23-29 20 13 39-38m-17 0h17v17" />
          <circle cx="47" cy="91" r="12" />
          <path d="M47 105v31l-21 30m21-30 22 28M48 114l23 6 36-25M45 113l-22 15" />
        </>
      )}
    </svg>
  );
}
