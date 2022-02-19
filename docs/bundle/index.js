(() => {
  // src/RedomElement.ts
  var createTag = (ele) => {
    let tag = "";
    if (ele.tagName && ele.tagName !== "div")
      tag += ele.tagName;
    if (ele.className)
      tag += `.${ele.className}`;
    if (ele.id)
      tag += `#${ele.id}`;
    return tag;
  };
  var createConfig = (ele) => {
    let config = {};
    for (let attribute of ele.attributes) {
      if (attribute.name === "class")
        continue;
      config[attribute.name] = attribute.value;
    }
    return config;
  };
  var RedomElement = class {
    tag;
    config;
    children;
    innerText;
    constructor(ele) {
      this.tag = createTag(ele);
      this.config = createConfig(ele);
      this.children = Array.prototype.map.call(ele.children, (child) => new RedomElement(child));
      this.innerText = ele.innerHTML;
    }
    toJSON() {
      let json = "el(";
      json += JSON.stringify(this.tag);
      let configStr = JSON.stringify(this.config);
      if (configStr !== "{}")
        json += `, ${configStr}`;
      let childrenStrings = this.children.map((x) => x.toJSON());
      if (childrenStrings.length)
        json += `, [${childrenStrings}]`;
      let innerStr = JSON.stringify(this.innerText);
      if (!childrenStrings.length && this.innerText)
        json += `, ${innerStr}`;
      json += ")";
      return json;
    }
  };

  // node_modules/redom/dist/redom.es.js
  function parseQuery(query) {
    var chunks = query.split(/([#.])/);
    var tagName = "";
    var id = "";
    var classNames = [];
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      if (chunk === "#") {
        id = chunks[++i];
      } else if (chunk === ".") {
        classNames.push(chunks[++i]);
      } else if (chunk.length) {
        tagName = chunk;
      }
    }
    return {
      tag: tagName || "div",
      id,
      className: classNames.join(" ")
    };
  }
  function createElement(query, ns2) {
    var ref = parseQuery(query);
    var tag = ref.tag;
    var id = ref.id;
    var className = ref.className;
    var element = ns2 ? document.createElementNS(ns2, tag) : document.createElement(tag);
    if (id) {
      element.id = id;
    }
    if (className) {
      if (ns2) {
        element.setAttribute("class", className);
      } else {
        element.className = className;
      }
    }
    return element;
  }
  function unmount(parent, child) {
    var parentEl = getEl(parent);
    var childEl = getEl(child);
    if (child === childEl && childEl.__redom_view) {
      child = childEl.__redom_view;
    }
    if (childEl.parentNode) {
      doUnmount(child, childEl, parentEl);
      parentEl.removeChild(childEl);
    }
    return child;
  }
  function doUnmount(child, childEl, parentEl) {
    var hooks = childEl.__redom_lifecycle;
    if (hooksAreEmpty(hooks)) {
      childEl.__redom_lifecycle = {};
      return;
    }
    var traverse2 = parentEl;
    if (childEl.__redom_mounted) {
      trigger(childEl, "onunmount");
    }
    while (traverse2) {
      var parentHooks = traverse2.__redom_lifecycle || {};
      for (var hook in hooks) {
        if (parentHooks[hook]) {
          parentHooks[hook] -= hooks[hook];
        }
      }
      if (hooksAreEmpty(parentHooks)) {
        traverse2.__redom_lifecycle = null;
      }
      traverse2 = traverse2.parentNode;
    }
  }
  function hooksAreEmpty(hooks) {
    if (hooks == null) {
      return true;
    }
    for (var key in hooks) {
      if (hooks[key]) {
        return false;
      }
    }
    return true;
  }
  var hookNames = ["onmount", "onremount", "onunmount"];
  var shadowRootAvailable = typeof window !== "undefined" && "ShadowRoot" in window;
  function mount(parent, child, before, replace) {
    var parentEl = getEl(parent);
    var childEl = getEl(child);
    if (child === childEl && childEl.__redom_view) {
      child = childEl.__redom_view;
    }
    if (child !== childEl) {
      childEl.__redom_view = child;
    }
    var wasMounted = childEl.__redom_mounted;
    var oldParent = childEl.parentNode;
    if (wasMounted && oldParent !== parentEl) {
      doUnmount(child, childEl, oldParent);
    }
    if (before != null) {
      if (replace) {
        parentEl.replaceChild(childEl, getEl(before));
      } else {
        parentEl.insertBefore(childEl, getEl(before));
      }
    } else {
      parentEl.appendChild(childEl);
    }
    doMount(child, childEl, parentEl, oldParent);
    return child;
  }
  function trigger(el2, eventName) {
    if (eventName === "onmount" || eventName === "onremount") {
      el2.__redom_mounted = true;
    } else if (eventName === "onunmount") {
      el2.__redom_mounted = false;
    }
    var hooks = el2.__redom_lifecycle;
    if (!hooks) {
      return;
    }
    var view = el2.__redom_view;
    var hookCount = 0;
    view && view[eventName] && view[eventName]();
    for (var hook in hooks) {
      if (hook) {
        hookCount++;
      }
    }
    if (hookCount) {
      var traverse2 = el2.firstChild;
      while (traverse2) {
        var next = traverse2.nextSibling;
        trigger(traverse2, eventName);
        traverse2 = next;
      }
    }
  }
  function doMount(child, childEl, parentEl, oldParent) {
    var hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
    var remount = parentEl === oldParent;
    var hooksFound = false;
    for (var i = 0, list2 = hookNames; i < list2.length; i += 1) {
      var hookName = list2[i];
      if (!remount) {
        if (child !== childEl) {
          if (hookName in child) {
            hooks[hookName] = (hooks[hookName] || 0) + 1;
          }
        }
      }
      if (hooks[hookName]) {
        hooksFound = true;
      }
    }
    if (!hooksFound) {
      childEl.__redom_lifecycle = {};
      return;
    }
    var traverse2 = parentEl;
    var triggered = false;
    if (remount || traverse2 && traverse2.__redom_mounted) {
      trigger(childEl, remount ? "onremount" : "onmount");
      triggered = true;
    }
    while (traverse2) {
      var parent = traverse2.parentNode;
      var parentHooks = traverse2.__redom_lifecycle || (traverse2.__redom_lifecycle = {});
      for (var hook in hooks) {
        parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
      }
      if (triggered) {
        break;
      } else {
        if (traverse2.nodeType === Node.DOCUMENT_NODE || shadowRootAvailable && traverse2 instanceof ShadowRoot || parent && parent.__redom_mounted) {
          trigger(traverse2, remount ? "onremount" : "onmount");
          triggered = true;
        }
        traverse2 = parent;
      }
    }
  }
  function setStyle(view, arg1, arg2) {
    var el2 = getEl(view);
    if (typeof arg1 === "object") {
      for (var key in arg1) {
        setStyleValue(el2, key, arg1[key]);
      }
    } else {
      setStyleValue(el2, arg1, arg2);
    }
  }
  function setStyleValue(el2, key, value) {
    if (value == null) {
      el2.style[key] = "";
    } else {
      el2.style[key] = value;
    }
  }
  var xlinkns = "http://www.w3.org/1999/xlink";
  function setAttrInternal(view, arg1, arg2, initial) {
    var el2 = getEl(view);
    var isObj = typeof arg1 === "object";
    if (isObj) {
      for (var key in arg1) {
        setAttrInternal(el2, key, arg1[key], initial);
      }
    } else {
      var isSVG = el2 instanceof SVGElement;
      var isFunc = typeof arg2 === "function";
      if (arg1 === "style" && typeof arg2 === "object") {
        setStyle(el2, arg2);
      } else if (isSVG && isFunc) {
        el2[arg1] = arg2;
      } else if (arg1 === "dataset") {
        setData(el2, arg2);
      } else if (!isSVG && (arg1 in el2 || isFunc) && arg1 !== "list") {
        el2[arg1] = arg2;
      } else {
        if (isSVG && arg1 === "xlink") {
          setXlink(el2, arg2);
          return;
        }
        if (initial && arg1 === "class") {
          arg2 = el2.className + " " + arg2;
        }
        if (arg2 == null) {
          el2.removeAttribute(arg1);
        } else {
          el2.setAttribute(arg1, arg2);
        }
      }
    }
  }
  function setXlink(el2, arg1, arg2) {
    if (typeof arg1 === "object") {
      for (var key in arg1) {
        setXlink(el2, key, arg1[key]);
      }
    } else {
      if (arg2 != null) {
        el2.setAttributeNS(xlinkns, arg1, arg2);
      } else {
        el2.removeAttributeNS(xlinkns, arg1, arg2);
      }
    }
  }
  function setData(el2, arg1, arg2) {
    if (typeof arg1 === "object") {
      for (var key in arg1) {
        setData(el2, key, arg1[key]);
      }
    } else {
      if (arg2 != null) {
        el2.dataset[arg1] = arg2;
      } else {
        delete el2.dataset[arg1];
      }
    }
  }
  function text(str) {
    return document.createTextNode(str != null ? str : "");
  }
  function parseArgumentsInternal(element, args, initial) {
    for (var i = 0, list2 = args; i < list2.length; i += 1) {
      var arg = list2[i];
      if (arg !== 0 && !arg) {
        continue;
      }
      var type = typeof arg;
      if (type === "function") {
        arg(element);
      } else if (type === "string" || type === "number") {
        element.appendChild(text(arg));
      } else if (isNode(getEl(arg))) {
        mount(element, arg);
      } else if (arg.length) {
        parseArgumentsInternal(element, arg, initial);
      } else if (type === "object") {
        setAttrInternal(element, arg, null, initial);
      }
    }
  }
  function ensureEl(parent) {
    return typeof parent === "string" ? html(parent) : getEl(parent);
  }
  function getEl(parent) {
    return parent.nodeType && parent || !parent.el && parent || getEl(parent.el);
  }
  function isNode(arg) {
    return arg && arg.nodeType;
  }
  var htmlCache = {};
  function html(query) {
    var args = [], len = arguments.length - 1;
    while (len-- > 0)
      args[len] = arguments[len + 1];
    var element;
    var type = typeof query;
    if (type === "string") {
      element = memoizeHTML(query).cloneNode(false);
    } else if (isNode(query)) {
      element = query.cloneNode(false);
    } else if (type === "function") {
      var Query = query;
      element = new (Function.prototype.bind.apply(Query, [null].concat(args)))();
    } else {
      throw new Error("At least one argument required");
    }
    parseArgumentsInternal(getEl(element), args, true);
    return element;
  }
  var el = html;
  html.extend = function extendHtml(query) {
    var args = [], len = arguments.length - 1;
    while (len-- > 0)
      args[len] = arguments[len + 1];
    var clone = memoizeHTML(query);
    return html.bind.apply(html, [this, clone].concat(args));
  };
  function memoizeHTML(query) {
    return htmlCache[query] || (htmlCache[query] = createElement(query));
  }
  function setChildren(parent) {
    var children = [], len = arguments.length - 1;
    while (len-- > 0)
      children[len] = arguments[len + 1];
    var parentEl = getEl(parent);
    var current = traverse(parent, children, parentEl.firstChild);
    while (current) {
      var next = current.nextSibling;
      unmount(parent, current);
      current = next;
    }
  }
  function traverse(parent, children, _current) {
    var current = _current;
    var childEls = new Array(children.length);
    for (var i = 0; i < children.length; i++) {
      childEls[i] = children[i] && getEl(children[i]);
    }
    for (var i$1 = 0; i$1 < children.length; i$1++) {
      var child = children[i$1];
      if (!child) {
        continue;
      }
      var childEl = childEls[i$1];
      if (childEl === current) {
        current = current.nextSibling;
        continue;
      }
      if (isNode(childEl)) {
        var next = current && current.nextSibling;
        var exists = child.__redom_index != null;
        var replace = exists && next === childEls[i$1 + 1];
        mount(parent, child, current, replace);
        if (replace) {
          current = next;
        }
        continue;
      }
      if (child.length != null) {
        current = traverse(parent, child, current);
      }
    }
    return current;
  }
  var ListPool = function ListPool2(View, key, initData) {
    this.View = View;
    this.initData = initData;
    this.oldLookup = {};
    this.lookup = {};
    this.oldViews = [];
    this.views = [];
    if (key != null) {
      this.key = typeof key === "function" ? key : propKey(key);
    }
  };
  ListPool.prototype.update = function update(data, context) {
    var ref = this;
    var View = ref.View;
    var key = ref.key;
    var initData = ref.initData;
    var keySet = key != null;
    var oldLookup = this.lookup;
    var newLookup = {};
    var newViews = new Array(data.length);
    var oldViews = this.views;
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var view = void 0;
      if (keySet) {
        var id = key(item);
        view = oldLookup[id] || new View(initData, item, i, data);
        newLookup[id] = view;
        view.__redom_id = id;
      } else {
        view = oldViews[i] || new View(initData, item, i, data);
      }
      view.update && view.update(item, i, data, context);
      var el2 = getEl(view.el);
      el2.__redom_view = view;
      newViews[i] = view;
    }
    this.oldViews = oldViews;
    this.views = newViews;
    this.oldLookup = oldLookup;
    this.lookup = newLookup;
  };
  function propKey(key) {
    return function(item) {
      return item[key];
    };
  }
  function list(parent, View, key, initData) {
    return new List(parent, View, key, initData);
  }
  var List = function List2(parent, View, key, initData) {
    this.View = View;
    this.initData = initData;
    this.views = [];
    this.pool = new ListPool(View, key, initData);
    this.el = ensureEl(parent);
    this.keySet = key != null;
  };
  List.prototype.update = function update2(data, context) {
    if (data === void 0)
      data = [];
    var ref = this;
    var keySet = ref.keySet;
    var oldViews = this.views;
    this.pool.update(data, context);
    var ref$1 = this.pool;
    var views = ref$1.views;
    var lookup = ref$1.lookup;
    if (keySet) {
      for (var i = 0; i < oldViews.length; i++) {
        var oldView = oldViews[i];
        var id = oldView.__redom_id;
        if (lookup[id] == null) {
          oldView.__redom_index = null;
          unmount(this, oldView);
        }
      }
    }
    for (var i$1 = 0; i$1 < views.length; i$1++) {
      var view = views[i$1];
      view.__redom_index = i$1;
    }
    setChildren(this, views);
    if (keySet) {
      this.lookup = lookup;
    }
    this.views = views;
  };
  List.extend = function extendList(parent, View, key, initData) {
    return List.bind(List, parent, View, key, initData);
  };
  list.extend = List.extend;
  var Place = function Place2(View, initData) {
    this.el = text("");
    this.visible = false;
    this.view = null;
    this._placeholder = this.el;
    if (View instanceof Node) {
      this._el = View;
    } else if (View.el instanceof Node) {
      this._el = View;
      this.view = View;
    } else {
      this._View = View;
    }
    this._initData = initData;
  };
  Place.prototype.update = function update3(visible, data) {
    var placeholder = this._placeholder;
    var parentNode = this.el.parentNode;
    if (visible) {
      if (!this.visible) {
        if (this._el) {
          mount(parentNode, this._el, placeholder);
          unmount(parentNode, placeholder);
          this.el = getEl(this._el);
          this.visible = visible;
        } else {
          var View = this._View;
          var view = new View(this._initData);
          this.el = getEl(view);
          this.view = view;
          mount(parentNode, view, placeholder);
          unmount(parentNode, placeholder);
        }
      }
      this.view && this.view.update && this.view.update(data);
    } else {
      if (this.visible) {
        if (this._el) {
          mount(parentNode, placeholder, this._el);
          unmount(parentNode, this._el);
          this.el = placeholder;
          this.visible = visible;
          return;
        }
        mount(parentNode, placeholder, this.view);
        unmount(parentNode, this.view);
        this.el = placeholder;
        this.view = null;
      }
    }
    this.visible = visible;
  };
  var Router = function Router2(parent, Views, initData) {
    this.el = ensureEl(parent);
    this.Views = Views;
    this.initData = initData;
  };
  Router.prototype.update = function update4(route, data) {
    if (route !== this.route) {
      var Views = this.Views;
      var View = Views[route];
      this.route = route;
      if (View && (View instanceof Node || View.el instanceof Node)) {
        this.view = View;
      } else {
        this.view = View && new View(this.initData, data);
      }
      setChildren(this.el, [this.view]);
    }
    this.view && this.view.update && this.view.update(data, route);
  };
  var ns = "http://www.w3.org/2000/svg";
  var svgCache = {};
  function svg(query) {
    var args = [], len = arguments.length - 1;
    while (len-- > 0)
      args[len] = arguments[len + 1];
    var element;
    var type = typeof query;
    if (type === "string") {
      element = memoizeSVG(query).cloneNode(false);
    } else if (isNode(query)) {
      element = query.cloneNode(false);
    } else if (type === "function") {
      var Query = query;
      element = new (Function.prototype.bind.apply(Query, [null].concat(args)))();
    } else {
      throw new Error("At least one argument required");
    }
    parseArgumentsInternal(getEl(element), args, true);
    return element;
  }
  svg.extend = function extendSvg(query) {
    var clone = memoizeSVG(query);
    return svg.bind(this, clone);
  };
  svg.ns = ns;
  function memoizeSVG(query) {
    return svgCache[query] || (svgCache[query] = createElement(query, ns));
  }

  // src/exampleInput.ts
  var exampleInput = `<div class="modal" tabindex="-1">
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

  // index.ts
  var input;
  var convertButton;
  var outputDiv;
  var container = el("", { style: "display: flex; flex-direction: column" }, [
    input = el("textarea", { style: "min-height: 100px" }),
    convertButton = el("button", "Convert"),
    outputDiv = el("")
  ]);
  document.body.appendChild(container);
  input.value = exampleInput;
  convertButton.onclick = () => {
    convertButton.disabled = true;
    let html2 = input.value;
    let doc = new DOMParser().parseFromString(html2, "text/xml");
    let redomElement = new RedomElement(doc.children[0]);
    outputDiv.innerText = redomElement.toJSON();
    convertButton.disabled = false;
  };
})();
//# sourceMappingURL=index.js.map
