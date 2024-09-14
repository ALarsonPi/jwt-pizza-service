const { DB } = require('./database/database.js');
const request = require('supertest');
const { Role } = require('./model/model.js');

class TestUtils {
    setupJestDebugging() {
        if (process.env.VSCODE_INSPECTOR_OPTIONS) {
            jest.setTimeout(60 * 1000 * 5); // 5 minutes
        }
    }
    
    randomName() {
        return Math.random().toString(36).substring(2, 12);
    }

    getRandomIndex(arraySize) {
        return Math.floor(Math.random() * arraySize);
    }

    async getAuthUser(app) {
        const defaultTestUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
        defaultTestUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
        const registerRes = await request(app).post('/api/auth').send(defaultTestUser);
        const testUserAuthToken = registerRes.body.token;
        const returnObj = {authToken: testUserAuthToken, user: defaultTestUser};
        return returnObj;
    }

    async getAdminUser(app) {
        const adminRole = Role.Admin;
        const adminPassword = 'toomanysecrets';
        let user = { password: adminPassword, roles: [{ role: adminRole }] };
        user.name = this.randomName();
        user.email = user.name + '@admin.com';

        const addUserResponse = await DB.addUser(user);
        addUserResponse.password = adminPassword;

        const userResponse = await request(app).put('/api/auth').send(addUserResponse);
        const testUserAuthToken = userResponse.body.token;
        const returnObj = {authToken: testUserAuthToken, user: addUserResponse};
        return returnObj;
    }

    async createNewFranchiseForAdmin(app, adminUser, adminAuthToken) {
        const testUtils = new TestUtils();
        const newFranchiseName = testUtils.randomName();
        const newFranchise = {"name": newFranchiseName, "admins": [{"email": adminUser.email}]};
        return await request(app).post(`/api/franchise`).set('Authorization', `Bearer ${adminAuthToken}`).send(newFranchise);
    }
    
    async createNewStoreForAdmin(app, adminAuthToken, franchiseId) {
        const testUtils = new TestUtils();
        const franchiseName = testUtils.randomName();
        const newStore = {"franchiseId": franchiseId, "name": franchiseName};
        return await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(newStore);
    }
}

module.exports = TestUtils