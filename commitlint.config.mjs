const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    // Conventional Commits requires a type prefix, but not a lowercase subject.
    "subject-case": [0],
  },
};

export default config;
