# ProseMirror + CodeMirror 6

Based on the example from https://prosemirror.net/examples/codemirror/. This is just an example setup and might not be very reusable. Use this to get something up-and-running quickly.

[![Tests](https://github.com/sibiraj-s/prosemirror-codemirror-6/actions/workflows/test.yml/badge.svg)](https://github.com/sibiraj-s/prosemirror-codemirror-6/actions/workflows/test.yml)
[![NPM Version](https://badgen.net/npm/v/prosemirror-codemirror-6)](https://npm.im/prosemirror-codemirror-6)

## Getting Started

```bash
npm i prosemirror-codemirror-6
```

### Usage

```ts
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { nodes as basicNodes, marks } from 'prosemirror-schema-basic';
import { CodeMirrorView, node as codeMirrorNode } from 'prosemirror-codemirror-6';
import { minimalSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

const nodes = {
  ...basicNodes,
  code_mirror: codeMirrorNode,
};

const schema = new Schema({
  nodes,
  marks,
});

const editor = new EditorView(element, {
  state: EditorState.create({
    schema,
  }),
  nodeViews: {
    code_mirror: (node, view, getPos) =>
      new CodeMirrorView({
        node,
        view,
        getPos,
        cmOptions: {
          extensions: [minimalSetup, javascript()],
        },
      }),
  },
});
```

## Contributing

Install the dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

### Related Links

- ProseMirror - https://prosemirror.net/
- CodeMirror 6 - https://codemirror.net
- Migrating to CodeMirror 6 - https://codemirror.net/6/docs/migration/
