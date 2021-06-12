import { EditorState, NodeSelection } from '../_snowpack/pkg/prosemirror-state.js';
import { EditorView } from '../_snowpack/pkg/prosemirror-view.js';
import { buildMenuItems, exampleSetup } from '../_snowpack/pkg/prosemirror-example-setup.js';
import { MenuItem } from '../_snowpack/pkg/prosemirror-menu.js';
import { setBlockType } from '../_snowpack/pkg/prosemirror-commands.js';

import '../_snowpack/pkg/prosemirror-menu/style/menu.css.proxy.js';
import '../_snowpack/pkg/prosemirror-example-setup/style/style.css.proxy.js';
import '../_snowpack/pkg/prosemirror-view/style/prosemirror.css.proxy.js';
import './index.css.proxy.js';
import './editor.css.proxy.js';

import { schema, CodeMirrorView } from './codemirror.js';
import doc from './doc.js';

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
