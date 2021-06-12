import { l as EditorState, T as Transaction, F as Facet, S as StateField, d as countColumn, e as Text, b as StateEffect, M as MapMode, E as EditorSelection, c as combineConfig, P as Prec, g as codePointAt, f as codePointSize, j as fromCodePoint } from './index-c694cd06.js';
import { V as ViewPlugin, D as Direction, E as EditorView, l as logException, b as Decoration, k as keymap, W as WidgetType, S as StyleModule, c as RangeSetBuilder } from './index-4410d11b.js';

/// The default maximum length of a `TreeBuffer` node.
const DefaultBufferLength = 1024;
let nextPropID = 0;
const CachedNode = new WeakMap();
/// Each [node type](#tree.NodeType) can have metadata associated with
/// it in props. Instances of this class represent prop names.
class NodeProp {
    /// Create a new node prop type. You can optionally pass a
    /// `deserialize` function.
    constructor({ deserialize } = {}) {
        this.id = nextPropID++;
        this.deserialize = deserialize || (() => {
            throw new Error("This node type doesn't define a deserialize function");
        });
    }
    /// Create a string-valued node prop whose deserialize function is
    /// the identity function.
    static string() { return new NodeProp({ deserialize: str => str }); }
    /// Create a number-valued node prop whose deserialize function is
    /// just `Number`.
    static number() { return new NodeProp({ deserialize: Number }); }
    /// Creates a boolean-valued node prop whose deserialize function
    /// returns true for any input.
    static flag() { return new NodeProp({ deserialize: () => true }); }
    /// Store a value for this prop in the given object. This can be
    /// useful when building up a prop object to pass to the
    /// [`NodeType`](#tree.NodeType) constructor. Returns its first
    /// argument.
    set(propObj, value) {
        propObj[this.id] = value;
        return propObj;
    }
    /// This is meant to be used with
    /// [`NodeSet.extend`](#tree.NodeSet.extend) or
    /// [`Parser.withProps`](#lezer.Parser.withProps) to compute prop
    /// values for each node type in the set. Takes a [match
    /// object](#tree.NodeType^match) or function that returns undefined
    /// if the node type doesn't get this prop, and the prop's value if
    /// it does.
    add(match) {
        if (typeof match != "function")
            match = NodeType.match(match);
        return (type) => {
            let result = match(type);
            return result === undefined ? null : [this, result];
        };
    }
}
/// Prop that is used to describe matching delimiters. For opening
/// delimiters, this holds an array of node names (written as a
/// space-separated string when declaring this prop in a grammar)
/// for the node types of closing delimiters that match it.
NodeProp.closedBy = new NodeProp({ deserialize: str => str.split(" ") });
/// The inverse of [`openedBy`](#tree.NodeProp^closedBy). This is
/// attached to closing delimiters, holding an array of node names
/// of types of matching opening delimiters.
NodeProp.openedBy = new NodeProp({ deserialize: str => str.split(" ") });
/// Used to assign node types to groups (for example, all node
/// types that represent an expression could be tagged with an
/// `"Expression"` group).
NodeProp.group = new NodeProp({ deserialize: str => str.split(" ") });
const noProps = Object.create(null);
/// Each node in a syntax tree has a node type associated with it.
class NodeType {
    /// @internal
    constructor(
    /// The name of the node type. Not necessarily unique, but if the
    /// grammar was written properly, different node types with the
    /// same name within a node set should play the same semantic
    /// role.
    name, 
    /// @internal
    props, 
    /// The id of this node in its set. Corresponds to the term ids
    /// used in the parser.
    id, 
    /// @internal
    flags = 0) {
        this.name = name;
        this.props = props;
        this.id = id;
        this.flags = flags;
    }
    static define(spec) {
        let props = spec.props && spec.props.length ? Object.create(null) : noProps;
        let flags = (spec.top ? 1 /* Top */ : 0) | (spec.skipped ? 2 /* Skipped */ : 0) |
            (spec.error ? 4 /* Error */ : 0) | (spec.name == null ? 8 /* Anonymous */ : 0);
        let type = new NodeType(spec.name || "", props, spec.id, flags);
        if (spec.props)
            for (let src of spec.props) {
                if (!Array.isArray(src))
                    src = src(type);
                if (src)
                    src[0].set(props, src[1]);
            }
        return type;
    }
    /// Retrieves a node prop for this type. Will return `undefined` if
    /// the prop isn't present on this node.
    prop(prop) { return this.props[prop.id]; }
    /// True when this is the top node of a grammar.
    get isTop() { return (this.flags & 1 /* Top */) > 0; }
    /// True when this node is produced by a skip rule.
    get isSkipped() { return (this.flags & 2 /* Skipped */) > 0; }
    /// Indicates whether this is an error node.
    get isError() { return (this.flags & 4 /* Error */) > 0; }
    /// When true, this node type doesn't correspond to a user-declared
    /// named node, for example because it is used to cache repetition.
    get isAnonymous() { return (this.flags & 8 /* Anonymous */) > 0; }
    /// Returns true when this node's name or one of its
    /// [groups](#tree.NodeProp^group) matches the given string.
    is(name) {
        if (typeof name == 'string') {
            if (this.name == name)
                return true;
            let group = this.prop(NodeProp.group);
            return group ? group.indexOf(name) > -1 : false;
        }
        return this.id == name;
    }
    /// Create a function from node types to arbitrary values by
    /// specifying an object whose property names are node or
    /// [group](#tree.NodeProp^group) names. Often useful with
    /// [`NodeProp.add`](#tree.NodeProp.add). You can put multiple
    /// names, separated by spaces, in a single property name to map
    /// multiple node names to a single value.
    static match(map) {
        let direct = Object.create(null);
        for (let prop in map)
            for (let name of prop.split(" "))
                direct[name] = map[prop];
        return (node) => {
            for (let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++) {
                let found = direct[i < 0 ? node.name : groups[i]];
                if (found)
                    return found;
            }
        };
    }
}
/// An empty dummy node type to use when no actual type is available.
NodeType.none = new NodeType("", Object.create(null), 0, 8 /* Anonymous */);
/// A node set holds a collection of node types. It is used to
/// compactly represent trees by storing their type ids, rather than a
/// full pointer to the type object, in a number array. Each parser
/// [has](#lezer.Parser.nodeSet) a node set, and [tree
/// buffers](#tree.TreeBuffer) can only store collections of nodes
/// from the same set. A set can have a maximum of 2**16 (65536)
/// node types in it, so that the ids fit into 16-bit typed array
/// slots.
class NodeSet {
    /// Create a set with the given types. The `id` property of each
    /// type should correspond to its position within the array.
    constructor(
    /// The node types in this set, by id.
    types) {
        this.types = types;
        for (let i = 0; i < types.length; i++)
            if (types[i].id != i)
                throw new RangeError("Node type ids should correspond to array positions when creating a node set");
    }
    /// Create a copy of this set with some node properties added. The
    /// arguments to this method should be created with
    /// [`NodeProp.add`](#tree.NodeProp.add).
    extend(...props) {
        let newTypes = [];
        for (let type of this.types) {
            let newProps = null;
            for (let source of props) {
                let add = source(type);
                if (add) {
                    if (!newProps)
                        newProps = Object.assign({}, type.props);
                    add[0].set(newProps, add[1]);
                }
            }
            newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
        }
        return new NodeSet(newTypes);
    }
}
/// A piece of syntax tree. There are two ways to approach these
/// trees: the way they are actually stored in memory, and the
/// convenient way.
///
/// Syntax trees are stored as a tree of `Tree` and `TreeBuffer`
/// objects. By packing detail information into `TreeBuffer` leaf
/// nodes, the representation is made a lot more memory-efficient.
///
/// However, when you want to actually work with tree nodes, this
/// representation is very awkward, so most client code will want to
/// use the `TreeCursor` interface instead, which provides a view on
/// some part of this data structure, and can be used to move around
/// to adjacent nodes.
class Tree {
    /// Construct a new tree. You usually want to go through
    /// [`Tree.build`](#tree.Tree^build) instead.
    constructor(type, 
    /// The tree's child nodes. Children small enough to fit in a
    /// `TreeBuffer will be represented as such, other children can be
    /// further `Tree` instances with their own internal structure.
    children, 
    /// The positions (offsets relative to the start of this tree) of
    /// the children.
    positions, 
    /// The total length of this tree
    length) {
        this.type = type;
        this.children = children;
        this.positions = positions;
        this.length = length;
    }
    /// @internal
    toString() {
        let children = this.children.map(c => c.toString()).join();
        return !this.type.name ? children :
            (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) +
                (children.length ? "(" + children + ")" : "");
    }
    /// Get a [tree cursor](#tree.TreeCursor) rooted at this tree. When
    /// `pos` is given, the cursor is [moved](#tree.TreeCursor.moveTo)
    /// to the given position and side.
    cursor(pos, side = 0) {
        let scope = (pos != null && CachedNode.get(this)) || this.topNode;
        let cursor = new TreeCursor(scope);
        if (pos != null) {
            cursor.moveTo(pos, side);
            CachedNode.set(this, cursor._tree);
        }
        return cursor;
    }
    /// Get a [tree cursor](#tree.TreeCursor) that, unlike regular
    /// cursors, doesn't skip [anonymous](#tree.NodeType.isAnonymous)
    /// nodes.
    fullCursor() {
        return new TreeCursor(this.topNode, true);
    }
    /// Get a [syntax node](#tree.SyntaxNode) object for the top of the
    /// tree.
    get topNode() {
        return new TreeNode(this, 0, 0, null);
    }
    /// Get the [syntax node](#tree.SyntaxNode) at the given position.
    /// If `side` is -1, this will move into nodes that end at the
    /// position. If 1, it'll move into nodes that start at the
    /// position. With 0, it'll only enter nodes that cover the position
    /// from both sides.
    resolve(pos, side = 0) {
        return this.cursor(pos, side).node;
    }
    /// Iterate over the tree and its children, calling `enter` for any
    /// node that touches the `from`/`to` region (if given) before
    /// running over such a node's children, and `leave` (if given) when
    /// leaving the node. When `enter` returns `false`, the given node
    /// will not have its children iterated over (or `leave` called).
    iterate(spec) {
        let { enter, leave, from = 0, to = this.length } = spec;
        for (let c = this.cursor();;) {
            let mustLeave = false;
            if (c.from <= to && c.to >= from && (c.type.isAnonymous || enter(c.type, c.from, c.to) !== false)) {
                if (c.firstChild())
                    continue;
                if (!c.type.isAnonymous)
                    mustLeave = true;
            }
            for (;;) {
                if (mustLeave && leave)
                    leave(c.type, c.from, c.to);
                mustLeave = c.type.isAnonymous;
                if (c.nextSibling())
                    break;
                if (!c.parent())
                    return;
                mustLeave = true;
            }
        }
    }
    /// Balance the direct children of this tree.
    balance(maxBufferLength = DefaultBufferLength) {
        return this.children.length <= BalanceBranchFactor ? this
            : balanceRange(this.type, NodeType.none, this.children, this.positions, 0, this.children.length, 0, maxBufferLength, this.length, 0);
    }
    /// Build a tree from a postfix-ordered buffer of node information,
    /// or a cursor over such a buffer.
    static build(data) { return buildTree(data); }
}
/// The empty tree
Tree.empty = new Tree(NodeType.none, [], [], 0);
// For trees that need a context hash attached, we're using this
// kludge which assigns an extra property directly after
// initialization (creating a single new object shape).
function withHash(tree, hash) {
    if (hash)
        tree.contextHash = hash;
    return tree;
}
/// Tree buffers contain (type, start, end, endIndex) quads for each
/// node. In such a buffer, nodes are stored in prefix order (parents
/// before children, with the endIndex of the parent indicating which
/// children belong to it)
class TreeBuffer {
    /// Create a tree buffer @internal
    constructor(
    /// @internal
    buffer, 
    // The total length of the group of nodes in the buffer.
    length, 
    /// @internal
    set, type = NodeType.none) {
        this.buffer = buffer;
        this.length = length;
        this.set = set;
        this.type = type;
    }
    /// @internal
    toString() {
        let result = [];
        for (let index = 0; index < this.buffer.length;) {
            result.push(this.childString(index));
            index = this.buffer[index + 3];
        }
        return result.join(",");
    }
    /// @internal
    childString(index) {
        let id = this.buffer[index], endIndex = this.buffer[index + 3];
        let type = this.set.types[id], result = type.name;
        if (/\W/.test(result) && !type.isError)
            result = JSON.stringify(result);
        index += 4;
        if (endIndex == index)
            return result;
        let children = [];
        while (index < endIndex) {
            children.push(this.childString(index));
            index = this.buffer[index + 3];
        }
        return result + "(" + children.join(",") + ")";
    }
    /// @internal
    findChild(startIndex, endIndex, dir, after) {
        let { buffer } = this, pick = -1;
        for (let i = startIndex; i != endIndex; i = buffer[i + 3]) {
            if (after != -100000000 /* None */) {
                let start = buffer[i + 1], end = buffer[i + 2];
                if (dir > 0) {
                    if (end > after)
                        pick = i;
                    if (end > after)
                        break;
                }
                else {
                    if (start < after)
                        pick = i;
                    if (end >= after)
                        break;
                }
            }
            else {
                pick = i;
                if (dir > 0)
                    break;
            }
        }
        return pick;
    }
}
class TreeNode {
    constructor(node, from, index, _parent) {
        this.node = node;
        this.from = from;
        this.index = index;
        this._parent = _parent;
    }
    get type() { return this.node.type; }
    get name() { return this.node.type.name; }
    get to() { return this.from + this.node.length; }
    nextChild(i, dir, after, full = false) {
        for (let parent = this;;) {
            for (let { children, positions } = parent.node, e = dir > 0 ? children.length : -1; i != e; i += dir) {
                let next = children[i], start = positions[i] + parent.from;
                if (after != -100000000 /* None */ && (dir < 0 ? start >= after : start + next.length <= after))
                    continue;
                if (next instanceof TreeBuffer) {
                    let index = next.findChild(0, next.buffer.length, dir, after == -100000000 /* None */ ? -100000000 /* None */ : after - start);
                    if (index > -1)
                        return new BufferNode(new BufferContext(parent, next, i, start), null, index);
                }
                else if (full || (!next.type.isAnonymous || hasChild(next))) {
                    let inner = new TreeNode(next, start, i, parent);
                    return full || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, after);
                }
            }
            if (full || !parent.type.isAnonymous)
                return null;
            i = parent.index + dir;
            parent = parent._parent;
            if (!parent)
                return null;
        }
    }
    get firstChild() { return this.nextChild(0, 1, -100000000 /* None */); }
    get lastChild() { return this.nextChild(this.node.children.length - 1, -1, -100000000 /* None */); }
    childAfter(pos) { return this.nextChild(0, 1, pos); }
    childBefore(pos) { return this.nextChild(this.node.children.length - 1, -1, pos); }
    nextSignificantParent() {
        let val = this;
        while (val.type.isAnonymous && val._parent)
            val = val._parent;
        return val;
    }
    get parent() {
        return this._parent ? this._parent.nextSignificantParent() : null;
    }
    get nextSibling() {
        return this._parent ? this._parent.nextChild(this.index + 1, 1, -1) : null;
    }
    get prevSibling() {
        return this._parent ? this._parent.nextChild(this.index - 1, -1, -1) : null;
    }
    get cursor() { return new TreeCursor(this); }
    resolve(pos, side = 0) {
        return this.cursor.moveTo(pos, side).node;
    }
    getChild(type, before = null, after = null) {
        let r = getChildren(this, type, before, after);
        return r.length ? r[0] : null;
    }
    getChildren(type, before = null, after = null) {
        return getChildren(this, type, before, after);
    }
    /// @internal
    toString() { return this.node.toString(); }
}
function getChildren(node, type, before, after) {
    let cur = node.cursor, result = [];
    if (!cur.firstChild())
        return result;
    if (before != null)
        while (!cur.type.is(before))
            if (!cur.nextSibling())
                return result;
    for (;;) {
        if (after != null && cur.type.is(after))
            return result;
        if (cur.type.is(type))
            result.push(cur.node);
        if (!cur.nextSibling())
            return after == null ? result : [];
    }
}
class BufferContext {
    constructor(parent, buffer, index, start) {
        this.parent = parent;
        this.buffer = buffer;
        this.index = index;
        this.start = start;
    }
}
class BufferNode {
    constructor(context, _parent, index) {
        this.context = context;
        this._parent = _parent;
        this.index = index;
        this.type = context.buffer.set.types[context.buffer.buffer[index]];
    }
    get name() { return this.type.name; }
    get from() { return this.context.start + this.context.buffer.buffer[this.index + 1]; }
    get to() { return this.context.start + this.context.buffer.buffer[this.index + 2]; }
    child(dir, after) {
        let { buffer } = this.context;
        let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, after == -100000000 /* None */ ? -100000000 /* None */ : after - this.context.start);
        return index < 0 ? null : new BufferNode(this.context, this, index);
    }
    get firstChild() { return this.child(1, -100000000 /* None */); }
    get lastChild() { return this.child(-1, -100000000 /* None */); }
    childAfter(pos) { return this.child(1, pos); }
    childBefore(pos) { return this.child(-1, pos); }
    get parent() {
        return this._parent || this.context.parent.nextSignificantParent();
    }
    externalSibling(dir) {
        return this._parent ? null : this.context.parent.nextChild(this.context.index + dir, dir, -1);
    }
    get nextSibling() {
        let { buffer } = this.context;
        let after = buffer.buffer[this.index + 3];
        if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length))
            return new BufferNode(this.context, this._parent, after);
        return this.externalSibling(1);
    }
    get prevSibling() {
        let { buffer } = this.context;
        let parentStart = this._parent ? this._parent.index + 4 : 0;
        if (this.index == parentStart)
            return this.externalSibling(-1);
        return new BufferNode(this.context, this._parent, buffer.findChild(parentStart, this.index, -1, -100000000 /* None */));
    }
    get cursor() { return new TreeCursor(this); }
    resolve(pos, side = 0) {
        return this.cursor.moveTo(pos, side).node;
    }
    /// @internal
    toString() { return this.context.buffer.childString(this.index); }
    getChild(type, before = null, after = null) {
        let r = getChildren(this, type, before, after);
        return r.length ? r[0] : null;
    }
    getChildren(type, before = null, after = null) {
        return getChildren(this, type, before, after);
    }
}
/// A tree cursor object focuses on a given node in a syntax tree, and
/// allows you to move to adjacent nodes.
class TreeCursor {
    /// @internal
    constructor(node, full = false) {
        this.full = full;
        this.buffer = null;
        this.stack = [];
        this.index = 0;
        this.bufferNode = null;
        if (node instanceof TreeNode) {
            this.yieldNode(node);
        }
        else {
            this._tree = node.context.parent;
            this.buffer = node.context;
            for (let n = node._parent; n; n = n._parent)
                this.stack.unshift(n.index);
            this.bufferNode = node;
            this.yieldBuf(node.index);
        }
    }
    /// Shorthand for `.type.name`.
    get name() { return this.type.name; }
    yieldNode(node) {
        if (!node)
            return false;
        this._tree = node;
        this.type = node.type;
        this.from = node.from;
        this.to = node.to;
        return true;
    }
    yieldBuf(index, type) {
        this.index = index;
        let { start, buffer } = this.buffer;
        this.type = type || buffer.set.types[buffer.buffer[index]];
        this.from = start + buffer.buffer[index + 1];
        this.to = start + buffer.buffer[index + 2];
        return true;
    }
    yield(node) {
        if (!node)
            return false;
        if (node instanceof TreeNode) {
            this.buffer = null;
            return this.yieldNode(node);
        }
        this.buffer = node.context;
        return this.yieldBuf(node.index, node.type);
    }
    /// @internal
    toString() {
        return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
    }
    /// @internal
    enter(dir, after) {
        if (!this.buffer)
            return this.yield(this._tree.nextChild(dir < 0 ? this._tree.node.children.length - 1 : 0, dir, after, this.full));
        let { buffer } = this.buffer;
        let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, after == -100000000 /* None */ ? -100000000 /* None */ : after - this.buffer.start);
        if (index < 0)
            return false;
        this.stack.push(this.index);
        return this.yieldBuf(index);
    }
    /// Move the cursor to this node's first child. When this returns
    /// false, the node has no child, and the cursor has not been moved.
    firstChild() { return this.enter(1, -100000000 /* None */); }
    /// Move the cursor to this node's last child.
    lastChild() { return this.enter(-1, -100000000 /* None */); }
    /// Move the cursor to the first child that starts at or after `pos`.
    childAfter(pos) { return this.enter(1, pos); }
    /// Move to the last child that ends at or before `pos`.
    childBefore(pos) { return this.enter(-1, pos); }
    /// Move the node's parent node, if this isn't the top node.
    parent() {
        if (!this.buffer)
            return this.yieldNode(this.full ? this._tree._parent : this._tree.parent);
        if (this.stack.length)
            return this.yieldBuf(this.stack.pop());
        let parent = this.full ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
        this.buffer = null;
        return this.yieldNode(parent);
    }
    /// @internal
    sibling(dir) {
        if (!this.buffer)
            return !this._tree._parent ? false
                : this.yield(this._tree._parent.nextChild(this._tree.index + dir, dir, -100000000 /* None */, this.full));
        let { buffer } = this.buffer, d = this.stack.length - 1;
        if (dir < 0) {
            let parentStart = d < 0 ? 0 : this.stack[d] + 4;
            if (this.index != parentStart)
                return this.yieldBuf(buffer.findChild(parentStart, this.index, -1, -100000000 /* None */));
        }
        else {
            let after = buffer.buffer[this.index + 3];
            if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3]))
                return this.yieldBuf(after);
        }
        return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, -100000000 /* None */, this.full)) : false;
    }
    /// Move to this node's next sibling, if any.
    nextSibling() { return this.sibling(1); }
    /// Move to this node's previous sibling, if any.
    prevSibling() { return this.sibling(-1); }
    atLastNode(dir) {
        let index, parent, { buffer } = this;
        if (buffer) {
            if (dir > 0) {
                if (this.index < buffer.buffer.buffer.length)
                    return false;
            }
            else {
                for (let i = 0; i < this.index; i++)
                    if (buffer.buffer.buffer[i + 3] < this.index)
                        return false;
            }
            ({ index, parent } = buffer);
        }
        else {
            ({ index, _parent: parent } = this._tree);
        }
        for (; parent; { index, _parent: parent } = parent) {
            for (let i = index + dir, e = dir < 0 ? -1 : parent.node.children.length; i != e; i += dir) {
                let child = parent.node.children[i];
                if (this.full || !child.type.isAnonymous || child instanceof TreeBuffer || hasChild(child))
                    return false;
            }
        }
        return true;
    }
    move(dir) {
        if (this.enter(dir, -100000000 /* None */))
            return true;
        for (;;) {
            if (this.sibling(dir))
                return true;
            if (this.atLastNode(dir) || !this.parent())
                return false;
        }
    }
    /// Move to the next node in a
    /// [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR))
    /// traversal, going from a node to its first child or, if the
    /// current node is empty, its next sibling or the next sibling of
    /// the first parent node that has one.
    next() { return this.move(1); }
    /// Move to the next node in a last-to-first pre-order traveral. A
    /// node is followed by ist last child or, if it has none, its
    /// previous sibling or the previous sibling of the first parent
    /// node that has one.
    prev() { return this.move(-1); }
    /// Move the cursor to the innermost node that covers `pos`. If
    /// `side` is -1, it will enter nodes that end at `pos`. If it is 1,
    /// it will enter nodes that start at `pos`.
    moveTo(pos, side = 0) {
        // Move up to a node that actually holds the position, if possible
        while (this.from == this.to ||
            (side < 1 ? this.from >= pos : this.from > pos) ||
            (side > -1 ? this.to <= pos : this.to < pos))
            if (!this.parent())
                break;
        // Then scan down into child nodes as far as possible
        for (;;) {
            if (side < 0 ? !this.childBefore(pos) : !this.childAfter(pos))
                break;
            if (this.from == this.to ||
                (side < 1 ? this.from >= pos : this.from > pos) ||
                (side > -1 ? this.to <= pos : this.to < pos)) {
                this.parent();
                break;
            }
        }
        return this;
    }
    /// Get a [syntax node](#tree.SyntaxNode) at the cursor's current
    /// position.
    get node() {
        if (!this.buffer)
            return this._tree;
        let cache = this.bufferNode, result = null, depth = 0;
        if (cache && cache.context == this.buffer) {
            scan: for (let index = this.index, d = this.stack.length; d >= 0;) {
                for (let c = cache; c; c = c._parent)
                    if (c.index == index) {
                        if (index == this.index)
                            return c;
                        result = c;
                        depth = d + 1;
                        break scan;
                    }
                index = this.stack[--d];
            }
        }
        for (let i = depth; i < this.stack.length; i++)
            result = new BufferNode(this.buffer, result, this.stack[i]);
        return this.bufferNode = new BufferNode(this.buffer, result, this.index);
    }
    /// Get the [tree](#tree.Tree) that represents the current node, if
    /// any. Will return null when the node is in a [tree
    /// buffer](#tree.TreeBuffer).
    get tree() {
        return this.buffer ? null : this._tree.node;
    }
}
function hasChild(tree) {
    return tree.children.some(ch => !ch.type.isAnonymous || ch instanceof TreeBuffer || hasChild(ch));
}
class FlatBufferCursor {
    constructor(buffer, index) {
        this.buffer = buffer;
        this.index = index;
    }
    get id() { return this.buffer[this.index - 4]; }
    get start() { return this.buffer[this.index - 3]; }
    get end() { return this.buffer[this.index - 2]; }
    get size() { return this.buffer[this.index - 1]; }
    get pos() { return this.index; }
    next() { this.index -= 4; }
    fork() { return new FlatBufferCursor(this.buffer, this.index); }
}
const BalanceBranchFactor = 8;
function buildTree(data) {
    var _a;
    let { buffer, nodeSet, topID = 0, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data;
    let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
    let types = nodeSet.types;
    let contextHash = 0;
    function takeNode(parentStart, minPos, children, positions, inRepeat) {
        let { id, start, end, size } = cursor;
        let startPos = start - parentStart;
        if (size < 0) {
            if (size == -1) { // Reused node
                children.push(reused[id]);
                positions.push(startPos);
            }
            else { // Context change
                contextHash = id;
            }
            cursor.next();
            return;
        }
        let type = types[id], node, buffer;
        if (end - start <= maxBufferLength && (buffer = findBufferSize(cursor.pos - minPos, inRepeat))) {
            // Small enough for a buffer, and no reused nodes inside
            let data = new Uint16Array(buffer.size - buffer.skip);
            let endPos = cursor.pos - buffer.size, index = data.length;
            while (cursor.pos > endPos)
                index = copyToBuffer(buffer.start, data, index, inRepeat);
            node = new TreeBuffer(data, end - buffer.start, nodeSet, inRepeat < 0 ? NodeType.none : types[inRepeat]);
            startPos = buffer.start - parentStart;
        }
        else { // Make it a node
            let endPos = cursor.pos - size;
            cursor.next();
            let localChildren = [], localPositions = [];
            let localInRepeat = id >= minRepeatType ? id : -1;
            while (cursor.pos > endPos) {
                if (cursor.id == localInRepeat)
                    cursor.next();
                else
                    takeNode(start, endPos, localChildren, localPositions, localInRepeat);
            }
            localChildren.reverse();
            localPositions.reverse();
            if (localInRepeat > -1 && localChildren.length > BalanceBranchFactor)
                node = balanceRange(type, type, localChildren, localPositions, 0, localChildren.length, 0, maxBufferLength, end - start, contextHash);
            else
                node = withHash(new Tree(type, localChildren, localPositions, end - start), contextHash);
        }
        children.push(node);
        positions.push(startPos);
    }
    function findBufferSize(maxSize, inRepeat) {
        // Scan through the buffer to find previous siblings that fit
        // together in a TreeBuffer, and don't contain any reused nodes
        // (which can't be stored in a buffer).
        // If `inRepeat` is > -1, ignore node boundaries of that type for
        // nesting, but make sure the end falls either at the start
        // (`maxSize`) or before such a node.
        let fork = cursor.fork();
        let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
        let result = { size: 0, start: 0, skip: 0 };
        scan: for (let minPos = fork.pos - maxSize; fork.pos > minPos;) {
            // Pretend nested repeat nodes of the same type don't exist
            if (fork.id == inRepeat) {
                // Except that we store the current state as a valid return
                // value.
                result.size = size;
                result.start = start;
                result.skip = skip;
                skip += 4;
                size += 4;
                fork.next();
                continue;
            }
            let nodeSize = fork.size, startPos = fork.pos - nodeSize;
            if (nodeSize < 0 || startPos < minPos || fork.start < minStart)
                break;
            let localSkipped = fork.id >= minRepeatType ? 4 : 0;
            let nodeStart = fork.start;
            fork.next();
            while (fork.pos > startPos) {
                if (fork.size < 0)
                    break scan;
                if (fork.id >= minRepeatType)
                    localSkipped += 4;
                fork.next();
            }
            start = nodeStart;
            size += nodeSize;
            skip += localSkipped;
        }
        if (inRepeat < 0 || size == maxSize) {
            result.size = size;
            result.start = start;
            result.skip = skip;
        }
        return result.size > 4 ? result : undefined;
    }
    function copyToBuffer(bufferStart, buffer, index, inRepeat) {
        let { id, start, end, size } = cursor;
        cursor.next();
        if (id == inRepeat)
            return index;
        let startIndex = index;
        if (size > 4) {
            let endPos = cursor.pos - (size - 4);
            while (cursor.pos > endPos)
                index = copyToBuffer(bufferStart, buffer, index, inRepeat);
        }
        if (id < minRepeatType) { // Don't copy repeat nodes into buffers
            buffer[--index] = startIndex;
            buffer[--index] = end - bufferStart;
            buffer[--index] = start - bufferStart;
            buffer[--index] = id;
        }
        return index;
    }
    let children = [], positions = [];
    while (cursor.pos > 0)
        takeNode(data.start || 0, 0, children, positions, -1);
    let length = (_a = data.length) !== null && _a !== void 0 ? _a : (children.length ? positions[0] + children[0].length : 0);
    return new Tree(types[topID], children.reverse(), positions.reverse(), length);
}
function balanceRange(outerType, innerType, children, positions, from, to, start, maxBufferLength, length, contextHash) {
    let localChildren = [], localPositions = [];
    if (length <= maxBufferLength) {
        for (let i = from; i < to; i++) {
            localChildren.push(children[i]);
            localPositions.push(positions[i] - start);
        }
    }
    else {
        let maxChild = Math.max(maxBufferLength, Math.ceil(length * 1.5 / BalanceBranchFactor));
        for (let i = from; i < to;) {
            let groupFrom = i, groupStart = positions[i];
            i++;
            for (; i < to; i++) {
                let nextEnd = positions[i] + children[i].length;
                if (nextEnd - groupStart > maxChild)
                    break;
            }
            if (i == groupFrom + 1) {
                let only = children[groupFrom];
                if (only instanceof Tree && only.type == innerType && only.length > maxChild << 1) { // Too big, collapse
                    for (let j = 0; j < only.children.length; j++) {
                        localChildren.push(only.children[j]);
                        localPositions.push(only.positions[j] + groupStart - start);
                    }
                    continue;
                }
                localChildren.push(only);
            }
            else if (i == groupFrom + 1) {
                localChildren.push(children[groupFrom]);
            }
            else {
                let inner = balanceRange(innerType, innerType, children, positions, groupFrom, i, groupStart, maxBufferLength, positions[i - 1] + children[i - 1].length - groupStart, contextHash);
                if (innerType != NodeType.none && !containsType(inner.children, innerType))
                    inner = withHash(new Tree(NodeType.none, inner.children, inner.positions, inner.length), contextHash);
                localChildren.push(inner);
            }
            localPositions.push(groupStart - start);
        }
    }
    return withHash(new Tree(outerType, localChildren, localPositions, length), contextHash);
}
function containsType(nodes, type) {
    for (let elt of nodes)
        if (elt.type == type)
            return true;
    return false;
}
/// Tree fragments are used during [incremental
/// parsing](#lezer.ParseOptions.fragments) to track parts of old
/// trees that can be reused in a new parse. An array of fragments is
/// used to track regions of an old tree whose nodes might be reused
/// in new parses. Use the static
/// [`applyChanges`](#tree.TreeFragment^applyChanges) method to update
/// fragments for document changes.
class TreeFragment {
    constructor(
    /// The start of the unchanged range pointed to by this fragment.
    /// This refers to an offset in the _updated_ document (as opposed
    /// to the original tree).
    from, 
    /// The end of the unchanged range.
    to, 
    /// The tree that this fragment is based on.
    tree, 
    /// The offset between the fragment's tree and the document that
    /// this fragment can be used against. Add this when going from
    /// document to tree positions, subtract it to go from tree to
    /// document positions.
    offset, open) {
        this.from = from;
        this.to = to;
        this.tree = tree;
        this.offset = offset;
        this.open = open;
    }
    get openStart() { return (this.open & 1 /* Start */) > 0; }
    get openEnd() { return (this.open & 2 /* End */) > 0; }
    /// Apply a set of edits to an array of fragments, removing or
    /// splitting fragments as necessary to remove edited ranges, and
    /// adjusting offsets for fragments that moved.
    static applyChanges(fragments, changes, minGap = 128) {
        if (!changes.length)
            return fragments;
        let result = [];
        let fI = 1, nextF = fragments.length ? fragments[0] : null;
        let cI = 0, pos = 0, off = 0;
        for (;;) {
            let nextC = cI < changes.length ? changes[cI++] : null;
            let nextPos = nextC ? nextC.fromA : 1e9;
            if (nextPos - pos >= minGap)
                while (nextF && nextF.from < nextPos) {
                    let cut = nextF;
                    if (pos >= cut.from || nextPos <= cut.to || off) {
                        let fFrom = Math.max(cut.from, pos) - off, fTo = Math.min(cut.to, nextPos) - off;
                        cut = fFrom >= fTo ? null :
                            new TreeFragment(fFrom, fTo, cut.tree, cut.offset + off, (cI > 0 ? 1 /* Start */ : 0) | (nextC ? 2 /* End */ : 0));
                    }
                    if (cut)
                        result.push(cut);
                    if (nextF.to > nextPos)
                        break;
                    nextF = fI < fragments.length ? fragments[fI++] : null;
                }
            if (!nextC)
                break;
            pos = nextC.toA;
            off = nextC.toA - nextC.toB;
        }
        return result;
    }
    /// Create a set of fragments from a freshly parsed tree, or update
    /// an existing set of fragments by replacing the ones that overlap
    /// with a tree with content from the new tree. When `partial` is
    /// true, the parse is treated as incomplete, and the token at its
    /// end is not included in [`safeTo`](#tree.TreeFragment.safeTo).
    static addTree(tree, fragments = [], partial = false) {
        let result = [new TreeFragment(0, tree.length, tree, 0, partial ? 2 /* End */ : 0)];
        for (let f of fragments)
            if (f.to > tree.length)
                result.push(f);
        return result;
    }
}
// Creates an `Input` that is backed by a single, flat string.
function stringInput(input) { return new StringInput(input); }
class StringInput {
    constructor(string, length = string.length) {
        this.string = string;
        this.length = length;
    }
    get(pos) {
        return pos < 0 || pos >= this.length ? -1 : this.string.charCodeAt(pos);
    }
    lineAfter(pos) {
        if (pos < 0)
            return "";
        let end = this.string.indexOf("\n", pos);
        return this.string.slice(pos, end < 0 ? this.length : Math.min(end, this.length));
    }
    read(from, to) { return this.string.slice(from, Math.min(this.length, to)); }
    clip(at) { return new StringInput(this.string, at); }
}

/**
Node prop stored in a grammar's top syntax node to provide the
facet that stores language data for that language.
*/
const languageDataProp = /*@__PURE__*/new NodeProp();
/**
Helper function to define a facet (to be added to the top syntax
node(s) for a language via
[`languageDataProp`](https://codemirror.net/6/docs/ref/#language.languageDataProp)), that will be
used to associate language data with the language. You
probably only need this when subclassing
[`Language`](https://codemirror.net/6/docs/ref/#language.Language).
*/
function defineLanguageFacet(baseData) {
    return Facet.define({
        combine: baseData ? values => values.concat(baseData) : undefined
    });
}
/**
A language object manages parsing and per-language
[metadata](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt). Parse data is
managed as a [Lezer](https://lezer.codemirror.net) tree. You'll
want to subclass this class for custom parsers, or use the
[`LezerLanguage`](https://codemirror.net/6/docs/ref/#language.LezerLanguage) or
[`StreamLanguage`](https://codemirror.net/6/docs/ref/#stream-parser.StreamLanguage) abstractions for
[Lezer](https://lezer.codemirror.net/) or stream parsers.
*/
class Language {
    /**
    Construct a language object. You usually don't need to invoke
    this directly. But when you do, make sure you use
    [`defineLanguageFacet`](https://codemirror.net/6/docs/ref/#language.defineLanguageFacet) to create
    the first argument.
    */
    constructor(
    /**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) data
    facet used for this language.
    */
    data, parser, 
    /**
    The node type of the top node of trees produced by this parser.
    */
    topNode, extraExtensions = []) {
        this.data = data;
        this.topNode = topNode;
        // Kludge to define EditorState.tree as a debugging helper,
        // without the EditorState package actually knowing about
        // languages and lezer trees.
        if (!EditorState.prototype.hasOwnProperty("tree"))
            Object.defineProperty(EditorState.prototype, "tree", { get() { return syntaxTree(this); } });
        this.parser = parser;
        this.extension = [
            language.of(this),
            EditorState.languageData.of((state, pos) => state.facet(languageDataFacetAt(state, pos)))
        ].concat(extraExtensions);
    }
    /**
    Query whether this language is active at the given position.
    */
    isActiveAt(state, pos) {
        return languageDataFacetAt(state, pos) == this.data;
    }
    /**
    Find the document regions that were parsed using this language.
    The returned regions will _include_ any nested languages rooted
    in this language, when those exist.
    */
    findRegions(state) {
        let lang = state.facet(language);
        if ((lang === null || lang === void 0 ? void 0 : lang.data) == this.data)
            return [{ from: 0, to: state.doc.length }];
        if (!lang || !lang.allowsNesting)
            return [];
        let result = [];
        syntaxTree(state).iterate({
            enter: (type, from, to) => {
                if (type.isTop && type.prop(languageDataProp) == this.data) {
                    result.push({ from, to });
                    return false;
                }
                return undefined;
            }
        });
        return result;
    }
    /**
    Indicates whether this language allows nested languages. The
    default implementation returns true.
    */
    get allowsNesting() { return true; }
    /**
    Use this language to parse the given string into a tree.
    */
    parseString(code) {
        let doc = Text.of(code.split("\n"));
        let parse = this.parser.startParse(new DocInput(doc), 0, new EditorParseContext(this.parser, EditorState.create({ doc }), [], Tree.empty, { from: 0, to: code.length }, [], null));
        let tree;
        while (!(tree = parse.advance())) { }
        return tree;
    }
}
/**
@internal
*/
Language.setState = /*@__PURE__*/StateEffect.define();
function languageDataFacetAt(state, pos) {
    let topLang = state.facet(language);
    if (!topLang)
        return null;
    if (!topLang.allowsNesting)
        return topLang.data;
    let tree = syntaxTree(state);
    let target = tree.resolve(pos, -1);
    while (target) {
        let facet = target.type.prop(languageDataProp);
        if (facet)
            return facet;
        target = target.parent;
    }
    return topLang.data;
}
/**
A subclass of [`Language`](https://codemirror.net/6/docs/ref/#language.Language) for use with
[Lezer](https://lezer.codemirror.net/docs/ref#lezer.Parser)
parsers.
*/
class LezerLanguage extends Language {
    constructor(data, parser) {
        super(data, parser, parser.topNode);
        this.parser = parser;
    }
    /**
    Define a language from a parser.
    */
    static define(spec) {
        let data = defineLanguageFacet(spec.languageData);
        return new LezerLanguage(data, spec.parser.configure({
            props: [languageDataProp.add(type => type.isTop ? data : undefined)]
        }));
    }
    /**
    Create a new instance of this language with a reconfigured
    version of its parser.
    */
    configure(options) {
        return new LezerLanguage(this.data, this.parser.configure(options));
    }
    get allowsNesting() { return this.parser.hasNested; }
}
/**
Get the syntax tree for a state, which is the current (possibly
incomplete) parse tree of active [language](https://codemirror.net/6/docs/ref/#language.Language),
or the empty tree if there is no language available.
*/
function syntaxTree(state) {
    let field = state.field(Language.state, false);
    return field ? field.tree : Tree.empty;
}
// Lezer-style Input object for a Text document.
class DocInput {
    constructor(doc, length = doc.length) {
        this.doc = doc;
        this.length = length;
        this.cursorPos = 0;
        this.string = "";
        this.prevString = "";
        this.cursor = doc.iter();
    }
    syncTo(pos) {
        if (pos < this.cursorPos) { // Reset the cursor if we have to go back
            this.cursor = this.doc.iter();
            this.cursorPos = 0;
        }
        this.prevString = pos == this.cursorPos ? this.string : "";
        this.string = this.cursor.next(pos - this.cursorPos).value;
        this.cursorPos = pos + this.string.length;
        return this.cursorPos - this.string.length;
    }
    get(pos) {
        if (pos >= this.length)
            return -1;
        let stringStart = this.cursorPos - this.string.length;
        if (pos < stringStart || pos >= this.cursorPos) {
            if (pos < stringStart && pos >= stringStart - this.prevString.length)
                return this.prevString.charCodeAt(pos - (stringStart - this.prevString.length));
            stringStart = this.syncTo(pos);
        }
        return this.string.charCodeAt(pos - stringStart);
    }
    lineAfter(pos) {
        if (pos >= this.length || pos < 0)
            return "";
        let stringStart = this.cursorPos - this.string.length;
        if (pos < stringStart || pos >= this.cursorPos)
            stringStart = this.syncTo(pos);
        return this.cursor.lineBreak ? "" : this.string.slice(pos - stringStart, Math.min(this.length - stringStart, this.string.length));
    }
    read(from, to) {
        let stringStart = this.cursorPos - this.string.length;
        if (from < stringStart || to >= this.cursorPos)
            return this.doc.sliceString(from, to);
        else
            return this.string.slice(from - stringStart, to - stringStart);
    }
    clip(at) {
        return new DocInput(this.doc, at);
    }
}
/**
A parse context provided to parsers working on the editor content.
*/
class EditorParseContext {
    /**
    @internal
    */
    constructor(parser, 
    /**
    The current editor state.
    */
    state, 
    /**
    Tree fragments that can be reused by incremental re-parses.
    */
    fragments = [], 
    /**
    @internal
    */
    tree, 
    /**
    The current editor viewport (or some overapproximation
    thereof). Intended to be used for opportunistically avoiding
    work (in which case
    [`skipUntilInView`](https://codemirror.net/6/docs/ref/#language.EditorParseContext.skipUntilInView)
    should be called to make sure the parser is restarted when the
    skipped region becomes visible).
    */
    viewport, 
    /**
    @internal
    */
    skipped, 
    /**
    This is where skipping parsers can register a promise that,
    when resolved, will schedule a new parse. It is cleared when
    the parse worker picks up the promise. @internal
    */
    scheduleOn) {
        this.parser = parser;
        this.state = state;
        this.fragments = fragments;
        this.tree = tree;
        this.viewport = viewport;
        this.skipped = skipped;
        this.scheduleOn = scheduleOn;
        this.parse = null;
        /**
        @internal
        */
        this.tempSkipped = [];
    }
    /**
    @internal
    */
    work(time, upto) {
        if (this.tree != Tree.empty && (upto == null ? this.tree.length == this.state.doc.length : this.tree.length >= upto)) {
            this.takeTree();
            return true;
        }
        if (!this.parse)
            this.parse = this.parser.startParse(new DocInput(this.state.doc), 0, this);
        let endTime = Date.now() + time;
        for (;;) {
            let done = this.parse.advance();
            if (done) {
                this.fragments = this.withoutTempSkipped(TreeFragment.addTree(done));
                this.parse = null;
                this.tree = done;
                return true;
            }
            else if (upto != null && this.parse.pos >= upto) {
                this.takeTree();
                return true;
            }
            if (Date.now() > endTime)
                return false;
        }
    }
    /**
    @internal
    */
    takeTree() {
        if (this.parse && this.parse.pos > this.tree.length) {
            this.tree = this.parse.forceFinish();
            this.fragments = this.withoutTempSkipped(TreeFragment.addTree(this.tree, this.fragments, true));
        }
    }
    withoutTempSkipped(fragments) {
        for (let r; r = this.tempSkipped.pop();)
            fragments = cutFragments(fragments, r.from, r.to);
        return fragments;
    }
    /**
    @internal
    */
    changes(changes, newState) {
        let { fragments, tree, viewport, skipped } = this;
        this.takeTree();
        if (!changes.empty) {
            let ranges = [];
            changes.iterChangedRanges((fromA, toA, fromB, toB) => ranges.push({ fromA, toA, fromB, toB }));
            fragments = TreeFragment.applyChanges(fragments, ranges);
            tree = Tree.empty;
            viewport = { from: changes.mapPos(viewport.from, -1), to: changes.mapPos(viewport.to, 1) };
            if (this.skipped.length) {
                skipped = [];
                for (let r of this.skipped) {
                    let from = changes.mapPos(r.from, 1), to = changes.mapPos(r.to, -1);
                    if (from < to)
                        skipped.push({ from, to });
                }
            }
        }
        return new EditorParseContext(this.parser, newState, fragments, tree, viewport, skipped, this.scheduleOn);
    }
    /**
    @internal
    */
    updateViewport(viewport) {
        this.viewport = viewport;
        let startLen = this.skipped.length;
        for (let i = 0; i < this.skipped.length; i++) {
            let { from, to } = this.skipped[i];
            if (from < viewport.to && to > viewport.from) {
                this.fragments = cutFragments(this.fragments, from, to);
                this.skipped.splice(i--, 1);
            }
        }
        return this.skipped.length < startLen;
    }
    /**
    @internal
    */
    reset() {
        if (this.parse) {
            this.takeTree();
            this.parse = null;
        }
    }
    /**
    Notify the parse scheduler that the given region was skipped
    because it wasn't in view, and the parse should be restarted
    when it comes into view.
    */
    skipUntilInView(from, to) {
        this.skipped.push({ from, to });
    }
    /**
    Returns a parser intended to be used as placeholder when
    asynchronously loading a nested parser. It'll skip its input and
    mark it as not-really-parsed, so that the next update will parse
    it again.
    
    When `until` is given, a reparse will be scheduled when that
    promise resolves.
    */
    static getSkippingParser(until) {
        return {
            startParse(input, startPos, context) {
                return {
                    pos: startPos,
                    advance() {
                        let ecx = context;
                        ecx.tempSkipped.push({ from: startPos, to: input.length });
                        if (until)
                            ecx.scheduleOn = ecx.scheduleOn ? Promise.all([ecx.scheduleOn, until]) : until;
                        this.pos = input.length;
                        return new Tree(NodeType.none, [], [], input.length - startPos);
                    },
                    forceFinish() { return this.advance(); }
                };
            }
        };
    }
    /**
    @internal
    */
    movedPast(pos) {
        return this.tree.length < pos && this.parse && this.parse.pos >= pos;
    }
}
/**
FIXME backwards compatible shim, remove on next major @internal
*/
EditorParseContext.skippingParser = /*@__PURE__*/EditorParseContext.getSkippingParser();
function cutFragments(fragments, from, to) {
    return TreeFragment.applyChanges(fragments, [{ fromA: from, toA: to, fromB: from, toB: to }]);
}
class LanguageState {
    constructor(
    // A mutable parse state that is used to preserve work done during
    // the lifetime of a state when moving to the next state.
    context) {
        this.context = context;
        this.tree = context.tree;
    }
    apply(tr) {
        if (!tr.docChanged)
            return this;
        let newCx = this.context.changes(tr.changes, tr.state);
        // If the previous parse wasn't done, go forward only up to its
        // end position or the end of the viewport, to avoid slowing down
        // state updates with parse work beyond the viewport.
        let upto = this.context.tree.length == tr.startState.doc.length ? undefined
            : Math.max(tr.changes.mapPos(this.context.tree.length), newCx.viewport.to);
        if (!newCx.work(25 /* Apply */, upto))
            newCx.takeTree();
        return new LanguageState(newCx);
    }
    static init(state) {
        let parseState = new EditorParseContext(state.facet(language).parser, state, [], Tree.empty, { from: 0, to: state.doc.length }, [], null);
        if (!parseState.work(25 /* Apply */))
            parseState.takeTree();
        return new LanguageState(parseState);
    }
}
Language.state = /*@__PURE__*/StateField.define({
    create: LanguageState.init,
    update(value, tr) {
        for (let e of tr.effects)
            if (e.is(Language.setState))
                return e.value;
        if (tr.startState.facet(language) != tr.state.facet(language))
            return LanguageState.init(tr.state);
        return value.apply(tr);
    }
});
let requestIdle = typeof window != "undefined" && window.requestIdleCallback ||
    ((callback, { timeout }) => setTimeout(callback, timeout));
let cancelIdle = typeof window != "undefined" && window.cancelIdleCallback || clearTimeout;
const parseWorker = /*@__PURE__*/ViewPlugin.fromClass(class ParseWorker {
    constructor(view) {
        this.view = view;
        this.working = -1;
        // End of the current time chunk
        this.chunkEnd = -1;
        // Milliseconds of budget left for this chunk
        this.chunkBudget = -1;
        this.work = this.work.bind(this);
        this.scheduleWork();
    }
    update(update) {
        let cx = this.view.state.field(Language.state).context;
        if (update.viewportChanged) {
            if (cx.updateViewport(update.view.viewport))
                cx.reset();
            if (this.view.viewport.to > cx.tree.length)
                this.scheduleWork();
        }
        if (update.docChanged) {
            if (this.view.hasFocus)
                this.chunkBudget += 50 /* ChangeBonus */;
            this.scheduleWork();
        }
        this.checkAsyncSchedule(cx);
    }
    scheduleWork() {
        if (this.working > -1)
            return;
        let { state } = this.view, field = state.field(Language.state), frags = field.context.fragments;
        if (field.tree.length >= state.doc.length && frags.length && frags[0].from == 0 && frags[0].to >= state.doc.length)
            return;
        this.working = requestIdle(this.work, { timeout: 500 /* Pause */ });
    }
    work(deadline) {
        this.working = -1;
        let now = Date.now();
        if (this.chunkEnd < now && (this.chunkEnd < 0 || this.view.hasFocus)) { // Start a new chunk
            this.chunkEnd = now + 30000 /* ChunkTime */;
            this.chunkBudget = 3000 /* ChunkBudget */;
        }
        if (this.chunkBudget <= 0)
            return; // No more budget
        let { state, viewport: { to: vpTo } } = this.view, field = state.field(Language.state);
        if (field.tree.length >= vpTo + 1000000 /* MaxParseAhead */)
            return;
        let time = Math.min(this.chunkBudget, deadline ? Math.max(25 /* MinSlice */, deadline.timeRemaining()) : 100 /* Slice */);
        let done = field.context.work(time, vpTo + 1000000 /* MaxParseAhead */);
        this.chunkBudget -= Date.now() - now;
        if (done || this.chunkBudget <= 0 || field.context.movedPast(vpTo)) {
            field.context.takeTree();
            this.view.dispatch({ effects: Language.setState.of(new LanguageState(field.context)) });
        }
        if (!done && this.chunkBudget > 0)
            this.scheduleWork();
        this.checkAsyncSchedule(field.context);
    }
    checkAsyncSchedule(cx) {
        if (cx.scheduleOn) {
            cx.scheduleOn.then(() => this.scheduleWork());
            cx.scheduleOn = null;
        }
    }
    destroy() {
        if (this.working >= 0)
            cancelIdle(this.working);
    }
}, {
    eventHandlers: { focus() { this.scheduleWork(); } }
});
/**
The facet used to associate a language with an editor state.
*/
const language = /*@__PURE__*/Facet.define({
    combine(languages) { return languages.length ? languages[0] : null; },
    enables: [Language.state, parseWorker]
});
/**
This class bundles a [language object](https://codemirror.net/6/docs/ref/#language.Language) with an
optional set of supporting extensions. Language packages are
encouraged to export a function that optionally takes a
configuration object and returns a `LanguageSupport` instance, as
the main way for client code to use the package.
*/
class LanguageSupport {
    /**
    Create a support object.
    */
    constructor(
    /**
    The language object.
    */
    language, 
    /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */
    support = []) {
        this.language = language;
        this.support = support;
        this.extension = [language, support];
    }
}

/**
Facet that defines a way to provide a function that computes the
appropriate indentation depth at the start of a given line, or
`null` to indicate no appropriate indentation could be determined.
*/
const indentService = /*@__PURE__*/Facet.define();
/**
Facet for overriding the unit by which indentation happens.
Should be a string consisting either entirely of spaces or
entirely of tabs. When not set, this defaults to 2 spaces.
*/
const indentUnit = /*@__PURE__*/Facet.define({
    combine: values => {
        if (!values.length)
            return "  ";
        if (!/^(?: +|\t+)$/.test(values[0]))
            throw new Error("Invalid indent unit: " + JSON.stringify(values[0]));
        return values[0];
    }
});
/**
Return the _column width_ of an indent unit in the state.
Determined by the [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit)
facet, and [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) when that
contains tabs.
*/
function getIndentUnit(state) {
    let unit = state.facet(indentUnit);
    return unit.charCodeAt(0) == 9 ? state.tabSize * unit.length : unit.length;
}
/**
Create an indentation string that covers columns 0 to `cols`.
Will use tabs for as much of the columns as possible when the
[`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit) facet contains
tabs.
*/
function indentString(state, cols) {
    let result = "", ts = state.tabSize;
    if (state.facet(indentUnit).charCodeAt(0) == 9)
        while (cols >= ts) {
            result += "\t";
            cols -= ts;
        }
    for (let i = 0; i < cols; i++)
        result += " ";
    return result;
}
/**
Get the indentation at the given position. Will first consult any
[indent services](https://codemirror.net/6/docs/ref/#language.indentService) that are registered,
and if none of those return an indentation, this will check the
syntax tree for the [indent node prop](https://codemirror.net/6/docs/ref/#language.indentNodeProp)
and use that if found. Returns a number when an indentation could
be determined, and null otherwise.
*/
function getIndentation(context, pos) {
    if (context instanceof EditorState)
        context = new IndentContext(context);
    for (let service of context.state.facet(indentService)) {
        let result = service(context, pos);
        if (result != null)
            return result;
    }
    let tree = syntaxTree(context.state);
    return tree ? syntaxIndentation(context, tree, pos) : null;
}
/**
Indentation contexts are used when calling [indentation
services](https://codemirror.net/6/docs/ref/#language.indentService). They provide helper utilities
useful in indentation logic, and can selectively override the
indentation reported for some lines.
*/
class IndentContext {
    /**
    Create an indent context.
    */
    constructor(
    /**
    The editor state.
    */
    state, 
    /**
    @internal
    */
    options = {}) {
        this.state = state;
        this.options = options;
        this.unit = getIndentUnit(state);
    }
    /**
    Get the text directly after `pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    textAfterPos(pos) {
        var _a, _b;
        let sim = (_a = this.options) === null || _a === void 0 ? void 0 : _a.simulateBreak;
        if (pos == sim && ((_b = this.options) === null || _b === void 0 ? void 0 : _b.simulateDoubleBreak))
            return "";
        return this.state.sliceDoc(pos, Math.min(pos + 100, sim != null && sim > pos ? sim : 1e9, this.state.doc.lineAt(pos).to));
    }
    /**
    Find the column for the given position.
    */
    column(pos) {
        var _a;
        let line = this.state.doc.lineAt(pos), text = line.text.slice(0, pos - line.from);
        let result = this.countColumn(text, pos - line.from);
        let override = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.overrideIndentation) ? this.options.overrideIndentation(line.from) : -1;
        if (override > -1)
            result += override - this.countColumn(text, text.search(/\S/));
        return result;
    }
    /**
    find the column position (taking tabs into account) of the given
    position in the given string.
    */
    countColumn(line, pos) {
        return countColumn(pos < 0 ? line : line.slice(0, pos), 0, this.state.tabSize);
    }
    /**
    Find the indentation column of the given document line.
    */
    lineIndent(line) {
        var _a;
        let override = (_a = this.options) === null || _a === void 0 ? void 0 : _a.overrideIndentation;
        if (override) {
            let overriden = override(line.from);
            if (overriden > -1)
                return overriden;
        }
        return this.countColumn(line.text, line.text.search(/\S/));
    }
}
/**
A syntax tree node prop used to associate indentation strategies
with node types. Such a strategy is a function from an indentation
context to a column number or null, where null indicates that no
definitive indentation can be determined.
*/
const indentNodeProp = /*@__PURE__*/new NodeProp();
// Compute the indentation for a given position from the syntax tree.
function syntaxIndentation(cx, ast, pos) {
    let tree = ast.resolve(pos);
    // Enter previous nodes that end in empty error terms, which means
    // they were broken off by error recovery, so that indentation
    // works even if the constructs haven't been finished.
    for (let scan = tree, scanPos = pos;;) {
        let last = scan.childBefore(scanPos);
        if (!last)
            break;
        if (last.type.isError && last.from == last.to) {
            tree = scan;
            scanPos = last.from;
        }
        else {
            scan = last;
            scanPos = scan.to + 1;
        }
    }
    return indentFrom(tree, pos, cx);
}
function ignoreClosed(cx) {
    var _a, _b;
    return cx.pos == ((_a = cx.options) === null || _a === void 0 ? void 0 : _a.simulateBreak) && ((_b = cx.options) === null || _b === void 0 ? void 0 : _b.simulateDoubleBreak);
}
function indentStrategy(tree) {
    let strategy = tree.type.prop(indentNodeProp);
    if (strategy)
        return strategy;
    let first = tree.firstChild, close;
    if (first && (close = first.type.prop(NodeProp.closedBy))) {
        let last = tree.lastChild, closed = last && close.indexOf(last.name) > -1;
        return cx => delimitedStrategy(cx, true, 1, undefined, closed && !ignoreClosed(cx) ? last.from : undefined);
    }
    return tree.parent == null ? topIndent : null;
}
function indentFrom(node, pos, base) {
    for (; node; node = node.parent) {
        let strategy = indentStrategy(node);
        if (strategy)
            return strategy(new TreeIndentContext(base, pos, node));
    }
    return null;
}
function topIndent() { return 0; }
/**
Objects of this type provide context information and helper
methods to indentation functions.
*/
class TreeIndentContext extends IndentContext {
    /**
    @internal
    */
    constructor(base, 
    /**
    The position at which indentation is being computed.
    */
    pos, 
    /**
    The syntax tree node to which the indentation strategy
    applies.
    */
    node) {
        super(base.state, base.options);
        this.base = base;
        this.pos = pos;
        this.node = node;
    }
    /**
    Get the text directly after `this.pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    get textAfter() {
        return this.textAfterPos(this.pos);
    }
    /**
    Get the indentation at the reference line for `this.node`, which
    is the line on which it starts, unless there is a node that is
    _not_ a parent of this node covering the start of that line. If
    so, the line at the start of that node is tried, again skipping
    on if it is covered by another such node.
    */
    get baseIndent() {
        let line = this.state.doc.lineAt(this.node.from);
        // Skip line starts that are covered by a sibling (or cousin, etc)
        for (;;) {
            let atBreak = this.node.resolve(line.from);
            while (atBreak.parent && atBreak.parent.from == atBreak.from)
                atBreak = atBreak.parent;
            if (isParent(atBreak, this.node))
                break;
            line = this.state.doc.lineAt(atBreak.from);
        }
        return this.lineIndent(line);
    }
    /**
    Continue looking for indentations in the node's parent nodes,
    and return the result of that.
    */
    continue() {
        let parent = this.node.parent;
        return parent ? indentFrom(parent, this.pos, this.base) : 0;
    }
}
function isParent(parent, of) {
    for (let cur = of; cur; cur = cur.parent)
        if (parent == cur)
            return true;
    return false;
}
// Check whether a delimited node is aligned (meaning there are
// non-skipped nodes on the same line as the opening delimiter). And
// if so, return the opening token.
function bracketedAligned(context) {
    var _a;
    let tree = context.node;
    let openToken = tree.childAfter(tree.from), last = tree.lastChild;
    if (!openToken)
        return null;
    let sim = (_a = context.options) === null || _a === void 0 ? void 0 : _a.simulateBreak;
    let openLine = context.state.doc.lineAt(openToken.from);
    let lineEnd = sim == null || sim <= openLine.from ? openLine.to : Math.min(openLine.to, sim);
    for (let pos = openToken.to;;) {
        let next = tree.childAfter(pos);
        if (!next || next == last)
            return null;
        if (!next.type.isSkipped)
            return next.from < lineEnd ? openToken : null;
        pos = next.to;
    }
}
/**
An indentation strategy for delimited (usually bracketed) nodes.
Will, by default, indent one unit more than the parent's base
indent unless the line starts with a closing token. When `align`
is true and there are non-skipped nodes on the node's opening
line, the content of the node will be aligned with the end of the
opening node, like this:

    foo(bar,
        baz)
*/
function delimitedIndent({ closing, align = true, units = 1 }) {
    return (context) => delimitedStrategy(context, align, units, closing);
}
function delimitedStrategy(context, align, units, closing, closedAt) {
    let after = context.textAfter, space = after.match(/^\s*/)[0].length;
    let closed = closing && after.slice(space, space + closing.length) == closing || closedAt == context.pos + space;
    let aligned = align ? bracketedAligned(context) : null;
    if (aligned)
        return closed ? context.column(aligned.from) : context.column(aligned.to);
    return context.baseIndent + (closed ? 0 : context.unit * units);
}
/**
An indentation strategy that aligns a node's content to its base
indentation.
*/
const flatIndent = (context) => context.baseIndent;
/**
Creates an indentation strategy that, by default, indents
continued lines one unit more than the node's base indentation.
You can provide `except` to prevent indentation of lines that
match a pattern (for example `/^else\b/` in `if`/`else`
constructs), and you can change the amount of units used with the
`units` option.
*/
function continuedIndent({ except, units = 1 } = {}) {
    return (context) => {
        let matchExcept = except && except.test(context.textAfter);
        return context.baseIndent + (matchExcept ? 0 : units * context.unit);
    };
}
const DontIndentBeyond = 200;
/**
Enables reindentation on input. When a language defines an
`indentOnInput` field in its [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt), which must hold a regular
expression, the line at the cursor will be reindented whenever new
text is typed and the input from the start of the line up to the
cursor matches that regexp.

To avoid unneccesary reindents, it is recommended to start the
regexp with `^` (usually followed by `\s*`), and end it with `$`.
For example, `/^\s*\}$/` will reindent when a closing brace is
added at the start of a line.
*/
function indentOnInput() {
    return EditorState.transactionFilter.of(tr => {
        if (!tr.docChanged || tr.annotation(Transaction.userEvent) != "input")
            return tr;
        let rules = tr.startState.languageDataAt("indentOnInput", tr.startState.selection.main.head);
        if (!rules.length)
            return tr;
        let doc = tr.newDoc, { head } = tr.newSelection.main, line = doc.lineAt(head);
        if (head > line.from + DontIndentBeyond)
            return tr;
        let lineStart = doc.sliceString(line.from, head);
        if (!rules.some(r => r.test(lineStart)))
            return tr;
        let { state } = tr, last = -1, changes = [];
        for (let { head } of state.selection.ranges) {
            let line = state.doc.lineAt(head);
            if (line.from == last)
                continue;
            last = line.from;
            let indent = getIndentation(state, line.from);
            if (indent == null)
                continue;
            let cur = /^\s*/.exec(line.text)[0];
            let norm = indentString(state, indent);
            if (cur != norm)
                changes.push({ from: line.from, to: line.from + cur.length, insert: norm });
        }
        return changes.length ? [tr, { changes }] : tr;
    });
}

