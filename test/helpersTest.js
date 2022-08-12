const { assert } = require('chai');
const { isUserEmailInDatabase } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('isUserEmailInDatabase', function() {
  it('should return a user with valid email', function() {
    const user = isUserEmailInDatabase('user@example.com', testUsers);
    const expectedUserID = 'userRandomID';
    assert.strictEqual(user.id, expectedUserID);
  });
  it('should return undefined with non-existant email', function() {
    const user = isUserEmailInDatabase('asdf@example.com', testUsers);
    assert.isUndefined(user);
  });
});

