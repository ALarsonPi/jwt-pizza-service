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

test('getMenu', async () => {
    const getMenuRes = await request(app).get('/api/order/menu').send(testUser);
    expect(getMenuRes.status).toBe(200);
    const menuList = getMenuRes.body;
    expect(menuList.length).toBeGreaterThan(0);

    // Every menu should have an image, a title, a price, and a description
    menuList.forEach(menu => {
        expect(menu.description).toBeDefined();
        expect(menu.image).toBeDefined();
        expect(menu.title).toBeDefined();
        expect(menu.price).toBeDefined();

        // Ensure normal price range
        expect(menu.price).toBeGreaterThan(0);
        expect(menu.price).toBeLessThan(50);
    });

});

async function addItemToMenu() {
    const testUtils = new TestUtils();
    const newMenuItemTitle = testUtils.randomName();
    const newMenuItem = { "title": newMenuItemTitle, "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 };
    return await request(app).put(`/api/order/menu`).set('Authorization', `Bearer ${adminAuthToken}`).send(newMenuItem);
}

async function getRandomItemsFromMenu(numItems) {
    const getMenuRes = await request(app).get('/api/order/menu').send(adminUser);
    expect(getMenuRes.status).toBe(200);
    const menuList = getMenuRes.body;
    const testUtils = new TestUtils();
    const chosenItemsList = [];
    for(let i = 0; i < numItems; i++) {
        const randomIndex = testUtils.getRandomIndex(menuList.length);
        const chosenItem = menuList[randomIndex];
        chosenItemsList.push(chosenItem)
    }
    const mappedMenuItems = chosenItemsList.map((item)=> {
        return {"menuId": item.id, "description": item.description, "price": item.price };
    });
    return mappedMenuItems;
}

test('addItemToMenu', async () => {
    const getMenuResBefore = await request(app).get('/api/order/menu').send(testUser);
    expect(getMenuResBefore.status).toBe(200);

    const addToMenuRes = await addItemToMenu();
    expect(addToMenuRes.status).toBe(200);

    const getMenuResAfter = await request(app).get('/api/order/menu').send(testUser);
    expect(getMenuResAfter.status).toBe(200);

    // Number of menus should have gone up by one
    expect(getMenuResBefore.body.length).toBe(getMenuResAfter.body.length - 1);
});

async function createNewOrder() {
    const testUtils = new TestUtils();

    const newFranchiseRes = await testUtils.createNewFranchiseForAdmin(app, adminUser, adminAuthToken);
    const franchiseId = newFranchiseRes.body.id;

    const newStoreRes = await testUtils.createNewStoreForAdmin(app, adminAuthToken, franchiseId);
    const storeId = newStoreRes.body.id;

    const chosenMenuItems = await getRandomItemsFromMenu(3);
    const newUserOrder = {"franchiseId": franchiseId, "storeId": storeId, "items": chosenMenuItems};
    const addNewOrderRes = await request(app).post(`/api/order`).set('Authorization', `Bearer ${adminAuthToken}`).send(newUserOrder);
    return addNewOrderRes;
}

test('createOrderForUser', async () => {
    const addNewOrderRes = await createNewOrder();
    expect(addNewOrderRes.status).toBe(200);
});

test('getOrderForUser', async () => {
    const addNewOrderRes = await createNewOrder();
    expect(addNewOrderRes.status).toBe(200);

    const getOrderRes = await request(app).get(`/api/order`).set('Authorization', `Bearer ${adminAuthToken}`).send();
    expect(getOrderRes.status).toBe(200);
});
