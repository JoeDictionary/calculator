const nearley = require("nearley");
const grammar = require("./grammar.js");
// console.log("OYYYY");

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

try {
  parser.feed("123")
  console.log(parser.results);
} catch (e) {
  console.log(e.message);
}

// const display = document.querySelector(".calculator_display");
// const calculator = document.querySelector(".calculator");
// const keys = calculator.querySelector(".calculator_keys");

// keys.addEventListener("click", event => {
//   const key = event.target;
//   const action = key.dataset.action;
//   if (key.matches("button")) {
//     if (!action) {
//       console.log("number key");
//     } else console.log(action);
//   }
// });
