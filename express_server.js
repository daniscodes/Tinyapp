const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require("bcryptjs");

const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = ''

  for (let i = 0; i < 6; i++) {
    str += characters[Math.floor(Math.random() * characters.length)];
  }
  return str;
}

const urlsForUser = function (id) {
  let userURL = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURL[key] = urlDatabase[key];
    }
  }
  return userURL;
};

const isUserInDatabase = function (userEmail) {
  for (const key in users) {
    if (users[key].email === userEmail) {
      return true;
    }
  }
  return false;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur")
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk")
  },
};

app.use(express.urlencoded({ extended: true }));

// root route
app.get("/", (req, res) => {
  if (users[req.cookies.user_id]) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

// available urls in database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// user login page
app.get("/login", (req, res) => {
  if (users[req.cookies.user_id]) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

// login existing user
app.post('/login', (req, res) => {

  // check if the user doesn't exist in the datbase
  if (!req.body.email || !req.body.password) {
    return res.status(400).send(`Cannot leave email and password empty`);
  }

  let userData = isUserInDatabase(req.body.email);
  if (userData === false) {
    return res.status(403).send(`User doesn't exist in database`);
  }

  // check if the password matches with the one stored in the datbase
  if (!bcrypt.compareSync(req.body.password,userData.password)) {
    return res.status(403).send(`Incorrect password`);
  }

  //set the appropriate cookie
  res.cookie('user_id', userData.id);
  res.redirect('/urls');
});

// logout user
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//hello
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

//user registration
app.get('/register', (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
    return;
  }
  const user = users[req.cookies.user_id];
  const templateVars = { user };
  res.render('register', templateVars);
});

app.post("/register", (req, res) => {

  //email/password is empty
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send('Email or password is empty!')
  }

  // user already exists
  if (isUserInDatabase(req.body.email)) {
    return res.status(400).send(`User already exists`);
  }

  //set up a new user
  let newUserID = generateRandomString();

  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  console.log(users);
  res.cookie('user_id', newUserID)
  res.redirect('/urls');
})

//create new shortened url web form
app.get("/urls/new", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.redirect('/login');
    return;
  }
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('urls_new', templateVars);
});

// list of stored urls
app.get("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.status(401).send("Please login or register")
    return;
  }

  let usersURL = urlsForUser(req.cookies.user_id)
  const templateVars = { urls: usersURL, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// add new url to database
app.post("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send("Please login or register");
  }
  if (!req.body.longURL) {
    return res.status(400).send('Invalid URL');
  }

  let id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }
  res.redirect(`/urls/${id}`)
})

//delete URL
app.post("/urls/:id/delete", (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Unable to delete Tiny URL');
  }

  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Unable to modify other users\' URLs');
  }

  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// edit URL
app.post(`/urls/:id`, (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Unable to edit URL')
  }
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Unable to modify other users\' URLs');
  }
  urlDatabase[req.params.id].longURL = req.body.longURL
  res.redirect(`/urls`);
});

// showing the newly created link
app.get("/urls/:id", (req, res) => {
  if (!users[req.cookies.user_id]) {
    return res.status(403).send('Please login');
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`Provided Tiny URL [${req.params.id}] not found in database`);
  }
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(403).send('Forbidden');
  }

  const templateVars =
  {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies.user_id]
  };

  res.render("urls_show", templateVars)
})

// redirects to new web form
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.status(404).send(`Provided Tiny URL [${req.params.id}] not found in database`);
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// server listening on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});