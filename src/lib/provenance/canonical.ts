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
//   the backend prints as "2" here, and an int beyond ±(2^53−1) prints as a float; the backend
//   keeps manifest integers within the JS-safe range (vectors.json "integers" note).

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
  // Python ints are never -0, so -0 can only be the float -0.0.
  if (Object.is(value, -0)) return "-0.0";
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

// Manifests are shallow; the cap only stops hostile input from overflowing the stack.
export const MAX_DEPTH = 64;

function canonicalObject(value: Record<string, unknown>, depth: number): string {
  const keys = Object.keys(value).sort(compareCodePoints);
  const members = keys.map(
    (key) => `${canonicalString(key)}:${canonicalAt(value[key], depth + 1)}`,
  );
  return `{${members.join(",")}}`;
}

const isPlainObject = (value: object): boolean => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

function canonicalAt(value: unknown, depth: number): string {
  if (depth > MAX_DEPTH) throw new CanonicalJsonError(`Nesting deeper than ${MAX_DEPTH}.`);
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return canonicalString(value);
  if (typeof value === "number") return canonicalNumber(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalAt(item, depth + 1)).join(",")}]`;
  if (typeof value === "object" && isPlainObject(value)) {
    return canonicalObject(value as Record<string, unknown>, depth);
  }
  throw new CanonicalJsonError(`Cannot canonicalise a value of type ${typeof value}.`);
}

export function canonicalJson(value: unknown): string {
  return canonicalAt(value, 0);
}
