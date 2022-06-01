import type { EditorView } from 'prosemirror-view';
import type { Node as ProsemirrorNode } from 'prosemirror-model';
import type { Extension } from '@codemirror/state';

export interface ComputeChange {
  from: number;
  to: number;
  text: string;
}

interface CMOptions {
  extensions: Extension;
}

export type GetPos = () => number | undefined;

export interface CodeMirrorViewOptions {
  node: ProsemirrorNode;
  view: EditorView;
  getPos: GetPos;
  cmOptions?: CMOptions;
}
