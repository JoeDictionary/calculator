const nearley = require("nearley");
const grammar = require("./grammar.js");

const MQ = MathQuill.getInterface(2)

// Parse function for equals-key
function parse(str) {
  const parser = new Parser(Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
    return parser.results;
  } catch (e) {
    return "Syntax Error";
  }
}



const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");
const display = document.querySelector(".calculator_display");
const mathDisplay = document.querySelector("#mathDisplay")

const mathField = MQ.MathField(mathDisplay, {
    spaceBehavesLikeTab: true,
    sumStartsWithNEquals: true,
    supSubsRequireOperand: true,
    autoCommands : "pi sum",
    // maxDepth: 10,
    // autoOperatorNames: "sin cos"
    handlers:{
      enter: () => console.log(mathField.latex())
    }
})

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;

  if (key.matches("button")) {
    if (!action) {
    } else {
      if (key.className === "operator") {
      }
      if (action === "decimal") {
      }
      if (action === "clear") {
      }
      if (action === "frac") {
      }
      if (action === "calculate") {
      }
    }
  }
});
