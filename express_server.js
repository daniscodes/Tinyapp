const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
//const {urlsForUser, isUserEmailInDatabase, generateRandomString} = require('./helpers');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['LHL', 'Tiny', 'App'],
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  asdfqw: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test1")
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("test2")
  }
};

//helper functions
const urlsForUser = function(id, urlDatabase) {
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

const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// root page
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

// return the urls available in the database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// user logout page
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// user login page
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user };
  res.render("login", templateVars);
});

// user login success
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot leave email and password empty`);
  }

  const userData = isUserEmailInDatabase(req.body.email, users);
  if (!userData) {
    return res.status(400).send(`User does not exist in database. Please <a href="/register">Register</a>`);
  }
  // check if the password matches with the one stored in the datbase
  bcrypt.compare(req.body.password, userData.password, (err, result) => {
    if (!result) {
      return res.status(400).send(`The username or password is incorrect. Please <a href="/login">Login</a>`);
    }
    req.session.user_id = userData.id;
    res.redirect('/urls');
  });
});
// user registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('register', templateVars);
});

// user registration routing
app.post('/register', (req, res) => {
  // if bad input 
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot leave email and password empty. Please <a href="/register">Register</a>`);
  }

  // user already exists in datbase
  if (isUserEmailInDatabase(req.body.email, users) !== undefined) {
    return res.status(400).send(`User already exists. Please <a href="/login">Login</a>`);
  }

  // setup new user
  let newUserRandomID = generateRandomString();
  users[newUserRandomID] = {
    id: newUserRandomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = newUserRandomID;
  res.redirect('/urls');
});

// create a new shortened url web form
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_new', templateVars);
});

// show the list of urls that is stored
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Please <a href="/login">Login</a> or <a href="/register">Register</a>');
    return;
  }

  const user = users[req.session.user_id];
  const urls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

// add new url to the database
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send('Unable to create TinyURl. Please <a href="/login">Login</a>');
  }

  if (!req.body.longURL) {
    return res.status(400).send('Invalid URL');
  }

  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${newShortURL}`);
});

// delete the url
app.post('/urls/:id/delete', (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send('Unable to delete TinyURL');
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(403).send('Unable to delete modify another users Tiny URLs');
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// edit the url
app.put('/urls/:id', (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send('Unable to edit Tiny URL');
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(403).send('Unable to delete modify another users Tiny URLs');
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

// re-route to display newly created link
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send('Please <a href="/login">Login</a>');
  }
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Provided tiny URL [${req.params.id}] not found in database`);
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(403).send('Forbidden');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);

});
// redirect to the new web form
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Provided tiny URL [${req.params.id}] not found in database`);
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}`);
});