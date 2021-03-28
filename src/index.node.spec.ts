import * as PUBLIC_API from './index.node'
// import { testCases } from '@orioro/jest-util'

test('node.js / public api', () => {
  expect(Object.keys(PUBLIC_API)).toMatchSnapshot()
})
