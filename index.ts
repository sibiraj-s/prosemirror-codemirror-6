import { Selection, TextSelection } from "prosemirror-state";
import { EditorView, NodeView } from "prosemirror-view";
import { Schema, Node as ProsemirrorNode, NodeSpec } from "prosemirror-model";
import { nodes as basicNodes, marks } from "prosemirror-schema-basic";
import { exitCode } from "prosemirror-commands";
import { EditorState as CMState, Transaction as CMTransaction } from "@codemirror/state";
import { Command, EditorView as CMView, keymap } from "@codemirror/view";
import { basicSetup } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";

export const code_mirror: NodeSpec = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  isolating: true,
  parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
  toDOM() {
    return ["pre", ["code", 0]];
  },
};

const nodes = {
  ...basicNodes,
  code_mirror,
};

export const schema = new Schema({
  nodes,
  marks,
});

interface ComputeChange {
  from: number;
  to: number;
  text: string;
}

function computeChange(oldVal: string, newVal: string): ComputeChange | null {
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
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
}

export class CodeMirrorView implements NodeView {
  node: ProsemirrorNode;
  view: EditorView;
  dom: HTMLElement;

  cm: CMView;

  getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    // Store for later
    this.node = node;
    this.view = view;

    this.getPos = getPos;

    // Create a CodeMirror instance
    this.cm = new CMView({
      state: CMState.create({
        doc: this.node.textContent,
        extensions: [
          basicSetup,
          javascript(),
          keymap.of([
            ...[
              {
                key: "ArrowUp",
                run: this.mayBeEscape("line", -1),
              },
              {
                key: "ArrowLeft",
                run: this.mayBeEscape("char", -1),
              },
              {
                key: "ArrowDown",
                run: this.mayBeEscape("line", 1),
              },
              {
                key: "ArrowRight",
                run: this.mayBeEscape("char", 1),
              },
              {
                key: "Ctrl-Enter",
                run: () => {
                  if (exitCode(this.view.state, this.view.dispatch)) {
                    this.view.focus();
                    return true;
                  }
                  return false;
                },
              },
            ],
          ]),
        ],
      }),
      dispatch: this.valueChanged.bind(this),
    });

    // The editor's outer node is our DOM representation
    this.dom = this.cm.dom;
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

  asProseMirrorSelection(doc: ProsemirrorNode) {
    const offset = this.getPos() + 1;
    const { anchor, head } = this.cm.state.selection.main;
    return TextSelection.create(doc, anchor + offset, head + offset);
  }

  valueChanged(cmTr: CMTransaction) {
    this.cm.setState(cmTr.state);
    this.forwardSelection();

    if (cmTr.docChanged) {
      const start = this.getPos() + 1;

      const cmValue = cmTr.state.doc.toString();
      const change = computeChange(this.node.textContent, cmValue);

      if (!change) {
        return;
      }

      const content = change.text ? schema.text(change.text) : null;
      const tr = this.view.state.tr.replaceWith(change.from + start, change.to + start, content);
      this.view.dispatch(tr);
    }
  }

  mayBeEscape(unit: "char" | "line", dir: -1 | 1): Command {
    return (view) => {
      const { state } = view;
      const { selection } = state;

      const offsetToPos = () => {
        const offset = selection.main.from;
        const line = state.doc.lineAt(offset);
        return { line: line.number, ch: offset - line.from };
      };

      const pos = offsetToPos();
      const hasSelection = state.selection.ranges.some((r) => !r.empty);

      const firstLine = 1;
      const lastLine = state.doc.lineAt(state.doc.length).number;

      if (
        hasSelection ||
        pos.line !== (dir < 0 ? firstLine : lastLine) ||
        (unit === "char" && pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length))
      ) {
        return false;
      }

      let targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
      const pmSelection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
      this.view.dispatch(this.view.state.tr.setSelection(pmSelection).scrollIntoView());
      this.view.focus();
      return true;
    };
  }

  update(node: ProsemirrorNode) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    return true;
  }

  destroy() {
    this.cm.destroy();
  }
}