/**
A facet that registers a code folding service. When called with
the extent of a line, such a function should return a foldable
range that starts on that line (but continues beyond it), if one
can be found.
*/
const foldService = /*@__PURE__*/Facet.define();
/**
This node prop is used to associate folding information with
syntax node types. Given a syntax node, it should check whether
that tree is foldable and return the range that can be collapsed
when it is.
*/
const foldNodeProp = /*@__PURE__*/new NodeProp();
/**
[Fold](https://codemirror.net/6/docs/ref/#language.foldNodeProp) function that folds everything but
the first and the last child of a syntax node. Useful for nodes
that start and end with delimiters.
*/
function foldInside(node) {
    let first = node.firstChild, last = node.lastChild;
    return first && first.to < last.from ? { from: first.to, to: last.type.isError ? node.to : last.from } : null;
}
function syntaxFolding(state, start, end) {
    let tree = syntaxTree(state);
    if (tree.length == 0)
        return null;
    let inner = tree.resolve(end);
    let found = null;
    for (let cur = inner; cur; cur = cur.parent) {
        if (cur.to <= end || cur.from > end)
            continue;
        if (found && cur.from < start)
            break;
        let prop = cur.type.prop(foldNodeProp);
        if (prop) {
            let value = prop(cur, state);
            if (value && value.from <= end && value.from >= start && value.to > end)
                found = value;
        }
    }
    return found;
}
/**
Check whether the given line is foldable. First asks any fold
services registered through
[`foldService`](https://codemirror.net/6/docs/ref/#language.foldService), and if none of them return
a result, tries to query the [fold node
prop](https://codemirror.net/6/docs/ref/#language.foldNodeProp) of syntax nodes that cover the end
of the line.
*/
function foldable(state, lineStart, lineEnd) {
    for (let service of state.facet(foldService)) {
        let result = service(state, lineStart, lineEnd);
        if (result)
            return result;
    }
    return syntaxFolding(state, lineStart, lineEnd);
}

