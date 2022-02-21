import { Schema } from 'prosemirror-model';
import { nodes as basicNodes, marks } from 'prosemirror-schema-basic';
import { node as codeMirrorNode } from '../lib';

const nodes = {
  ...basicNodes,
  code_mirror: codeMirrorNode,
};

const schema = new Schema({
  nodes,
  marks,
});

export default schema;
