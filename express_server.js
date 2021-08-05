const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const { getUserByEmail } = require("./helpers");

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000)
    .toString(16)
    .substring(1);
};

const adminpass = "iamr00t";
const hash = bcrypt.hashSync(adminpass, 10);

const users = {
  "218f25": {
    id: "218f25",
    email: "admin@tinyapp.com",
    hashedPassword: hash,
  },
};

const urlsDb = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "218f25",
  },
  "06a844": {
    longURL: "http://www.reddit.com",
    userID: "218f25",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "218f25",
  },
};

const urlsForUser = (id) => {
  const urls = {};
  for (const url in urlsDb) {
    if (urlsDb[url].userID === id) {
      urls[url] = urlsDb[url];
    }
  }
  return urls;
};

app.get("/urls.json", (req, res) => {
  res.json(urlsDb);
});

app.get("/", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

//READ urls
app.get("/urls", (req, res) => {
  let user = req.session.user_id;
  let urls = urlsForUser(user);
  const templateVars = { user: users[user], urls };
  res.render("urls_index", templateVars);
});

//CREATE new url
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userID = req.session.user_id;
  if (userID) {
    urlsDb[shortURL] = { longURL, userID };
    console.log(urlsDb);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  let user = req.session.user_id;
  const templateVars = { user: users[user] };
  res.render("urls_new", templateVars);
});

//Users can only view their own urls
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.user_id;
  const shortURL = req.params.shortURL;
  // if shortURL does not exist, return HTML with message (link does not exist in Db)
  if (!urlsDb[shortURL]) {
    res.status(404).send("😬Not found - invalid link!");
  }
  //display message/prompt if user is not logged in
  if (!user) {
    res.status(403).send("👀Login first!");
  }
  //display message/prompt if URL with matching id does not belong to the user
  if (urlsDb[shortURL].userID !== user) {
    res.status(403).send("❌ Nah, this link does not belong to you fam!");
  }
  const longURL = urlsDb[shortURL].longURL;
  const templateVars = {
    shortURL,
    longURL,
    user: users[user],
  };
  res.render("urls_show", templateVars);
});

// UPDATE existing longURL
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  //only link owners can update
  if (urlsDb[shortURL].userID === userID) {
    urlsDb[shortURL] = { longURL, userID };
    res.redirect("/urls");
  } else {
    res
      .status(403)
      .send("❌ ACCESS DENIED -- this link does not belong to you\n");
  }
});

//DELETE url object from Db
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  //only link owners can delete
  if (urlsDb[shortURL].userID === userID) {
    delete urlsDb[shortURL];
    res.redirect("/urls");
  } else {
    res
      .status(403)
      .send("❌ ACCESS DENIED -- this link does not belong to you\n");
  }
});

//Redirect shortURL -> longURL
app.get("/u/:shortURL", (req, res) => {
  //const id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const url = urlsDb[shortURL];
  if (!url) {
    res.status(404).send("This URL does not exist in the Db!");
    return;
  }
  res.redirect(url.longURL);
});

app.get("/register", (req, res) => {
  const user = req.session.user_id;
  //redirect logged in users.
  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[user],
    };
    res.render("register", templateVars);
  }
});

//Register new user
app.post("/register", (req, res) => {
  console.log(req.body);
  console.log(req.session.user_id);

  const email = req.body.email;
  const password = req.body.password;
  //if email/pass is empty string, respond with 400 status code
  if (email === "" || password === "") {
    res.status(400).send("Email/password cannot be empty!");
  }
  //if email already exists in users, respond with 400 status code..
  if (getUserByEmail(email, users)) {
    res
      .status(400)
      .send("Email already exists in Db - Pick a different email or login!");
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  let id = generateRandomString();
  // add a new user object to global users.
  users[id] = {
    id,
    email,
    hashedPassword,
  };
  //set user_id cookie containing user's newly generated ID
  req.session.user_id = id;
  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let user = req.session.user_id;
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = {
    user: users[user],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //lookup the email address in the user object
  if (!getUserByEmail(email, users)) {
    res.status(403).send("Email not found in Db - Please register!");
  }
  //verify password
  let user = getUserByEmail(email, users);
  let checkPass = bcrypt.compareSync(password, users[user].hashedPassword);
  if (checkPass) {
    req.session.user_id = user;
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password!");
  }
});

app.post("/logout", (req, res) => {
  console.log(req.body);
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`);
});
