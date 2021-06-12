import {Selection, TextSelection} from "../_snowpack/pkg/prosemirror-state.js";
import {Schema} from "../_snowpack/pkg/prosemirror-model.js";
import {nodes as basicNodes, marks} from "../_snowpack/pkg/prosemirror-schema-basic.js";
import {exitCode} from "../_snowpack/pkg/prosemirror-commands.js";
import {EditorState as CMState} from "../_snowpack/pkg/@codemirror/state.js";
import {EditorView as CMView, keymap} from "../_snowpack/pkg/@codemirror/view.js";
import {basicSetup} from "../_snowpack/pkg/@codemirror/basic-setup.js";
import {javascript} from "../_snowpack/pkg/@codemirror/lang-javascript.js";
export const code_mirror = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  isolating: true,
  parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
  toDOM() {
    return ["pre", ["code", 0]];
  }
};
const nodes = {
  ...basicNodes,
  code_mirror
};
export const schema = new Schema({
  nodes,
  marks
});
function computeChange(oldVal, newVal) {
  if (oldVal === newVal) {
    return null;
  }
  let start = 0;
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;
  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
    ++start;
  }
  while (oldEnd > start && newEnd > start && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
    oldEnd--;
    newEnd--;
  }
  return {from: start, to: oldEnd, text: newVal.slice(start, newEnd)};
}
export class CodeMirrorView {
  constructor(node, view, getPos) {
    this.updating = false;
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    const changeFilter = CMState.changeFilter.of((tr) => {
      if (!tr.docChanged && !this.updating) {
        this.forwardSelection();
      }
      return true;
    });
    this.cm = new CMView({
      dispatch: this.dispatch.bind(this)
    });
    this.dom = this.cm.dom;
    const cmState = CMState.create({
      doc: this.node.textContent,
      extensions: [
        changeFilter,
        basicSetup,
        javascript(),
        keymap.of([
          ...[
            {
              key: "ArrowUp",
              run: this.mayBeEscape("line", -1)
            },
            {
              key: "ArrowLeft",
              run: this.mayBeEscape("char", -1)
            },
            {
              key: "ArrowDown",
              run: this.mayBeEscape("line", 1)
            },
            {
              key: "ArrowRight",
              run: this.mayBeEscape("char", 1)
            },
            {
              key: "Ctrl-Enter",
              run() {
                if (exitCode(this.view.state, this.view.dispatch)) {
                  this.view.focus();
                  return true;
                }
                return false;
              }
            }
          ]
        ])
      ]
    });
    this.cm.setState(cmState);
  }
  forwardSelection() {
    if (!this.cm.hasFocus) {
      return;
    }
    const state = this.view.state;
    const selection = this.asProseMirrorSelection(state.doc);
    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection));
    }
  }
  asProseMirrorSelection(doc) {
    const offset = this.getPos() + 1;
    const {anchor, head} = this.cm.state.selection.main;
    return TextSelection.create(doc, anchor + offset, head + offset);
  }
  dispatch(cmTr) {
    this.cm.setState(cmTr.state);
    if (cmTr.docChanged && !this.updating) {
      const start = this.getPos() + 1;
      const cmValue = cmTr.state.doc.toString();
      const change = computeChange(this.node.textContent, cmValue);
      if (!change) {
        return;
      }
      const content = change.text ? schema.text(change.text) : null;
      const tr = this.view.state.tr.replaceWith(change.from + start, change.to + start, content);
      this.view.dispatch(tr);
      this.forwardSelection();
    }
  }
  mayBeEscape(unit, dir) {
    return (view) => {
      const {state} = view;
      const {selection} = state;
      const offsetToPos = () => {
        const offset = selection.main.from;
        const line = state.doc.lineAt(offset);
        return {line: line.number, ch: offset - line.from};
      };
      const pos = offsetToPos();
      const hasSelection = state.selection.ranges.some((r) => !r.empty);
      const firstLine = 1;
      const lastLine = state.doc.lineAt(state.doc.length).number;
      if (hasSelection || pos.line !== (dir < 0 ? firstLine : lastLine) || unit === "char" && pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length)) {
        return false;
      }
      let targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
      const pmSelection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
      this.view.dispatch(this.view.state.tr.setSelection(pmSelection).scrollIntoView());
      this.view.focus();
      return true;
    };
  }
  update(node) {
    if (node.type !== this.node.type) {
      return false;
    }
    this.node = node;
    const change = computeChange(this.cm.state.doc.toString(), node.textContent);
    if (change) {
      this.updating = true;
      this.cm.dispatch({
        changes: {from: change.from, to: change.to, insert: change.text}
      });
      this.updating = false;
    }
    return true;
  }
  setSelection(anchor, head) {
    this.focus();
    this.updating = true;
    this.cm.dispatch({selection: {anchor, head}});
    this.updating = false;
  }
  focus() {
    this.cm.focus();
    this.forwardSelection();
  }
  selectNode() {
    this.focus();
  }
  stopEvent() {
    return true;
  }
  destroy() {
    this.cm.destroy();
  }
}
