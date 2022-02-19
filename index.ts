import { el } from "redom";

let button: HTMLElement;
el("", [(button = el("button"))]);
// console.log(button);

let container = document.createElement("div");
container.style.display = "flex";
container.style.flexDirection = "column";

let input = document.createElement("textarea");
input.value = `<div class="modal" tabindex="-1">
<div class="modal-dialog">
  <div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title">Modal title</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <p>Modal body text goes here.</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      <button type="button" class="btn btn-primary">Save changes</button>
    </div>
  </div>
</div>
</div>`;
let convertButton = document.createElement("button");
convertButton.innerText = "Convert";

let outputDiv = document.createElement("div");

// Structure
container.appendChild(input);
container.appendChild(convertButton);
container.appendChild(outputDiv);
document.body.appendChild(container);

// Events
convertButton.onclick = () => {
  convertButton.disabled = true;
  let html = input.value;
  console.log(html);
  let doc = new DOMParser().parseFromString(html, "text/xml");

  let redomStr = toRedom(doc);
  outputDiv.innerText = redomStr;

  convertButton.disabled = false;
};
let ele: Element;
let toRedom = (ele: XMLDocument | Element): string => {
  let out = "el(";
  if ("tagName" in ele) out += `"${ele.tagName}",`;
  let isFirstChild = true;
  for (let child of ele.children) {
    if (!isFirstChild) out += ",";
    else isFirstChild = false;

    let childStr = toRedom(child);
    out += childStr;
  }
  out += ")";
  return out;
};

