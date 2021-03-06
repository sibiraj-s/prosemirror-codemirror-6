import { EditorState, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { buildMenuItems, exampleSetup } from 'prosemirror-example-setup';
import { MenuItem } from 'prosemirror-menu';
import { setBlockType } from 'prosemirror-commands';

import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-view/style/prosemirror.css';
import './index.scss';
import './editor.scss';

import { schema, CodeMirrorView } from './codemirror';
import doc from './doc';

const nodeIsActive = (state, nodeType) => {
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
  })
);

const state = EditorState.create({
  doc: schema.nodeFromJSON(doc),
  plugins: exampleSetup({
    schema,
    menuContent: menu.fullMenu,
    floatingMenu: false,
  }),
});

new EditorView(document.querySelector('#editor'), {
  state,
  nodeViews: {
    code_mirror: (node, view, getPos) => new CodeMirrorView(node, view, getPos),
  },
});
