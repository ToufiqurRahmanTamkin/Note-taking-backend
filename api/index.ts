import { app } from '../src/app';

// Vercel invokes an Express app directly as the request handler. The DB
// connection is established lazily by middleware inside `app`.
export default app;
