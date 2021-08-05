const findUserViaEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return null;
};

module.exports = { findUserViaEmail };
