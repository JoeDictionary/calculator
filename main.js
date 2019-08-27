// const Lex = require("./node_modules/lex")
console.log("OYYYY");

const display = document.querySelector(".calculator_display");
const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;
  if (key.matches("button")) {
    if (!action) {
      console.log("number key");
    } else console.log(action);
  }
});
