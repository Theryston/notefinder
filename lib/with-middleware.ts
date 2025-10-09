/* eslint-disable @typescript-eslint/no-explicit-any */

export const withMiddleware =
  (
    middleware: (req: Request, ctx?: any) => Promise<Response | void>,
    handler: (req: Request, ctx?: any) => Promise<Response>,
  ) =>
  async (req: Request, ctx: any) => {
    const result = await middleware(req, ctx);
    if (result instanceof Response && result.status !== 200) return result;
    return handler(req, ctx);
  };
