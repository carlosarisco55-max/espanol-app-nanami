export function sameMap(actual: Record<string, string>, expected: Record<string, string>): boolean {
  const keys = Object.keys(expected);
  if (keys.length === 0) return false;
  return keys.every((key) => actual[key] === expected[key]);
}

export function hasUniqueValues(map: Record<string, string>): boolean {
  const values = Object.values(map).filter(Boolean);
  return new Set(values).size === values.length;
}
