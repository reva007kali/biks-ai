import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import apiRoutes from "../server/api";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(apiRoutes);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
