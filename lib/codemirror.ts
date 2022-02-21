import { Selection, TextSelection } from 'prosemirror-state';
import { EditorView, NodeView } from 'prosemirror-view';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { exitCode } from 'prosemirror-commands';
import { EditorState as CMState, Transaction as CMTransaction } from '@codemirror/state';
import { Command, EditorView as CMView, keymap } from '@codemirror/view';

import { ComputeChange, CodeMirrorViewOptions } from './types';

const computeChange = (oldVal: string, newVal: string): ComputeChange | null => {
  if (oldVal === newVal) {
    return null;
  }

  let start = 0;
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;

  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
    start += 1;
  }

  while (oldEnd > start && newEnd > start && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
};

class CodeMirrorView implements NodeView {
  node: ProsemirrorNode;

  view: EditorView;

  dom: HTMLElement;

  cm: CMView;

  getPos: () => number;

  updating = false;

  constructor(options: CodeMirrorViewOptions) {
    // Store for later
    this.node = options.node;
    this.view = options.view;
    const cmExtensions = options.cmOptions?.extensions || [];

    this.getPos = options.getPos as () => number;

    const changeFilter = CMState.changeFilter.of((tr) => {
      if (!tr.docChanged && !this.updating) {
        this.forwardSelection();
      }
      return true;
    });

    // Create a CodeMirror instancew
    this.cm = new CMView({
      dispatch: this.dispatch.bind(this),
    });

    // The editor's outer node is our DOM representation
    this.dom = this.cm.dom;

    const cmState = CMState.create({
      doc: this.node.textContent,
      extensions: [
        changeFilter,
        keymap.of([
          {
            key: 'ArrowUp',
            run: this.mayBeEscape('line', -1),
          },
          {
            key: 'ArrowLeft',
            run: this.mayBeEscape('char', -1),
          },
          {
            key: 'ArrowDown',
            run: this.mayBeEscape('line', 1),
          },
          {
            key: 'ArrowRight',
            run: this.mayBeEscape('char', 1),
          },
          {
            key: 'Ctrl-Enter',
            run: () => {
              if (exitCode(this.view.state, this.view.dispatch)) {
                this.view.focus();
                return true;
              }
              return false;
            },
          },
        ]),
        cmExtensions,
      ],
    });

    this.cm.setState(cmState);
  }

  forwardSelection() {
    if (!this.cm.hasFocus) {
      return;
    }

    const { state } = this.view;
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

  dispatch(cmTr: CMTransaction) {
    this.cm.setState(cmTr.state);

    if (cmTr.docChanged && !this.updating) {
      const start = this.getPos() + 1;

      const cmValue = cmTr.state.doc.toString();
      const change = computeChange(this.node.textContent, cmValue);

      if (!change) {
        return;
      }

      const content = change.text ? this.view.state.schema.text(change.text) : null;

      const tr = this.view.state.tr.replaceWith(change.from + start, change.to + start, content as ProsemirrorNode);
      this.view.dispatch(tr);
      this.forwardSelection();
    }
  }

  mayBeEscape(unit: 'char' | 'line', dir: -1 | 1): Command {
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
        (unit === 'char' && pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length))
      ) {
        return false;
      }

      const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
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
    const change = computeChange(this.cm.state.doc.toString(), node.textContent);

    if (change) {
      this.updating = true;
      this.cm.dispatch({
        changes: { from: change.from, to: change.to, insert: change.text },
      });
      this.updating = false;
    }

    return true;
  }

  setSelection(anchor: number, head: number): void {
    this.focus();
    this.updating = true;
    this.cm.dispatch({ selection: { anchor, head } });
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

export default CodeMirrorView;
