# Getting Started with PokéAPI

## Overview

The PokéAPI is a free, open-source RESTful API that provides data about Pokémon, moves, items, locations, and more. It requires **no authentication** — you can start making requests immediately.

## Base URL

```
https://pokeapi.co/api/v2
```

## Quick Start

Fetch Pikachu's data:

```bash
curl https://pokeapi.co/api/v2/pokemon/pikachu
```

## Pagination

List endpoints support `limit` and `offset` query parameters:

```
GET /pokemon?limit=20&offset=0
```

## Rate Limiting

PokéAPI is free and open — please cache responses where possible to reduce server load. There are no official rate limits, but heavy usage is discouraged.

## Resources

- **Pokémon** — `/pokemon/{name}` — Core data (types, stats, abilities)
- **Species** — `/pokemon-species/{name}` — Flavor text, evolution, habitat
- **Items** — `/item/{name}` — Item descriptions and effects
- **Moves** — `/move/{name}` — Move stats and descriptions
- **Locations** — `/location/{name}` — Game locations and areas

## SDKs

| Language | Package |
|---|---|
| JavaScript | `npm install pokenode-ts` |
| Python | `pip install pokebase` |
| Java | `pokeapi-java` |

## Error Handling

| Status Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Resource not found |
| `500` | Server error |

Responses are plain JSON — no wrapper envelope.
