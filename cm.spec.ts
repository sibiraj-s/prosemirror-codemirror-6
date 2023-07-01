import { describe, it, expect } from 'vitest';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import schema from './demo/schema';
import doc from './demo/doc';
import { CodeMirrorView } from './lib';

describe('CodeMirror', () => {
  it('should render codemirror editor', () => {
    const element = document.createElement('pm-root');

    const state = EditorState.create({
      doc: schema.nodeFromJSON(doc),
      schema,
    });

    const editor = new EditorView(element, {
      state,
      nodeViews: {
        code_mirror: (node: any, view: any, getPos: any) => new CodeMirrorView({
          node,
          view,
          getPos,
        }),
      },
    });

    expect(editor).toBeTruthy();
    expect(element.getElementsByClassName('cm-editor')).toHaveLength(1);
  });
});
