let createTag = (ele: Element): string => {
  let tag = "";
  if (ele.tagName && ele.tagName !== "div") tag += ele.tagName;
  if (ele.className) tag += `.${ele.className}`;
  if (ele.id) tag += `#${ele.id}`;
  return tag;
};

let createConfig = (ele: Element): any => {
  let config = {};
  for (let attribute of ele.attributes) {
    if (attribute.name === "class") continue;
    config[attribute.name] = attribute.value;
  }
  return config;
};

export class RedomElement {
  private tag: string;
  private config: any;
  private children: RedomElement[];
  private innerText: string;

  constructor(ele: Element) {
    this.tag = createTag(ele);
    this.config = createConfig(ele);
    this.children = Array.prototype.map.call(
      ele.children,
      (child: Element) => new RedomElement(child)
    );
    this.innerText = ele.innerHTML;
  }

  toJSON() {
    let json = "el(";
    json += JSON.stringify(this.tag);

    let configStr = JSON.stringify(this.config);
    if (configStr !== "{}") json += `, ${configStr}`;

    let childrenStrings = this.children.map((x) => x.toJSON());
    if (childrenStrings.length) json += `, [${childrenStrings}]`;

    let innerStr = JSON.stringify(this.innerText);
    if (!childrenStrings.length && this.innerText) json += `, ${innerStr}`;

    json += ")";

    return json;
  }
}