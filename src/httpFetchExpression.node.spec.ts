// jest.mock('node-fetch')
import { HTTPErrorResponse, URLNotAllowed } from './errors'
import { FetchError, Response, Headers } from 'node-fetch'
import { prepareEvaluateTestCases } from '@orioro/jest-util-expression'

import { ALL_EXPRESSIONS, SyncModeUnsupportedError } from '@orioro/expression'

import { _httpFetchExpression } from './httpFetchExpression'

// fetch-blob is the module that node-fetch uses to build Blobs
// added as dev-dependency for testing purposes only
const Blob = require('fetch-blob') // eslint-disable-line @typescript-eslint/no-var-requires

const RESPONSES = {
  'https://invalid-json.json': {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
    body: '<h1>Hello World!</h1>',
  },
  'https://400.json': {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'HTTP_ERR_BAD_REQUEST' }),
  },
  'https://401.json': {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'HTTP_ERR_UNAUTHORIZED' }),
  },
  'https://403.json': {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'HTTP_ERR_FORBIDDEN' }),
  },
  'https://404.json': {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'HTTP_ERR_NOT_FOUND' }),
  },
  'https://500.json': {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'HTTP_ERR_INTERNAL_SERVER_ERROR' }),
  },
  'https://authorization-token-required.json': (init) => {
    if (
      init &&
      init.headers &&
      init.headers.Authorization === 'Bearer [VALID_TOKEN]'
    ) {
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key1: 'value1',
          key2: 'value2',
        }),
      }
    } else {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'HTTP_ERR_UNAUTHORIZED' }),
      }
    }
  },
  default: {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key1: 'value1',
      key2: 'value2',
    }),
  },
}

const mockFetch = jest.fn((url, init) => {
  const response = RESPONSES[url] || RESPONSES.default

  const { body, ...metadata } =
    typeof response === 'function' ? response(init) : response

  return Promise.resolve(
    new Response(body, {
      ...metadata,
      headers: new Headers(metadata.headers),
      url,
    })
  )
})

const { testAsyncCases, testSyncCases } = prepareEvaluateTestCases({
  ...ALL_EXPRESSIONS,
  $httpFetch: _httpFetchExpression(mockFetch),
})

describe('$httpFetch - simple', () => {
  describe('async only', () => {
    testSyncCases([
      [
        'https://example.com/',
        ['$httpFetch'],
        new SyncModeUnsupportedError('$httpFetch'),
      ],
    ])
  })

  describe('parameter validation', () => {
    testAsyncCases([
      ['https://example.com/', ['$httpFetch', 'text'], RESPONSES.default.body],
      [
        'any-string',
        ['$httpFetch', 'text', 'https://example.com/'],
        RESPONSES.default.body,
      ],
      ['any-string', ['$httpFetch', 'text', 1], TypeError],
      [
        'any-string',
        ['$httpFetch', 'text', 'https://example.com/', { method: 9 }],
        TypeError,
      ],
      [
        'any-string',
        [
          '$httpFetch',
          'text',
          'https://example.com/',
          { method: 'INVALID_HTTP_METHOD' },
        ],
        TypeError,
      ],
    ])
  })

  describe('bodyFormat', () => {
    const url = 'https://example.com/'

    describe('explicitly defined', () => {
      testAsyncCases([
        ['any-string', ['$httpFetch', 'text', url, {}], RESPONSES.default.body],
        [
          'any-string',
          ['$httpFetch', 'json', url, {}],
          JSON.parse(RESPONSES.default.body),
        ],
        [
          'any-string',
          ['$httpFetch', 'arrayBuffer', url, {}],
          // eslint-disable-next-line jest/no-standalone-expect
          (res) => expect(res).resolves.toBeInstanceOf(ArrayBuffer),
        ],
        [
          'any-string',
          ['$httpFetch', 'blob', url, {}],
          // eslint-disable-next-line jest/no-standalone-expect
          (res) => expect(res).resolves.toBeInstanceOf(Blob),
        ],
      ])
    })
  })
})

describe('$httpFetch - error handling', () => {
  testAsyncCases([
    [
      'any-string',
      ['$httpFetch', 'json', 'https://400.json', {}],
      (res) =>
        res.then(
          () => {
            throw new Error('Test should have thrown')
          },
          (result) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(result).toBeInstanceOf(HTTPErrorResponse)

            // eslint-disable-next-line jest/no-standalone-expect
            expect(result.response).toEqual({
              headers: { 'content-type': 'application/json' },
              ok: false,
              redirected: false,
              status: 400,
              statusText: 'Bad Request',
              type: undefined,
              url: 'https://400.json',
              body: { code: 'HTTP_ERR_BAD_REQUEST' },
            })
          }
        ),
    ],
    ['https://401.json', ['$httpFetch', 'json'], HTTPErrorResponse],
    ['https://403.json', ['$httpFetch', 'json'], HTTPErrorResponse],
    ['https://404.json', ['$httpFetch', 'json'], HTTPErrorResponse],
    ['https://500.json', ['$httpFetch', 'json'], HTTPErrorResponse],
    [
      'https://invalid-json.json',
      ['$httpFetch', 'json'],
      (res) =>
        res.then(
          () => {
            throw new Error('Test should have thrown')
          },
          (err) => {
            // JSON parsing error is not considered an HTTP Error response
            // eslint-disable-next-line jest/no-standalone-expect
            expect(err).toBeInstanceOf(FetchError)
          }
        ),
    ],
  ])
})

