const config = require('./src/config.js');
const { execSync } = require('child_process');

const { loggingUserId, loggingApiKey, loggingPostUrl } = config.logging;

for (let i = 1; i <= 100; i++) {
  // Randomly decide between "warn" and "info"
  const level = Math.random() < 0.5 ? "warn" : "info";

  // Current timestamp in nanoseconds
  const timestamp = Date.now() * 1000000;

  // Construct the payload
  const payload = JSON.stringify({
    streams: [
      {
        stream: { component: "jwt-pizza-service", level, type: "http-req" },
        values: [
          [
            timestamp.toString(),
            JSON.stringify({
              name: "hacker",
              email: "d@jwt.com",
              password: "****",
              user_id: "44",
              traceID: "abcdefghijklmnop"
            })
          ]
        ]
      }
    ]
  });

  // Construct the curl command
  const curlCommand = `curl -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${loggingUserId}:${loggingApiKey}" \
    -d '${payload}' \
    ${loggingPostUrl}`;

  try {
    console.log(`Sending log ${i}: level=${level}`);
    execSync(curlCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error sending log ${i}:`, error.message);
  }

  // Sleep for 3 seconds
  execSync('sleep 3');
}
