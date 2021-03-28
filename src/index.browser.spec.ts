import * as PUBLIC_API from './index.browser'
// import { testCases } from '@orioro/jest-util'

test('browser / public api', () => {
  expect(Object.keys(PUBLIC_API)).toMatchSnapshot()
})