describe('$httpFetch - with custom url filter', () => {
  describe('function url filter', () => {
    const { testAsyncCases } = prepareEvaluateTestCases({
      ...ALL_EXPRESSIONS,
      $httpFetch: _httpFetchExpression(mockFetch, {
        url: (url) => {
          if (
            !(
              url.startsWith('http://example.com') ||
              url.startsWith('https://example.com')
            )
          ) {
            throw new Error(`Invalid url ${url}`)
          }

          return url
        },
      }),
    })

    testAsyncCases([
      ['http://example.com', ['$httpFetch', 'text'], RESPONSES.default.body],
      [
        'http://example.com/page-1.html',
        ['$httpFetch', 'text'],
        RESPONSES.default.body,
      ],
      [
        'http://example.com.br/page-1.html',
        ['$httpFetch', 'text'],
        RESPONSES.default.body,
      ],
    ])
  })

  describe('array of allowed origins url filter', () => {
    const { testAsyncCases } = prepareEvaluateTestCases({
      ...ALL_EXPRESSIONS,
      $httpFetch: _httpFetchExpression(mockFetch, {
        url: ['https://example.com', 'https://example.org'],
      }),
    })

    testAsyncCases([
      [
        'https://example.com/api/data.json',
        ['$httpFetch', 'json'],
        JSON.parse(RESPONSES.default.body),
      ],
      [
        'https://example.org/api/data.json',
        ['$httpFetch', 'json'],
        JSON.parse(RESPONSES.default.body),
      ],
      [
        'https://some-other-example.com/api/data.json',
        ['$httpFetch', 'json'],
        URLNotAllowed,
      ],
      [
        'data.json',
        ['$httpFetch', 'json'],
        new TypeError('Invalid URL: data.json'),
      ],
    ])
  })

  describe('criteria of allowed urls filter', () => {
    const { testAsyncCases } = prepareEvaluateTestCases({
      ...ALL_EXPRESSIONS,
      $httpFetch: _httpFetchExpression(mockFetch, {
        url: {
          protocol: 'https:',
        },
      }),
    })

    testAsyncCases([
      [
        'https://example.com/api/data.json',
        ['$httpFetch', 'json'],
        JSON.parse(RESPONSES.default.body),
      ],
      [
        'https://some-other-example.com/api/data.json',
        ['$httpFetch', 'json'],
        JSON.parse(RESPONSES.default.body),
      ],
      [
        'http://some-other-example.com/api/data.json',
        ['$httpFetch', 'json'],
        URLNotAllowed,
      ],
      [
        'data.json',
        ['$httpFetch', 'json'],
        new TypeError('Invalid URL: data.json'),
      ],
    ])
  })
})

describe('$httpFetch - with custom init filter', () => {
  const testAsyncCasesNoAuth = testAsyncCases
  const { testAsyncCases: testAsyncCasesWithAuth } = prepareEvaluateTestCases({
    ...ALL_EXPRESSIONS,
    $httpFetch: _httpFetchExpression(mockFetch, {
      init: (init = {}) => ({
        ...init,
        headers: {
          ...init.headers,
          Authorization: 'Bearer [VALID_TOKEN]',
        },
      }),
    }),
  })

  testAsyncCasesWithAuth([
    [
      'https://authorization-token-required.json',
      ['$httpFetch', 'json'],
      {
        key1: 'value1',
        key2: 'value2',
      },
    ],
  ])

  testAsyncCasesNoAuth([
    [
      'https://authorization-token-required.json',
      ['$httpFetch', 'json'],
      (res) =>
        res.then(
          () => {
            throw new Error('Test should have thrown')
          },
          (result) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(result).toBeInstanceOf(HTTPErrorResponse)

            // eslint-disable-next-line jest/no-standalone-expect
            expect(result.response).toEqual({
              headers: { 'content-type': 'application/json' },
              ok: false,
              redirected: false,
              status: 401,
              statusText: 'Unauthorized',
              type: undefined,
              url: 'https://authorization-token-required.json',
              body: { code: 'HTTP_ERR_UNAUTHORIZED' },
            })
          }
        ),
    ],
  ])
})

describe('in combination with $try expression', () => {
  testAsyncCases([
    [
      'https://200.json',
      ['$try', ['$httpFetch', 'json'], 'TRY_ERROR'],
      JSON.parse(RESPONSES.default.body),
    ],
    [
      'https://400.json',
      ['$try', ['$httpFetch', 'json'], 'TRY_ERROR'],
      'TRY_ERROR',
    ],
    [
      'https://400.json',
      ['$try', ['$httpFetch']],
      {
        error: true,
        message:
          'Expected `arrayBuffer, blob, json, text` but got `undefined`: undefined',
      },
    ],
    [
      'https://400.json',
      ['$try', ['$httpFetch', 'json']],
      {
        code: 'ERR_HTTP_ERROR_RESPONSE',
        error: true,
        message: 'HTTP Response Error: 400 - Bad Request',
        response: {
          body: { code: 'HTTP_ERR_BAD_REQUEST' },
          headers: { 'content-type': 'application/json' },
          ok: false,
          redirected: false,
          status: 400,
          statusText: 'Bad Request',
          type: undefined,
          url: 'https://400.json',
        },
      },
    ],
  ])
})
