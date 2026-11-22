// Plans are stored entity-escaped by the server (security middleware), so decode, then keep only
// basic formatting tags. shortcut: tag allowlist, not a full sanitizer; swap for DOMPurify if plans ever hold richer markup.
const ALLOWED = new Set(['H2', 'H3', 'H4', 'P', 'BR', 'UL', 'OL', 'LI', 'B', 'STRONG', 'I', 'EM', 'U', 'DIV', 'SPAN', 'HR']);

export const planToSafeHtml = (stored: string): string => {
  if (!stored) return '';
  const ta = document.createElement('textarea');
  let html = stored;
  for (let i = 0; i < 3 && /&(lt|gt|amp|quot|#39|#x27);/i.test(html); i++) {
    ta.innerHTML = html;
    html = ta.value;
  }
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const clean = (node: Element) => {
    Array.from(node.children).forEach(child => {
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      Array.from(child.attributes).forEach(a => child.removeAttribute(a.name));
      clean(child);
    });
  };
  doc.body.querySelectorAll('script,style,iframe,object,embed').forEach(n => n.remove());
  clean(doc.body);
  return doc.body.innerHTML;
};
