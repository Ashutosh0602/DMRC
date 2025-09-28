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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, lat, long } = body;

    if (!uid || typeof lat !== "number" || typeof long !== "number") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<LocationDoc>("locations");

    await collection.updateOne(
      { user: uid },
      { $push: { data: { lat, long } } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
