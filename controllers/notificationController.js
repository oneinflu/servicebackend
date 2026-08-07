const User = require('../models/User');
const DeviceToken = require('../models/DeviceToken');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const { sendToTokens, isConfigured } = require('../lib/firebaseAdmin');

// Register (or re-point) this device's FCM token to the current user.
exports.registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ status: 'error', message: 'token is required' });
    }

    await DeviceToken.findOneAndUpdate(
      { token: token.trim() },
      { token: token.trim(), user: req.user._id, platform: platform || 'android' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Called on logout so a shared device stops receiving the old user's pushes.
exports.removeDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'token is required' });
    }
    await DeviceToken.deleteOne({ token: token.trim(), user: req.user._id });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const rows = await UserNotification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('notification');

    const notifications = rows
      .filter((row) => row.notification)
      .map((row) => ({
        _id: row._id,
        title: row.notification.title,
        body: row.notification.body,
        read: row.read,
        createdAt: row.createdAt
      }));

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await UserNotification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ status: 'success', data: { count } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await UserNotification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await UserNotification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// ---- Admin ----

function audienceQuery(audience) {
  if (audience === 'individual') return { accountType: 'individual' };
  if (audience === 'business') return { accountType: 'business' };
  return {};
}

exports.sendNotification = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    const { title, body, audience } = req.body;
    if (!title || !title.trim() || !body || !body.trim()) {
      return res.status(400).json({ status: 'error', message: 'title and body are required' });
    }
    if (!['all', 'individual', 'business'].includes(audience)) {
      return res.status(400).json({ status: 'error', message: 'audience must be all, individual or business' });
    }

    const recipients = await User.find(audienceQuery(audience)).select('_id');
    const recipientIds = recipients.map((u) => u._id);

    const notification = await Notification.create({
      title: title.trim(),
      body: body.trim(),
      audience,
      sentBy: req.user._id,
      recipientCount: recipientIds.length
    });

    // Inbox rows first — the in-app list must be correct even if push fails.
    if (recipientIds.length > 0) {
      await UserNotification.insertMany(
        recipientIds.map((userId) => ({ user: userId, notification: notification._id })),
        { ordered: false }
      );
    }

    const tokenDocs = await DeviceToken.find({ user: { $in: recipientIds } }).select('token');
    const tokens = tokenDocs.map((t) => t.token);

    const push = await sendToTokens(tokens, {
      title: notification.title,
      body: notification.body,
      data: { notificationId: String(notification._id), type: 'admin_broadcast' }
    });

    if (push.invalidTokens.length > 0) {
      await DeviceToken.deleteMany({ token: { $in: push.invalidTokens } });
    }

    notification.pushSuccessCount = push.successCount;
    notification.pushFailureCount = push.failureCount;
    await notification.save();

    res.status(201).json({
      status: 'success',
      data: {
        notification,
        push: {
          devicesTargeted: tokens.length,
          successCount: push.successCount,
          failureCount: push.failureCount,
          skipped: push.skipped || false,
          reason: push.reason || null
        }
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getSentNotifications = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sentBy', 'name email');

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications, pushConfigured: isConfigured() }
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
