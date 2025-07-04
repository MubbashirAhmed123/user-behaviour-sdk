import { UserEvent } from "../schema/index.js";

export const loginController=async (req, res) => {
    console.log(req.params)
    try {
      const { customUid } = req.params;
  
      const matchStage = {
        type: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] }
      };
  
      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'sessions',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'sessionInfo'
          }
        },
        { $unwind: '$sessionInfo' }
      ];
  
      // If a specific customUid is provided, filter it
      if (customUid) {
        pipeline.push({
          $match: {
            'sessionInfo.customUid': customUid
          }
        });
      }
  
      pipeline.push(
        {
          $group: {
            _id: '$sessionInfo.customUid',
            totalLoginAttempts: { $sum: 1 },
            loginSuccessCount: {
              $sum: { $cond: [{ $eq: ['$type', 'LOGIN_SUCCESS'] }, 1, 0] }
            },
            loginFailedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'LOGIN_FAILED'] }, 1, 0] }
            }
          }
        },
        { $sort: { totalLoginAttempts: -1 } }
      );
  
      const stats = await UserEvent.aggregate(pipeline);
      res.send(stats);
    } catch (error) {
      console.error('Error calculating login stats:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }