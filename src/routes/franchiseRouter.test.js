const request = require('supertest');
const app = require('../service');
const TestUtils = require('../test-utils');

let testUser;

let adminUser;
let adminAuthToken;

beforeAll(async () => {
  const testUtils = new TestUtils();
  testUtils.setupJestDebugging();

  const adminResponse = await testUtils.getAdminUser(app);
  adminAuthToken = adminResponse.authToken;
  adminUser = adminResponse.user;

  const testUserResponse = await testUtils.getAuthUser(app);
  testUser = testUserResponse.user;
});

test('getAllFranchises', async () => {
    const getAllFranchisesRes = await request(app).get('/api/franchise').send(testUser);
    expect(getAllFranchisesRes.status).toBe(200);

    const franchiseList = getAllFranchisesRes.body;
    expect(franchiseList).toBeDefined();
});

function franchiseListIncludesFranchise(franchiseList, franchise) {
    const filteredList = franchiseList.filter((filterFranchise)=> filterFranchise.id === franchise.id && filterFranchise.name === franchise.name && filterFranchise.admins.length == franchise.admins.length);
    const franchiseFoundInList = filteredList.length > 0;
    return franchiseFoundInList;
}

test('listUserFranchises', async () => {
    const testUtils = new TestUtils();

    const franchise1 = ((await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken))).body;
    const franchise2 = ((await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken))).body;
    const franchise3 = ((await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken))).body;

    const getUserFranchiesesRes = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    expect(getUserFranchiesesRes.status).toBe(200);

    const userFranchises = getUserFranchiesesRes.body;
    expect(userFranchises.length).toBe(3);

    // Franchises match what was added, and are in correct order
    expect(franchiseListIncludesFranchise(userFranchises, franchise1)).toBe(true);
    expect(franchiseListIncludesFranchise(userFranchises, franchise2)).toBe(true);
    expect(franchiseListIncludesFranchise(userFranchises, franchise3)).toBe(true);
});

test('createFranchise', async () => {
    const testUtils = new TestUtils();

    const originalFranchisesRes = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    const originalNumFranchises = originalFranchisesRes.body.length;

    const createNewFranchiseRes = (await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken));
    expect(createNewFranchiseRes.status).toBe(200);
    expect(createNewFranchiseRes.body.admins[0].email).toBe(adminUser.email);

    const afterCreationFranchisesRes = await request(app).get(`/api/franchise/${adminUser.id}`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    const afterCreationNumFranchises = afterCreationFranchisesRes.body.length;

    expect(originalNumFranchises).toBe(afterCreationNumFranchises - 1);
});

test('deleteFranchise', async () => {
    const testUtils = new TestUtils();

    // Prepare new franchise to delete
    const newFranchise = ((await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken))).body;

    // Show that the franchise exists
    const getAllFranchisesRes = await request(app).get('/api/franchise').send(testUser);
    const franchiseIdList = getAllFranchisesRes.body.map((franchise) => franchise.id);
    const newFranchiseIsInListOfAllFranchises = franchiseIdList.includes(newFranchise.id);
    expect(newFranchiseIsInListOfAllFranchises).toBe(true);

    // Delete franchise
    const franchiseId = newFranchise.id;
    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    expect(deleteFranchiseRes.status).toBe(200);
    const returnedMessage = deleteFranchiseRes.body.message;
    expect(returnedMessage).toBe('franchise deleted');

    // Ensure it's deleted
    const getAllFranchisesResAfterDeletion = await request(app).get('/api/franchise').send(testUser);
    const afterDeleteFranchiseIdList = getAllFranchisesResAfterDeletion.body.map((franchise) => franchise.id);
    const newFranchiseIsInListOfAllFranchisesAfterDeletion = afterDeleteFranchiseIdList.includes(newFranchise.id);
    expect(newFranchiseIsInListOfAllFranchisesAfterDeletion).toBe(false);
});



test('createStore', async () => {
    const testUtils = new TestUtils();

    const newFranchiseRes = await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken);
    expect(newFranchiseRes.status).toBe(200);
    const franchiseId = newFranchiseRes.body.id;
    const createStoreRes = await testUtils.createNewStoreForAdmin(app, adminAuthToken, franchiseId);
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.franchiseId).toBe(franchiseId);
});

test('deleteStore', async () => {
    const testUtils = new TestUtils();

    const newFranchiseRes = await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken);
    expect(newFranchiseRes.status).toBe(200);
    const franchiseId = newFranchiseRes.body.id;

    const newStoreRes = await testUtils.createNewStoreForAdmin(app, adminAuthToken, franchiseId);
    expect(newStoreRes.status).toBe(200);
    const storeId = newStoreRes.body.id;

    const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseId}/store/${storeId}`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    expect(deleteStoreRes.status).toBe(200);
    const returnedMessage = deleteStoreRes.body.message;
    expect(returnedMessage).toBe('store deleted');
});
