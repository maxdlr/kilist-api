import { Request, Response } from "express";

const setCors = (req: Request, res: Response) => {
  const origin = req.headers.origin || "";

  const allowedOrigins = process.env.CORS_ORIGIN_URL;

  if (allowedOrigins?.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type, Content-Disposition",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, Content-Type, X-Requested-With, Range",
  );
};

export default setCors;
