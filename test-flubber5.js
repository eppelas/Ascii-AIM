import flubber from 'flubber';
const paths1 = ["M 0 0 L 10 10 Z"];
const paths2 = ["M 0 0 L 20 20 Z"];
const interpolator = flubber.interpolateAll(paths1, paths2, { maxSegmentLength: 2, single: false });
console.log(interpolator);
console.log(interpolator[0](0.5));
