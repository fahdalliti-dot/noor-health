const fs = require('fs');
const path = require('path');

// blue-* resolves to the terracotta scale (see tailwind.config.js), but the
// *semantic* meaning is wrong: `text-blue-700` reads as blue, not terracotta,
// and it breaks the "one named token per surface" rule. Use the explicit brand
// name so the intent is legible to anyone reading the class list.
const repl = [
  ['text-blue-700', 'text-terracotta-700'],
  ['bg-blue-50', 'bg-terracotta-50'],
  ['bg-blue-100', 'bg-terracotta-100'],
  ['border-blue-200', 'border-terracotta-200'],
  ['border-blue-100', 'border-terracotta-100'],
  ['hover:bg-blue-100', 'hover:bg-terracotta-100'],
  ['hover:border-blue-200', 'hover:border-terracotta-200'],
  ['hover:bg-blue-50', 'hover:bg-terracotta-50'],
  ['text-blue-600', 'text-terracotta-600'],
  ['bg-blue-600', 'bg-terracotta-600'],
  ['hover:bg-blue-600', 'hover:bg-terracotta-600'],
  ['hover:text-blue-600', 'hover:text-terracotta-600'],
  ['hover:text-blue-700', 'hover:text-terracotta-700'],
  ['hover:bg-blue-700', 'hover:bg-terracotta-700'],
  ['bg-blue-700', 'bg-terracotta-700'],
  ['ring-blue-500', 'ring-terracotta-500'],
  ['focus:ring-blue-500', 'focus:ring-terracotta-500'],
];

function walk(d) {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/\.(tsx|ts|css)$/.test(p)) out.push(p);
  }
  return out;
}

const root = process.argv[2];
const changed = [];
for (const f of walk(root)) {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;
  for (const [a, b] of repl) {
    const rx = new RegExp(a.replace(/[\[\]]/g, '\\$&'), 'g');
    s = s.replace(rx, b);
  }
  if (s !== orig) {
    fs.writeFileSync(f, s);
    changed.push(f);
  }
}

console.log(changed.join('\n'));
console.log(changed.length + ' files changed');