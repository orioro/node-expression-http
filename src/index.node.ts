import fetch from 'node-fetch'
import { _httpFetchExpression } from './httpFetchExpression'

export const httpFetchExpression = _httpFetchExpression.bind(null, fetch)
