const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();

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

const isUserInDatabase = function (userEmail) {
  for (const key in users) {
    if (users[key].email === userEmail) {
      return true;
    }
  }
  return false;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));

// root route
app.get("/", (req, res) => {
  res.send("Hello!");
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

// login existing user
app.post('/login', (req, res) => {
  let userData = isUserEmailInDatabase(req.body.email);
  if (userData === false) {
    res.statusCode = 403;
    res.statusMessage = 'Forbidden';
    return res.send(`User Does Not Exist in Database`);
  }

  // check if the password matches with the one stored in the datbase
  if (userData.password !== req.body.password) {
    res.statusCode = 403;
    res.statusMessage = 'Forbidden';
    return res.send(`Incorrect Password`);
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
    res.statusCode = 400;
    res.statusMessage = 'Bad Request';
    return res.send('Email or password is empty!')
  }

  // user already exists
  if (isUserInDatabase(req.body.email)) {
    res.statusCode = 400;
    res.statusMessage = 'Bad Request';
    return res.send(`User already exists`);
  }

    //set up a new user
  let newUserID = generateRandomString();

  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: req.body.password
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// add new url to database
app.post("/urls", (req, res) => {
if (!users[req.cookies.user_id]) {
  res.redirect('/login');
  return;
}

  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
})

//delete URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// edit URL
app.post(`/urls/:id`, (req, res) => {
  urlDatabase[req.params.id] = req.body.updatedURL;
  res.redirect(`/urls/${req.params.id}`);
});

// showing the newly created link
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided Tiny URL[${req.params.id}] not found in database`);
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars)
})

// redirects to new web form
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    return res.send(`Provided Tiny URL [${req.params.id}] not found in database`);
  }
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// server listening on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});