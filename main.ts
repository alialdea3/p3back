import { MongoClient, ObjectId } from "mongodb";
import type { TareaModel } from "./types.ts";
import { fromModelToTarea } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("agenda");

const tareaCollection = db.collection<TareaModel>("tareas");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {
    if (path.startsWith("/tasks/")) {
      const id = path.split("/")[2];
      const tareaDB = await tareaCollection.findOne({ _id: new ObjectId(id) });
      if (!tareaDB) return new Response("Tsrea no encontrada", { status: 404 });
      const tarea = fromModelToTarea(tareaDB);
      return new Response(JSON.stringify(tarea), { status: 200 });
    } else if (path == "/tasks") {
      const tareaDB = await tareaCollection.find().toArray();
      const tareas = await Promise.all(tareaDB.map((u) => fromModelToTarea(u)));
      return new Response(JSON.stringify(tareas), { status: 200 });
    }
  } else if (method === "POST") {
    if (path === "/tasks") {
      const tarea = await req.json();
      if (!tarea.titulo) {
        return new Response("Bad request", { status: 400 });
      }
      const tareaDB = await tareaCollection.findOne({
        titulo: tarea.titulo,
      });
      if (tareaDB) return new Response("tarea already exists", { status: 409 });

      const { insertedId } = await tareaCollection.insertOne({
        titulo: tarea.title,
        completed: false,
      });

      return new Response(
        JSON.stringify({
          titulo: tarea.titulo,
          completed: tarea.completed,
          id: insertedId,
        }),
        { status: 201 },
      );
    }
  } else if (method === "PUT") {
    if (path.startsWith("/tasks/")) {
      const tarea = await req.json();
      const id = path.split("/")[2];
      const { modifiedCount } = await tareaCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed: tarea.completed } },
      );

      if (modifiedCount === 0) {
        return new Response("tarea not found", { status: 404 });
      }
      const tareaDB = await tareaCollection.findOne({ _id: new ObjectId(id) });
      if (!tareaDB) return new Response("Tarea not found", { status: 404 });

      return new Response(
        JSON.stringify({
          id: tareaDB._id,
          title: tareaDB.titulo,
          completed: tareaDB.completed,
        }),
        { status: 200 },
      );
    }
  } else if (method === "DELETE") {
    if (path.startsWith("/tasks/")) {
      const id = path.split("/")[2];
      if (!id) return new Response("Bad request", { status: 400 });
      const { deletedCount } = await tareaCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (deletedCount === 0) {
        return new Response("tarea not found", { status: 404 });
      }

      return new Response("Tarea eliminada correctamente", { status: 200 });
    }
  }

  return new Response("endpoint not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
