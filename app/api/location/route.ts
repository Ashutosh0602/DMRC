export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

interface LocationDoc {
  user: string;
  data: { lat: number; long: number }[];
}

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "geo_db";

let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

// CORS utilities
function applyCorsHeaders(response: NextResponse, origin?: string | null) {
  const allowOrigin = origin || "*";
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const res = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(res, origin);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, lat, long } = body;

    if (!uid || typeof lat !== "number" || typeof long !== "number") {
      const res = NextResponse.json({ error: "invalid payload" }, { status: 400 });
      return applyCorsHeaders(res, req.headers.get("origin"));
    }

    const db = await getDb();
    const collection = db.collection<LocationDoc>("locations");

    await collection.updateOne(
      { user: uid },
      { $push: { data: { lat, long } } },
      { upsert: true }
    );

    const res = NextResponse.json({ ok: true });
    return applyCorsHeaders(res, req.headers.get("origin"));
  } catch (err) {
    console.error(err);
    const res = NextResponse.json({ error: "server error" }, { status: 500 });
    return applyCorsHeaders(res, req.headers.get("origin"));
  }
}