const ios = typeof navigator != "undefined" &&
    !/Edge\/(\d+)/.exec(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) &&
    (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);
const Outside = "-10000px";
const tooltipPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.view = view;
        this.inView = true;
        this.measureReq = { read: this.readMeasure.bind(this), write: this.writeMeasure.bind(this), key: this };
        this.input = view.state.facet(showTooltip);
        this.tooltips = this.input.filter(t => t);
        this.tooltipViews = this.tooltips.map(tp => this.createTooltip(tp));
    }
    update(update) {
        let input = update.state.facet(showTooltip);
        if (input == this.input) {
            for (let t of this.tooltipViews)
                if (t.update)
                    t.update(update);
        }
        else {
            let tooltips = input.filter(x => x);
            let views = [];
            for (let i = 0; i < tooltips.length; i++) {
                let tip = tooltips[i], known = -1;
                if (!tip)
                    continue;
                for (let i = 0; i < this.tooltips.length; i++) {
                    let other = this.tooltips[i];
                    if (other && other.create == tip.create)
                        known = i;
                }
                if (known < 0) {
                    views[i] = this.createTooltip(tip);
                }
                else {
                    let tooltipView = views[i] = this.tooltipViews[known];
                    if (tooltipView.update)
                        tooltipView.update(update);
                }
            }
            for (let t of this.tooltipViews)
                if (views.indexOf(t) < 0)
                    t.dom.remove();
            this.input = input;
            this.tooltips = tooltips;
            this.tooltipViews = views;
            this.maybeMeasure();
        }
    }
    createTooltip(tooltip) {
        let tooltipView = tooltip.create(this.view);
        tooltipView.dom.classList.add("cm-tooltip");
        // FIXME drop this on the next breaking release
        if (tooltip.class)
            tooltipView.dom.classList.add(tooltip.class);
        tooltipView.dom.style.top = Outside;
        this.view.dom.appendChild(tooltipView.dom);
        if (tooltipView.mount)
            tooltipView.mount(this.view);
        return tooltipView;
    }
    destroy() {
        for (let { dom } of this.tooltipViews)
            dom.remove();
    }
    readMeasure() {
        return {
            editor: this.view.dom.getBoundingClientRect(),
            pos: this.tooltips.map(t => this.view.coordsAtPos(t.pos)),
            size: this.tooltipViews.map(({ dom }) => dom.getBoundingClientRect()),
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
        };
    }
    writeMeasure(measured) {
        let { editor } = measured;
        for (let i = 0; i < this.tooltipViews.length; i++) {
            let tooltip = this.tooltips[i], tView = this.tooltipViews[i], { dom } = tView;
            let pos = measured.pos[i], size = measured.size[i];
            // Hide tooltips that are outside of the editor.
            if (!pos || pos.bottom <= editor.top || pos.top >= editor.bottom || pos.right <= editor.left || pos.left >= editor.right) {
                dom.style.top = Outside;
                continue;
            }
            let width = size.right - size.left, height = size.bottom - size.top;
            let left = this.view.textDirection == Direction.LTR ? Math.min(pos.left, measured.innerWidth - width)
                : Math.max(0, pos.left - width);
            let above = !!tooltip.above;
            if (!tooltip.strictSide &&
                (above ? pos.top - (size.bottom - size.top) < 0 : pos.bottom + (size.bottom - size.top) > measured.innerHeight))
                above = !above;
            if (ios) {
                dom.style.top = ((above ? pos.top - height : pos.bottom) - editor.top) + "px";
                dom.style.left = (left - editor.left) + "px";
                dom.style.position = "absolute";
            }
            else {
                dom.style.top = (above ? pos.top - height : pos.bottom) + "px";
                dom.style.left = left + "px";
            }
            dom.classList.toggle("cm-tooltip-above", above);
            dom.classList.toggle("cm-tooltip-below", !above);
            if (tView.positioned)
                tView.positioned();
        }
    }
    maybeMeasure() {
        if (this.tooltips.length) {
            if (this.view.inView || this.inView)
                this.view.requestMeasure(this.measureReq);
            this.inView = this.view.inView;
        }
    }
}, {
    eventHandlers: {
        scroll() { this.maybeMeasure(); }
    }
});
const baseTheme = EditorView.baseTheme({
    ".cm-tooltip": {
        position: "fixed",
        zIndex: 100
    },
    "&light .cm-tooltip": {
        border: "1px solid #ddd",
        backgroundColor: "#f5f5f5"
    },
    "&dark .cm-tooltip": {
        backgroundColor: "#333338",
        color: "white"
    }
});
/**
Behavior by which an extension can provide a tooltip to be shown.
*/
const showTooltip = Facet.define({
    enables: [tooltipPlugin, baseTheme]
});
const HoverTime = 750, HoverMaxDist = 6;
class HoverPlugin {
    constructor(view, source, field, setHover) {
        this.view = view;
        this.source = source;
        this.field = field;
        this.setHover = setHover;
        this.lastMouseMove = null;
        this.hoverTimeout = -1;
        this.restartTimeout = -1;
        this.pending = null;
        this.checkHover = this.checkHover.bind(this);
        view.dom.addEventListener("mouseleave", this.mouseleave = this.mouseleave.bind(this));
        view.dom.addEventListener("mousemove", this.mousemove = this.mousemove.bind(this));
    }
    update() {
        if (this.pending) {
            this.pending = null;
            clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => this.startHover(), 20);
        }
    }
    get active() {
        return this.view.state.field(this.field);
    }
    checkHover() {
        this.hoverTimeout = -1;
        if (this.active)
            return;
        let now = Date.now(), lastMove = this.lastMouseMove;
        if (now - lastMove.timeStamp < HoverTime)
            this.hoverTimeout = setTimeout(this.checkHover, HoverTime - (now - lastMove.timeStamp));
        else
            this.startHover();
    }
    startHover() {
        var _a;
        clearTimeout(this.restartTimeout);
        let lastMove = this.lastMouseMove;
        let coords = { x: lastMove.clientX, y: lastMove.clientY };
        let pos = this.view.contentDOM.contains(lastMove.target)
            ? this.view.posAtCoords(coords) : null;
        if (pos == null)
            return;
        let posCoords = this.view.coordsAtPos(pos);
        if (posCoords == null || coords.y < posCoords.top || coords.y > posCoords.bottom ||
            coords.x < posCoords.left - this.view.defaultCharacterWidth ||
            coords.x > posCoords.right + this.view.defaultCharacterWidth)
            return;
        let bidi = this.view.bidiSpans(this.view.state.doc.lineAt(pos)).find(s => s.from <= pos && s.to >= pos);
        let rtl = bidi && bidi.dir == Direction.RTL ? -1 : 1;
        let open = this.source(this.view, pos, (coords.x < posCoords.left ? -rtl : rtl));
        if ((_a = open) === null || _a === void 0 ? void 0 : _a.then) {
            let pending = this.pending = { pos };
            open.then(result => {
                if (this.pending == pending) {
                    this.pending = null;
                    if (result)
                        this.view.dispatch({ effects: this.setHover.of(result) });
                }
            }, e => logException(this.view.state, e, "hover tooltip"));
        }
        else if (open) {
            this.view.dispatch({ effects: this.setHover.of(open) });
        }
    }
    mousemove(event) {
        var _a;
        this.lastMouseMove = event;
        if (this.hoverTimeout < 0)
            this.hoverTimeout = setTimeout(this.checkHover, HoverTime);
        let tooltip = this.active;
        if (tooltip && !isInTooltip(event.target) || this.pending) {
            let { pos } = tooltip || this.pending, end = (_a = tooltip === null || tooltip === void 0 ? void 0 : tooltip.end) !== null && _a !== void 0 ? _a : pos;
            if ((pos == end ? this.view.posAtCoords({ x: event.clientX, y: event.clientY }) != pos
                : !isOverRange(this.view, pos, end, event.clientX, event.clientY, HoverMaxDist))) {
                this.view.dispatch({ effects: this.setHover.of(null) });
                this.pending = null;
            }
        }
    }
    mouseleave() {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = -1;
        if (this.active)
            this.view.dispatch({ effects: this.setHover.of(null) });
    }
    destroy() {
        clearTimeout(this.hoverTimeout);
        this.view.dom.removeEventListener("mouseleave", this.mouseleave);
        this.view.dom.removeEventListener("mousemove", this.mousemove);
    }
}
function isInTooltip(elt) {
    for (let cur = elt; cur; cur = cur.parentNode)
        if (cur.nodeType == 1 && cur.classList.contains("cm-tooltip"))
            return true;
    return false;
}
function isOverRange(view, from, to, x, y, margin) {
    let range = document.createRange();
    let fromDOM = view.domAtPos(from), toDOM = view.domAtPos(to);
    range.setEnd(toDOM.node, toDOM.offset);
    range.setStart(fromDOM.node, fromDOM.offset);
    let rects = range.getClientRects();
    range.detach();
    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        let dist = Math.max(rect.top - y, y - rect.bottom, rect.left - x, x - rect.right);
        if (dist <= margin)
            return true;
    }
    return false;
}
/**
Enable a hover tooltip, which shows up when the pointer hovers
over ranges of text. The callback is called when the mouse hovers
over the document text. It should, if there is a tooltip
associated with position `pos` return the tooltip description
(either directly or in a promise). The `side` argument indicates
on which side of the position the pointer is—it will be -1 if the
pointer is before the position, 1 if after the position.
*/
function hoverTooltip(source, options = {}) {
    const setHover = StateEffect.define();
    const hoverState = StateField.define({
        create() { return null; },
        update(value, tr) {
            if (value && (options.hideOnChange && (tr.docChanged || tr.selection)))
                return null;
            for (let effect of tr.effects)
                if (effect.is(setHover))
                    return effect.value;
            if (value && tr.docChanged) {
                let newPos = tr.changes.mapPos(value.pos, -1, MapMode.TrackDel);
                if (newPos == null)
                    return null;
                let copy = Object.assign(Object.create(null), value);
                copy.pos = newPos;
                if (value.end != null)
                    copy.end = tr.changes.mapPos(value.end);
                return copy;
            }
            return value;
        },
        provide: f => showTooltip.from(f)
    });
    return [
        hoverState,
        ViewPlugin.define(view => new HoverPlugin(view, source, hoverState, setHover))
    ];
}

