import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createClient } from "@supabase/supabase-js";

// Supabase client config
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hnnetzbgjvqrlwfdsjiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'hnnetzbgjvqrlwfdsjiv';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enforce using the env variable for the agent token
const AGENT_INTEGRATION_TOKEN = process.env.AGENT_INTEGRATION_TOKEN;

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api

  app.post("/api/tickets", async (req: Request, res: Response) => {
    try {
      if (!AGENT_INTEGRATION_TOKEN) {
         return res.status(500).json({ error: "Agent integration token is not configured on the server" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }

      const token = authHeader.split(" ")[1];
      if (token !== AGENT_INTEGRATION_TOKEN) {
        return res.status(403).json({ error: "Forbidden: Invalid token" });
      }

      const { title, description, priority, customerId, customerName, tags } = req.body;

      if (!title || !description || !customerId || !customerName) {
        return res.status(400).json({ error: "Missing required ticket fields" });
      }

      const newTicket = {
        id: 'ext-' + Date.now().toString(36),
        title,
        description,
        status: 'open',
        priority: priority || 'medium',
        customerId,
        customerName,
        tags: tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { data, error } = await supabase.from("tickets").insert([newTicket]);

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: "Failed to create ticket in database", details: error });
      }

      return res.status(201).json({ success: true, ticket: newTicket });
    } catch (error) {
      console.error("Error creating external ticket:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
