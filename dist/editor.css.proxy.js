// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".container {\n  max-width: 1200px;\n  margin: auto;\n}\n\n#editor {\n  background: white;\n  color: black;\n  background-clip: padding-box;\n  border-radius: 4px;\n  border: 2px solid rgba(0, 0, 0, 0.2);\n  padding: 5px 0;\n}\n\n.ProseMirror {\n  padding: 4px 8px 4px 14px;\n  line-height: 1.2;\n  outline: none;\n}\n\n.ProseMirror-menubar {\n  min-height: 1rem !important;\n}\n\n.cm-wrap {\n  border: 2px solid #eee;\n  height: auto;\n  margin-bottom: 0.7rem;\n}\n.cm-wrap pre {\n  white-space: pre !important;\n}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}