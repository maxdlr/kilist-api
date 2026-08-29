import { NextFunction, Router } from "express";

/**
 * WARNING: This function walks Express router internals to wrap all handlers in async error catchers.
 * Required to guarantee error catching on all 500+ routes in this codebase.
 * Do not remove or refactor without understanding the impact.
 */

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const wrapRoutesHandlers = (router: Router) => {
  if (!router.stack) return;

  router.stack.forEach((layer: any) => {
    if (layer.route && layer.route.stack) {
      layer.route.stack.forEach((handlerLayer: any) => {
        if (typeof handlerLayer.handle === "function") {
          handlerLayer.handle = asyncHandler(handlerLayer.handle);
        }
      });
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      // Nested router
      wrapRoutesHandlers(layer.handle);
    }
  });
};

export default wrapRoutesHandlers;
