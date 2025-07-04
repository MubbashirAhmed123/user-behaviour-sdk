import { DailyUserStats, OverallStats } from "../schema/index.js"

export const overallControllers=async (req, res) => {
        try {
          const { uId } = req.params;
      
          const allStats = await DailyUserStats.find({ uId });


          console.log('allStats',allStats)  
      
          if (allStats.length === 0) {
            return res.status(404).send({ message: "No data found for this user." });
          }
      
          // Initialize accumulators
          let totalMouseMoves = 0;
          let totalMouseSpeed = 0;
      
          let totalLoginAttempts = 0;
          let totalLoginSuccess = 0;
      
          let totalSessions = 0;
          let totalEvents = 0;
      
          let totalAccounts = 0;
          let totalUids = 0;

          let totalUserAccounts=[]
          let totalDevices=[]
      
          let totalWordSpeed = 0;
          let totalCharSpeed = 0;
          let totalTypingCount = 0;
      
          let totalTransactionAmount = 0;
          let totalTransactionCount = 0;
      
          let totalAccountActivities = 0;
      
          let location=[]
      
          // Accumulate values
          for (let stat of allStats) {
            const m = stat.mouseMovement || {};
            totalMouseSpeed += (m.averageSpeed || 0) * (m.count || 0);
            totalMouseMoves += m.count || 0;
      
            const l = stat.loginAttempts || {};
            totalLoginAttempts += l.total || 0;
            totalLoginSuccess += l.success || 0;
      
            const s = stat.sessions || {};
            totalSessions += s.totalSessions || 0;
            totalEvents += s.totalEvents || 0;
      
            const a = stat.account || {};
            totalAccounts += a.totalAccounts || 0;
            totalUids += a.totalDevices.length || 0;
            totalUserAccounts.push(...a.totalUserAccounts)
            totalDevices.push(...a.totalDevices)
      
            const t = stat.typingSpeed || {};
            totalWordSpeed += (t.avgWordSpeed || 0) * (t.count || 0);
            totalCharSpeed += (t.avgCharacterSpeed || 0) * (t.count || 0);
            totalTypingCount += t.count || 0;
      
            const txn = stat.transaction || {};
            totalTransactionAmount += txn.totalAmount || 0;
            totalTransactionCount += txn.transactionCount || 0;
      
            const aa = stat.accountActivity || {};
            totalAccountActivities += aa.count || 0;

            const locationDetails=stat.location
            location=locationDetails
            

          }
      
          // Compute averages
          const overallStats = {
            uId,
            averageMouseSpeed: totalMouseMoves ? totalMouseSpeed / totalMouseMoves : 0,
            totalMouseMoves,
      
            totalLoginAttempts,
            successfulLogins: totalLoginSuccess,
            failedLogins: totalLoginAttempts - totalLoginSuccess,
      
            totalSessions,
            totalEvents,
      
            totalAccounts,
            totalUids,
            totalUserAccounts,
            totalDevices,
      
            averageWordSpeed: totalTypingCount ? totalWordSpeed / totalTypingCount : 0,
            averageCharacterSpeed: totalTypingCount ? totalCharSpeed / totalTypingCount : 0,
            // totalTypingEntries: totalTypingCount,
      
            averageTransactionAmount: totalTransactionCount ? totalTransactionAmount / totalTransactionCount : 0,
            // totalTransactionCount,
            totalTransactionAmount,
      
            totalAccountActivities,
            location
          };
      
          // Save or update
          await OverallStats.findOneAndUpdate(
            { uId },
            overallStats,
            { upsert: true, new: true }
          );
      
          res.send({ uId, overallStats });
      
        } catch (err) {
          console.error("Error generating overall stats:", err);
          res.status(500).send({ error: "Failed to generate overall data" });
        }
      }