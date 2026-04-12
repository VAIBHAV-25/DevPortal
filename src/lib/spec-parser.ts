import type { OpenAPIV3 } from 'openapi-types'
import type { ParsedEndpoint, ParsedParameter, ParsedResponse, ParsedRequestBody } from '@/types'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'
const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']

function extractSchema(mediaType: OpenAPIV3.MediaTypeObject | undefined): Record<string, unknown> | undefined {
  if (!mediaType?.schema) return undefined
  return mediaType.schema as Record<string, unknown>
}

function parseParameters(params: unknown[]): ParsedParameter[] {
  return params
    .filter((p) => p && typeof p === 'object' && '$ref' in p === false)
    .map((p) => {
      const param = p as OpenAPIV3.ParameterObject
      const schema = (param.schema ?? {}) as Record<string, unknown>
      return {
        name: param.name,
        in: param.in as ParsedParameter['in'],
        required: param.required ?? false,
        type: (schema.type as string) ?? 'string',
        description: param.description ?? '',
        example: String(param.example ?? schema.default ?? ''),
      }
    })
}

function parseRequestBody(requestBody: OpenAPIV3.RequestBodyObject | undefined): ParsedRequestBody | undefined {
  if (!requestBody) return undefined
  const content = requestBody.content ?? {}
  const contentType = Object.keys(content)[0] ?? 'application/json'
  const schema = extractSchema(content[contentType]) ?? {}
  return {
    required: requestBody.required ?? false,
    contentType,
    schema,
  }
}

function parseResponses(responses: OpenAPIV3.OperationObject['responses']): ParsedResponse[] {
  if (!responses) return []
  return Object.entries(responses).map(([statusCode, responseOrRef]) => {
    const response = responseOrRef as OpenAPIV3.ResponseObject
    const content = response.content ?? {}
    const firstMediaType = Object.values(content)[0]
    return {
      statusCode,
      description: response.description ?? '',
      schema: extractSchema(firstMediaType),
    }
  })
}

export function parseSpec(spec: OpenAPIV3.Document): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = []
  const paths = spec.paths ?? {}

  for (const [path, pathItem] of Object.entries(paths)) {
    const item = pathItem as OpenAPIV3.PathItemObject
    const pathLevelParams = Array.isArray(item.parameters) ? item.parameters : []

    for (const method of HTTP_METHODS) {
      const operation = item[method] as OpenAPIV3.OperationObject | undefined
      if (!operation) continue

      const operationParams = Array.isArray(operation.parameters) ? operation.parameters : []
      const allParams = [...pathLevelParams, ...operationParams]

      endpoints.push({
        operationId: operation.operationId ?? `${method}_${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
        method: method.toUpperCase() as ParsedEndpoint['method'],
        path,
        summary: operation.summary ?? '',
        description: operation.description ?? '',
        tags: operation.tags ?? [],
        parameters: parseParameters(allParams),
        requestBody: parseRequestBody(operation.requestBody as OpenAPIV3.RequestBodyObject | undefined),
        responses: parseResponses(operation.responses),
      })
    }
  }

  return endpoints
}

export function endpointsByTag(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  const grouped: Record<string, ParsedEndpoint[]> = {}
  for (const endpoint of endpoints) {
    const tags = endpoint.tags.length > 0 ? endpoint.tags : ['default']
    for (const tag of tags) {
      if (!grouped[tag]) grouped[tag] = []
      grouped[tag].push(endpoint)
    }
  }
  return grouped
}
