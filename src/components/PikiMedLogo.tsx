type Variant = "full" | "icon"
type Size    = "sm" | "md" | "lg"
type Theme   = "color" | "white" | "dark"

interface PikiMedLogoProps {
  variant?: Variant
  size?:    Size
  theme?:   Theme
  className?: string
}

// ── Size tokens ───────────────────────────────────────────────────────────────
const SIZE = {
  sm: { icon: 28, font: 16, sub: 6.5,  gap: 8  },
  md: { icon: 36, font: 20, sub: 8,    gap: 10 },
  lg: { icon: 48, font: 26, sub: 10.5, gap: 13 },
} as const

// ── Icon mark ─────────────────────────────────────────────────────────────────
// Three overlapping circles arranged in a triangle.
// All geometry is expressed as fractions of the bounding box (0–1) so the mark
// scales cleanly regardless of `size`.
//
//   r  = circle radius as fraction of box width
//   cx/cy offsets place the three circles so their edges cross near the centre.
//
//   Triangle arrangement (top-left, top-right, bottom-centre):
//
//        ●  ●
//          ●
//
const R  = 0.42   // circle radius fraction
const OX = 0.265  // horizontal offset from centre for top pair
const OY = 0.22   // vertical offset from centre for all circles

// Final positions (fractions of box, where 0.5 = centre):
//   top-left  : (0.5 − OX,  0.5 − OY)
//   top-right : (0.5 + OX,  0.5 − OY)
//   bottom    : (0.5,        0.5 + OY * 1.1)

// White centre dot radius (fraction)
const WR = 0.095

interface IconMarkProps {
  size:  number   // px square bounding box
  theme: Theme
}

function IconMark({ size, theme }: IconMarkProps) {
  const s = size

  const white = theme === "white"

  // Circle colours
  const cyan  = white ? "white" : "#06B6D4"
  const teal  = white ? "white" : "#0E7490"
  const green = white ? "white" : "#1D9E75"

  // Opacities
  const oCyan  = white ? 0.95 : 0.82
  const oTeal  = white ? 0.75 : 0.82
  const oGreen = white ? 0.55 : 0.78

  // Pixel positions
  const cx1 = s * (0.5 - OX)
  const cy1 = s * (0.5 - OY)
  const cx2 = s * (0.5 + OX)
  const cy2 = s * (0.5 - OY)
  const cx3 = s * 0.5
  const cy3 = s * (0.5 + OY * 1.1)
  const r   = s * R
  const wr  = s * WR

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Drop shadow / depth filter */}
      <defs>
        <filter id={`shadow-${s}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Three circles — painted back-to-front so overlaps blend naturally */}
      {/* top-left: cyan */}
      <circle
        cx={cx1} cy={cy1} r={r}
        fill={cyan}
        opacity={oCyan}
        style={{ mixBlendMode: "multiply" }}
      />
      {/* top-right: teal */}
      <circle
        cx={cx2} cy={cy2} r={r}
        fill={teal}
        opacity={oTeal}
        style={{ mixBlendMode: "multiply" }}
      />
      {/* bottom-centre: green */}
      <circle
        cx={cx3} cy={cy3} r={r}
        fill={green}
        opacity={oGreen}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Centre white dot */}
      <circle
        cx={s * 0.5} cy={s * 0.5} r={wr}
        fill="white"
        opacity={white ? 0.6 : 1}
      />
    </svg>
  )
}

// ── Full wordmark ─────────────────────────────────────────────────────────────

interface WordmarkProps {
  fontSize:  number
  subSize:   number
  gap:       number
  theme:     Theme
}

function Wordmark({ fontSize, subSize, gap, theme }: WordmarkProps) {
  const pikiColor = theme === "white" ? "white"   : "#06B6D4"
  const medColor  = theme === "white" ? "white"
                  : theme === "dark"  ? "#E2E8F0"
                  : "#1E293B"
  const subColor  = theme === "white" ? "rgba(255,255,255,0.7)" : "#94A3B8"

  return (
    <span
      style={{
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        marginLeft:     gap,
        lineHeight:     1,
        userSelect:     "none",
      }}
    >
      {/* "PikiMed" */}
      <span style={{ fontSize, lineHeight: 1 }}>
        <span style={{ color: pikiColor, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Piki
        </span>
        <span style={{ color: medColor, fontWeight: 400, letterSpacing: "-0.01em" }}>
          Med
        </span>
      </span>

      {/* Subtitle */}
      <span
        style={{
          color:          subColor,
          fontSize:       subSize,
          fontWeight:     500,
          letterSpacing:  "0.12em",
          textTransform:  "uppercase",
          marginTop:      subSize * 0.35,
          lineHeight:     1,
        }}
      >
        Healthcare Intelligence
      </span>
    </span>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export default function PikiMedLogo({
  variant   = "full",
  size      = "md",
  theme     = "color",
  className,
}: PikiMedLogoProps) {
  const { icon, font, sub, gap } = SIZE[size]

  return (
    <span
      className={className}
      style={{
        display:    "inline-flex",
        alignItems: "center",
        lineHeight: 1,
      }}
    >
      <IconMark size={icon} theme={theme} />
      {variant === "full" && (
        <Wordmark
          fontSize={font}
          subSize={sub}
          gap={gap}
          theme={theme}
        />
      )}
    </span>
  )
}
