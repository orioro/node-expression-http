import { indefiniteObjectOfType, enumType } from '@orioro/typing'

export type HTTPMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'

export const HTTP_METHOD_TYPE_SPEC = enumType([
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
])

// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#parameters
export type FetchInit = {
  method?: HTTPMethod
  headers?: { [key: string]: string }
  body?:
    | Blob
    | BufferSource
    | FormData
    | URLSearchParams
    // | USVString
    | ReadableStream
  mode?: 'same-origin' | 'no-cors' | 'cors' | 'navigate'
  credentials?: 'omit' | 'same-origin' | 'include'
  redirect?: 'omit' | 'same-origin' | 'include'
  referrer?: string
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin'
    | 'origin-when-cross-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  integrity?: string
  keepalive?: boolean
}
export const FETCH_INIT_TYPE_SPEC = {
  method: ['undefined', HTTP_METHOD_TYPE_SPEC],
  headers: ['undefined', indefiniteObjectOfType('string')],
  body: 'any',
  mode: [
    'undefined',
    enumType([
      // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
      'same-origin',
      'no-cors',
      'cors',
      'navigate',
    ]),
  ],
  credentials: [
    'undefined',
    enumType([
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
      'omit',
      'same-origin',
      'include',
    ]),
  ],
  redirect: [
    'undefined',
    enumType([
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
      'follow',
      'error',
      'manual',
    ]),
  ],
  referrer: ['undefined', 'string'],
  referrerPolicy: [
    'undefined',
    enumType([
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
      'no-referrer',
      'no-referrer-when-downgrade',
      'same-origin',
      'origin',
      'strict-origin',
      'origin-when-cross-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ]),
  ],
  integrity: ['undefined', 'string'],
  keepalive: ['undefined', 'boolean'],
}

// https://developer.mozilla.org/en-US/docs/Web/API/Response#body_interface_methods
export const BODY_FORMAT_TYPE_SPEC = enumType([
  'arrayBuffer',
  'blob',
  // 'formData',
  'json',
  'text',
])

export type BodyFormat =
  | 'arrayBuffer'
  | 'blob'
  // | 'formData'
  | 'json'
  | 'text'

export type ParsedBody = ArrayBuffer | Blob | FormData | PlainObject | string

export type PlainObject = { [key: string]: any }

export type UrlResolverInterface = (urlInput: string) => string
export type InitResolverInterface = (initInput?: PlainObject) => FetchInit
export type FetchInterface = (
  url: string,
  init?: FetchInit
) => Promise<Response>

export type SerializableResponse = {
  headers: PlainObject | null
  ok: boolean
  redirected: boolean
  status: number
  statusText: string
  type: string
  url: string
  body: ParsedBody
}
