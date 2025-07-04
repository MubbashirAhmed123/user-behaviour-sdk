import Fastify from "fastify";
import cors from "@fastify/cors";
import crypto from 'node:crypto'
import { UserEvent, Session, DailyUserStats, OverallStats } from "./schema/index.js";
import "./config/db.js";
import dotenv from 'dotenv';
import { routes } from "./routes/routes.js";
import { eventController, sessionController, sessionIdControllers } from "./controllers/event.js";
import { loginController } from "./controllers/login.js";
import { dayWiseData } from "./controllers/daywise.js";
import { overallControllers } from "./controllers/overall.js";
const app = Fastify({ logger: true });

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
await app.register(cors, {
  origin: "*",
  credentials: true,
});
dotenv.config();


app.register(routes)




// Create an MD5 hash object
const hash = crypto.createHash('md5');

app.get('/', async (req, res) => {
  res.send('hello')
})

app.post("/events", eventController)


app.get('/sessions',sessionController)

app.get('/events/:sessionId',sessionIdControllers)

app.get('/login_activity/:customUid', loginController);
  


  app.get('/get_velocity_data/:uId', dayWiseData);

  app.get('/get_acc/:uId', async (req, res) => {
    const {uId}=req.params

    let ac=await Session.aggregate([
        {$match:{uId}},
        {
            $group:{
                _id:'$customUid',
                count:{$sum:1}
            }
        }
    ])

    res.send(ac)

    })
  

    app.get('/get_overall_data/:uId', overallControllers);


    app.get('/fingerprint/:requestId', async (req, reply) => {
      try {
          console.log(req.params)
          const res = await fetch(`https://api.fpjs.io/events/${req.params.requestId}`, {
              headers: {
                  'Auth-API-Key': process.env.FPJS_API_KEY,
                  'accept': 'application/json'
              }
          })
  
          if (!res.ok) {
              return reply.status(res.status).send({ error: 'Failed to fetch from FPJS API' });
          }
  
          const data = await res.json();
          console.log(data)
          return reply.send(data);
      } catch (error) {
          console.error('Fetch error:', error);
          return reply.status(500).send({ error: 'Internal Server Error' });
      }
  })
  
  
  
app.listen({ port: 5005 }, (err) => {
  if (err) throw err;
  console.log("Server listening on port 5005");
});


// /events

// { type: "DEVICE_DATA",fingerprintUid; ...}


// case 1: No data in db for fingerprint generated uid
//         -> create new session
//         -> save data to db (sessionId, fingerprintUid, ip, deviceDetails, startTime, endTime)
//         -> add events data with the new sessionId


// case 2: Data in db for fingerprint generated uid
//         -> check if a session with endTime > current time is found
//         -> if found -> 
//                 -> case 1 : no custom uid. -> use same session and store the data in events Collection
//                 -> case 2: custom uid found and matching -> use same session and store the data in events Collection
//                 -> case 3: custom uid found and not matching -> create new session and store the data in events Collection
        
//         if not found ->
//             -> create new session
//             -> save data to db (sessionId, fingerprintUid, ip, deviceDetails, startTime, endTime)
//             -> add events data with the new sessionId.