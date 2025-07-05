import Fastify from "fastify";
import cors from "@fastify/cors";
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { connectToDb } from "./config/db.js"; // updated import
import { routes } from "./routes/routes.js";
import { eventController, sessionController, sessionIdControllers } from "./controllers/event.js";
import { loginController } from "./controllers/login.js";
import { dayWiseData } from "./controllers/daywise.js";
import { overallControllers } from "./controllers/overall.js";

dotenv.config();

const app = Fastify({ logger: true });

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

await app.register(cors, {
  origin: "*",
  credentials: true,
});

// Register routes
app.register(routes);

// Basic routes
app.get('/', async (req, res) => res.send('hello'));
app.post("/events", eventController);
app.get('/sessions', sessionController);
app.get('/events/:sessionId', sessionIdControllers);
app.get('/login_activity/:customUid', loginController);
app.get('/get_velocity_data/:uId', dayWiseData);
app.get('/get_acc/:uId', async (req, res) => {
  const { uId } = req.params;
  let ac = await Session.aggregate([
    { $match: { uId } },
    {
      $group: {
        _id: '$customUid',
        count: { $sum: 1 }
      }
    }
  ]);
  res.send(ac);
});
app.get('/get_overall_data/:uId', overallControllers);
app.get('/fingerprint/:requestId', async (req, reply) => {
  try {
    const res = await fetch(`https://api.fpjs.io/events/${req.params.requestId}`, {
      headers: {
        'Auth-API-Key': process.env.FPJS_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!res.ok) {
      return reply.status(res.status).send({ error: 'Failed to fetch from FPJS API' });
    }

    const data = await res.json();
    return reply.send(data);
  } catch (error) {
    console.error('Fetch error:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

try {
  await connectToDb();
  app.listen({ port: 5005 }, (err) => {
    if (err) throw err;
    console.log("Server listening on port 5005");
  });
} catch (error) {
  console.error("Server startup failed due to DB connection issue:", error);
}
