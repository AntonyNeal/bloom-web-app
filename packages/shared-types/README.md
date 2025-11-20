# @shared/types

Shared TypeScript type definitions for the Life Psychology monorepo.

## Installation

Automatically linked in the workspace. To use in an app:

```bash
pnpm --filter your-app add @shared/types
```

## Usage

```typescript
import type { ApplicationDTO, ApiResponse, User } from '@shared/types';

const application: ApplicationDTO = {
  id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  // ...
};
```

## Type Categories

### Database Entities

Types that match database schema:

```typescript
import type { ApplicationEntity } from '@shared/types';

// Matches Applications table structure
interface ApplicationEntity {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  // ... all database fields
}
```

### DTOs (Data Transfer Objects)

API-friendly versions of entities:

```typescript
import type { ApplicationDTO } from '@shared/types';

// Camelcase version for API responses
interface ApplicationDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // ... all fields
}
```

### API Types

Request/response types:

```typescript
import type { ApiResponse, ApiError } from '@shared/types';

// Generic API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// API error structure
interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
```

### Form Types

Form data and validation:

```typescript
import type { ApplicationFormData } from '@shared/types';

interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  // ... form fields
}
```

## Adding New Types

1. Create type definition file:
```typescript
// src/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
```

2. Export from `src/index.ts`:
```typescript
export type { User, UserDTO } from './user';
```

3. Use in apps:
```typescript
import type { User, UserDTO } from '@shared/types';
```

## Type Conventions

### Naming
- **Entities**: PascalCase + "Entity" suffix → `ApplicationEntity`
- **DTOs**: PascalCase + "DTO" suffix → `ApplicationDTO`
- **Requests**: PascalCase + "Request" suffix → `CreateApplicationRequest`
- **Responses**: PascalCase + "Response" suffix → `ApplicationResponse`

### Structure
- **Required fields**: No `?` modifier
- **Optional fields**: Use `?` modifier
- **Null vs Undefined**: Prefer `undefined` for optional, `null` for empty

### Documentation
Add JSDoc comments for complex types:

```typescript
/**
 * Represents a practitioner application submission.
 * @property id - Unique identifier (GUID)
 * @property status - Application processing status
 * @property createdAt - ISO 8601 timestamp
 */
export interface ApplicationDTO {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
```

## Type Guards

Include type guards for runtime checking:

```typescript
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}
```

## Generic Types

Use generics for reusable patterns:

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Usage
type UserList = PaginatedResponse<User>;
```

## Current Types

### Application
- `ApplicationEntity` - Database entity
- `ApplicationDTO` - API transfer object
- `ApplicationDetailDTO` - Detailed view with relations
- `ApplicationFormData` - Form submission data

### API
- `ApiResponse<T>` - Generic API response
- `ApiError` - Error structure

### Authentication
- `User` - User entity
- `AuthToken` - JWT token structure

## Development

```bash
# Type check
pnpm --filter @shared/types type-check

# No build needed - imported directly from source
```

## Guidelines

- **Type-first**: Define types before implementation
- **Strict**: Avoid `any`, use `unknown` when type is unclear
- **Immutable**: Use `readonly` for immutable data
- **Exhaustive**: Use discriminated unions for state
- **Documented**: Add JSDoc for public APIs

## Example: Adding Application Types

```typescript
// src/application.ts
/**
 * Application status enum
 */
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

/**
 * Database entity for applications
 */
export interface ApplicationEntity {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Status: ApplicationStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
}

/**
 * API DTO for applications
 */
export interface ApplicationDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts entity to DTO
 */
export function toApplicationDTO(entity: ApplicationEntity): ApplicationDTO {
  return {
    id: entity.ApplicationID,
    firstName: entity.FirstName,
    lastName: entity.LastName,
    email: entity.Email,
    status: entity.Status,
    createdAt: entity.CreatedAt.toISOString(),
    updatedAt: entity.UpdatedAt.toISOString(),
  };
}
```

---

**Version**: 1.0.0  
**Status**: Active Development
