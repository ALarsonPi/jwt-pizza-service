const { metrics } = require('./config.js');
const app = require('./service.js');

const port = process.argv[2] || 3000;
app.use(metrics.requestTracker);
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
