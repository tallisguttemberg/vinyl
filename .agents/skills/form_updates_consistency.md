---
name: Form Updates and Component Props Consistency
description: Best practices for updating dynamic forms and ensuring consistent props across React components to prevent TS errors.
---

# Form Updates and Component Props Consistency

When making changes to a central data model or form logic that affects multiple components, it's very easy to miss one or two files that depend on that structure, leading to TypeScript compilation errors. 

## The Problem
When updating a Prisma schema or adding new fields to a primary creation form (like `OrderForm.tsx`), it's common to update the schema and the `useMutation` inputs on the backend but forget to update components that pass data INTO that form as props, such as Edit pages (`EditClient.tsx`). 

In TypeScript (and particularly with `react-hook-form` and `zod`), missing matching fields in `initialValues` will trigger type mismatches during the build step. 

## Best Practices

### 1. Identify all references to a modified type
When adding a new field (like `mlUsed`) to a data structure (like an `Order Item`), mentally map out or search for all places that structure is used:
- The backend Prisma Schema (`schema.prisma`)
- The tRPC router input verification `z.object(...)` 
- The React Hook Form `z.object(...)` schema
- The **Creation Page** component
- The **Edit Page** component (where data is fetched from the DB and reformatted into `initialValues`)
- Data display components (tables, details pages)

### 2. Update `initialValues` in Edit screens
When a new default field is added to a frontend schema, any screen that pre-fills that form (like an edit page) **MUST** be updated to provide a default value for that new field.
```typescript
// Example: If a new field 'mlUsed' is added to the form schema, 
// the Edit page formatting must include it, even if it defaults to 0.
const initialValues = {
    // ... other fields
    items: order.items.map(item => ({
        // ... existing fields
        mlUsed: Number((item as any).mlUsed || 0), // Added this!
    })),
}
```

### 3. Handle Prisma schema drift gracefully with temporary casting 
When running `prisma generate` in local environments, the TypeScript Language Server might experience delays in picking up the new types generated in `node_modules/@prisma/client`. 

To prevent this temporary drift from blocking development progress or causing spurious linting errors:
- Use `(item as any).newField` when referencing a field that was just added to the Prisma schema but the TS server hasn't recognized yet.
- Explicitly cast default values or nulls back to `any` on write operations if Prisma strict typing is complaining about nullability before the new types sync. Example: `rollLength: (input.rollLength ?? null) as any`

### 4. Separate tests from source code
Ensure that unit testing files (e.g., `*.test.ts`) are kept in their appropriate directories. If a backend test file is accidentally moved into a frontend source directory, the frontend build tools (like Vite or Next.js) may try to compile it and fail if required test runner dependencies (like `vitest`) are not installed in the frontend `package.json`. 

If you see an error like `Cannot find module 'vitest'`, check if a backend test file leaked into the frontend.
