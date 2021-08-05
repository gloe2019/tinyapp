const { assert } = require("chai");

const { findUserViaEmail } = require("../helpers.js");

const testUsers = {
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

describe("findUserViaEmail", function () {
  it("should return a user with valid email", function () {
    const user = findUserViaEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert.equal(user, expectedOutput);
  });

  it("should return undefined for a non-existent email", () => {
    const user = findUserViaEmail("totally@wrong.co", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});
