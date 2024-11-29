const config = require('./config.js');
const os = require('os');
const fetch = require('node-fetch');

class Metrics {
  constructor(period = 1000) {
    console.log("Resetting totals again");
    this.totalRequests = 0;
    this.totalGetRequests = 0;
    this.totalPutRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;

    this.sendMetricsPeriodically(period);
  }

  requestTracker = (req, _, next) => {
    console.log(`Received ${req.method} request`);
    this.totalRequests++;
    switch (req.method) {
      case 'GET':
        this.totalGetRequests++;
        break;
      case 'POST':
        this.totalPostRequests++;
        break;
      case 'DELETE':
        this.totalDeleteRequests++;
        break;
      case 'PUT':
        this.totalPutRequests++;
        break;
    }

    next();
  };

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const metricsData = [
          `hardware,source=${config.metrics.grafanaSource} cpuUsagePercentage=${this.getCpuUsagePercentage()},memoryUsagePercentage=${this.getMemoryUsagePercentage()}`,
          `requests,source=${config.metrics.grafanaSource} total=${this.totalRequests},get=${this.totalGetRequests},post=${this.totalPostRequests},delete=${this.totalDeleteRequests},put=${this.totalPutRequests}`
        ];
        const metricsString = metricsData.join('\n');
        this.sendMetricToGrafana(metricsString);
      } catch (error) {
        console.error('Error sending metrics:', error);
      }
    }, period);

    timer.unref();
  }

  sendMetricToGrafana(metricsString) {
    const payload = `${metricsString}`;
    try {
      fetch(config.metrics.grafanaPostUrl, {
        method: 'POST',
        body: payload,
        headers: {
          'Authorization': `Bearer ${config.metrics.grafanaUserId + ':' + config.metrics.grafanaApiKey}`,
          'Content-Type': 'text/plain',
        },
      })
        .then((response) => {
          if (!response.ok) {
            console.error('Failed to push metrics data to Grafana', response);
          } else {
            console.log('Metrics successfully pushed:', metricsString);
          }
        })
        .catch((error) => {
          console.error('Error pushing metrics:', error);
        });
    } catch (e) {
      console.log("Err", e);
    }
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return (cpuUsage * 100).toFixed(2);
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return ((usedMemory / totalMemory) * 100).toFixed(2);
  }
}

const metrics = new Metrics();
module.exports = metrics;
