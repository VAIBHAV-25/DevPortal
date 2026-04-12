# Getting Started with Stub API

## Overview

The Stub API uses [JSONPlaceholder](https://jsonplaceholder.typicode.com) — a free fake REST API for testing and prototyping. It supports full CRUD operations and returns realistic JSON data.

## Base URL

```
https://jsonplaceholder.typicode.com
```

## Quick Start

Fetch all posts:

```bash
curl https://jsonplaceholder.typicode.com/posts
```

## Resources

- **Posts** — `/posts` — CRUD operations on blog posts
- **Users** — `/users` — User profile data
- **Comments** — `/comments` — Comments linked to posts

## Authentication

**No authentication required.** All endpoints are open.

## Important Note

This is a **fake API** — write operations (POST, PUT, DELETE) will return success responses but **will not persist data**. This makes it ideal for sandbox testing.
