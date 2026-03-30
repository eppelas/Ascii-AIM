import { interpolateAll } from 'flubber';

export function getInterpolator(fromPaths: string[], toPaths: string[]) {
  return interpolateAll(fromPaths, toPaths, { maxSegmentLength: 2 });
}