/**
An instance of this is passed to completion source functions.
*/
class CompletionContext {
    /**
    Create a new completion context. (Mostly useful for testing
    completion sources—in the editor, the extension will create
    these for you.)
    */
    constructor(
    /**
    The editor state that the completion happens in.
    */
    state, 
    /**
    The position at which the completion is happening.
    */
    pos, 
    /**
    Indicates whether completion was activated explicitly, or
    implicitly by typing. The usual way to respond to this is to
    only return completions when either there is part of a
    completable entity before the cursor, or `explicit` is true.
    */
    explicit) {
        this.state = state;
        this.pos = pos;
        this.explicit = explicit;
        /**
        @internal
        */
        this.abortListeners = [];
    }
    /**
    Get the extent, content, and (if there is a token) type of the
    token before `this.pos`.
    */
    tokenBefore(types) {
        let token = syntaxTree(this.state).resolve(this.pos, -1);
        while (token && types.indexOf(token.name) < 0)
            token = token.parent;
        return token ? { from: token.from, to: this.pos,
            text: this.state.sliceDoc(token.from, this.pos),
            type: token.type } : null;
    }
    /**
    Get the match of the given expression directly before the
    cursor.
    */
    matchBefore(expr) {
        let line = this.state.doc.lineAt(this.pos);
        let start = Math.max(line.from, this.pos - 250);
        let str = line.text.slice(start - line.from, this.pos - line.from);
        let found = str.search(ensureAnchor(expr, false));
        return found < 0 ? null : { from: start + found, to: this.pos, text: str.slice(found) };
    }
    /**
    Yields true when the query has been aborted. Can be useful in
    asynchronous queries to avoid doing work that will be ignored.
    */
    get aborted() { return this.abortListeners == null; }
    /**
    Allows you to register abort handlers, which will be called when
    the query is
    [aborted](https://codemirror.net/6/docs/ref/#autocomplete.CompletionContext.aborted).
    */
    addEventListener(type, listener) {
        if (type == "abort" && this.abortListeners)
            this.abortListeners.push(listener);
    }
}
function toSet(chars) {
    let flat = Object.keys(chars).join("");
    let words = /\w/.test(flat);
    if (words)
        flat = flat.replace(/\w/g, "");
    return `[${words ? "\\w" : ""}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
}
function prefixMatch(options) {
    let first = Object.create(null), rest = Object.create(null);
    for (let { label } of options) {
        first[label[0]] = true;
        for (let i = 1; i < label.length; i++)
            rest[label[i]] = true;
    }
    let source = toSet(first) + toSet(rest) + "*$";
    return [new RegExp("^" + source), new RegExp(source)];
}
/**
Given a a fixed array of options, return an autocompleter that
completes them.
*/
function completeFromList(list) {
    let options = list.map(o => typeof o == "string" ? { label: o } : o);
    let [span, match] = options.every(o => /^\w+$/.test(o.label)) ? [/\w*$/, /\w+$/] : prefixMatch(options);
    return (context) => {
        let token = context.matchBefore(match);
        return token || context.explicit ? { from: token ? token.from : context.pos, options, span } : null;
    };
}
/**
Wrap the given completion source so that it will not fire when the
cursor is in a syntax node with one of the given names.
*/
function ifNotIn(nodes, source) {
    return (context) => {
        for (let pos = syntaxTree(context.state).resolve(context.pos, -1); pos; pos = pos.parent)
            if (nodes.indexOf(pos.name) > -1)
                return null;
        return source(context);
    };
}
class Option {
    constructor(completion, source, match) {
        this.completion = completion;
        this.source = source;
        this.match = match;
    }
}
function cur(state) { return state.selection.main.head; }
// Make sure the given regexp has a $ at its end and, if `start` is
// true, a ^ at its start.
function ensureAnchor(expr, start) {
    var _a;
    let { source } = expr;
    let addStart = start && source[0] != "^", addEnd = source[source.length - 1] != "$";
    if (!addStart && !addEnd)
        return expr;
    return new RegExp(`${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`, (_a = expr.flags) !== null && _a !== void 0 ? _a : (expr.ignoreCase ? "i" : ""));
}
function applyCompletion(view, option) {
    let apply = option.completion.apply || option.completion.label;
    let result = option.source;
    if (typeof apply == "string") {
        view.dispatch({
            changes: { from: result.from, to: result.to, insert: apply },
            selection: { anchor: result.from + apply.length }
        });
    }
    else {
        apply(view, option.completion, result.from, result.to);
    }
}
const SourceCache = /*@__PURE__*/new WeakMap();
function asSource(source) {
    if (!Array.isArray(source))
        return source;
    let known = SourceCache.get(source);
    if (!known)
        SourceCache.set(source, known = completeFromList(source));
    return known;
}

// A pattern matcher for fuzzy completion matching. Create an instance
// once for a pattern, and then use that to match any number of
// completions.
class FuzzyMatcher {
    constructor(pattern) {
        this.pattern = pattern;
        this.chars = [];
        this.folded = [];
        // Buffers reused by calls to `match` to track matched character
        // positions.
        this.any = [];
        this.precise = [];
        this.byWord = [];
        for (let p = 0; p < pattern.length;) {
            let char = codePointAt(pattern, p), size = codePointSize(char);
            this.chars.push(char);
            let part = pattern.slice(p, p + size), upper = part.toUpperCase();
            this.folded.push(codePointAt(upper == part ? part.toLowerCase() : upper, 0));
            p += size;
        }
        this.astral = pattern.length != this.chars.length;
    }
    // Matches a given word (completion) against the pattern (input).
    // Will return null for no match, and otherwise an array that starts
    // with the match score, followed by any number of `from, to` pairs
    // indicating the matched parts of `word`.
    //
    // The score is a number that is more negative the worse the match
    // is. See `Penalty` above.
    match(word) {
        if (this.pattern.length == 0)
            return [0];
        if (word.length < this.pattern.length)
            return null;
        let { chars, folded, any, precise, byWord } = this;
        // For single-character queries, only match when they occur right
        // at the start
        if (chars.length == 1) {
            let first = codePointAt(word, 0);
            return first == chars[0] ? [0, 0, codePointSize(first)]
                : first == folded[0] ? [-200 /* CaseFold */, 0, codePointSize(first)] : null;
        }
        let direct = word.indexOf(this.pattern);
        if (direct == 0)
            return [0, 0, this.pattern.length];
        let len = chars.length, anyTo = 0;
        if (direct < 0) {
            for (let i = 0, e = Math.min(word.length, 200); i < e && anyTo < len;) {
                let next = codePointAt(word, i);
                if (next == chars[anyTo] || next == folded[anyTo])
                    any[anyTo++] = i;
                i += codePointSize(next);
            }
            // No match, exit immediately
            if (anyTo < len)
                return null;
        }
        // This tracks the extent of the precise (non-folded, not
        // necessarily adjacent) match
        let preciseTo = 0;
        // Tracks whether there is a match that hits only characters that
        // appear to be starting words. `byWordFolded` is set to true when
        // a case folded character is encountered in such a match
        let byWordTo = 0, byWordFolded = false;
        // If we've found a partial adjacent match, these track its state
        let adjacentTo = 0, adjacentStart = -1, adjacentEnd = -1;
        let hasLower = /[a-z]/.test(word);
        // Go over the option's text, scanning for the various kinds of matches
        for (let i = 0, e = Math.min(word.length, 200), prevType = 0 /* NonWord */; i < e && byWordTo < len;) {
            let next = codePointAt(word, i);
            if (direct < 0) {
                if (preciseTo < len && next == chars[preciseTo])
                    precise[preciseTo++] = i;
                if (adjacentTo < len) {
                    if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
                        if (adjacentTo == 0)
                            adjacentStart = i;
                        adjacentEnd = i;
                        adjacentTo++;
                    }
                    else {
                        adjacentTo = 0;
                    }
                }
            }
            let ch, type = next < 0xff
                ? (next >= 48 && next <= 57 || next >= 97 && next <= 122 ? 2 /* Lower */ : next >= 65 && next <= 90 ? 1 /* Upper */ : 0 /* NonWord */)
                : ((ch = fromCodePoint(next)) != ch.toLowerCase() ? 1 /* Upper */ : ch != ch.toUpperCase() ? 2 /* Lower */ : 0 /* NonWord */);
            if ((type == 1 /* Upper */ && hasLower || prevType == 0 /* NonWord */ && type != 0 /* NonWord */) &&
                (chars[byWordTo] == next || (folded[byWordTo] == next && (byWordFolded = true))))
                byWord[byWordTo++] = i;
            prevType = type;
            i += codePointSize(next);
        }
        if (byWordTo == len && byWord[0] == 0)
            return this.result(-100 /* ByWord */ + (byWordFolded ? -200 /* CaseFold */ : 0), byWord, word);
        if (adjacentTo == len && adjacentStart == 0)
            return [-200 /* CaseFold */, 0, adjacentEnd];
        if (direct > -1)
            return [-700 /* NotStart */, direct, direct + this.pattern.length];
        if (adjacentTo == len)
            return [-200 /* CaseFold */ + -700 /* NotStart */, adjacentStart, adjacentEnd];
        if (byWordTo == len)
            return this.result(-100 /* ByWord */ + (byWordFolded ? -200 /* CaseFold */ : 0) + -700 /* NotStart */, byWord, word);
        return chars.length == 2 ? null : this.result((any[0] ? -700 /* NotStart */ : 0) + -200 /* CaseFold */ + -1100 /* Gap */, any, word);
    }
    result(score, positions, word) {
        let result = [score], i = 1;
        for (let pos of positions) {
            let to = pos + (this.astral ? codePointSize(codePointAt(word, pos)) : 1);
            if (i > 1 && result[i - 1] == pos)
                result[i - 1] = to;
            else {
                result[i++] = pos;
                result[i++] = to;
            }
        }
        return result;
    }
}

const completionConfig = /*@__PURE__*/Facet.define({
    combine(configs) {
        return combineConfig(configs, {
            activateOnTyping: true,
            override: null,
            maxRenderedOptions: 100,
            defaultKeymap: true
        }, {
            defaultKeymap: (a, b) => a && b
        });
    }
});

const MaxInfoWidth = 300;
const baseTheme$1 = /*@__PURE__*/EditorView.baseTheme({
    ".cm-tooltip.cm-tooltip-autocomplete": {
        "& > ul": {
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "auto",
            maxWidth_fallback: "700px",
            maxWidth: "min(700px, 95vw)",
            maxHeight: "10em",
            listStyle: "none",
            margin: 0,
            padding: 0,
            "& > li": {
                cursor: "pointer",
                padding: "1px 1em 1px 3px",
                lineHeight: 1.2
            },
            "& > li[aria-selected]": {
                background_fallback: "#bdf",
                backgroundColor: "Highlight",
                color_fallback: "white",
                color: "HighlightText"
            }
        }
    },
    ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
        content: '"···"',
        opacity: 0.5,
        display: "block",
        textAlign: "center"
    },
    ".cm-tooltip.cm-completionInfo": {
        position: "absolute",
        padding: "3px 9px",
        width: "max-content",
        maxWidth: MaxInfoWidth + "px",
    },
    ".cm-completionInfo.cm-completionInfo-left": { right: "100%" },
    ".cm-completionInfo.cm-completionInfo-right": { left: "100%" },
    "&light .cm-snippetField": { backgroundColor: "#00000022" },
    "&dark .cm-snippetField": { backgroundColor: "#ffffff22" },
    ".cm-snippetFieldPosition": {
        verticalAlign: "text-top",
        width: 0,
        height: "1.15em",
        margin: "0 -0.7px -.7em",
        borderLeft: "1.4px dotted #888"
    },
    ".cm-completionMatchedText": {
        textDecoration: "underline"
    },
    ".cm-completionDetail": {
        marginLeft: "0.5em",
        fontStyle: "italic"
    },
    ".cm-completionIcon": {
        fontSize: "90%",
        width: ".8em",
        display: "inline-block",
        textAlign: "center",
        paddingRight: ".6em",
        opacity: "0.6"
    },
    ".cm-completionIcon-function, .cm-completionIcon-method": {
        "&:after": { content: "'ƒ'" }
    },
    ".cm-completionIcon-class": {
        "&:after": { content: "'○'" }
    },
    ".cm-completionIcon-interface": {
        "&:after": { content: "'◌'" }
    },
    ".cm-completionIcon-variable": {
        "&:after": { content: "'𝑥'" }
    },
    ".cm-completionIcon-constant": {
        "&:after": { content: "'𝐶'" }
    },
    ".cm-completionIcon-type": {
        "&:after": { content: "'𝑡'" }
    },
    ".cm-completionIcon-enum": {
        "&:after": { content: "'∪'" }
    },
    ".cm-completionIcon-property": {
        "&:after": { content: "'□'" }
    },
    ".cm-completionIcon-keyword": {
        "&:after": { content: "'🔑\uFE0E'" } // Disable emoji rendering
    },
    ".cm-completionIcon-namespace": {
        "&:after": { content: "'▢'" }
    },
    ".cm-completionIcon-text": {
        "&:after": { content: "'abc'", fontSize: "50%", verticalAlign: "middle" }
    }
});

function createListBox(options, id, range) {
    const ul = document.createElement("ul");
    ul.id = id;
    ul.setAttribute("role", "listbox");
    ul.setAttribute("aria-expanded", "true");
    for (let i = range.from; i < range.to; i++) {
        let { completion, match } = options[i];
        const li = ul.appendChild(document.createElement("li"));
        li.id = id + "-" + i;
        let icon = li.appendChild(document.createElement("div"));
        icon.classList.add("cm-completionIcon");
        if (completion.type)
            icon.classList.add(...completion.type.split(/\s+/g).map(cls => "cm-completionIcon-" + cls));
        icon.setAttribute("aria-hidden", "true");
        let labelElt = li.appendChild(document.createElement("span"));
        labelElt.className = "cm-completionLabel";
        let { label, detail } = completion, off = 0;
        for (let j = 1; j < match.length;) {
            let from = match[j++], to = match[j++];
            if (from > off)
                labelElt.appendChild(document.createTextNode(label.slice(off, from)));
            let span = labelElt.appendChild(document.createElement("span"));
            span.appendChild(document.createTextNode(label.slice(from, to)));
            span.className = "cm-completionMatchedText";
            off = to;
        }
        if (off < label.length)
            labelElt.appendChild(document.createTextNode(label.slice(off)));
        if (detail) {
            let detailElt = li.appendChild(document.createElement("span"));
            detailElt.className = "cm-completionDetail";
            detailElt.textContent = detail;
        }
        li.setAttribute("role", "option");
    }
    if (range.from)
        ul.classList.add("cm-completionListIncompleteTop");
    if (range.to < options.length)
        ul.classList.add("cm-completionListIncompleteBottom");
    return ul;
}
function createInfoDialog(option, view) {
    let dom = document.createElement("div");
    dom.className = "cm-tooltip cm-completionInfo";
    let { info } = option.completion;
    if (typeof info == "string") {
        dom.textContent = info;
    }
    else {
        let content = info(option.completion);
        if (content.then)
            content.then(node => dom.appendChild(node), e => logException(view.state, e, "completion info"));
        else
            dom.appendChild(content);
    }
    return dom;
}
function rangeAroundSelected(total, selected, max) {
    if (total <= max)
        return { from: 0, to: total };
    if (selected <= (total >> 1)) {
        let off = Math.floor(selected / max);
        return { from: off * max, to: (off + 1) * max };
    }
    let off = Math.floor((total - selected) / max);
    return { from: total - (off + 1) * max, to: total - off * max };
}
class CompletionTooltip {
    constructor(view, stateField) {
        this.view = view;
        this.stateField = stateField;
        this.info = null;
        this.placeInfo = {
            read: () => this.measureInfo(),
            write: (pos) => this.positionInfo(pos),
            key: this
        };
        let cState = view.state.field(stateField);
        let { options, selected } = cState.open;
        let config = view.state.facet(completionConfig);
        this.range = rangeAroundSelected(options.length, selected, config.maxRenderedOptions);
        this.dom = document.createElement("div");
        this.dom.className = "cm-tooltip-autocomplete";
        this.dom.addEventListener("mousedown", (e) => {
            for (let dom = e.target, match; dom && dom != this.dom; dom = dom.parentNode) {
                if (dom.nodeName == "LI" && (match = /-(\d+)$/.exec(dom.id)) && +match[1] < options.length) {
                    applyCompletion(view, options[+match[1]]);
                    e.preventDefault();
                    return;
                }
            }
        });
        this.list = this.dom.appendChild(createListBox(options, cState.id, this.range));
        this.list.addEventListener("scroll", () => {
            if (this.info)
                this.view.requestMeasure(this.placeInfo);
        });
    }
    mount() { this.updateSel(); }
    update(update) {
        if (update.state.field(this.stateField) != update.startState.field(this.stateField))
            this.updateSel();
    }
    positioned() {
        if (this.info)
            this.view.requestMeasure(this.placeInfo);
    }
    updateSel() {
        let cState = this.view.state.field(this.stateField), open = cState.open;
        if (open.selected < this.range.from || open.selected >= this.range.to) {
            this.range = rangeAroundSelected(open.options.length, open.selected, this.view.state.facet(completionConfig).maxRenderedOptions);
            this.list.remove();
            this.list = this.dom.appendChild(createListBox(open.options, cState.id, this.range));
            this.list.addEventListener("scroll", () => {
                if (this.info)
                    this.view.requestMeasure(this.placeInfo);
            });
        }
        if (this.updateSelectedOption(open.selected)) {
            if (this.info) {
                this.info.remove();
                this.info = null;
            }
            let option = open.options[open.selected];
            if (option.completion.info) {
                this.info = this.dom.appendChild(createInfoDialog(option, this.view));
                this.view.requestMeasure(this.placeInfo);
            }
        }
    }
    updateSelectedOption(selected) {
        let set = null;
        for (let opt = this.list.firstChild, i = this.range.from; opt; opt = opt.nextSibling, i++) {
            if (i == selected) {
                if (!opt.hasAttribute("aria-selected")) {
                    opt.setAttribute("aria-selected", "true");
                    set = opt;
                }
            }
            else {
                if (opt.hasAttribute("aria-selected"))
                    opt.removeAttribute("aria-selected");
            }
        }
        if (set)
            scrollIntoView(this.list, set);
        return set;
    }
    measureInfo() {
        let sel = this.dom.querySelector("[aria-selected]");
        if (!sel)
            return null;
        let rect = this.dom.getBoundingClientRect();
        let top = sel.getBoundingClientRect().top - rect.top;
        if (top < 0 || top > this.list.clientHeight - 10)
            return null;
        let left = this.view.textDirection == Direction.RTL;
        let spaceLeft = rect.left, spaceRight = innerWidth - rect.right;
        if (left && spaceLeft < Math.min(MaxInfoWidth, spaceRight))
            left = false;
        else if (!left && spaceRight < Math.min(MaxInfoWidth, spaceLeft))
            left = true;
        return { top, left };
    }
    positionInfo(pos) {
        if (this.info && pos) {
            this.info.style.top = pos.top + "px";
            this.info.classList.toggle("cm-completionInfo-left", pos.left);
            this.info.classList.toggle("cm-completionInfo-right", !pos.left);
        }
    }
}
// We allocate a new function instance every time the completion
// changes to force redrawing/repositioning of the tooltip
function completionTooltip(stateField) {
    return (view) => new CompletionTooltip(view, stateField);
}
function scrollIntoView(container, element) {
    let parent = container.getBoundingClientRect();
    let self = element.getBoundingClientRect();
    if (self.top < parent.top)
        container.scrollTop -= parent.top - self.top;
    else if (self.bottom > parent.bottom)
        container.scrollTop += self.bottom - parent.bottom;
}

const MaxOptions = 300;
// Used to pick a preferred option when two options with the same
// label occur in the result.
function score(option) {
    return (option.boost || 0) * 100 + (option.apply ? 10 : 0) + (option.info ? 5 : 0) +
        (option.type ? 1 : 0);
}
function sortOptions(active, state) {
    let options = [];
    for (let a of active)
        if (a.hasResult()) {
            let matcher = new FuzzyMatcher(state.sliceDoc(a.from, a.to)), match;
            for (let option of a.result.options)
                if (match = matcher.match(option.label)) {
                    if (option.boost != null)
                        match[0] += option.boost;
                    options.push(new Option(option, a, match));
                }
        }
    options.sort(cmpOption);
    let result = [], prev = null;
    for (let opt of options.sort(cmpOption)) {
        if (result.length == MaxOptions)
            break;
        if (!prev || prev.label != opt.completion.label || prev.detail != opt.completion.detail)
            result.push(opt);
        else if (score(opt.completion) > score(prev))
            result[result.length - 1] = opt;
        prev = opt.completion;
    }
    return result;
}
class CompletionDialog {
    constructor(options, attrs, tooltip, timestamp, selected) {
        this.options = options;
        this.attrs = attrs;
        this.tooltip = tooltip;
        this.timestamp = timestamp;
        this.selected = selected;
    }
    setSelected(selected, id) {
        return selected == this.selected || selected >= this.options.length ? this
            : new CompletionDialog(this.options, makeAttrs(id, selected), this.tooltip, this.timestamp, selected);
    }
    static build(active, state, id, prev) {
        let options = sortOptions(active, state);
        if (!options.length)
            return null;
        let selected = 0;
        if (prev && prev.selected) {
            let selectedValue = prev.options[prev.selected].completion;
            for (let i = 0; i < options.length && !selected; i++) {
                if (options[i].completion == selectedValue)
                    selected = i;
            }
        }
        return new CompletionDialog(options, makeAttrs(id, selected), {
            pos: active.reduce((a, b) => b.hasResult() ? Math.min(a, b.from) : a, 1e8),
            create: completionTooltip(completionState)
        }, prev ? prev.timestamp : Date.now(), selected);
    }
    map(changes) {
        return new CompletionDialog(this.options, this.attrs, Object.assign(Object.assign({}, this.tooltip), { pos: changes.mapPos(this.tooltip.pos) }), this.timestamp, this.selected);
    }
}
class CompletionState {
    constructor(active, id, open) {
        this.active = active;
        this.id = id;
        this.open = open;
    }
    static start() {
        return new CompletionState(none, "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36), null);
    }
    update(tr) {
        let { state } = tr, conf = state.facet(completionConfig);
        let sources = conf.override ||
            state.languageDataAt("autocomplete", cur(state)).map(asSource);
        let active = sources.map(source => {
            let value = this.active.find(s => s.source == source) ||
                new ActiveSource(source, this.active.some(a => a.state != 0 /* Inactive */) ? 1 /* Pending */ : 0 /* Inactive */, false);
            return value.update(tr, conf);
        });
        if (active.length == this.active.length && active.every((a, i) => a == this.active[i]))
            active = this.active;
        let open = tr.selection || active.some(a => a.hasResult() && tr.changes.touchesRange(a.from, a.to)) ||
            !sameResults(active, this.active) ? CompletionDialog.build(active, state, this.id, this.open)
            : this.open && tr.docChanged ? this.open.map(tr.changes) : this.open;
        if (!open && active.every(a => a.state != 1 /* Pending */) && active.some(a => a.hasResult()))
            active = active.map(a => a.hasResult() ? new ActiveSource(a.source, 0 /* Inactive */, false) : a);
        for (let effect of tr.effects)
            if (effect.is(setSelectedEffect))
                open = open && open.setSelected(effect.value, this.id);
        return active == this.active && open == this.open ? this : new CompletionState(active, this.id, open);
    }
    get tooltip() { return this.open ? this.open.tooltip : null; }
    get attrs() { return this.open ? this.open.attrs : baseAttrs; }
}
function sameResults(a, b) {
    if (a == b)
        return true;
    for (let iA = 0, iB = 0;;) {
        while (iA < a.length && !a[iA].hasResult)
            iA++;
        while (iB < b.length && !b[iB].hasResult)
            iB++;
        let endA = iA == a.length, endB = iB == b.length;
        if (endA || endB)
            return endA == endB;
        if (a[iA++].result != b[iB++].result)
            return false;
    }
}
function makeAttrs(id, selected) {
    return {
        "aria-autocomplete": "list",
        "aria-activedescendant": id + "-" + selected,
        "aria-owns": id
    };
}
const baseAttrs = { "aria-autocomplete": "list" }, none = [];
function cmpOption(a, b) {
    let dScore = b.match[0] - a.match[0];
    if (dScore)
        return dScore;
    let lA = a.completion.label, lB = b.completion.label;
    return lA < lB ? -1 : lA == lB ? 0 : 1;
}
class ActiveSource {
    constructor(source, state, explicit) {
        this.source = source;
        this.state = state;
        this.explicit = explicit;
    }
    hasResult() { return false; }
    update(tr, conf) {
        let event = tr.annotation(Transaction.userEvent), value = this;
        if (event == "input" || event == "delete")
            value = value.handleUserEvent(tr, event, conf);
        else if (tr.docChanged)
            value = value.handleChange(tr);
        else if (tr.selection && value.state != 0 /* Inactive */)
            value = new ActiveSource(value.source, 0 /* Inactive */, false);
        for (let effect of tr.effects) {
            if (effect.is(startCompletionEffect))
                value = new ActiveSource(value.source, 1 /* Pending */, effect.value);
            else if (effect.is(closeCompletionEffect))
                value = new ActiveSource(value.source, 0 /* Inactive */, false);
            else if (effect.is(setActiveEffect))
                for (let active of effect.value)
                    if (active.source == value.source)
                        value = active;
        }
        return value;
    }
    handleUserEvent(_tr, type, conf) {
        return type == "delete" || !conf.activateOnTyping ? this : new ActiveSource(this.source, 1 /* Pending */, false);
    }
    handleChange(tr) {
        return tr.changes.touchesRange(cur(tr.startState)) ? new ActiveSource(this.source, 0 /* Inactive */, false) : this;
    }
}
class ActiveResult extends ActiveSource {
    constructor(source, explicit, result, from, to, span) {
        super(source, 2 /* Result */, explicit);
        this.result = result;
        this.from = from;
        this.to = to;
        this.span = span;
    }
    hasResult() { return true; }
    handleUserEvent(tr, type, conf) {
        let from = tr.changes.mapPos(this.from), to = tr.changes.mapPos(this.to, 1);
        let pos = cur(tr.state);
        if ((this.explicit ? pos < from : pos <= from) || pos > to)
            return new ActiveSource(this.source, type == "input" && conf.activateOnTyping ? 1 /* Pending */ : 0 /* Inactive */, false);
        if (this.span && (from == to || this.span.test(tr.state.sliceDoc(from, to))))
            return new ActiveResult(this.source, this.explicit, this.result, from, to, this.span);
        return new ActiveSource(this.source, 1 /* Pending */, this.explicit);
    }
    handleChange(tr) {
        return tr.changes.touchesRange(this.from, this.to)
            ? new ActiveSource(this.source, 0 /* Inactive */, false)
            : new ActiveResult(this.source, this.explicit, this.result, tr.changes.mapPos(this.from), tr.changes.mapPos(this.to, 1), this.span);
    }
    map(mapping) {
        return new ActiveResult(this.source, this.explicit, this.result, mapping.mapPos(this.from), mapping.mapPos(this.to, 1), this.span);
    }
}
const startCompletionEffect = /*@__PURE__*/StateEffect.define();
const closeCompletionEffect = /*@__PURE__*/StateEffect.define();
const setActiveEffect = /*@__PURE__*/StateEffect.define({
    map(sources, mapping) { return sources.map(s => s.hasResult() && !mapping.empty ? s.map(mapping) : s); }
});
const setSelectedEffect = /*@__PURE__*/StateEffect.define();
const completionState = /*@__PURE__*/StateField.define({
    create() { return CompletionState.start(); },
    update(value, tr) { return value.update(tr); },
    provide: f => [
        showTooltip.from(f, val => val.tooltip),
        EditorView.contentAttributes.from(f, state => state.attrs)
    ]
});

const CompletionInteractMargin = 75;
/**
Returns a command that moves the completion selection forward or
backward by the given amount.
*/
function moveCompletionSelection(forward, by = "option") {
    return (view) => {
        let cState = view.state.field(completionState, false);
        if (!cState || !cState.open || Date.now() - cState.open.timestamp < CompletionInteractMargin)
            return false;
        let step = 1, tooltip;
        if (by == "page" && (tooltip = view.dom.querySelector(".cm-tooltip-autocomplete")))
            step = Math.max(2, Math.floor(tooltip.offsetHeight / tooltip.firstChild.offsetHeight));
        let selected = cState.open.selected + step * (forward ? 1 : -1), { length } = cState.open.options;
        if (selected < 0)
            selected = by == "page" ? 0 : length - 1;
        else if (selected >= length)
            selected = by == "page" ? length - 1 : 0;
        view.dispatch({ effects: setSelectedEffect.of(selected) });
        return true;
    };
}
/**
Accept the current completion.
*/
const acceptCompletion = (view) => {
    let cState = view.state.field(completionState, false);
    if (!cState || !cState.open || Date.now() - cState.open.timestamp < CompletionInteractMargin)
        return false;
    applyCompletion(view, cState.open.options[cState.open.selected]);
    return true;
};
/**
Explicitly start autocompletion.
*/
const startCompletion = (view) => {
    let cState = view.state.field(completionState, false);
    if (!cState)
        return false;
    view.dispatch({ effects: startCompletionEffect.of(true) });
    return true;
};
/**
Close the currently active completion.
*/
const closeCompletion = (view) => {
    let cState = view.state.field(completionState, false);
    if (!cState || !cState.active.some(a => a.state != 0 /* Inactive */))
        return false;
    view.dispatch({ effects: closeCompletionEffect.of(null) });
    return true;
};
class RunningQuery {
    constructor(source, context) {
        this.source = source;
        this.context = context;
        this.time = Date.now();
        this.updates = [];
        // Note that 'undefined' means 'not done yet', whereas 'null' means
        // 'query returned null'.
        this.done = undefined;
    }
}
const DebounceTime = 50, MaxUpdateCount = 50, MinAbortTime = 1000;
const completionPlugin = /*@__PURE__*/ViewPlugin.fromClass(class {
    constructor(view) {
        this.view = view;
        this.debounceUpdate = -1;
        this.running = [];
        this.debounceAccept = -1;
        this.composing = 0 /* None */;
        for (let active of view.state.field(completionState).active)
            if (active.state == 1 /* Pending */)
                this.startQuery(active);
    }
    update(update) {
        let cState = update.state.field(completionState);
        if (!update.selectionSet && !update.docChanged && update.startState.field(completionState) == cState)
            return;
        let doesReset = update.transactions.some(tr => {
            let event = tr.annotation(Transaction.userEvent);
            return (tr.selection || tr.docChanged) && event != "input" && event != "delete";
        });
        for (let i = 0; i < this.running.length; i++) {
            let query = this.running[i];
            if (doesReset ||
                query.updates.length + update.transactions.length > MaxUpdateCount && query.time - Date.now() > MinAbortTime) {
                for (let handler of query.context.abortListeners) {
                    try {
                        handler();
                    }
                    catch (e) {
                        logException(this.view.state, e);
                    }
                }
                query.context.abortListeners = null;
                this.running.splice(i--, 1);
            }
            else {
                query.updates.push(...update.transactions);
            }
        }
        if (this.debounceUpdate > -1)
            clearTimeout(this.debounceUpdate);
        this.debounceUpdate = cState.active.some(a => a.state == 1 /* Pending */ && !this.running.some(q => q.source == a.source))
            ? setTimeout(() => this.startUpdate(), DebounceTime) : -1;
        if (this.composing != 0 /* None */)
            for (let tr of update.transactions) {
                if (tr.annotation(Transaction.userEvent) == "input")
                    this.composing = 2 /* Changed */;
                else if (this.composing == 2 /* Changed */ && tr.selection)
                    this.composing = 3 /* ChangedAndMoved */;
            }
    }
    startUpdate() {
        this.debounceUpdate = -1;
        let { state } = this.view, cState = state.field(completionState);
        for (let active of cState.active) {
            if (active.state == 1 /* Pending */ && !this.running.some(r => r.source == active.source))
                this.startQuery(active);
        }
    }
    startQuery(active) {
        let { state } = this.view, pos = cur(state);
        let context = new CompletionContext(state, pos, active.explicit);
        let pending = new RunningQuery(active.source, context);
        this.running.push(pending);
        Promise.resolve(active.source(context)).then(result => {
            if (!pending.context.aborted) {
                pending.done = result || null;
                this.scheduleAccept();
            }
        }, err => {
            this.view.dispatch({ effects: closeCompletionEffect.of(null) });
            logException(this.view.state, err);
        });
    }
    scheduleAccept() {
        if (this.running.every(q => q.done !== undefined))
            this.accept();
        else if (this.debounceAccept < 0)
            this.debounceAccept = setTimeout(() => this.accept(), DebounceTime);
    }
    // For each finished query in this.running, try to create a result
    // or, if appropriate, restart the query.
    accept() {
        var _a;
        if (this.debounceAccept > -1)
            clearTimeout(this.debounceAccept);
        this.debounceAccept = -1;
        let updated = [];
        let conf = this.view.state.facet(completionConfig);
        for (let i = 0; i < this.running.length; i++) {
            let query = this.running[i];
            if (query.done === undefined)
                continue;
            this.running.splice(i--, 1);
            if (query.done) {
                let active = new ActiveResult(query.source, query.context.explicit, query.done, query.done.from, (_a = query.done.to) !== null && _a !== void 0 ? _a : cur(query.updates.length ? query.updates[0].startState : this.view.state), query.done.span ? ensureAnchor(query.done.span, true) : null);
                // Replay the transactions that happened since the start of
                // the request and see if that preserves the result
                for (let tr of query.updates)
                    active = active.update(tr, conf);
                if (active.hasResult()) {
                    updated.push(active);
                    continue;
                }
            }
            let current = this.view.state.field(completionState).active.find(a => a.source == query.source);
            if (current && current.state == 1 /* Pending */) {
                if (query.done == null) {
                    // Explicitly failed. Should clear the pending status if it
                    // hasn't been re-set in the meantime.
                    let active = new ActiveSource(query.source, 0 /* Inactive */, false);
                    for (let tr of query.updates)
                        active = active.update(tr, conf);
                    if (active.state != 1 /* Pending */)
                        updated.push(active);
                }
                else {
                    // Cleared by subsequent transactions. Restart.
                    this.startQuery(current);
                }
            }
        }
        if (updated.length)
            this.view.dispatch({ effects: setActiveEffect.of(updated) });
    }
}, {
    eventHandlers: {
        compositionstart() {
            this.composing = 1 /* Started */;
        },
        compositionend() {
            if (this.composing == 3 /* ChangedAndMoved */) {
                // Safari fires compositionend events synchronously, possibly
                // from inside an update, so dispatch asynchronously to avoid reentrancy
                setTimeout(() => this.view.dispatch({ effects: startCompletionEffect.of(false) }), 20);
            }
            this.composing = 0 /* None */;
        }
    }
});

class FieldPos {
    constructor(field, line, from, to) {
        this.field = field;
        this.line = line;
        this.from = from;
        this.to = to;
    }
}
class FieldRange {
    constructor(field, from, to) {
        this.field = field;
        this.from = from;
        this.to = to;
    }
    map(changes) {
        return new FieldRange(this.field, changes.mapPos(this.from, -1), changes.mapPos(this.to, 1));
    }
}
class Snippet {
    constructor(lines, fieldPositions) {
        this.lines = lines;
        this.fieldPositions = fieldPositions;
    }
    instantiate(state, pos) {
        let text = [], lineStart = [pos];
        let lineObj = state.doc.lineAt(pos), baseIndent = /^\s*/.exec(lineObj.text)[0];
        for (let line of this.lines) {
            if (text.length) {
                let indent = baseIndent, tabs = /^\t*/.exec(line)[0].length;
                for (let i = 0; i < tabs; i++)
                    indent += state.facet(indentUnit);
                lineStart.push(pos + indent.length - tabs);
                line = indent + line.slice(tabs);
            }
            text.push(line);
            pos += line.length + 1;
        }
        let ranges = this.fieldPositions.map(pos => new FieldRange(pos.field, lineStart[pos.line] + pos.from, lineStart[pos.line] + pos.to));
        return { text, ranges };
    }
    static parse(template) {
        let fields = [];
        let lines = [], positions = [], m;
        for (let line of template.split(/\r\n?|\n/)) {
            while (m = /[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/.exec(line)) {
                let seq = m[1] ? +m[1] : null, name = m[2] || m[3], found = -1;
                for (let i = 0; i < fields.length; i++) {
                    if (seq != null ? fields[i].seq == seq : name ? fields[i].name == name : false)
                        found = i;
                }
                if (found < 0) {
                    let i = 0;
                    while (i < fields.length && (seq == null || (fields[i].seq != null && fields[i].seq < seq)))
                        i++;
                    fields.splice(i, 0, { seq, name: name || null });
                    found = i;
                    for (let pos of positions)
                        if (pos.field >= found)
                            pos.field++;
                }
                positions.push(new FieldPos(found, lines.length, m.index, m.index + name.length));
                line = line.slice(0, m.index) + name + line.slice(m.index + m[0].length);
            }
            lines.push(line);
        }
        return new Snippet(lines, positions);
    }
}
let fieldMarker = /*@__PURE__*/Decoration.widget({ widget: /*@__PURE__*/new class extends WidgetType {
        toDOM() {
            let span = document.createElement("span");
            span.className = "cm-snippetFieldPosition";
            return span;
        }
        ignoreEvent() { return false; }
    } });
let fieldRange = /*@__PURE__*/Decoration.mark({ class: "cm-snippetField" });
class ActiveSnippet {
    constructor(ranges, active) {
        this.ranges = ranges;
        this.active = active;
        this.deco = Decoration.set(ranges.map(r => (r.from == r.to ? fieldMarker : fieldRange).range(r.from, r.to)));
    }
    map(changes) {
        return new ActiveSnippet(this.ranges.map(r => r.map(changes)), this.active);
    }
    selectionInsideField(sel) {
        return sel.ranges.every(range => this.ranges.some(r => r.field == this.active && r.from <= range.from && r.to >= range.to));
    }
}
const setActive = /*@__PURE__*/StateEffect.define({
    map(value, changes) { return value && value.map(changes); }
});
const moveToField = /*@__PURE__*/StateEffect.define();
const snippetState = /*@__PURE__*/StateField.define({
    create() { return null; },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setActive))
                return effect.value;
            if (effect.is(moveToField) && value)
                return new ActiveSnippet(value.ranges, effect.value);
        }
        if (value && tr.docChanged)
            value = value.map(tr.changes);
        if (value && tr.selection && !value.selectionInsideField(tr.selection))
            value = null;
        return value;
    },
    provide: f => EditorView.decorations.from(f, val => val ? val.deco : Decoration.none)
});
function fieldSelection(ranges, field) {
    return EditorSelection.create(ranges.filter(r => r.field == field).map(r => EditorSelection.range(r.from, r.to)));
}
/**
Convert a snippet template to a function that can apply it.
Snippets are written using syntax like this:

    "for (let ${index} = 0; ${index} < ${end}; ${index}++) {\n\t${}\n}"

Each `${}` placeholder (you may also use `#{}`) indicates a field
that the user can fill in. Its name, if any, will be the default
content for the field.

When the snippet is activated by calling the returned function,
the code is inserted at the given position. Newlines in the
template are indented by the indentation of the start line, plus
one [indent unit](https://codemirror.net/6/docs/ref/#language.indentUnit) per tab character after
the newline.

On activation, (all instances of) the first field are selected.
The user can move between fields with Tab and Shift-Tab as long as
the fields are active. Moving to the last field or moving the
cursor out of the current field deactivates the fields.

The order of fields defaults to textual order, but you can add
numbers to placeholders (`${1}` or `${1:defaultText}`) to provide
a custom order.
*/
function snippet(template) {
    let snippet = Snippet.parse(template);
    return (editor, _completion, from, to) => {
        let { text, ranges } = snippet.instantiate(editor.state, from);
        let spec = { changes: { from, to, insert: Text.of(text) } };
        if (ranges.length)
            spec.selection = fieldSelection(ranges, 0);
        if (ranges.length > 1) {
            let active = new ActiveSnippet(ranges, 0);
            let effects = spec.effects = [setActive.of(active)];
            if (editor.state.field(snippetState, false) === undefined)
                effects.push(StateEffect.appendConfig.of([snippetState.init(() => active), addSnippetKeymap,
                    snippetPointerHandler, baseTheme$1]));
        }
        editor.dispatch(editor.state.update(spec));
    };
}
function moveField(dir) {
    return ({ state, dispatch }) => {
        let active = state.field(snippetState, false);
        if (!active || dir < 0 && active.active == 0)
            return false;
        let next = active.active + dir, last = dir > 0 && !active.ranges.some(r => r.field == next + dir);
        dispatch(state.update({
            selection: fieldSelection(active.ranges, next),
            effects: setActive.of(last ? null : new ActiveSnippet(active.ranges, next))
        }));
        return true;
    };
}
/**
A command that clears the active snippet, if any.
*/
const clearSnippet = ({ state, dispatch }) => {
    let active = state.field(snippetState, false);
    if (!active)
        return false;
    dispatch(state.update({ effects: setActive.of(null) }));
    return true;
};
/**
Move to the next snippet field, if available.
*/
const nextSnippetField = /*@__PURE__*/moveField(1);
/**
Move to the previous snippet field, if available.
*/
const prevSnippetField = /*@__PURE__*/moveField(-1);
const defaultSnippetKeymap = [
    { key: "Tab", run: nextSnippetField, shift: prevSnippetField },
    { key: "Escape", run: clearSnippet }
];
/**
A facet that can be used to configure the key bindings used by
snippets. The default binds Tab to
[`nextSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.nextSnippetField), Shift-Tab to
[`prevSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.prevSnippetField), and Escape
to [`clearSnippet`](https://codemirror.net/6/docs/ref/#autocomplete.clearSnippet).
*/
const snippetKeymap = /*@__PURE__*/Facet.define({
    combine(maps) { return maps.length ? maps[0] : defaultSnippetKeymap; }
});
const addSnippetKeymap = /*@__PURE__*/Prec.override(/*@__PURE__*/keymap.compute([snippetKeymap], state => state.facet(snippetKeymap)));
/**
Create a completion from a snippet. Returns an object with the
properties from `completion`, plus an `apply` function that
applies the snippet.
*/
function snippetCompletion(template, completion) {
    return Object.assign(Object.assign({}, completion), { apply: snippet(template) });
}
const snippetPointerHandler = /*@__PURE__*/EditorView.domEventHandlers({
    mousedown(event, view) {
        let active = view.state.field(snippetState, false), pos;
        if (!active || (pos = view.posAtCoords({ x: event.clientX, y: event.clientY })) == null)
            return false;
        let match = active.ranges.find(r => r.from <= pos && r.to >= pos);
        if (!match || match.field == active.active)
            return false;
        view.dispatch({
            selection: fieldSelection(active.ranges, match.field),
            effects: setActive.of(active.ranges.some(r => r.field > match.field) ? new ActiveSnippet(active.ranges, match.field) : null)
        });
        return true;
    }
});

/**
Returns an extension that enables autocompletion.
*/
function autocompletion(config = {}) {
    return [
        completionState,
        completionConfig.of(config),
        completionPlugin,
        completionKeymapExt,
        baseTheme$1
    ];
}
/**
Basic keybindings for autocompletion.

 - Ctrl-Space: [`startCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.startCompletion)
 - Escape: [`closeCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.closeCompletion)
 - ArrowDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true)`
 - ArrowUp: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(false)`
 - PageDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true, "page")`
 - PageDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true, "page")`
 - Enter: [`acceptCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.acceptCompletion)
*/
const completionKeymap = [
    { key: "Ctrl-Space", run: startCompletion },
    { key: "Escape", run: closeCompletion },
    { key: "ArrowDown", run: /*@__PURE__*/moveCompletionSelection(true) },
    { key: "ArrowUp", run: /*@__PURE__*/moveCompletionSelection(false) },
    { key: "PageDown", run: /*@__PURE__*/moveCompletionSelection(true, "page") },
    { key: "PageUp", run: /*@__PURE__*/moveCompletionSelection(false, "page") },
    { key: "Enter", run: acceptCompletion }
];
const completionKeymapExt = /*@__PURE__*/Prec.override(/*@__PURE__*/keymap.computeN([completionConfig], state => state.facet(completionConfig).defaultKeymap ? [completionKeymap] : []));

let nextTagID = 0;
/**
Highlighting tags are markers that denote a highlighting category.
They are [associated](https://codemirror.net/6/docs/ref/#highlight.styleTags) with parts of a syntax
tree by a language mode, and then mapped to an actual CSS style by
a [highlight style](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle).

Because syntax tree node types and highlight styles have to be
able to talk the same language, CodeMirror uses a mostly _closed_
[vocabulary](https://codemirror.net/6/docs/ref/#highlight.tags) of syntax tags (as opposed to
traditional open string-based systems, which make it hard for
highlighting themes to cover all the tokens produced by the
various languages).

It _is_ possible to [define](https://codemirror.net/6/docs/ref/#highlight.Tag^define) your own
highlighting tags for system-internal use (where you control both
the language package and the highlighter), but such tags will not
be picked up by regular highlighters (though you can derive them
from standard tags to allow highlighters to fall back to those).
*/
class Tag {
    /**
    @internal
    */
    constructor(
    /**
    The set of tags that match this tag, starting with this one
    itself, sorted in order of decreasing specificity. @internal
    */
    set, 
    /**
    The base unmodified tag that this one is based on, if it's
    modified @internal
    */
    base, 
    /**
    The modifiers applied to this.base @internal
    */
    modified) {
        this.set = set;
        this.base = base;
        this.modified = modified;
        /**
        @internal
        */
        this.id = nextTagID++;
    }
    /**
    Define a new tag. If `parent` is given, the tag is treated as a
    sub-tag of that parent, and [highlight
    styles](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle) that don't mention this tag
    will try to fall back to the parent tag (or grandparent tag,
    etc).
    */
    static define(parent) {
        if (parent === null || parent === void 0 ? void 0 : parent.base)
            throw new Error("Can not derive from a modified tag");
        let tag = new Tag([], null, []);
        tag.set.push(tag);
        if (parent)
            for (let t of parent.set)
                tag.set.push(t);
        return tag;
    }
    /**
    Define a tag _modifier_, which is a function that, given a tag,
    will return a tag that is a subtag of the original. Applying the
    same modifier to a twice tag will return the same value (`m1(t1)
    == m1(t1)`) and applying multiple modifiers will, regardless or
    order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).
    
    When multiple modifiers are applied to a given base tag, each
    smaller set of modifiers is registered as a parent, so that for
    example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
    `m1(m3(t1)`, and so on.
    */
    static defineModifier() {
        let mod = new Modifier;
        return (tag) => {
            if (tag.modified.indexOf(mod) > -1)
                return tag;
            return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b) => a.id - b.id));
        };
    }
}
let nextModifierID = 0;
class Modifier {
    constructor() {
        this.instances = [];
        this.id = nextModifierID++;
    }
    static get(base, mods) {
        if (!mods.length)
            return base;
        let exists = mods[0].instances.find(t => t.base == base && sameArray(mods, t.modified));
        if (exists)
            return exists;
        let set = [], tag = new Tag(set, base, mods);
        for (let m of mods)
            m.instances.push(tag);
        let configs = permute(mods);
        for (let parent of base.set)
            for (let config of configs)
                set.push(Modifier.get(parent, config));
        return tag;
    }
}
function sameArray(a, b) {
    return a.length == b.length && a.every((x, i) => x == b[i]);
}
function permute(array) {
    let result = [array];
    for (let i = 0; i < array.length; i++) {
        for (let a of permute(array.slice(0, i).concat(array.slice(i + 1))))
            result.push(a);
    }
    return result;
}
/**
This function is used to add a set of tags to a language syntax
via
[`Parser.configure`](https://lezer.codemirror.net/docs/ref#lezer.Parser.configure).

The argument object maps node selectors to [highlighting
tags](https://codemirror.net/6/docs/ref/#highlight.Tag) or arrays of tags.

Node selectors may hold one or more (space-separated) node paths.
Such a path can be a [node
name](https://lezer.codemirror.net/docs/ref#tree.NodeType.name),
or multiple node names (or `*` wildcards) separated by slash
characters, as in `"Block/Declaration/VariableName"`. Such a path
matches the final node but only if its direct parent nodes are the
other nodes mentioned. A `*` in such a path matches any parent,
but only a single level—wildcards that match multiple parents
aren't supported, both for efficiency reasons and because Lezer
trees make it rather hard to reason about what they would match.)

A path can be ended with `/...` to indicate that the tag assigned
to the node should also apply to all child nodes, even if they
match their own style (by default, only the innermost style is
used).

When a path ends in `!`, as in `Attribute!`, no further matching
happens for the node's child nodes, and the entire node gets the
given style.

In this notation, node names that contain `/`, `!`, `*`, or `...`
must be quoted as JSON strings.

For example:

```javascript
parser.withProps(
  styleTags({
    // Style Number and BigNumber nodes
    "Number BigNumber": tags.number,
    // Style Escape nodes whose parent is String
    "String/Escape": tags.escape,
    // Style anything inside Attributes nodes
    "Attributes!": tags.meta,
    // Add a style to all content inside Italic nodes
    "Italic/...": tags.emphasis,
    // Style InvalidString nodes as both `string` and `invalid`
    "InvalidString": [tags.string, tags.invalid],
    // Style the node named "/" as punctuation
    '"/"': tags.punctuation
  })
)
```
*/
function styleTags(spec) {
    let byName = Object.create(null);
    for (let prop in spec) {
        let tags = spec[prop];
        if (!Array.isArray(tags))
            tags = [tags];
        for (let part of prop.split(" "))
            if (part) {
                let pieces = [], mode = 2 /* Normal */, rest = part;
                for (let pos = 0;;) {
                    if (rest == "..." && pos > 0 && pos + 3 == part.length) {
                        mode = 1 /* Inherit */;
                        break;
                    }
                    let m = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(rest);
                    if (!m)
                        throw new RangeError("Invalid path: " + part);
                    pieces.push(m[0] == "*" ? null : m[0][0] == '"' ? JSON.parse(m[0]) : m[0]);
                    pos += m[0].length;
                    if (pos == part.length)
                        break;
                    let next = part[pos++];
                    if (pos == part.length && next == "!") {
                        mode = 0 /* Opaque */;
                        break;
                    }
                    if (next != "/")
                        throw new RangeError("Invalid path: " + part);
                    rest = part.slice(pos);
                }
                let last = pieces.length - 1, inner = pieces[last];
                if (!inner)
                    throw new RangeError("Invalid path: " + part);
                let rule = new Rule(tags, mode, last > 0 ? pieces.slice(0, last) : null);
                byName[inner] = rule.sort(byName[inner]);
            }
    }
    return ruleNodeProp.add(byName);
}
const ruleNodeProp = /*@__PURE__*/new NodeProp();
const highlightStyle = /*@__PURE__*/Facet.define({
    combine(stylings) { return stylings.length ? HighlightStyle.combinedMatch(stylings) : null; }
});
const fallbackHighlightStyle = /*@__PURE__*/Facet.define({
    combine(values) { return values.length ? values[0].match : null; }
});
function getHighlightStyle(state) {
    return state.facet(highlightStyle) || state.facet(fallbackHighlightStyle);
}
class Rule {
    constructor(tags, mode, context, next) {
        this.tags = tags;
        this.mode = mode;
        this.context = context;
        this.next = next;
    }
    sort(other) {
        if (!other || other.depth < this.depth) {
            this.next = other;
            return this;
        }
        other.next = this.sort(other.next);
        return other;
    }
    get depth() { return this.context ? this.context.length : 0; }
}
/**
A highlight style associates CSS styles with higlighting
[tags](https://codemirror.net/6/docs/ref/#highlight.Tag).
*/
class HighlightStyle {
    constructor(spec, options) {
        this.map = Object.create(null);
        let modSpec;
        function def(spec) {
            let cls = StyleModule.newName();
            (modSpec || (modSpec = Object.create(null)))["." + cls] = spec;
            return cls;
        }
        this.all = typeof options.all == "string" ? options.all : options.all ? def(options.all) : null;
        for (let style of spec) {
            let cls = (style.class || def(Object.assign({}, style, { tag: null }))) +
                (this.all ? " " + this.all : "");
            let tags = style.tag;
            if (!Array.isArray(tags))
                this.map[tags.id] = cls;
            else
                for (let tag of tags)
                    this.map[tag.id] = cls;
        }
        this.module = modSpec ? new StyleModule(modSpec) : null;
        this.scope = options.scope || null;
        this.match = this.match.bind(this);
        let ext = [treeHighlighter];
        if (this.module)
            ext.push(EditorView.styleModule.of(this.module));
        this.extension = ext.concat(highlightStyle.of(this));
        this.fallback = ext.concat(fallbackHighlightStyle.of(this));
    }
    /**
    Returns the CSS class associated with the given tag, if any.
    This method is bound to the instance by the constructor.
    */
    match(tag, scope) {
        if (this.scope && scope != this.scope)
            return null;
        for (let t of tag.set) {
            let match = this.map[t.id];
            if (match !== undefined) {
                if (t != tag)
                    this.map[tag.id] = match;
                return match;
            }
        }
        return this.map[tag.id] = this.all;
    }
    /**
    Combines an array of highlight styles into a single match
    function that returns all of the classes assigned by the styles
    for a given tag.
    */
    static combinedMatch(styles) {
        if (styles.length == 1)
            return styles[0].match;
        let cache = styles.some(s => s.scope) ? undefined : Object.create(null);
        return (tag, scope) => {
            let cached = cache && cache[tag.id];
            if (cached !== undefined)
                return cached;
            let result = null;
            for (let style of styles) {
                let value = style.match(tag, scope);
                if (value)
                    result = result ? result + " " + value : value;
            }
            if (cache)
                cache[tag.id] = result;
            return result;
        };
    }
    /**
    Create a highlighter style that associates the given styles to
    the given tags. The spec must be objects that hold a style tag
    or array of tags in their `tag` property, and either a single
    `class` property providing a static CSS class (for highlighters
    like [`classHighlightStyle`](https://codemirror.net/6/docs/ref/#highlight.classHighlightStyle)
    that rely on external styling), or a
    [`style-mod`](https://github.com/marijnh/style-mod#documentation)-style
    set of CSS properties (which define the styling for those tags).
    
    The CSS rules created for a highlighter will be emitted in the
    order of the spec's properties. That means that for elements that
    have multiple tags associated with them, styles defined further
    down in the list will have a higher CSS precedence than styles
    defined earlier.
    */
    static define(specs, options) {
        return new HighlightStyle(specs, options || {});
    }
    /**
    Returns the CSS classes (if any) that the highlight styles
    active in the given state would assign to the given a style
    [tag](https://codemirror.net/6/docs/ref/#highlight.Tag) and (optional) language
    [scope](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle^define^options.scope).
    */
    static get(state, tag, scope) {
        let style = getHighlightStyle(state);
        return style && style(tag, scope || NodeType.none);
    }
}
class TreeHighlighter {
    constructor(view) {
        this.markCache = Object.create(null);
        this.tree = syntaxTree(view.state);
        this.decorations = this.buildDeco(view, getHighlightStyle(view.state));
    }
    update(update) {
        let tree = syntaxTree(update.state), style = getHighlightStyle(update.state);
        let styleChange = style != update.startState.facet(highlightStyle);
        if (tree.length < update.view.viewport.to && !styleChange) {
            this.decorations = this.decorations.map(update.changes);
        }
        else if (tree != this.tree || update.viewportChanged || styleChange) {
            this.tree = tree;
            this.decorations = this.buildDeco(update.view, style);
        }
    }
    buildDeco(view, match) {
        if (!match || !this.tree.length)
            return Decoration.none;
        let builder = new RangeSetBuilder();
        for (let { from, to } of view.visibleRanges) {
            highlightTreeRange(this.tree, from, to, match, (from, to, style) => {
                builder.add(from, to, this.markCache[style] || (this.markCache[style] = Decoration.mark({ class: style })));
            });
        }
        return builder.finish();
    }
}
// This extension installs a highlighter that highlights based on the
// syntax tree and highlight style.
const treeHighlighter = /*@__PURE__*/Prec.fallback(/*@__PURE__*/ViewPlugin.fromClass(TreeHighlighter, {
    decorations: v => v.decorations
}));
const nodeStack = [""];
function highlightTreeRange(tree, from, to, style, span) {
    let spanStart = from, spanClass = "";
    let cursor = tree.topNode.cursor;
    function flush(at, newClass) {
        if (spanClass)
            span(spanStart, at, spanClass);
        spanStart = at;
        spanClass = newClass;
    }
    function node(inheritedClass, depth, scope) {
        let { type, from: start, to: end } = cursor;
        if (start >= to || end <= from)
            return;
        nodeStack[depth] = type.name;
        if (type.isTop)
            scope = type;
        let cls = inheritedClass;
        let rule = type.prop(ruleNodeProp), opaque = false;
        while (rule) {
            if (!rule.context || matchContext(rule.context, nodeStack, depth)) {
                for (let tag of rule.tags) {
                    let st = style(tag, scope);
                    if (st) {
                        if (cls)
                            cls += " ";
                        cls += st;
                        if (rule.mode == 1 /* Inherit */)
                            inheritedClass += (inheritedClass ? " " : "") + st;
                        else if (rule.mode == 0 /* Opaque */)
                            opaque = true;
                    }
                }
                break;
            }
            rule = rule.next;
        }
        let upto = start;
        if (!opaque && cursor.firstChild()) {
            do {
                if (cursor.from > upto && spanClass != cls)
                    flush(upto, cls);
                upto = cursor.to;
                node(inheritedClass, depth + 1, scope);
            } while (cursor.nextSibling());
            cursor.parent();
        }
        if (end > upto && spanClass != cls)
            flush(upto, cls);
    }
    node("", 0, tree.type);
    flush(to, "");
}
function matchContext(context, stack, depth) {
    if (context.length > depth - 1)
        return false;
    for (let d = depth - 1, i = context.length - 1; i >= 0; i--, d--) {
        let check = context[i];
        if (check && check != stack[d])
            return false;
    }
    return true;
}
const t = Tag.define;
const comment = /*@__PURE__*/t(), name = /*@__PURE__*/t(), typeName = /*@__PURE__*/t(name), literal = /*@__PURE__*/t(), string = /*@__PURE__*/t(literal), number = /*@__PURE__*/t(literal), content = /*@__PURE__*/t(), heading = /*@__PURE__*/t(content), keyword = /*@__PURE__*/t(), operator = /*@__PURE__*/t(), punctuation = /*@__PURE__*/t(), bracket = /*@__PURE__*/t(punctuation), meta = /*@__PURE__*/t();
/**
The default set of highlighting [tags](https://codemirror.net/6/docs/ref/#highlight.Tag^define) used
by regular language packages and themes.

This collection is heavily biased towards programming languages,
and necessarily incomplete. A full ontology of syntactic
constructs would fill a stack of books, and be impractical to
write themes for. So try to make do with this set. If all else
fails, [open an
issue](https://github.com/codemirror/codemirror.next) to propose a
new tag, or [define](https://codemirror.net/6/docs/ref/#highlight.Tag^define) a local custom tag for
your use case.

Note that it is not obligatory to always attach the most specific
tag possible to an element—if your grammar can't easily
distinguish a certain type of element (such as a local variable),
it is okay to style it as its more general variant (a variable).

For tags that extend some parent tag, the documentation links to
the parent.
*/
const tags = {
    /**
    A comment.
    */
    comment,
    /**
    A line [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    lineComment: /*@__PURE__*/t(comment),
    /**
    A block [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    blockComment: /*@__PURE__*/t(comment),
    /**
    A documentation [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    docComment: /*@__PURE__*/t(comment),
    /**
    Any kind of identifier.
    */
    name,
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a variable.
    */
    variableName: /*@__PURE__*/t(name),
    /**
    A type [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    typeName: typeName,
    /**
    A tag name (subtag of [`typeName`](https://codemirror.net/6/docs/ref/#highlight.tags.typeName)).
    */
    tagName: /*@__PURE__*/t(typeName),
    /**
    A property, field, or attribute [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    propertyName: /*@__PURE__*/t(name),
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a class.
    */
    className: /*@__PURE__*/t(name),
    /**
    A label [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    labelName: /*@__PURE__*/t(name),
    /**
    A namespace [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    namespace: /*@__PURE__*/t(name),
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a macro.
    */
    macroName: /*@__PURE__*/t(name),
    /**
    A literal value.
    */
    literal,
    /**
    A string [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    string,
    /**
    A documentation [string](https://codemirror.net/6/docs/ref/#highlight.tags.string).
    */
    docString: /*@__PURE__*/t(string),
    /**
    A character literal (subtag of [string](https://codemirror.net/6/docs/ref/#highlight.tags.string)).
    */
    character: /*@__PURE__*/t(string),
    /**
    A number [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    number,
    /**
    An integer [number](https://codemirror.net/6/docs/ref/#highlight.tags.number) literal.
    */
    integer: /*@__PURE__*/t(number),
    /**
    A floating-point [number](https://codemirror.net/6/docs/ref/#highlight.tags.number) literal.
    */
    float: /*@__PURE__*/t(number),
    /**
    A boolean [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    bool: /*@__PURE__*/t(literal),
    /**
    Regular expression [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    regexp: /*@__PURE__*/t(literal),
    /**
    An escape [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal), for example a
    backslash escape in a string.
    */
    escape: /*@__PURE__*/t(literal),
    /**
    A color [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    color: /*@__PURE__*/t(literal),
    /**
    A URL [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    url: /*@__PURE__*/t(literal),
    /**
    A language keyword.
    */
    keyword,
    /**
    The [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) for the self or this
    object.
    */
    self: /*@__PURE__*/t(keyword),
    /**
    The [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) for null.
    */
    null: /*@__PURE__*/t(keyword),
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) denoting some atomic value.
    */
    atom: /*@__PURE__*/t(keyword),
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that represents a unit.
    */
    unit: /*@__PURE__*/t(keyword),
    /**
    A modifier [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword).
    */
    modifier: /*@__PURE__*/t(keyword),
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that acts as an operator.
    */
    operatorKeyword: /*@__PURE__*/t(keyword),
    /**
    A control-flow related [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword).
    */
    controlKeyword: /*@__PURE__*/t(keyword),
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that defines something.
    */
    definitionKeyword: /*@__PURE__*/t(keyword),
    /**
    An operator.
    */
    operator,
    /**
    An [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that defines something.
    */
    derefOperator: /*@__PURE__*/t(operator),
    /**
    Arithmetic-related [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    arithmeticOperator: /*@__PURE__*/t(operator),
    /**
    Logical [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    logicOperator: /*@__PURE__*/t(operator),
    /**
    Bit [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    bitwiseOperator: /*@__PURE__*/t(operator),
    /**
    Comparison [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    compareOperator: /*@__PURE__*/t(operator),
    /**
    [Operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that updates its operand.
    */
    updateOperator: /*@__PURE__*/t(operator),
    /**
    [Operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that defines something.
    */
    definitionOperator: /*@__PURE__*/t(operator),
    /**
    Type-related [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    typeOperator: /*@__PURE__*/t(operator),
    /**
    Control-flow [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    controlOperator: /*@__PURE__*/t(operator),
    /**
    Program or markup punctuation.
    */
    punctuation,
    /**
    [Punctuation](https://codemirror.net/6/docs/ref/#highlight.tags.punctuation) that separates
    things.
    */
    separator: /*@__PURE__*/t(punctuation),
    /**
    Bracket-style [punctuation](https://codemirror.net/6/docs/ref/#highlight.tags.punctuation).
    */
    bracket,
    /**
    Angle [brackets](https://codemirror.net/6/docs/ref/#highlight.tags.bracket) (usually `<` and `>`
    tokens).
    */
    angleBracket: /*@__PURE__*/t(bracket),
    /**
    Square [brackets](https://codemirror.net/6/docs/ref/#highlight.tags.bracket) (usually `[` and `]`
    tokens).
    */
    squareBracket: /*@__PURE__*/t(bracket),
    /**
    Parentheses (usually `(` and `)` tokens). Subtag of
    [bracket](https://codemirror.net/6/docs/ref/#highlight.tags.bracket).
    */
    paren: /*@__PURE__*/t(bracket),
    /**
    Braces (usually `{` and `}` tokens). Subtag of
    [bracket](https://codemirror.net/6/docs/ref/#highlight.tags.bracket).
    */
    brace: /*@__PURE__*/t(bracket),
    /**
    Content, for example plain text in XML or markup documents.
    */
    content,
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a heading.
    */
    heading,
    /**
    A level 1 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading1: /*@__PURE__*/t(heading),
    /**
    A level 2 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading2: /*@__PURE__*/t(heading),
    /**
    A level 3 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading3: /*@__PURE__*/t(heading),
    /**
    A level 4 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading4: /*@__PURE__*/t(heading),
    /**
    A level 5 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading5: /*@__PURE__*/t(heading),
    /**
    A level 6 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading6: /*@__PURE__*/t(heading),
    /**
    A prose separator (such as a horizontal rule).
    */
    contentSeparator: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a list.
    */
    list: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a quote.
    */
    quote: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is emphasized.
    */
    emphasis: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is styled strong.
    */
    strong: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is part of a link.
    */
    link: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is styled as code or
    monospace.
    */
    monospace: /*@__PURE__*/t(content),
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that has a strike-through
    style.
    */
    strikethrough: /*@__PURE__*/t(content),
    /**
    Inserted text in a change-tracking format.
    */
    inserted: /*@__PURE__*/t(),
    /**
    Deleted text.
    */
    deleted: /*@__PURE__*/t(),
    /**
    Changed text.
    */
    changed: /*@__PURE__*/t(),
    /**
    An invalid or unsyntactic element.
    */
    invalid: /*@__PURE__*/t(),
    /**
    Metadata or meta-instruction.
    */
    meta,
    /**
    [Metadata](https://codemirror.net/6/docs/ref/#highlight.tags.meta) that applies to the entire
    document.
    */
    documentMeta: /*@__PURE__*/t(meta),
    /**
    [Metadata](https://codemirror.net/6/docs/ref/#highlight.tags.meta) that annotates or adds
    attributes to a given syntactic element.
    */
    annotation: /*@__PURE__*/t(meta),
    /**
    Processing instruction or preprocessor directive. Subtag of
    [meta](https://codemirror.net/6/docs/ref/#highlight.tags.meta).
    */
    processingInstruction: /*@__PURE__*/t(meta),
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates that a
    given element is being defined. Expected to be used with the
    various [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) tags.
    */
    definition: /*@__PURE__*/Tag.defineModifier(),
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates that
    something is constant. Mostly expected to be used with
    [variable names](https://codemirror.net/6/docs/ref/#highlight.tags.variableName).
    */
    constant: /*@__PURE__*/Tag.defineModifier(),
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) used to indicate that
    a [variable](https://codemirror.net/6/docs/ref/#highlight.tags.variableName) or [property
    name](https://codemirror.net/6/docs/ref/#highlight.tags.propertyName) is being called or defined
    as a function.
    */
    function: /*@__PURE__*/Tag.defineModifier(),
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that can be applied to
    [names](https://codemirror.net/6/docs/ref/#highlight.tags.name) to indicate that they belong to
    the language's standard environment.
    */
    standard: /*@__PURE__*/Tag.defineModifier(),
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates a given
    [names](https://codemirror.net/6/docs/ref/#highlight.tags.name) is local to some scope.
    */
    local: /*@__PURE__*/Tag.defineModifier(),
    /**
    A generic variant [modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that
    can be used to tag language-specific alternative variants of
    some common tag. It is recommended for themes to define special
    forms of at least the [string](https://codemirror.net/6/docs/ref/#highlight.tags.string) and
    [variable name](https://codemirror.net/6/docs/ref/#highlight.tags.variableName) tags, since those
    come up a lot.
    */
    special: /*@__PURE__*/Tag.defineModifier()
};
/**
A default highlight style (works well with light themes).
*/
const defaultHighlightStyle = /*@__PURE__*/HighlightStyle.define([
    { tag: tags.link,
        textDecoration: "underline" },
    { tag: tags.heading,
        textDecoration: "underline",
        fontWeight: "bold" },
    { tag: tags.emphasis,
        fontStyle: "italic" },
    { tag: tags.strong,
        fontWeight: "bold" },
    { tag: tags.strikethrough,
        textDecoration: "line-through" },
    { tag: tags.keyword,
        color: "#708" },
    { tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
        color: "#219" },
    { tag: [tags.literal, tags.inserted],
        color: "#164" },
    { tag: [tags.string, tags.deleted],
        color: "#a11" },
    { tag: [tags.regexp, tags.escape, /*@__PURE__*/tags.special(tags.string)],
        color: "#e40" },
    { tag: /*@__PURE__*/tags.definition(tags.variableName),
        color: "#00f" },
    { tag: /*@__PURE__*/tags.local(tags.variableName),
        color: "#30a" },
    { tag: [tags.typeName, tags.namespace],
        color: "#085" },
    { tag: tags.className,
        color: "#167" },
    { tag: [/*@__PURE__*/tags.special(tags.variableName), tags.macroName],
        color: "#256" },
    { tag: /*@__PURE__*/tags.definition(tags.propertyName),
        color: "#00c" },
    { tag: tags.comment,
        color: "#940" },
    { tag: tags.meta,
        color: "#7a757a" },
    { tag: tags.invalid,
        color: "#f00" }
]);

export { ifNotIn as A, completeFromList as B, DefaultBufferLength as D, IndentContext as I, LezerLanguage as L, NodeProp as N, Tree as T, indentString as a, getIndentation as b, indentOnInput as c, defaultHighlightStyle as d, autocompletion as e, foldable as f, getIndentUnit as g, hoverTooltip as h, indentUnit as i, completionKeymap as j, NodeSet as k, language as l, NodeType as m, stringInput as n, TreeBuffer as o, snippetCompletion as p, indentNodeProp as q, continuedIndent as r, syntaxTree as s, flatIndent as t, delimitedIndent as u, foldNodeProp as v, foldInside as w, styleTags as x, tags as y, LanguageSupport as z };
