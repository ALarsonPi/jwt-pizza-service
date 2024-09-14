const request = require('supertest');
const app = require('../service');
const TestUtils = require('../test-utils');

let testUser;
let testAuthToken;

let adminUser;
let adminAuthToken;

beforeAll(async () => {
  const testUtils = new TestUtils();
  testUtils.setupJestDebugging();

  const adminResponse = await testUtils.getAdminUser(app);
  adminAuthToken = adminResponse.authToken;
  adminUser = adminResponse.user;

  const testUserResponse = await testUtils.getAuthUser(app);
  testAuthToken = testUserResponse.authToken;
  testUser = testUserResponse.user;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(password).toBeDefined();
  expect(loginRes.body.user).toMatchObject(user);
});

test('logout', async () => {
  const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testAuthToken}`).send(testUser);
  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe('logout successful');
});

test('updateUser', async () => {
  const updateUserRes = await request(app).put(`/api/auth/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`).set('Content-Type', 'application/json').send(adminUser);
  expect(updateUserRes.status).toBe(200);

  const { password, ...adminUserWithoutPassword } = adminUser;
  expect(password).toBeDefined();
  expect(updateUserRes.body).toMatchObject(adminUserWithoutPassword);
});
