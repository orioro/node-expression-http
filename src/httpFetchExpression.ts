import {
  InterpreterSpec,
  evaluateSync,
  interpreterList,
  ALL_EXPRESSIONS,
} from '@orioro/expression'

import { URL_EXPRESSIONS } from '@orioro/expression-url'

import {
  BodyFormat,
  BODY_FORMAT_TYPE_SPEC,
  FetchInit,
  FETCH_INIT_TYPE_SPEC,
  PlainObject,
  ParsedBody,
  FetchInterface,
  UrlResolverInterface,
  InitResolverInterface,
} from './types'

import { HTTPErrorResponse, URLNotAllowed } from './errors'

import { _noopEcho } from './util'

const _responseBody = (
  bodyFormat: BodyFormat,
  response
): Promise<ParsedBody> => {
  switch (bodyFormat) {
    case 'arrayBuffer':
      return response.arrayBuffer()
    case 'blob':
      return response.blob()
    // formData is not supported by node-fetch (and not used so frequently on responses)
    // case 'formData':
    //   return response.formData()
    case 'json':
      return response.json()
    case 'text':
      return response.text()
  }
}

export const allowOrigins = (origins: string[]) => (url: string): string => {
  const parsed = new URL(url)

  if (!origins.includes(parsed.origin)) {
    throw new URLNotAllowed(url)
  }

  return url
}

const _urlMatchingInterpreters = interpreterList({
  ...ALL_EXPRESSIONS,
  ...URL_EXPRESSIONS,
})

export const allowMatchingCriteria = (criteria: PlainObject) => (
  url: string
): string => {
  const matchesCriteria = evaluateSync(
    {
      interpreters: _urlMatchingInterpreters,
      scope: { $$VALUE: url },
    },
    ['$urlMatches', criteria]
  )

  if (!matchesCriteria) {
    throw new URLNotAllowed(url)
  }

  return url
}

const _validateUrl = (url) => {
  new URL(url)
}

/**
 * @todo $http Improve error handling
 * @function $http
 * @param {URL} url
 * @param {Object} init
 */
export const _httpFetchExpression = (
  fetch: FetchInterface,
  options: {
    url?: UrlResolverInterface | PlainObject
    init?: InitResolverInterface
  } = {}
): InterpreterSpec => {
  const _url = Array.isArray(options.url)
    ? allowOrigins(options.url)
    : typeof options.url === 'object'
    ? allowMatchingCriteria(options.url)
    : typeof options.url === 'function'
    ? options.url
    : _noopEcho

  const _init = options.init ? options.init : _noopEcho

  return {
    sync: null,
    async: [
      (bodyFormat: BodyFormat, url: string, init?: FetchInit) => {
        url = _url(url)
        init = _init(init)

        _validateUrl(url)

        return fetch(url, init).then((response) =>
          _responseBody(bodyFormat, response).then((parsedBody) => {
            if (response.ok) {
              return parsedBody
            } else {
              throw new HTTPErrorResponse(response, parsedBody)
            }
          })
        )
      },
      [BODY_FORMAT_TYPE_SPEC, 'string', ['undefined', FETCH_INIT_TYPE_SPEC]],
      { defaultParam: 1 },
    ],
  }
}
