import { EditorState, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { buildMenuItems, exampleSetup } from 'prosemirror-example-setup';
import { MenuItem } from 'prosemirror-menu';
import { NodeType, Node as ProsemirrorNode } from 'prosemirror-model';
import { setBlockType } from 'prosemirror-commands';
import { minimalSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-view/style/prosemirror.css';
import './index.css';

import schema from './schema';
import { CodeMirrorView } from '../lib';
import doc from './doc';
import { GetPos } from '../lib/types';

const nodeIsActive = (state: EditorState, nodeType: NodeType) => {
  if (!(state.selection instanceof NodeSelection)) {
    return false;
  }
  const { $from, to, node } = state.selection;

  if (node) {
    return node.hasMarkup(nodeType, {});
  }

  return to <= $from.end() && $from.parent.hasMarkup(nodeType, {});
};

const menu = buildMenuItems(schema);
menu.blockMenu[0].push(
  new MenuItem({
    label: 'CodeMirror',
    enable(state) {
      return setBlockType(schema.nodes.code_mirror)(state);
    },
    active(state) {
      return nodeIsActive(state, schema.nodes.code_mirror);
    },
    run(state, dispatch) {
      return setBlockType(schema.nodes.code_mirror)(state, dispatch);
    },
  }),
);

const state = EditorState.create({
  doc: schema.nodeFromJSON(doc),
  plugins: exampleSetup({
    schema,
    menuContent: menu.fullMenu,
    floatingMenu: false,
  }),
});

const element = document.querySelector('#editor') as HTMLElement;

const editor = new EditorView(element, {
  state,
  nodeViews: {
    code_mirror: (node: ProsemirrorNode, view: EditorView, getPos: GetPos) => new CodeMirrorView({
      node,
      view,
      getPos,
      cmOptions: {
        extensions: [minimalSetup, javascript()],
      },
    }),
  },
});

editor.focus();
