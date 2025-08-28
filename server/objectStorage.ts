import { Response } from "express";
import { randomUUID } from "crypto";

// Standalone object storage - disabled for production
export const objectStorageClient = null;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Standalone object storage service - disabled for production
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths (disabled in standalone)
  getPublicObjectSearchPaths(): Array<string> {
    throw new Error("Object storage is disabled in standalone mode");
  }

  // Gets the private object directory (disabled in standalone)
  getPrivateObjectDir(): string {
    throw new Error("Object storage is disabled in standalone mode");
  }

  // Search for a public object (disabled in standalone)
  async searchPublicObject(filePath: string): Promise<null> {
    return null;
  }

  // Downloads an object (disabled in standalone)
  async downloadObject(file: any, res: Response, cacheTtlSec: number = 3600) {
    res.status(404).json({ error: "Object storage is disabled in standalone mode" });
  }

  // Gets the upload URL (disabled in standalone)
  async getObjectEntityUploadURL(): Promise<string> {
    throw new Error("Object storage is disabled in standalone mode");
  }
}

// Standalone mode - object storage functions disabled