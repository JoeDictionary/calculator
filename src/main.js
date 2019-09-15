const nearley = require("nearley");
const grammar = require("./grammar.js");

const MQ = MathQuill.getInterface(2);

const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");
const display = document.querySelector(".calculator_display");
const mathDisplay = document.querySelector("#mathDisplay");

const mathField = MQ.MathField(mathDisplay, {
  spaceBehavesLikeTab: true,
  sumStartsWithNEquals: true,
  supSubsRequireOperand: true,
  autoCommands: "pi sum",
  // maxDepth: 10,
  // autoOperatorNames: "sin cos"
  handlers: {
    enter: () => console.log(mathField.latex())
  }
});

mathField.focus();

// Parse function for equals-key
function parse(str) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
    return parser.results;
  } catch (e) {
    return "Syntax Error";
  }
}

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;

  if (key.matches("button")) {
    if (!action) {
      mathField.write(key.textContent);
      console.log(mathField.latex());
      mathField.focus();
    } else {
      if (action != "clear" && action != "calculate") {
        mathField.write(action);
        console.log(mathField.latex());
        mathField.focus();
        if (key.dataset.backspace === "1") {
          mathField.keystroke("Left")
        } else {
          if (key.dataset.backspace === "2") {
            mathField.keystroke("Left")
            mathField.keystroke("Left")
          }
        }
      } else {
        if (action === "clear") {
          mathField.latex("");
          mathField.focus();
        }
        if (action === "calculate") {
          mathField.latex(parse(mathField.latex()));
          mathField.focus();
        }
      }
    }
  }
});
