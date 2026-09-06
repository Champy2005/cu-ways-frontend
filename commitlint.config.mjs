const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Keep governance focused on the Conventional Commit header instead of prose wrapping.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "header-max-length": [2, "always", 100],
    // Conventional Commits requires a type prefix, but not a lowercase subject.
    "subject-case": [0],
  },
};

export default config;
