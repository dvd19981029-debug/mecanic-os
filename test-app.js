const fs = require('fs');

process.on('uncaughtException', (err) => {
    console.error("UNCAUGHT RUNTIME EXCEPTION:", err.stack || err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error("UNHANDLED REJECTION:", err.stack || err);
    process.exit(1);
});

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

// Mock DOM elements
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this._innerHTML = '';
        this._textContent = '';
        this.classList = {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        };
        this.style = {};
        this.attributes = {};
    }
    
    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = val;
        // Mock parsing simple child nodes if needed
    }
    
    get textContent() { return this._textContent; }
    set textContent(val) { this._textContent = val; }

    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] || null; }
    appendChild(el) { this.children.push(el); }
    addEventListener(event, callback) {}
}

const documentMock = {
    getElementById(id) {
        return new MockElement();
    },
    querySelector(selector) {
        return new MockElement();
    },
    querySelectorAll(selector) {
        return [new MockElement()];
    },
    createElement(tag) {
        return new MockElement(tag);
    },
    addEventListener(event, callback) {
        if (event === 'DOMContentLoaded') {
            setTimeout(callback, 0);
        }
    }
};

const windowMock = {
    addEventListener(event, callback) {},
    location: {
        hash: '#clientes-vehiculos'
    }
};

global.window = windowMock;
global.document = documentMock;
global.localStorage = localStorageMock;

// Load app.js
try {
    const code = fs.readFileSync('frontend/app.js', 'utf8');
    eval(code);
    console.log("SUCCESS: app.js executed without syntax/top-level errors!");
    process.exit(0);
} catch (err) {
    console.error("RUNTIME ERROR IN APP.JS:", err.stack || err);
    process.exit(1);
}
