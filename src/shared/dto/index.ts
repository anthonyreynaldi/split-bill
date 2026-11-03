/**
 * DTOs: the shapes that cross the client ⇄ server boundary.
 *
 * Each schema is a zod object, and its TS type has the same name (`z.infer`).
 * Client forms (TanStack Form validators) and Server Actions (`defineAction`)
 * validate with the **same** schema, so client and server can't disagree.
 *
 * @module
 */
export * from "./common";
export * from "./auth.dto";
export * from "./event.dto";
export * from "./bill.dto";
export * from "./ocr.dto";
export * from "./summary.dto";
export * from "./share.dto";
