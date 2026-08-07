const fs = require('fs');
const path = require('path');

let admin = null;
let initialized = false;
let initError = null;

// Credentials come from either FIREBASE_SERVICE_ACCOUNT (raw JSON string,
// handy on hosts where you can't upload files) or a service-account file.
// Until one is present, push sending no-ops with a clear reason — the
// in-app notification inbox keeps working regardless.
function init() {
  if (initialized || initError) return;

  try {
    admin = require('firebase-admin');
  } catch (err) {
    initError = 'firebase-admin package is not installed';
    return;
  }

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      initError = 'FIREBASE_SERVICE_ACCOUNT is not valid JSON';
      return;
    }
  } else {
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || path.join(__dirname, '..', 'firebase-service-account.json');
    if (fs.existsSync(filePath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        initError = `Could not read service account at ${filePath}: ${err.message}`;
        return;
      }
    }
  }

  if (!serviceAccount) {
    initError = 'No Firebase service account configured (set FIREBASE_SERVICE_ACCOUNT or add firebase-service-account.json)';
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    initialized = true;
  } catch (err) {
    initError = `Firebase init failed: ${err.message}`;
  }
}

function isConfigured() {
  init();
  return initialized;
}

/**
 * Sends a push to many device tokens. Returns delivery counts plus the
 * tokens Firebase reported as permanently invalid so the caller can prune
 * them. Never throws — push failure must not fail the surrounding request.
 */
async function sendToTokens(tokens, { title, body, data = {} }) {
  init();

  if (!initialized) {
    return { successCount: 0, failureCount: 0, invalidTokens: [], skipped: true, reason: initError };
  }
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [], skipped: false };
  }

  const messaging = admin.messaging();
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = [];

  // sendEachForMulticast caps at 500 tokens per call.
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: { priority: 'high', notification: { channelId: 'serviceinfotek_default' } },
        apns: { payload: { aps: { sound: 'default' } } }
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((res, index) => {
        const code = res.error && res.error.code;
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          invalidTokens.push(batch[index]);
        }
      });
    } catch (err) {
      failureCount += batch.length;
    }
  }

  return { successCount, failureCount, invalidTokens, skipped: false };
}

module.exports = { sendToTokens, isConfigured };
