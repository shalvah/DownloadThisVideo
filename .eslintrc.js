module.exports = {
    "env": {
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "no-await-in-loop": ["warn"],
        "no-case-declarations": ["warn"],
        "no-extra-semi": ["warn"],
        "no-extra-boolean-cast": ["off"],
        "no-inner-declarations": ["off"],
        "no-mixed-spaces-and-tabs": ["off"],
        "no-unused-vars": ["warn"],
    }
};