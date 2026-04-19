const cron = require('node-cron');
const Post = require('../models/Post');

/**
 * Every minute: unlock scheduled posts whose unlockDate has passed.
 * @param {import('socket.io').Server | null} io - optional Socket.io server for notifications
 */
function schedulePostUnlockJob(io) {
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const now = new Date();
        const due = await Post.find({
          isLocked: true,
          unlockDate: { $lte: now },
        })
          .select('_id userId')
          .lean();

        if (due.length === 0) return;

        await Post.updateMany(
          { _id: { $in: due.map((p) => p._id) } },
          { $set: { isLocked: false } }
        );

        if (io) {
          for (const p of due) {
            io.to(`user:${p.userId}`).emit('notification', {
              type: 'post_unlocked',
              postId: String(p._id),
              message: 'Your scheduled post is now live.',
            });
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[postUnlockCron]', err);
      }
    }
  );
}

module.exports = { schedulePostUnlockJob };
