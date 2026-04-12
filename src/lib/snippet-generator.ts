import type { RequestState } from '@/types'

interface SnippetContext {
  request: RequestState
  apiToken?: string
}

function buildUrl(request: RequestState): string {
  let url = request.url
  // Replace path params
  for (const [key, value] of Object.entries(request.pathParams)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value))
  }
  // Append query params
  const queryEntries = Object.entries(request.queryParams).filter(([, v]) => v !== '')
  if (queryEntries.length > 0) {
    const qs = queryEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    url += `?${qs}`
  }
  return url
}

function buildHeaders(request: RequestState, apiToken?: string): Record<string, string> {
  const headers: Record<string, string> = { ...request.headers }
  if (apiToken) {
    headers['Authorization'] = `Bearer ${apiToken}`
  }
  if (request.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export function generateCurl({ request, apiToken }: SnippetContext): string {
  const url = buildUrl(request)
  const headers = buildHeaders(request, apiToken)

  const lines: string[] = [`curl -X ${request.method} '${url}'`]

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`  -H '${key}: ${value}'`)
  }

  if (request.body) {
    lines.push(`  -d '${request.body.replace(/'/g, "\\'")}'`)
  }

  return lines.join(' \\\n')
}

export function generateFetch({ request, apiToken }: SnippetContext): string {
  const url = buildUrl(request)
  const headers = buildHeaders(request, apiToken)

  const headersStr = JSON.stringify(headers, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '      ' + line))
    .join('\n')

  const hasBody = request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)

  return `const response = await fetch('${url}', {
  method: '${request.method}',
  headers: ${headersStr},${hasBody ? `\n  body: JSON.stringify(${request.body}),` : ''}
});

const data = await response.json();
console.log(data);`
}

export function generatePython({ request, apiToken }: SnippetContext): string {
  const url = buildUrl(request)
  const headers = buildHeaders(request, apiToken)

  const headersStr = JSON.stringify(headers, null, 4)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '    ' + line))
    .join('\n')

  const method = request.method.toLowerCase()
  const hasBody = request.body && ['post', 'put', 'patch'].includes(method)

  return `import requests

url = "${url}"
headers = ${headersStr}
${hasBody ? `payload = ${request.body}\n` : ''}
response = requests.${method}(url, headers=headers${hasBody ? ', json=payload' : ''})
print(response.status_code)
print(response.json())`
}

export function generateSnippets(context: SnippetContext): Record<string, string> {
  return {
    curl: generateCurl(context),
    fetch: generateFetch(context),
    python: generatePython(context),
  }
}
