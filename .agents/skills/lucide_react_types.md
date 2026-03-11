---
name: Resolving Lucide React Type Errors Next.js
description: How to fix the "Could not find a declaration file for module 'lucide-react'" error during Next.js builds.
---

# Resolving Lucide React Type Errors in Next.js

When building a Next.js application that uses the `lucide-react` icon library, you may encounter the following error from `tsc` during the `next build` process:

```text
Could not find a declaration file for module 'lucide-react'. '.../node_modules/lucide-react/dist/cjs/lucide-react.js' implicitly has an 'any' type.
Try `npm i --save-dev @types/lucide-react` if it exists or add a new declaration (.d.ts) file containing `declare module 'lucide-react';`
```

## The Cause
This occurs because the TypeScript compiler expects explicitly declared types for packages. However, the `lucide-react` package may not provide them in a format Next.js natively expects, and `@types/lucide-react` does not exist on the NPM registry (leading to `npm ERR! code E404` if you try to install it). 

This ultimately blocks the `next build` command because Next.js runs a strict type check during the export layer.

## The Solution
To fix this without having to disable typechecking completely, create a manual global declaration file at the root of the source directory (or any directory included in `tsconfig.json`).

1. Look in the root context of your project codebase (e.g., `./frontend/`).
2. Create or append to a file named `lucide-react.d.ts` (you could also use a broader `globals.d.ts`).
3. Inside the file, add this single line of code:

```typescript
declare module 'lucide-react';
```

## How it works
Adding `declare module 'lucide-react';` acts as an "escape hatch" for the TS compiler. It essentially tells TypeScript: "I acknowledge this module exists and I give it a global `any` type, so stop throwing build errors". 

Since the icons function properly in runtime regardless of this type error, it correctly mitigates the problem and allows your app to compile cleanly without missing required NPM packages.
