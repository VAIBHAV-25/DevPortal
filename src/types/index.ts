export interface ChangelogEntry {
  version: string
  date: string
  type: 'breaking' | 'feature' | 'fix'
  title: string
  description: string
}

export interface ParsedParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required: boolean
  type: string
  description: string
  example?: string
}

export interface ParsedResponse {
  statusCode: string
  description: string
  schema?: Record<string, unknown>
}

export interface ParsedRequestBody {
  required: boolean
  contentType: string
  schema: Record<string, unknown>
}

export interface ParsedEndpoint {
  operationId: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  path: string
  summary: string
  description: string
  tags: string[]
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
}

export interface RequestState {
  method: string
  url: string
  headers: Record<string, string>
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  body: string
}

export interface ApiCallResponse {
  status: number
  statusText: string
  data: unknown
  latency: number
  headers: Record<string, string>
}

export interface ApiKey {
  id: string
  name: string
  key: string
  maskedKey: string
  environment: 'sandbox' | 'production'
  createdAt: string
  expiresAt?: string
  lastUsedAt?: string
  revoked: boolean
}

export interface AnalyticsDataPoint {
  date: string
  calls: number
  errors: number
  avgLatency: number
}

export interface EndpointStat {
  endpoint: string
  method: string
  calls: number
  errorRate: number
  avgLatency: number
}

export interface StatusIncident {
  id: string
  title: string
  status: 'resolved' | 'investigating' | 'identified'
  startedAt: string
  resolvedAt?: string
  description: string
}

export interface ApiStatus {
  apiId: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  incidents: StatusIncident[]
}
