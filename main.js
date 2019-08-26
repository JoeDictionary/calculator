// const Lex = require("./node_modules/lex")
console.log("OYYYY");

// const calculator = document.querySelector(".calculator")
// const keys = calculator.querySelector(".calculator_keys")
const test = document.querySelector(".calculator_keys")
console.log(test);

test.addEventListener("click", event => {
  const key = event.target
  const action = key.dataset.action
if (key.matches("button")) {
  if (!action) {
    console.log("number key");
  } else console.log(action);
}
})