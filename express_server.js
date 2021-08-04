const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000)
    .toString(16)
    .substring(1);
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  "218f25": {
    id: "218f25",
    email: "admin@tinyapp.com",
    password: "purplepeopleeater",
  },
};

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  console.log(req.body);
  //req.body has key-val pair - username: provided username
  // set a cookie named username to the value submitted in req.body.
  let usernameVal = req.body.username;
  res.cookie("username", usernameVal);
  //redirect to /urls
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  console.log(req.body);
  res.clearCookie("username");
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let user = req.cookies.user_id;
  const templateVars = { user: users[user], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = req.cookies.user_id;
  const templateVars = { user: users[user], username: req.cookies.username };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); //Log POST req body
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  let user = req.cookies.user_id;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[user],
  };
  if (!templateVars.shortURL) {
    res.redirect("/urls");
    return;
  }

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let user = req.cookies.user_id;
  const templateVars = {
    user: users[user],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  console.log(req.body);
  // eslint-disable-next-line camelcase
  let user_id = generateRandomString();
  // add a new user object to global users. include id, email, password
  // eslint-disable-next-line camelcase
  users[user_id] = {
    // eslint-disable-next-line camelcase
    id: user_id,
    email: req.body.email,
    password: req.body.password,
  };
  //set user_id cookie containing user's newly generated ID
  res.cookie("user_id", user_id);
  //redirect to urls
  console.log(users);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //ensure you have / before urls!
  console.log(req.params);
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  console.log(req.params);
  //modify longURL
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`);
});
