/**
 * Barrel — combines all domain-grouped handlers into one array that is
 * passed to setupServer in service.js.
 *
 * To add a new domain:
 *   1. Create `handlers/<domain>Handlers.js`
 *   2. Import it here and spread it into the `handlers` array
 *   3. Nothing else changes — service.js stays untouched
 */
import { userHandlers } from "./handlers/userHandlers";
import { imageHandlers } from "./handlers/imageHandlers";
import { counterHandlers } from "./handlers/counterHandlers";

export const handlers = [...userHandlers, ...imageHandlers, ...counterHandlers];
