// filepath: d:\Nexus\Batchflow\server\src\types.d.ts
import { Request } from "express";

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string;
        }

        interface Request {
            user?: User;
        }
    }
}