// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".ProseMirror {\n  position: relative;\n}\n\n.ProseMirror {\n  word-wrap: break-word;\n  white-space: pre-wrap;\n  white-space: break-spaces;\n  -webkit-font-variant-ligatures: none;\n  font-variant-ligatures: none;\n  font-feature-settings: \"liga\" 0; /* the above doesn't seem to work in Edge */\n}\n\n.ProseMirror pre {\n  white-space: pre-wrap;\n}\n\n.ProseMirror li {\n  position: relative;\n}\n\n.ProseMirror-hideselection *::selection { background: transparent; }\n.ProseMirror-hideselection *::-moz-selection { background: transparent; }\n.ProseMirror-hideselection { caret-color: transparent; }\n\n.ProseMirror-selectednode {\n  outline: 2px solid #8cf;\n}\n\n/* Make sure li selections wrap around markers */\n\nli.ProseMirror-selectednode {\n  outline: none;\n}\n\nli.ProseMirror-selectednode:after {\n  content: \"\";\n  position: absolute;\n  left: -32px;\n  right: -2px; top: -2px; bottom: -2px;\n  border: 2px solid #8cf;\n  pointer-events: none;\n}\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}