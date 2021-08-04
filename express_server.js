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

const emailLookup = (testEmail) => {
  const keys = Object.keys(users);
  for (const key of keys) {
    if (users[key].email === testEmail) {
      return true;
    }
  }
  return false;
};

app.post("/register", (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  //if email/pass is empty string, respond with 400 status code
  if (email === "" || password === "") {
    res.sendStatus(400);
  }
  //if email already exists in users, respond with 400 status code..
  if (emailLookup(email) === true) {
    res.sendStatus(400);
  }
  console.log(users);
  // eslint-disable-next-line camelcase
  let id = generateRandomString();
  // add a new user object to global users. include id, email, password
  // eslint-disable-next-line camelcase
  users[id] = {
    id,
    email,
    password,
  };
  //set user_id cookie containing user's newly generated ID
  res.cookie("user_id", id);
  //redirect to urls
  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //req.body has email and password. lookup the email address in the user object

  if (emailLookup(email) === false) {
    res.sendStatus(403);
  }
  if (emailLookup(email) === true) {
    //if password matches url database, set user_id cookie with matchin random urls
    for (const user in users) {
      if (password === users[user].password) {
        res.cookie("user_id", user);
        res.redirect("/urls");
      }
    }
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  console.log(req.body);
  res.clearCookie("username");
  res.clearCookie("user_id");
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
