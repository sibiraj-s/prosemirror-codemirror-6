import { NodeSpec } from 'prosemirror-model';

const node: NodeSpec = {
  content: 'text*',
  marks: '',
  group: 'block',
  code: true,
  defining: true,
  isolating: true,
  parseDOM: [
    {
      tag: 'pre',
      preserveWhitespace: 'full',
    },
  ],
  toDOM() {
    return ['pre', ['code', 0]];
  },
};

export default node;
