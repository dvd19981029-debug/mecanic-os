import re

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/utils.js', 'r') as f:
    content = f.read()

safe_class = """
// Tagged template literal for secure HTML escaping to prevent XSS
export class SafeString {
    constructor(val) {
        this.val = val instanceof SafeString ? val.val : String(val);
    }
    toString() {
        return this.val;
    }
    valueOf() {
        return this.val;
    }
    [Symbol.toPrimitive](hint) {
        return this.val;
    }
}

export function safe(val) {
"""

content = content.replace("export function safe(val) {", safe_class)

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/utils.js', 'w') as f:
    f.write(content)
print("SafeString restored")
