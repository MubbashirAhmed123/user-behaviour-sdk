import crypto from 'node:crypto'

import { Session, UserEvent } from "../schema/index.js";

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const eventController=async (req, res) => {
    try {
      console.log('req.body', req.body)
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const { fingerprintUid, customUid, deviceDetails, events = [] } = req.body;
  
      if (!fingerprintUid || !events.length) {
        return res.status(400).send({ error: "Missing fingerprintUid or events." });
      }
  
      // Find existing sessions for this fingerprint
      const now = new Date();
      console.log('now',now)
      const sessionQuery = {
          fingerprintUid,
          endTime: { $gt: now }
        };
        if (customUid) sessionQuery.customUid = customUid;
        
        const existingSession = await Session.findOne(sessionQuery);
        
  
      let sessionId;
      if (existingSession) {
          console.log('existingssession',existingSession)
        if (!customUid || existingSession.customUid === customUid) {
          sessionId = existingSession.sessionId;
        } else {
          sessionId = await createNewSession();
          console.log('session created...',sessionId)
        }
      } else {
          console.log('new sessionnnnnnnnnnn')
        //No existing session, create new
        sessionId = await createNewSession();
        console.log('session created...',sessionId)
      }
  
      async function createNewSession() {
        // Create a new hash object each time
        const hash = crypto.createHash('md5');
        hash.update(fingerprintUid);
        const md5Hash = hash.digest('hex');
        console.log(`MD5 hash of "${fingerprintUid}": ${md5Hash}`);
  
        const newSessionId = generateSessionId();
        const newSession = new Session({
          sessionId: newSessionId,
          fingerprintUid,
          customUid: customUid || null,
          uId:`NK_${md5Hash}`,
          ip,
          deviceDetails,
          startTime: now,
          endTime: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes later
        });
        await newSession.save();
        return newSessionId;
      }
  
      // Create a new hash for the events
      const hashForEvents = crypto.createHash('md5');
      hashForEvents.update(fingerprintUid);
      const md5Hash = hashForEvents.digest('hex');
  
      // Add sessionId to each event
      const eventsToInsert = events.map((e) => ({
        ...e,
        uId:`NK_${md5Hash}`,
        sessionId,
      }));
      console.log('eventsToInsert',eventsToInsert)
  
      await UserEvent.insertMany(eventsToInsert);
  
      return res.send({
        success: true,
        sessionId,
        inserted: events.length,
      });
    } catch (error) {
      console.error("Error saving events:", error);
      return res.status(500).send({
        error: "Failed to save events",
        message: error.message,
      });
    }
  }



export const sessionController=async(req,res)=>{
    try {
        const sessions=await Session.find()
        res.status(200).send(sessions)
    } catch (error) {
        res.status(500).send({error:'Failed to fetch sessions'})
        
    }
}


export const sessionIdControllers=async(req,res)=>{
    console.log(req.params)
    try {
        const events=await UserEvent.find({sessionId:req.params.sessionId})
        res.status(200).send(events)
    } catch (error) {
        res.status(500).send({error:'Failed to fetch events'})
        
    }
}