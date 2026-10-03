// NEWMA canonical JSON, byte-identical to the backend's provenance/canonical.py:
// json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
// then UTF-8. Product code: no demo imports.
//
// - Keys sort by Unicode code point (Python str order), not by UTF-16 code unit.
// - Strings: JSON.stringify escapes exactly the set Python escapes with ensure_ascii=False
//   (", \, \b \f \n \r \t, other C0 controls as lowercase \u00xx); lone surrogates are rejected
//   because Python cannot UTF-8 encode them.
// - Numbers: safe integers print as digits; every other finite number prints as Python repr
//   (shortest round-trip digits; exponent form when exp < -4 or exp >= 16, e.g. 1e+21, 1e-05).
//   JSON numbers lose the int/float distinction in JS, so an integral float such as 2.0 from
//   the backend prints as "2" here (the backend keeps integral values as ints in manifests).

export class CanonicalJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalJsonError";
  }
}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const FIXED_MIN_EXP = -4;
const FIXED_MAX_EXP = 16;

function canonicalString(value: string): string {
  if (LONE_SURROGATE.test(value)) throw new CanonicalJsonError("Lone surrogate in string.");
  return JSON.stringify(value);
}

/** Python float repr from JS's shortest round-trip digits. */
export function pythonFloatRepr(value: number): string {
  const [mantissa, expText] = value.toExponential().split("e");
  const exp = Number(expText);
  const sign = value < 0 ? "-" : "";
  const digits = mantissa.replace("-", "").replace(".", "");
  if (exp >= FIXED_MIN_EXP && exp < FIXED_MAX_EXP) {
    if (exp < 0) return `${sign}0.${"0".repeat(-exp - 1)}${digits}`;
    const whole = digits.slice(0, exp + 1).padEnd(exp + 1, "0");
    return `${sign}${whole}.${digits.slice(exp + 1) || "0"}`;
  }
  const head = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  const expSign = exp < 0 ? "-" : "+";
  return `${sign}${head}e${expSign}${String(Math.abs(exp)).padStart(2, "0")}`;
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new CanonicalJsonError("Non-finite number.");
  return Number.isSafeInteger(value) ? String(value) : pythonFloatRepr(value);
}

/** Compares two strings by Unicode code point (Python's default str ordering). */
export function compareCodePoints(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i].codePointAt(0) ?? 0) - (right[i].codePointAt(0) ?? 0);
    if (diff !== 0) return diff;
  }
  return left.length - right.length;
}

function canonicalObject(value: Record<string, unknown>): string {
  const keys = Object.keys(value).sort(compareCodePoints);
  const members = keys.map((key) => `${canonicalString(key)}:${canonicalJson(value[key])}`);
  return `{${members.join(",")}}`;
}

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return canonicalString(value);
  if (typeof value === "number") return canonicalNumber(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return canonicalObject(value as Record<string, unknown>);
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === null) {
    return canonicalObject(value as Record<string, unknown>);
  }
  throw new CanonicalJsonError(`Cannot canonicalise a value of type ${typeof value}.`);
}
