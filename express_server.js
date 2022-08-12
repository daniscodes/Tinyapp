const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['LHL', 'Tiny', 'App'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

const isUserEmailInDatabase = function(userEmail) {
  for (const key in users) {
    if (users[key].email === userEmail) {
      return users[key];
    }
  }
  return false;
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
});

// return the urls available in the database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// user logout page
app.post('/logout', (req, res) => {
  eq.session = null;
  res.redirect('/urls');
});
// user login page
app.get("/login", (req, res) => {
  // !!! subject to change
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("login", templateVars);
});

// user login routing
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot leave email and password empty`);
  }

  let userData = isUserEmailInDatabase(req.body.email);
  if (userData === false) {
    return res.status(403).send(`User does not exist in database`);
  }
  // check if the password matches with the one stored in the datbase
  if (!bcrypt.compareSync(req.body.password,userData.password)) {
    return res.status(403).send(`Incorrect password`);
  }
  //set the appropriate cookie
  res.sesssion.user_id = userData.id;
  res.redirect('/urls');
});
// user registration page
app.get('/register', (req,res) => {
  // !!! subject to change
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const templateVars = {user: users[req.session.user_id]};
  res.render('register', templateVars);
});

// user registration routing
app.post('/register', (req,res)=>{
  // if bad input 
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send(`Cannot leave email and password empty`);
  }
  
  // user already exists in datbase
  if (isUserEmailInDatabase(req.body.email) !== false) {
    return res.status(400).send(`User already exists`);
  }
  
  // setup new user
  let newUserRandomID = generateRandomString();
  users[newUserRandomID] = {
    id: newUserRandomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  res.cookie('user_id', newUserRandomID);
  res.redirect('/urls');
});

// create a new shortened url web form
app.get('/urls/new', (req,res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }

  const templateVars = {user: users[req.session.user_id]};
  res.render('urls_new', templateVars);
});

// show the list of urls that is stored
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Please login or register');
    return;
  }

  let usersURL = urlsForUser(req.session.user_id);
  const templateVars = { urls: usersURL, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// add new url to the database
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send('Unable to create TinyURl. Please login');
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
app.post('/urls/:id/delete', (req, res)=> {
  if (!req.session.user_id) {
    return res.status(403).send('Unable to delete TinyURL');
  } 

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(403).send('Unable to delete modify another users Tiny URLs');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// edit the url
app.post('/urls/:id', (req, res) => {
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
    return res.status(403).send('Please Login');
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