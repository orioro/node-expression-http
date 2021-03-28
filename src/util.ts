import { PlainObject, ParsedBody, SerializableResponse } from './types'

export const serializableHeaders = (headers: Headers): PlainObject => {
  const _headers = {}

  if (headers) {
    for (const key of headers.keys()) {
      const lowerKey = key.toLowerCase()
      _headers[lowerKey] = headers.get(key)
    }
  }

  return _headers
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Response#properties
 * @function serializableResponse
 */
export const serializableResponse = (
  response: Response,
  parsedBody: ParsedBody
): SerializableResponse => {
  const { headers, ok, redirected, status, statusText, type, url } = response

  return {
    headers: headers ? serializableHeaders(headers) : null,
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
    body: parsedBody,
  }
}

export const _noopEcho = <Type>(input: Type): Type => input
