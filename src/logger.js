const config = require('./config.js');
const fetch = require('node-fetch');

class Logger {
  constructor(period = 5000) {
    this.sendLogsPeriodically(period);
  }

  httpLogger = (req, _, next) => {
    console.log(`Received ${req.method} request`);
    next();
  };

  sendLogsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const loggingData = '';
        this.sendLogToGrafana(loggingData);
      } catch (error) {
        console.error('Error sending logs:', error);
      }
    }, period);

    timer.unref();
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(`${config.logging.loggingPostUrl}`, {
      method: 'post',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.logging.loggingUserId}:${config.logging.loggingApiKey}`,
      },
    }).then((res) => {
      if (!res.ok) console.log('Failed to send log to Grafana');
    });
  }
}

const logController = new Logger();
module.exports = logController;
