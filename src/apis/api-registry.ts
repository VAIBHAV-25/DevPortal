import type { OpenAPIV3 } from 'openapi-types'
import type { ChangelogEntry } from '@/types'

import pokeapiSpec from './pokeapi/openapi.json'
import pokeapiChangelog from './pokeapi/changelog.json'
import stubApiSpec from './stub-api/openapi.json'
import stubApiChangelog from './stub-api/changelog.json'

export interface SdkLink {
  language: string
  package: string
  url: string
}

export interface ApiDefinition {
  id: string
  name: string
  version: string
  description: string
  spec: OpenAPIV3.Document
  docsFile?: string
  changelog?: ChangelogEntry[]
  sdks?: SdkLink[]
  baseUrl: string
  color: string
  icon: string
}

export const API_REGISTRY: ApiDefinition[] = [
  {
    id: 'pokeapi',
    name: 'PokéAPI',
    version: '2.7.0',
    description: 'All the Pokémon data you\'ll ever need in one place',
    spec: pokeapiSpec as unknown as OpenAPIV3.Document,
    docsFile: '/src/apis/pokeapi/docs.md',
    changelog: pokeapiChangelog as ChangelogEntry[],
    sdks: [
      { language: 'JavaScript', package: 'pokenode-ts', url: 'https://github.com/Gabb-c/pokenode-ts' },
      { language: 'Python', package: 'pokebase', url: 'https://github.com/PokeAPI/pokebase' },
    ],
    baseUrl: 'https://pokeapi.co/api/v2',
    color: '#EF4444',
    icon: '⚡',
  },
  {
    id: 'stub-api',
    name: 'Stub API',
    version: '1.1.0',
    description: 'Free fake REST API for testing and prototyping',
    spec: stubApiSpec as unknown as OpenAPIV3.Document,
    docsFile: '/src/apis/stub-api/docs.md',
    changelog: stubApiChangelog as ChangelogEntry[],
    sdks: [],
    baseUrl: 'https://jsonplaceholder.typicode.com',
    color: '#8B5CF6',
    icon: '🔧',
  },
]

export function getApiById(id: string): ApiDefinition | undefined {
  return API_REGISTRY.find((api) => api.id === id)
}
