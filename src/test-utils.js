const { DB } = require('./database/database.js');
const Role = require('./model/model.js');

class TestUtils {
    static setupJestDebugging() {
        if (process.env.VSCODE_INSPECTOR_OPTIONS) {
            jest.setTimeout(60 * 1000 * 5); // 5 minutes
        }
    }

    static randomName() {
        return Math.random().toString(36).substring(2, 12);
    }
    
    static async createAdminUser() {
      const password = 'toomanysecrets';
      let user = { password: password, roles: [{ role: Role.Admin }] };
      user.name = this.randomName();
      user.email = user.name + '@admin.com';
    
      await DB.addUser(user);
    
      user.password = password;
      return user;
    }
}

module.exports = TestUtils;