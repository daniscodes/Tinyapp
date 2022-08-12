const urlsForUser = function (id, urlDatabase) {
  const userURL = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURL[key] = urlDatabase[key];
    }
  }
  return userURL;
};

const isUserEmailInDatabase = function(email, database) {
  const values = Object.values(database);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
};

const generateRandomString = function () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = {
  urlsForUser,
  isUserEmailInDatabase,
  generateRandomString
};