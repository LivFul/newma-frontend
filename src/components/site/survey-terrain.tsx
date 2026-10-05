import { SURVEY_LABELS } from "@/content/home/survey";
import { contours, type Hill } from "@/lib/survey/contours";

// Decorative terrain behind the ecosystem plates. It shares the plates' coordinate system (the
// 470 x 560 hero viewBox) and extends past it, so the farm-to-patient route can enter the stack at
// the bottom and leave it at the top. Rendered on the server; zero client JavaScript.
const TERRAIN_BOX = Object.freeze({ x: -300, y: -100, width: 1100, height: 800 });

const HILLS: readonly Hill[] = [
  { cx: -40, cy: 110, r0: 14, step: 30, rings: 9, squash: 0.72, tilt: -0.42, seed: 1.3 },
  { cx: 580, cy: 290, r0: 12, step: 28, rings: 9, squash: 0.8, tilt: 0.5, seed: 4.1 },
  { cx: 170, cy: 660, r0: 10, step: 26, rings: 6, squash: 0.6, tilt: 0.12, seed: 2.2 },
];
const LINES = contours(HILLS);

type Parcel = Readonly<{ points: string; angle: number; restricted?: boolean; orchard?: boolean }>;
const PARCELS: readonly Parcel[] = [
  { points: "262,414 372,404 380,466 268,478", angle: 18 },
  { points: "372,404 486,396 494,456 380,466", angle: -62, restricted: true },
  { points: "268,478 380,466 386,530 272,538", angle: 74 },
  { points: "380,466 494,456 500,518 386,530", angle: 8, orchard: true },
];
const CONSENT_BOUNDARY = "250,396 502,380 514,532 258,552";
const FIELD_LABEL = Object.freeze({ x: 322, y: 450 });

// The route: field parcel to the foot of the stack, up through the six plates, out to the patient.
const ORIGIN = Object.freeze({ x: 326, y: 504 });
const PATIENT = Object.freeze({ x: 404, y: 26 });
const ROUTE_D =
  `M${ORIGIN.x} ${ORIGIN.y}C252 500 168 488 116 460L116 118` +
  `C116 66 214 38 318 30L${PATIENT.x - 12} ${PATIENT.y}`;

function CropPatterns() {
  return (
    <defs>
      {PARCELS.map((parcel, i) => (
        <pattern
          key={parcel.points}
          id={`survey-rows-${i}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${parcel.angle})`}
        >
          <path d="M0 3H6" className="survey-row" />
        </pattern>
      ))}
      {/* Orchard: the survey's tree symbol, a ring with a centre point, in staggered rows. */}
      <pattern id="survey-orchard" width="14" height="12" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.6" className="survey-tree" />
        <circle cx="4" cy="4" r="0.7" className="survey-tree-core" />
        <circle cx="11" cy="10" r="2.6" className="survey-tree" />
        <circle cx="11" cy="10" r="0.7" className="survey-tree-core" />
      </pattern>
      <pattern
        id="survey-restricted"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <path d="M0 0V7" className="survey-hatch" />
      </pattern>
    </defs>
  );
}

function Fields() {
  return (
    <g className="survey-fields">
      {PARCELS.map((parcel, i) => (
        <g key={parcel.points}>
          <polygon
            points={parcel.points}
            fill={parcel.orchard ? "url(#survey-orchard)" : `url(#survey-rows-${i})`}
          />
          {parcel.restricted ? (
            <polygon points={parcel.points} fill="url(#survey-restricted)" />
          ) : null}
          <polygon points={parcel.points} className="survey-parcel" />
        </g>
      ))}
      <polygon points={CONSENT_BOUNDARY} className="survey-boundary" />
      <text x={FIELD_LABEL.x} y={FIELD_LABEL.y} textAnchor="middle" className="survey-place">
        {SURVEY_LABELS.field.text}
      </text>
    </g>
  );
}

function Markers() {
  return (
    <g className="survey-markers">
      <rect x={ORIGIN.x - 6} y={ORIGIN.y - 6} width={12} height={12} className="survey-origin" />
      {/* A sprout over the origin point: the plant the route starts from. */}
      <path
        d={`M${ORIGIN.x} ${ORIGIN.y - 7}V${ORIGIN.y - 24}M${ORIGIN.x} ${ORIGIN.y - 15}C${ORIGIN.x - 2} ${ORIGIN.y - 22} ${ORIGIN.x - 10} ${ORIGIN.y - 23} ${ORIGIN.x - 12} ${ORIGIN.y - 21}C${ORIGIN.x - 10} ${ORIGIN.y - 15} ${ORIGIN.x - 3} ${ORIGIN.y - 14} ${ORIGIN.x} ${ORIGIN.y - 15}ZM${ORIGIN.x} ${ORIGIN.y - 19}C${ORIGIN.x + 2} ${ORIGIN.y - 26} ${ORIGIN.x + 10} ${ORIGIN.y - 27} ${ORIGIN.x + 12} ${ORIGIN.y - 25}C${ORIGIN.x + 10} ${ORIGIN.y - 19} ${ORIGIN.x + 3} ${ORIGIN.y - 18} ${ORIGIN.x} ${ORIGIN.y - 19}Z`}
        className="survey-sprout"
      />
      <circle cx={PATIENT.x} cy={PATIENT.y} r={12} className="survey-patient" />
      <path
        d={`M${PATIENT.x - 6} ${PATIENT.y}H${PATIENT.x + 6}M${PATIENT.x} ${PATIENT.y - 6}V${PATIENT.y + 6}`}
        className="survey-patient-cross"
      />
      <text x={PATIENT.x} y={PATIENT.y + 32} textAnchor="middle" className="survey-place">
        {SURVEY_LABELS.patient.text}
      </text>
    </g>
  );
}

export function SurveyTerrain() {
  const { x, y, width, height } = TERRAIN_BOX;
  return (
    <svg
      className="survey-terrain"
      viewBox={`${x} ${y} ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <CropPatterns />
      <g className="survey-contours">
        {LINES.map((line, i) => (
          <path key={i} d={line.d} data-index={line.index || undefined} />
        ))}
      </g>
      <Fields />
      <g className="survey-route">
        <path d={ROUTE_D} pathLength={1} className="survey-route-edge" />
        <path d={ROUTE_D} pathLength={1} className="survey-route-band" />
      </g>
      <Markers />
    </svg>
  );
}
