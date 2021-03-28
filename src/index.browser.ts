import { _httpFetchExpression } from './httpFetchExpression'

export const httpFetchExpression = _httpFetchExpression.bind(null, window.fetch)
