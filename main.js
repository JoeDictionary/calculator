const nearley = require("nearley");
const grammar = require("./grammar.js");
const mathjax = require("mathjax");

MathJax.Hub.Config({
  TeX: {
    Macros: {
      RR: "{\\bf R}",
      bold: ["{\\bf #1}", 1]
    }
  },
  tex2jax: {
    inlineMath: [["$", "$"]]
  }
});

function parse(str) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
    return parser.results;
  } catch (e) {
    return "Syntax Error";
  }
}

const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");

let displayRaw = "";
const display = document.querySelector(".calculator_display");
let dispRender = null;

MathJax.Hub.Queue(function() {
  dispRender = MathJax.Hub.getAllJax("display")[0];
});

function updateDisplayContent(newContent) {
  displayRaw += newContent;
  MathJax.Hub.Queue(["Text", dispRender, displayRaw]);
  console.log(displayRaw);
}

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;

  if (key.matches("button")) {
    if (!action) {
      updateDisplayContent("{"+key.textContent+"}")
    } else {
      if (key.className === "operator") {
        // display.textContent += action;
        updateDisplayContent(action)
      }
      if (action === "decimal") {
        // display.textContent += ".";
        updateDisplayContent(".")
      }
      if (action === "clear") {
        // display.textContent = "";
        displayRaw = "";
        MathJax.Hub.Queue(["Text", dispRender, displayRaw])
      }
      if (action === "frac") {
        // display.textContent += "$1 \\over 2$";
        updateDisplayContent("{1 \\over 2}");
      }
      if (action === "calculate") {
        display.textContent = parse(display.textContent);
      }
    }
  }
});
