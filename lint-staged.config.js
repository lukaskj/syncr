module.exports = {
  "*.{ts,js}": [() => "tsc --noEmit", "eslint --fix"],
};
