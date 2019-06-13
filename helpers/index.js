const Helpers = {};

Helpers.parseUser = user => {
  console.log(typeof user);
  user = user.toObject();
  if (user.role == "admin") {
    delete user.students;
    delete user.trainers;
    delete user.instructors;
    delete user.courses;
  } else if (user.role == "manager") {
    delete user.students;
    delete user.trainers;
    delete user.instructors;
    delete user.courses;
  }
  delete user.password;
  delete user.__v;
  return user;
};
Helpers.capitalize = st => {
  return st.charAt(0).toUpperCase() + st.slice(1);
};

Helpers.kebab = string => {
  if (string) {
    string = string
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  return string;
};

module.exports = Helpers;
