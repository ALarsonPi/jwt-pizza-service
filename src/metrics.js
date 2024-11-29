const config = require('./config.js');
const os = require('os');
const fetch = require('node-fetch');

class Metrics {
  constructor(period = 1000) {
    this.totalRequests = 0;
    this.totalGetRequests = 0;
    this.totalPutRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;

    this.activeUsers = 0;
    this.successfulLogins = 0;
    this.successfulLogouts = 0;
    this.unsuccessfulAuthCalls = 0;

    this.pizzasSold = 0;
    this.creationFailures = 0;
    this.totalRevenue = 0;

    this.creationLatencyInSeconds = 0;
    this.serviceLatencyInMilliseconds = 0;

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

  latencyTracker = (req, res, next) => {
    if (req.path === '/api/order' && req.method == 'POST') {
      const start = Date.now();
      req.timingData = { start, fetchTime: null };
      res.on('finish', () => {
        const totalTime = Date.now() - start;
        console.log(`Total time for ${req.method} ${req.originalUrl}: ${totalTime}ms`);
        if (req.timingData.fetchTime !== null) {
          console.log(`Fetch call took: ${req.timingData.fetchTime}ms`);
        }
      });
    }
    next();
  }

  purchaseTracker = (req, res, next) => {
    if (req.path === '/api/order' && req.method == 'POST') {
      this._handleOnFinishOrderCall(req, res);
    }
    next();
  }

  _handleOnFinishOrderCall(req, res) {
    res.on('finish', () => { 
      if (res.statusCode === 200) {
        const { items } = req.body;
        let totalOrderValue = 0;
        items.forEach(item => {
          totalOrderValue += item.price;
        });
        this.totalRevenue += totalOrderValue;
        this.pizzasSold += items.length;
      } else {
        this.creationFailures++;
      }
    });
  }

  authTracker = (req, res, next) => {
    if (req.path === '/api/auth') {
      this._handleOnFinishAuthCall(req, res);
    }
    next();
  }

  _handleOnFinishAuthCall(req, res) {
    res.on('finish', () => {
      if (res.statusCode === 200) {
        if (req.method === 'PUT') {
          this.activeUsers++;
          this.successfulLogins++;
        } else if (req.method === 'DELETE') {
          this.activeUsers--;
          this.successfulLogouts++;
        }
      } else {
        this.unsuccessfulAuthCalls++;
        console.log('API call to /api/auth failed with status:', res.statusCode);
      }
    });
  }

  sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const metricsData = [
          `hardware,source=${config.metrics.grafanaSource} cpuUsagePercentage=${this.getCpuUsagePercentage()},memoryUsagePercentage=${this.getMemoryUsagePercentage()}`,
          `requests,source=${config.metrics.grafanaSource} total=${this.totalRequests},get=${this.totalGetRequests},post=${this.totalPostRequests},delete=${this.totalDeleteRequests},put=${this.totalPutRequests}`,
          `auth,source=${config.metrics.grafanaSource} numActive=${this.activeUsers},successfulLogins=${this.successfulLogins},successfulLogouts=${this.successfulLogouts},unsuccessfulAuthCalls=${this.unsuccessfulAuthCalls}`,
          `purchase,source=${config.metrics.grafanaSource} pizzasSold=${this.pizzasSold},creationFailures=${this.creationFailures},totalRevenue=${this.totalRevenue}`,
          `latency,source=${config.metrics.grafanaSource} creationLatency=${this.creationLatencyInSeconds},serviceLatency=${this.serviceLatencyInMilliseconds}`
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
