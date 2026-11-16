export function RoadDiagram({
  active = "",
  compact = false,
}: {
  active?: string;
  compact?: boolean;
}) {
  const accent = (name: string) =>
    active === name ? "var(--road-yellow)" : "currentColor";
  return (
    <svg
      className={`road-diagram${compact ? " compact" : ""}`}
      viewBox="0 0 540 360"
      role="img"
      aria-labelledby={compact ? "road-title-small" : "road-title"}
    >
      <title id={compact ? "road-title-small" : "road-title"}>
        Asphalt area diagram: length, width, and compacted thickness
      </title>
      <defs>
        <pattern
          id={compact ? "grain-small" : "grain"}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="4" r="1" fill="#d6d3c7" opacity=".25" />
          <circle cx="11" cy="12" r=".7" fill="#d6d3c7" opacity=".25" />
        </pattern>
      </defs>
      <g className="diagram-grid" stroke="currentColor" opacity=".08">
        <path d="M0 90h540M0 180h540M0 270h540M90 0v360M180 0v360M270 0v360M360 0v360M450 0v360" />
      </g>
      <path
        d="m82 207 275-127 122 70-275 128Z"
        fill="#343c3b"
        stroke="#535a54"
      />
      <path d="m82 207 122 71v22L82 229Z" fill="#6c6e60" />
      <path d="m204 278 275-128v22L204 300Z" fill="#565c52" />
      <path
        d="m82 207 275-127 122 70-275 128Z"
        fill={`url(#${compact ? "grain-small" : "grain"})`}
      />
      <path
        d="m145 220 270-126M187 246 455 120"
        stroke="#e8dfb8"
        strokeWidth="2"
        opacity=".65"
      />
      <path
        d="m171 223 35-16m21-10 35-16m21-10 35-16m21-10 35-16m21-10 35-16"
        stroke="#ebc447"
        strokeWidth="5"
      />
      <g fill="none" strokeWidth="1.4">
        <path
          d="m74 180 272-127m-276 119 8 16m264-143 8 16"
          stroke={accent("length")}
        />
        <path
          d="m363 54 126 74m-131-66 9-15m117 89 9-15"
          stroke={accent("width")}
        />
        <path d="M499 151v25m-6-25h12m-12 25h12" stroke={accent("thickness")} />
      </g>
      <g
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="12"
        letterSpacing="1"
      >
        <text
          x="164"
          y="99"
          transform="rotate(-25 164 99)"
          fill={accent("length")}
        >
          LENGTH
        </text>
        <text
          x="423"
          y="75"
          transform="rotate(30 423 75)"
          fill={accent("width")}
        >
          WIDTH
        </text>
        <text x="468" y="208" textAnchor="middle" fill={accent("thickness")}>
          DEPTH
        </text>
        <text x="82" y="328" fontSize="10" opacity=".6" fill="currentColor">
          FINISHED / COMPACTED THICKNESS
        </text>
      </g>
    </svg>
  );
}
