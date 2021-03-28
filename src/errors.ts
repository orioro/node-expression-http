import { ParsedBody, SerializableResponse } from './types'
import { serializableResponse } from './util'

export class HTTPExpressionError extends Error {
  code: string
}

export const ERR_HTTP_ERROR_RESPONSE = 'ERR_HTTP_ERROR_RESPONSE'

export class HTTPErrorResponse extends HTTPExpressionError {
  constructor(response: Response, body: ParsedBody) {
    super(`HTTP Response Error: ${response.status} - ${response.statusText}`)

    this.code = ERR_HTTP_ERROR_RESPONSE
    this.response = serializableResponse(response, body)
  }

  response: SerializableResponse
}

export const ERR_URL_NOT_ALLOWED = 'ERR_URL_NOT_ALLOWED'

export class URLNotAllowed extends HTTPExpressionError {
  constructor(url: string) {
    super(`URL not allowed ${url}`)

    this.code = ERR_URL_NOT_ALLOWED
    this.url = url
  }

  url: string
}
