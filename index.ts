import { RedomElement } from "./src/RedomElement";
import { el } from "redom";
import { exampleInput } from "./src/exampleInput";

let input: HTMLTextAreaElement;
let convertButton: HTMLButtonElement;
let outputDiv: HTMLElement;

let container = el("", { style: "display: flex; flex-direction: column" }, [
  (input = el("textarea", { style: "min-height: 100px" })),
  (convertButton = el("button", "Convert")),
  (outputDiv = el("")),
]);
document.body.appendChild(container);

input.value = exampleInput;

// Events
convertButton.onclick = () => {
  convertButton.disabled = true;
  let html = input.value;
  let doc = new DOMParser().parseFromString(html, "text/xml");
  let redomElement = new RedomElement(doc.children[0]);
  outputDiv.innerText = redomElement.toJSON();

  convertButton.disabled = false;
};
