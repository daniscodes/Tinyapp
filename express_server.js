const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();

const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

function generateRandomString() {
  const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = ''

  for(let i = 0; i < 6; i++){
    str += characters[Math.floor(Math.random() * characters.length)];
  }
  return str;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// login existing user
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// logout user
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//hello
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

//create new shortened url web form
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render('urls_new', templateVars);
});

// list of stored urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,  username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// add new url to database
app.post("/urls", (req, res) => {
  const id = generateRandomString();
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

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]  };
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