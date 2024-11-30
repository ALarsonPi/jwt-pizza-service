const config = require('./config.js');
const fetch = require('node-fetch');

class Logger {
    httpLogger = (req, res, next) => {
      let send = res.send;
      res.send = (resBody) => {
        const logData = {
          authorized: !!req.headers.authorization,
          path: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          reqBody: JSON.stringify(req.body),
          resBody: JSON.stringify(resBody),
        };
        const level = this.statusToLogLevel(res.statusCode);
        this.log(level, 'http', logData);
        res.send = send;
        return res.send(resBody);
      };
      next();
    };

    queryWithLogging(queryFunction) {
        return async function (connection, sql, params) {
          try {
            const results = await queryFunction(connection, sql, params);
            console.log("AAHHHHHH", results, sql, params);

            const safeSql = sql || ''; 
            const safeParams = params || '';
            const safeResults = results || '';
            const logData = {
              query: logController.sanitize(safeSql),
              params: logController.sanitize(safeParams),
              result: logController.sanitize(safeResults),
            };
            logController.log('info', 'database', logData);
            return results;
          } catch (error) {
            console.log("NAAAAAH", error, sql, params);
            const safeSql = sql || ''; 
            const safeParams = params || '';
            logController.log('error', 'database', {
              error: error.message,
              query: logController.sanitize(safeSql),
              params: logController.sanitize(safeParams),
            });
            throw error;
          }
        };
    }
  
    log(level, type, logData) {
      const labels = { component: config.logging.source, level: level, type: type };
      const values = [this.nowString(), this.sanitize(logData)];
      const logEvent = { streams: [{ stream: labels, values: [values] }] };
  
      this.sendLogToGrafana(logEvent);
    }
  
    statusToLogLevel(statusCode) {
      if (statusCode >= 500) return 'error';
      if (statusCode >= 400) return 'warn';
      return 'info';
    }
  
    nowString() {
      return (Math.floor(Date.now()) * 1000000).toString();
    }
  
    sanitize(logData) {
      logData = JSON.stringify(logData);
      return logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
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
        if (!res.ok) {
            console.log('Failed to send log to Grafana') 
        }
      });
    }
  }
  const logController = new Logger();
  module.exports = logController;