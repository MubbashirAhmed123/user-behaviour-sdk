import { DailyUserStats, Session, UserEvent } from "../schema/index.js";

export const dayWiseData=async (req, res) => {
    try {
      const { uId } = req.params;
      console.log(uId)
      const dateFormat = "%Y-%m-%d";
      const today = new Date().toISOString().split("T")[0];
      const matchToday = {
        $match: {
          uId,
          timestamp: {
            $gte: new Date(`${today}T00:00:00.000Z`),
            $lt: new Date(`${today}T23:59:59.999Z`)
          }
        }
      };
  
      // Aggregations
      const mouseMovementAgg = UserEvent.aggregate([
        matchToday,
        { $match: { type: "MOUSE_MOVE" } },
        { $unwind: "$meta.mouseMovement" },
        {
          $group: {
            _id: null,
            avgSpeed: { $avg: "$meta.mouseMovement.speed" },
            moveCount: { $sum: 1 }
          }
        }
      ]);
  
      const loginAttemptsAgg = UserEvent.aggregate([
        matchToday,
        { $match: { type: { $in: ["LOGIN_SUCCESS", "LOGIN_FAILED"] } } },
        {
          $group: {
            _id: null,
            logins: { $sum: 1 },
            successes: {
              $sum: { $cond: [{ $eq: ["$type", "LOGIN_SUCCESS"] }, 1, 0] }
            }
          }
        }
      ]);
  
      const sessionStatsAgg = await UserEvent.aggregate([
        matchToday,
        {
          $group: {
            _id: null,
            sessions: { $addToSet: "$sessionId" },
            events: { $sum: 1 }
          }
        },
        {
          $project: {
            sessions: { $size: "$sessions" },
            events: 1,
            _id: 0
          }
        }
      ]);

      console.log("sessionStatsAgg",sessionStatsAgg)
  
      const accountStatsAgg = await Session.aggregate([
        {
          $match: {
            // customUid: { $ne: null },
            createdAt: {
              $gte: new Date(`${today}T00:00:00.000Z`),
              $lt: new Date(`${today}T23:59:59.999Z`)
            },
            fingerprintUid: { $ne: null } // 🔑 ensure this filters only with real fingerprintUid
          }
        },
        {
          $group: {
            _id: null,
            uIds: { $addToSet: "$uId" },
            customUids: { $addToSet: "$customUid" },
            fingerprintUids: { $addToSet: "$fingerprintUid" } // ✅ collect them
          }
        },
        {
          $project: {
            _id: 0,
            totalCustomUids: { $size: "$customUids" },
            totalUIds: { $size: "$uIds" },
            totalFingerprintUids: { $size: "$fingerprintUids" },
            customUids: 1,
            uIds: 1,
            fingerprintUids: 1
          }
        }
      ]);
      
      

      console.log('accountStatsAgg',accountStatsAgg)
  
      const typingSpeedAgg = UserEvent.aggregate([
        matchToday,
        { $match: { type: "TYPING_SPEED" } },
        {
          $group: {
            _id: null,
            avgWordSpeed: { $avg: "$meta.wordSpeed" },
            avgCharacterSpeed: { $avg: "$meta.characterSpeed" },
            count: { $sum: 1 }
          }
        }
      ]);
  
      const transactionAgg = UserEvent.aggregate([
        matchToday,
        { $match: { type: "TRANSACTION_PATTERNS" } },
        {
          $group: {
            _id: null,
            avgAmount: { $avg: "$meta.amount" },
            transactionCount: { $sum: 1 },
            totalAmount: { $sum: "$meta.amount" }
          }
        }
      ]);
  
      const accountActivityAgg = UserEvent.aggregate([
        matchToday,
        { $match: { type: "ACCOUNT_ACTIVITY" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);

      const locationAgg=await UserEvent.aggregate([
        matchToday,
          {
            $match: {
              "location.latitude": { $ne: null },
              "location.longitude": { $ne: null }
            }
          },
          {
            $group: {
              _id: {
                latitude: "$location.latitude",
                longitude: "$location.longitude"
              }
            }
          },
          {
            $project: {
              _id: 0,
              latitude: "$_id.latitude",
              longitude: "$_id.longitude"
            }
          }
        ])

        console.log('locationAgg',  locationAgg)
        
    
  
      // Run all in parallel
      const [
        mouseStats,
        loginStats,
        sessionsStats,
        accountStats,
        typingStats,
        transactionStats,
        accountActivity,
        location
      ] = await Promise.all([
        mouseMovementAgg,
        loginAttemptsAgg,
        sessionStatsAgg,
        accountStatsAgg,
        typingSpeedAgg,
        transactionAgg,
        accountActivityAgg,
        locationAgg
      ]);
  
      const todayStats = {
        uId,
        date: today,
        mouseMovement: {
          averageSpeed: mouseStats[0]?.avgSpeed || 0,
          count: mouseStats[0]?.moveCount || 0
        },
        loginAttempts: {
          total: loginStats[0]?.logins || 0,
          success: loginStats[0]?.successes || 0,
          failed: (loginStats[0]?.logins || 0) - (loginStats[0]?.successes || 0)
        },
        sessions: {
          totalSessions: sessionsStats[0]?.sessions || 0,
          totalEvents: sessionsStats[0]?.events || 0
        },
        account: {
          totalAccounts: accountStats[0]?.totalCustomUids || 0,
          totalUids: accountStats[0]?.totalUIds || 0,
          totalUserAccounts: accountStats[0]?.customUids || [],
          // totalDevices: accountStats[0]?.uIds || [],
          totalDevices:accountStats[0]?.fingerprintUids
        },
        typingSpeed: {
          avgWordSpeed: typingStats[0]?.avgWordSpeed || 0,
          avgCharacterSpeed: typingStats[0]?.avgCharacterSpeed || 0,
          count: typingStats[0]?.count || 0
        },
        transaction: {
          avgAmount: transactionStats[0]?.avgAmount || 0,
          transactionCount: transactionStats[0]?.transactionCount || 0,
          totalAmount: transactionStats[0]?.totalAmount || 0
        },
        accountActivity: {
          count: accountActivity[0]?.count || 0
        },
        location
      };
  
      // ✅ Insert or update document in MongoDB
      await DailyUserStats.findOneAndUpdate(
        { uId, date: today },
        todayStats,
        { upsert: true, new: true }
      );
  
      // ✅ Send response
      res.send({
        uId,
        dailyStats: todayStats
      });
  
    } catch (error) {
      console.error("Error fetching velocity data:", error);
      res.status(500).send({ error: "Failed to fetch velocity data" });
    }
  }