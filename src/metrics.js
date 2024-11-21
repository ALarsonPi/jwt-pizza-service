const config = require('./config.json');
const os = require('os');
const fetch = require('node-fetch');

class Metrics {
  constructor(period = 60000) {
    this.totalRequests = 0;
    this.totalGetRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;

    this.sendMetricsPeriodically(period);
  }

  requestTracker = (req, _, next) => {
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
    }

    next();
  };

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const metricsData = [];
        metricsData.push(this.getCpuUsagePercentage());
        metricsData.push(this.getMemoryUsagePercentage());
        metricsData.push(`totalRequests=${this.totalRequests}`);
        metricsData.push(`totalGetRequests=${this.totalGetRequests}`);
        metricsData.push(`totalPostRequests=${this.totalPostRequests}`);
        metricsData.push(`totalDeleteRequests=${this.totalDeleteRequests}`);

        const metricsString = metricsData.join('\n');
        this.sendMetricToGrafana(metricsString);
      } catch (error) {
        console.error('Error sending metrics:', error);
      }
    }, period);

    timer.unref();
  }

  sendMetricToGrafana(metricsString) {
    const payload = `${metricsString},source=${config.source}`;

    fetch(config.url, {
      method: 'POST',
      body: payload,
      headers: {
        'Authorization': `Bearer ${config.userId}:${config.apiKey}`,
        'Content-Type': 'text/plain',
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log('Metrics successfully pushed:', metricsString);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return `cpuUsagePercentage=${(cpuUsage * 100).toFixed(2)}`;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return `memoryUsagePercentage=${((usedMemory / totalMemory) * 100).toFixed(2)}`;
  }
}

const metrics = new Metrics();
module.exports = metrics;
