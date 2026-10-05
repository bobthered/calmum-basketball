# Project conventions

- Use arrow functions unless regular functions are required, such as generators,
  constructors, or callbacks that require their own `this`.
- Organize every Svelte script in this order: imports, types, constants, helper
  functions, destructured props, `$state`, `$derived`, then `$effects` and lifecycle
  registrations. Omit empty sections.
- Alphabetize declarations within each section, import specifiers, type members,
  and destructured props. Preserve initialization dependencies and intentional
  UI ordering when alphabetical order would change behavior.
- Prefer SvelteWind components over native content tags. Preserve semantic HTML,
  accessibility, element bindings, and transitions. Report missing component
  equivalents. Document metadata and Svelte special elements remain native.
- Prefix boolean names with `is` when naming new boolean fields.
- After completing changes, include a suggested git commit message starting with
  `feat:`, `fix:`, or `refactor:`. Do not commit unless explicitly requested.
