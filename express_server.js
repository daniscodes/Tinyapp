const express = require("express");
const app = express();
const PORT = 8080;

function generateRandomString() {
  const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = ''

  for(let i = 0; i < 6; i++){
    str += characters[Math.floor(Math.random() * characters.length)];
  }
  return str;
}

app.set("view engine", "ejs");

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req,res) => {
  
  res.render('register', templateVars);
})

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars)
})

app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");

  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`)
})

app.get("/urls/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  if (longURL){
  res.redirect(longURL);
  } else {
    res.statusCpde = 404;
    res.send(`<h2>404 Not Found</h2>`)
  }
});

app.post(`/urls/:id`, (req, res) => {
  const id = req.params.id;
  urlDatabase[req.params.id] = req.body.updatedURL;
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
})