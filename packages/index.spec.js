import runTest        from '@hackbg/runspec'
import suites         from './ops/index.spec.js.md'
import scrtSuites     from './scrt/Scrt.spec.ts.md'
import scrtNextSuites from './scrt-next/ScrtNext.spec.ts.md'

runTest({
  ...suites,
  ...scrtSuites,
  ...scrtNextSuites,
}, process.argv.slice(2))
