import { D as DefaultBufferLength, k as NodeSet, m as NodeType, n as stringInput, T as Tree, o as TreeBuffer, N as NodeProp, p as snippetCompletion, L as LezerLanguage, q as indentNodeProp, r as continuedIndent, t as flatIndent, u as delimitedIndent, v as foldNodeProp, w as foldInside, x as styleTags, y as tags, z as LanguageSupport, A as ifNotIn, B as completeFromList } from '../common/index-6f08f71d.js';
import '../common/index-c694cd06.js';
import '../common/index-4410d11b.js';
import '../common/index.es-6148ba8b.js';

/* SNOWPACK PROCESS POLYFILL (based on https://github.com/calvinmetcalf/node-process-es6) */
function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
var globalContext;
if (typeof window !== 'undefined') {
    globalContext = window;
} else if (typeof self !== 'undefined') {
    globalContext = self;
} else {
    globalContext = {};
}
if (typeof globalContext.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof globalContext.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = globalContext.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var process = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: {"NODE_ENV":"production"},
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

/// A parse stack. These are used internally by the parser to track
/// parsing progress. They also provide some properties and methods
/// that external code such as a tokenizer can use to get information
/// about the parse state.
class Stack {
    /// @internal
    constructor(
    /// A the parse that this stack is part of @internal
    p, 
    /// Holds state, pos, value stack pos (15 bits array index, 15 bits
    /// buffer index) triplets for all but the top state
    /// @internal
    stack, 
    /// The current parse state @internal
    state, 
    // The position at which the next reduce should take place. This
    // can be less than `this.pos` when skipped expressions have been
    // added to the stack (which should be moved outside of the next
    // reduction)
    /// @internal
    reducePos, 
    /// The input position up to which this stack has parsed.
    pos, 
    /// The dynamic score of the stack, including dynamic precedence
    /// and error-recovery penalties
    /// @internal
    score, 
    // The output buffer. Holds (type, start, end, size) quads
    // representing nodes created by the parser, where `size` is
    // amount of buffer array entries covered by this node.
    /// @internal
    buffer, 
    // The base offset of the buffer. When stacks are split, the split
    // instance shared the buffer history with its parent up to
    // `bufferBase`, which is the absolute offset (including the
    // offset of previous splits) into the buffer at which this stack
    // starts writing.
    /// @internal
    bufferBase, 
    /// @internal
    curContext, 
    // A parent stack from which this was split off, if any. This is
    // set up so that it always points to a stack that has some
    // additional buffer content, never to a stack with an equal
    // `bufferBase`.
    /// @internal
    parent) {
        this.p = p;
        this.stack = stack;
        this.state = state;
        this.reducePos = reducePos;
        this.pos = pos;
        this.score = score;
        this.buffer = buffer;
        this.bufferBase = bufferBase;
        this.curContext = curContext;
        this.parent = parent;
    }
    /// @internal
    toString() {
        return `[${this.stack.filter((_, i) => i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
    }
    // Start an empty stack
    /// @internal
    static start(p, state, pos = 0) {
        let cx = p.parser.context;
        return new Stack(p, [], state, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, null);
    }
    /// The stack's current [context](#lezer.ContextTracker) value, if
    /// any. Its type will depend on the context tracker's type
    /// parameter, or it will be `null` if there is no context
    /// tracker.
    get context() { return this.curContext ? this.curContext.context : null; }
    // Push a state onto the stack, tracking its start position as well
    // as the buffer base at that point.
    /// @internal
    pushState(state, start) {
        this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
        this.state = state;
    }
    // Apply a reduce action
    /// @internal
    reduce(action) {
        let depth = action >> 19 /* ReduceDepthShift */, type = action & 65535 /* ValueMask */;
        let { parser } = this.p;
        let dPrec = parser.dynamicPrecedence(type);
        if (dPrec)
            this.score += dPrec;
        if (depth == 0) {
            // Zero-depth reductions are a special case—they add stuff to
            // the stack without popping anything off.
            if (type < parser.minRepeatTerm)
                this.storeNode(type, this.reducePos, this.reducePos, 4, true);
            this.pushState(parser.getGoto(this.state, type, true), this.reducePos);
            this.reduceContext(type);
            return;
        }
        // Find the base index into `this.stack`, content after which will
        // be dropped. Note that with `StayFlag` reductions we need to
        // consume two extra frames (the dummy parent node for the skipped
        // expression and the state that we'll be staying in, which should
        // be moved to `this.state`).
        let base = this.stack.length - ((depth - 1) * 3) - (action & 262144 /* StayFlag */ ? 6 : 0);
        let start = this.stack[base - 2];
        let bufferBase = this.stack[base - 1], count = this.bufferBase + this.buffer.length - bufferBase;
        // Store normal terms or `R -> R R` repeat reductions
        if (type < parser.minRepeatTerm || (action & 131072 /* RepeatFlag */)) {
            let pos = parser.stateFlag(this.state, 1 /* Skipped */) ? this.pos : this.reducePos;
            this.storeNode(type, start, pos, count + 4, true);
        }
        if (action & 262144 /* StayFlag */) {
            this.state = this.stack[base];
        }
        else {
            let baseStateID = this.stack[base - 3];
            this.state = parser.getGoto(baseStateID, type, true);
        }
        while (this.stack.length > base)
            this.stack.pop();
        this.reduceContext(type);
    }
    // Shift a value into the buffer
    /// @internal
    storeNode(term, start, end, size = 4, isReduce = false) {
        if (term == 0 /* Err */) { // Try to omit/merge adjacent error nodes
            let cur = this, top = this.buffer.length;
            if (top == 0 && cur.parent) {
                top = cur.bufferBase - cur.parent.bufferBase;
                cur = cur.parent;
            }
            if (top > 0 && cur.buffer[top - 4] == 0 /* Err */ && cur.buffer[top - 1] > -1) {
                if (start == end)
                    return;
                if (cur.buffer[top - 2] >= start) {
                    cur.buffer[top - 2] = end;
                    return;
                }
            }
        }
        if (!isReduce || this.pos == end) { // Simple case, just append
            this.buffer.push(term, start, end, size);
        }
        else { // There may be skipped nodes that have to be moved forward
            let index = this.buffer.length;
            if (index > 0 && this.buffer[index - 4] != 0 /* Err */)
                while (index > 0 && this.buffer[index - 2] > end) {
                    // Move this record forward
                    this.buffer[index] = this.buffer[index - 4];
                    this.buffer[index + 1] = this.buffer[index - 3];
                    this.buffer[index + 2] = this.buffer[index - 2];
                    this.buffer[index + 3] = this.buffer[index - 1];
                    index -= 4;
                    if (size > 4)
                        size -= 4;
                }
            this.buffer[index] = term;
            this.buffer[index + 1] = start;
            this.buffer[index + 2] = end;
            this.buffer[index + 3] = size;
        }
    }
    // Apply a shift action
    /// @internal
    shift(action, next, nextEnd) {
        if (action & 131072 /* GotoFlag */) {
            this.pushState(action & 65535 /* ValueMask */, this.pos);
        }
        else if ((action & 262144 /* StayFlag */) == 0) { // Regular shift
            let start = this.pos, nextState = action, { parser } = this.p;
            if (nextEnd > this.pos || next <= parser.maxNode) {
                this.pos = nextEnd;
                if (!parser.stateFlag(nextState, 1 /* Skipped */))
                    this.reducePos = nextEnd;
            }
            this.pushState(nextState, start);
            if (next <= parser.maxNode)
                this.buffer.push(next, start, nextEnd, 4);
            this.shiftContext(next);
        }
        else { // Shift-and-stay, which means this is a skipped token
            if (next <= this.p.parser.maxNode)
                this.buffer.push(next, this.pos, nextEnd, 4);
            this.pos = nextEnd;
        }
    }
    // Apply an action
    /// @internal
    apply(action, next, nextEnd) {
        if (action & 65536 /* ReduceFlag */)
            this.reduce(action);
        else
            this.shift(action, next, nextEnd);
    }
    // Add a prebuilt node into the buffer. This may be a reused node or
    // the result of running a nested parser.
    /// @internal
    useNode(value, next) {
        let index = this.p.reused.length - 1;
        if (index < 0 || this.p.reused[index] != value) {
            this.p.reused.push(value);
            index++;
        }
        let start = this.pos;
        this.reducePos = this.pos = start + value.length;
        this.pushState(next, start);
        this.buffer.push(index, start, this.reducePos, -1 /* size < 0 means this is a reused value */);
        if (this.curContext)
            this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this.p.input, this));
    }
    // Split the stack. Due to the buffer sharing and the fact
    // that `this.stack` tends to stay quite shallow, this isn't very
    // expensive.
    /// @internal
    split() {
        let parent = this;
        let off = parent.buffer.length;
        // Because the top of the buffer (after this.pos) may be mutated
        // to reorder reductions and skipped tokens, and shared buffers
        // should be immutable, this copies any outstanding skipped tokens
        // to the new buffer, and puts the base pointer before them.
        while (off > 0 && parent.buffer[off - 2] > parent.reducePos)
            off -= 4;
        let buffer = parent.buffer.slice(off), base = parent.bufferBase + off;
        // Make sure parent points to an actual parent with content, if there is such a parent.
        while (parent && base == parent.bufferBase)
            parent = parent.parent;
        return new Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base, this.curContext, parent);
    }
    // Try to recover from an error by 'deleting' (ignoring) one token.
    /// @internal
    recoverByDelete(next, nextEnd) {
        let isNode = next <= this.p.parser.maxNode;
        if (isNode)
            this.storeNode(next, this.pos, nextEnd);
        this.storeNode(0 /* Err */, this.pos, nextEnd, isNode ? 8 : 4);
        this.pos = this.reducePos = nextEnd;
        this.score -= 200 /* Token */;
    }
    /// Check if the given term would be able to be shifted (optionally
    /// after some reductions) on this stack. This can be useful for
    /// external tokenizers that want to make sure they only provide a
    /// given token when it applies.
    canShift(term) {
        for (let sim = new SimulatedStack(this);;) {
            let action = this.p.parser.stateSlot(sim.top, 4 /* DefaultReduce */) || this.p.parser.hasAction(sim.top, term);
            if ((action & 65536 /* ReduceFlag */) == 0)
                return true;
            if (action == 0)
                return false;
            sim.reduce(action);
        }
    }
    /// Find the start position of the rule that is currently being parsed.
    get ruleStart() {
        for (let state = this.state, base = this.stack.length;;) {
            let force = this.p.parser.stateSlot(state, 5 /* ForcedReduce */);
            if (!(force & 65536 /* ReduceFlag */))
                return 0;
            base -= 3 * (force >> 19 /* ReduceDepthShift */);
            if ((force & 65535 /* ValueMask */) < this.p.parser.minRepeatTerm)
                return this.stack[base + 1];
            state = this.stack[base];
        }
    }
    /// Find the start position of an instance of any of the given term
    /// types, or return `null` when none of them are found.
    ///
    /// **Note:** this is only reliable when there is at least some
    /// state that unambiguously matches the given rule on the stack.
    /// I.e. if you have a grammar like this, where the difference
    /// between `a` and `b` is only apparent at the third token:
    ///
    ///     a { b | c }
    ///     b { "x" "y" "x" }
    ///     c { "x" "y" "z" }
    ///
    /// Then a parse state after `"x"` will not reliably tell you that
    /// `b` is on the stack. You _can_ pass `[b, c]` to reliably check
    /// for either of those two rules (assuming that `a` isn't part of
    /// some rule that includes other things starting with `"x"`).
    ///
    /// When `before` is given, this keeps scanning up the stack until
    /// it finds a match that starts before that position.
    ///
    /// Note that you have to be careful when using this in tokenizers,
    /// since it's relatively easy to introduce data dependencies that
    /// break incremental parsing by using this method.
    startOf(types, before) {
        let state = this.state, frame = this.stack.length, { parser } = this.p;
        for (;;) {
            let force = parser.stateSlot(state, 5 /* ForcedReduce */);
            let depth = force >> 19 /* ReduceDepthShift */, term = force & 65535 /* ValueMask */;
            if (types.indexOf(term) > -1) {
                let base = frame - (3 * (force >> 19 /* ReduceDepthShift */)), pos = this.stack[base + 1];
                if (before == null || before > pos)
                    return pos;
            }
            if (frame == 0)
                return null;
            if (depth == 0) {
                frame -= 3;
                state = this.stack[frame];
            }
            else {
                frame -= 3 * (depth - 1);
                state = parser.getGoto(this.stack[frame - 3], term, true);
            }
        }
    }
    // Apply up to Recover.MaxNext recovery actions that conceptually
    // inserts some missing token or rule.
    /// @internal
    recoverByInsert(next) {
        if (this.stack.length >= 300 /* MaxInsertStackDepth */)
            return [];
        let nextStates = this.p.parser.nextStates(this.state);
        if (nextStates.length > 4 /* MaxNext */ << 1 || this.stack.length >= 120 /* DampenInsertStackDepth */) {
            let best = [];
            for (let i = 0, s; i < nextStates.length; i += 2) {
                if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next))
                    best.push(nextStates[i], s);
            }
            if (this.stack.length < 120 /* DampenInsertStackDepth */)
                for (let i = 0; best.length < 4 /* MaxNext */ << 1 && i < nextStates.length; i += 2) {
                    let s = nextStates[i + 1];
                    if (!best.some((v, i) => (i & 1) && v == s))
                        best.push(nextStates[i], s);
                }
            nextStates = best;
        }
        let result = [];
        for (let i = 0; i < nextStates.length && result.length < 4 /* MaxNext */; i += 2) {
            let s = nextStates[i + 1];
            if (s == this.state)
                continue;
            let stack = this.split();
            stack.storeNode(0 /* Err */, stack.pos, stack.pos, 4, true);
            stack.pushState(s, this.pos);
            stack.shiftContext(nextStates[i]);
            stack.score -= 200 /* Token */;
            result.push(stack);
        }
        return result;
    }
    // Force a reduce, if possible. Return false if that can't
    // be done.
    /// @internal
    forceReduce() {
        let reduce = this.p.parser.stateSlot(this.state, 5 /* ForcedReduce */);
        if ((reduce & 65536 /* ReduceFlag */) == 0)
            return false;
        if (!this.p.parser.validAction(this.state, reduce)) {
            this.storeNode(0 /* Err */, this.reducePos, this.reducePos, 4, true);
            this.score -= 100 /* Reduce */;
        }
        this.reduce(reduce);
        return true;
    }
    /// @internal
    forceAll() {
        while (!this.p.parser.stateFlag(this.state, 2 /* Accepting */) && this.forceReduce()) { }
        return this;
    }
    /// Check whether this state has no further actions (assumed to be a direct descendant of the
    /// top state, since any other states must be able to continue
    /// somehow). @internal
    get deadEnd() {
        if (this.stack.length != 3)
            return false;
        let { parser } = this.p;
        return parser.data[parser.stateSlot(this.state, 1 /* Actions */)] == 65535 /* End */ &&
            !parser.stateSlot(this.state, 4 /* DefaultReduce */);
    }
    /// Restart the stack (put it back in its start state). Only safe
    /// when this.stack.length == 3 (state is directly below the top
    /// state). @internal
    restart() {
        this.state = this.stack[0];
        this.stack.length = 0;
    }
    /// @internal
    sameState(other) {
        if (this.state != other.state || this.stack.length != other.stack.length)
            return false;
        for (let i = 0; i < this.stack.length; i += 3)
            if (this.stack[i] != other.stack[i])
                return false;
        return true;
    }
    /// Get the parser used by this stack.
    get parser() { return this.p.parser; }
    /// Test whether a given dialect (by numeric ID, as exported from
    /// the terms file) is enabled.
    dialectEnabled(dialectID) { return this.p.parser.dialect.flags[dialectID]; }
    shiftContext(term) {
        if (this.curContext)
            this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this.p.input, this));
    }
    reduceContext(term) {
        if (this.curContext)
            this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this.p.input, this));
    }
    /// @internal
    emitContext() {
        let cx = this.curContext;
        if (!cx.tracker.strict)
            return;
        let last = this.buffer.length - 1;
        if (last < 0 || this.buffer[last] != -2)
            this.buffer.push(cx.hash, this.reducePos, this.reducePos, -2);
    }
    updateContext(context) {
        if (context != this.curContext.context) {
            let newCx = new StackContext(this.curContext.tracker, context);
            if (newCx.hash != this.curContext.hash)
                this.emitContext();
            this.curContext = newCx;
        }
    }
}
class StackContext {
    constructor(tracker, context) {
        this.tracker = tracker;
        this.context = context;
        this.hash = tracker.hash(context);
    }
}
var Recover;
(function (Recover) {
    Recover[Recover["Token"] = 200] = "Token";
    Recover[Recover["Reduce"] = 100] = "Reduce";
    Recover[Recover["MaxNext"] = 4] = "MaxNext";
    Recover[Recover["MaxInsertStackDepth"] = 300] = "MaxInsertStackDepth";
    Recover[Recover["DampenInsertStackDepth"] = 120] = "DampenInsertStackDepth";
})(Recover || (Recover = {}));
// Used to cheaply run some reductions to scan ahead without mutating
// an entire stack
class SimulatedStack {
    constructor(stack) {
        this.stack = stack;
        this.top = stack.state;
        this.rest = stack.stack;
        this.offset = this.rest.length;
    }
    reduce(action) {
        let term = action & 65535 /* ValueMask */, depth = action >> 19 /* ReduceDepthShift */;
        if (depth == 0) {
            if (this.rest == this.stack.stack)
                this.rest = this.rest.slice();
            this.rest.push(this.top, 0, 0);
            this.offset += 3;
        }
        else {
            this.offset -= (depth - 1) * 3;
        }
        let goto = this.stack.p.parser.getGoto(this.rest[this.offset - 3], term, true);
        this.top = goto;
    }
}
// This is given to `Tree.build` to build a buffer, and encapsulates
// the parent-stack-walking necessary to read the nodes.
class StackBufferCursor {
    constructor(stack, pos, index) {
        this.stack = stack;
        this.pos = pos;
        this.index = index;
        this.buffer = stack.buffer;
        if (this.index == 0)
            this.maybeNext();
    }
    static create(stack) {
        return new StackBufferCursor(stack, stack.bufferBase + stack.buffer.length, stack.buffer.length);
    }
    maybeNext() {
        let next = this.stack.parent;
        if (next != null) {
            this.index = this.stack.bufferBase - next.bufferBase;
            this.stack = next;
            this.buffer = next.buffer;
        }
    }
    get id() { return this.buffer[this.index - 4]; }
    get start() { return this.buffer[this.index - 3]; }
    get end() { return this.buffer[this.index - 2]; }
    get size() { return this.buffer[this.index - 1]; }
    next() {
        this.index -= 4;
        this.pos -= 4;
        if (this.index == 0)
            this.maybeNext();
    }
    fork() {
        return new StackBufferCursor(this.stack, this.pos, this.index);
    }
}

/// Tokenizers write the tokens they read into instances of this class.
class Token {
    constructor() {
        /// The start of the token. This is set by the parser, and should not
        /// be mutated by the tokenizer.
        this.start = -1;
        /// This starts at -1, and should be updated to a term id when a
        /// matching token is found.
        this.value = -1;
        /// When setting `.value`, you should also set `.end` to the end
        /// position of the token. (You'll usually want to use the `accept`
        /// method.)
        this.end = -1;
    }
    /// Accept a token, setting `value` and `end` to the given values.
    accept(value, end) {
        this.value = value;
        this.end = end;
    }
}
/// @internal
class TokenGroup {
    constructor(data, id) {
        this.data = data;
        this.id = id;
    }
    token(input, token, stack) { readToken(this.data, input, token, stack, this.id); }
}
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
/// Exports that are used for `@external tokens` in the grammar should
/// export an instance of this class.
class ExternalTokenizer {
    /// Create a tokenizer. The first argument is the function that,
    /// given an input stream and a token object,
    /// [fills](#lezer.Token.accept) the token object if it recognizes a
    /// token. `token.start` should be used as the start position to
    /// scan from.
    constructor(
    /// @internal
    token, options = {}) {
        this.token = token;
        this.contextual = !!options.contextual;
        this.fallback = !!options.fallback;
        this.extend = !!options.extend;
    }
}
// Tokenizer data is stored a big uint16 array containing, for each
// state:
//
//  - A group bitmask, indicating what token groups are reachable from
//    this state, so that paths that can only lead to tokens not in
//    any of the current groups can be cut off early.
//
//  - The position of the end of the state's sequence of accepting
//    tokens
//
//  - The number of outgoing edges for the state
//
//  - The accepting tokens, as (token id, group mask) pairs
//
//  - The outgoing edges, as (start character, end character, state
//    index) triples, with end character being exclusive
//
// This function interprets that data, running through a stream as
// long as new states with the a matching group mask can be reached,
// and updating `token` when it matches a token.
function readToken(data, input, token, stack, group) {
    let state = 0, groupMask = 1 << group, dialect = stack.p.parser.dialect;
    scan: for (let pos = token.start;;) {
        if ((groupMask & data[state]) == 0)
            break;
        let accEnd = data[state + 1];
        // Check whether this state can lead to a token in the current group
        // Accept tokens in this state, possibly overwriting
        // lower-precedence / shorter tokens
        for (let i = state + 3; i < accEnd; i += 2)
            if ((data[i + 1] & groupMask) > 0) {
                let term = data[i];
                if (dialect.allows(term) &&
                    (token.value == -1 || token.value == term || stack.p.parser.overrides(term, token.value))) {
                    token.accept(term, pos);
                    break;
                }
            }
        let next = input.get(pos++);
        // Do a binary search on the state's edges
        for (let low = 0, high = data[state + 2]; low < high;) {
            let mid = (low + high) >> 1;
            let index = accEnd + mid + (mid << 1);
            let from = data[index], to = data[index + 1];
            if (next < from)
                high = mid;
            else if (next >= to)
                low = mid + 1;
            else {
                state = data[index + 2];
                continue scan;
            }
        }
        break;
    }
}

// See lezer-generator/src/encode.ts for comments about the encoding
// used here
function decodeArray(input, Type = Uint16Array) {
    if (typeof input != "string")
        return input;
    let array = null;
    for (let pos = 0, out = 0; pos < input.length;) {
        let value = 0;
        for (;;) {
            let next = input.charCodeAt(pos++), stop = false;
            if (next == 126 /* BigValCode */) {
                value = 65535 /* BigVal */;
                break;
            }
            if (next >= 92 /* Gap2 */)
                next--;
            if (next >= 34 /* Gap1 */)
                next--;
            let digit = next - 32 /* Start */;
            if (digit >= 46 /* Base */) {
                digit -= 46 /* Base */;
                stop = true;
            }
            value += digit;
            if (stop)
                break;
            value *= 46 /* Base */;
        }
        if (array)
            array[out++] = value;
        else
            array = new Type(value);
    }
    return array;
}

// FIXME find some way to reduce recovery work done when the input
// doesn't match the grammar at all.
// Environment variable used to control console output
const verbose = typeof process != "undefined" && /\bparse\b/.test(process.env.LOG);
let stackIDs = null;
function cutAt(tree, pos, side) {
    let cursor = tree.cursor(pos);
    for (;;) {
        if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos)))
            for (;;) {
                if ((side < 0 ? cursor.to < pos : cursor.from > pos) && !cursor.type.isError)
                    return side < 0 ? Math.max(0, Math.min(cursor.to - 1, pos - 5)) : Math.min(tree.length, Math.max(cursor.from + 1, pos + 5));
                if (side < 0 ? cursor.prevSibling() : cursor.nextSibling())
                    break;
                if (!cursor.parent())
                    return side < 0 ? 0 : tree.length;
            }
    }
}
class FragmentCursor {
    constructor(fragments) {
        this.fragments = fragments;
        this.i = 0;
        this.fragment = null;
        this.safeFrom = -1;
        this.safeTo = -1;
        this.trees = [];
        this.start = [];
        this.index = [];
        this.nextFragment();
    }
    nextFragment() {
        let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
        if (fr) {
            this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
            this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
            while (this.trees.length) {
                this.trees.pop();
                this.start.pop();
                this.index.pop();
            }
            this.trees.push(fr.tree);
            this.start.push(-fr.offset);
            this.index.push(0);
            this.nextStart = this.safeFrom;
        }
        else {
            this.nextStart = 1e9;
        }
    }
    // `pos` must be >= any previously given `pos` for this cursor
    nodeAt(pos) {
        if (pos < this.nextStart)
            return null;
        while (this.fragment && this.safeTo <= pos)
            this.nextFragment();
        if (!this.fragment)
            return null;
        for (;;) {
            let last = this.trees.length - 1;
            if (last < 0) { // End of tree
                this.nextFragment();
                return null;
            }
            let top = this.trees[last], index = this.index[last];
            if (index == top.children.length) {
                this.trees.pop();
                this.start.pop();
                this.index.pop();
                continue;
            }
            let next = top.children[index];
            let start = this.start[last] + top.positions[index];
            if (start > pos) {
                this.nextStart = start;
                return null;
            }
            else if (start == pos && start + next.length <= this.safeTo) {
                return start == pos && start >= this.safeFrom ? next : null;
            }
            if (next instanceof TreeBuffer) {
                this.index[last]++;
                this.nextStart = start + next.length;
            }
            else {
                this.index[last]++;
                if (start + next.length >= pos) { // Enter this node
                    this.trees.push(next);
                    this.start.push(start);
                    this.index.push(0);
                }
            }
        }
    }
}
class CachedToken extends Token {
    constructor() {
        super(...arguments);
        this.extended = -1;
        this.mask = 0;
        this.context = 0;
    }
    clear(start) {
        this.start = start;
        this.value = this.extended = -1;
    }
}
const dummyToken = new Token;
class TokenCache {
    constructor(parser) {
        this.tokens = [];
        this.mainToken = dummyToken;
        this.actions = [];
        this.tokens = parser.tokenizers.map(_ => new CachedToken);
    }
    getActions(stack, input) {
        let actionIndex = 0;
        let main = null;
        let { parser } = stack.p, { tokenizers } = parser;
        let mask = parser.stateSlot(stack.state, 3 /* TokenizerMask */);
        let context = stack.curContext ? stack.curContext.hash : 0;
        for (let i = 0; i < tokenizers.length; i++) {
            if (((1 << i) & mask) == 0)
                continue;
            let tokenizer = tokenizers[i], token = this.tokens[i];
            if (main && !tokenizer.fallback)
                continue;
            if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
                this.updateCachedToken(token, tokenizer, stack, input);
                token.mask = mask;
                token.context = context;
            }
            if (token.value != 0 /* Err */) {
                let startIndex = actionIndex;
                if (token.extended > -1)
                    actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
                actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
                if (!tokenizer.extend) {
                    main = token;
                    if (actionIndex > startIndex)
                        break;
                }
            }
        }
        while (this.actions.length > actionIndex)
            this.actions.pop();
        if (!main) {
            main = dummyToken;
            main.start = stack.pos;
            if (stack.pos == input.length)
                main.accept(stack.p.parser.eofTerm, stack.pos);
            else
                main.accept(0 /* Err */, stack.pos + 1);
        }
        this.mainToken = main;
        return this.actions;
    }
    updateCachedToken(token, tokenizer, stack, input) {
        token.clear(stack.pos);
        tokenizer.token(input, token, stack);
        if (token.value > -1) {
            let { parser } = stack.p;
            for (let i = 0; i < parser.specialized.length; i++)
                if (parser.specialized[i] == token.value) {
                    let result = parser.specializers[i](input.read(token.start, token.end), stack);
                    if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
                        if ((result & 1) == 0 /* Specialize */)
                            token.value = result >> 1;
                        else
                            token.extended = result >> 1;
                        break;
                    }
                }
        }
        else if (stack.pos == input.length) {
            token.accept(stack.p.parser.eofTerm, stack.pos);
        }
        else {
            token.accept(0 /* Err */, stack.pos + 1);
        }
    }
    putAction(action, token, end, index) {
        // Don't add duplicate actions
        for (let i = 0; i < index; i += 3)
            if (this.actions[i] == action)
                return index;
        this.actions[index++] = action;
        this.actions[index++] = token;
        this.actions[index++] = end;
        return index;
    }
    addActions(stack, token, end, index) {
        let { state } = stack, { parser } = stack.p, { data } = parser;
        for (let set = 0; set < 2; set++) {
            for (let i = parser.stateSlot(state, set ? 2 /* Skip */ : 1 /* Actions */);; i += 3) {
                if (data[i] == 65535 /* End */) {
                    if (data[i + 1] == 1 /* Next */) {
                        i = pair(data, i + 2);
                    }
                    else {
                        if (index == 0 && data[i + 1] == 2 /* Other */)
                            index = this.putAction(pair(data, i + 1), token, end, index);
                        break;
                    }
                }
                if (data[i] == token)
                    index = this.putAction(pair(data, i + 1), token, end, index);
            }
        }
        return index;
    }
}
var Rec;
(function (Rec) {
    Rec[Rec["Distance"] = 5] = "Distance";
    Rec[Rec["MaxRemainingPerStep"] = 3] = "MaxRemainingPerStep";
    Rec[Rec["MinBufferLengthPrune"] = 200] = "MinBufferLengthPrune";
    Rec[Rec["ForceReduceLimit"] = 10] = "ForceReduceLimit";
})(Rec || (Rec = {}));
/// A parse context can be used for step-by-step parsing. After
/// creating it, you repeatedly call `.advance()` until it returns a
/// tree to indicate it has reached the end of the parse.
class Parse {
    constructor(parser, input, startPos, context) {
        this.parser = parser;
        this.input = input;
        this.startPos = startPos;
        this.context = context;
        // The position to which the parse has advanced.
        this.pos = 0;
        this.recovering = 0;
        this.nextStackID = 0x2654;
        this.nested = null;
        this.nestEnd = 0;
        this.nestWrap = null;
        this.reused = [];
        this.tokens = new TokenCache(parser);
        this.topTerm = parser.top[1];
        this.stacks = [Stack.start(this, parser.top[0], this.startPos)];
        let fragments = context === null || context === void 0 ? void 0 : context.fragments;
        this.fragments = fragments && fragments.length ? new FragmentCursor(fragments) : null;
    }
    // Move the parser forward. This will process all parse stacks at
    // `this.pos` and try to advance them to a further position. If no
    // stack for such a position is found, it'll start error-recovery.
    //
    // When the parse is finished, this will return a syntax tree. When
    // not, it returns `null`.
    advance() {
        if (this.nested) {
            let result = this.nested.advance();
            this.pos = this.nested.pos;
            if (result) {
                this.finishNested(this.stacks[0], result);
                this.nested = null;
            }
            return null;
        }
        let stacks = this.stacks, pos = this.pos;
        // This will hold stacks beyond `pos`.
        let newStacks = this.stacks = [];
        let stopped, stoppedTokens;
        let maybeNest;
        // Keep advancing any stacks at `pos` until they either move
        // forward or can't be advanced. Gather stacks that can't be
        // advanced further in `stopped`.
        for (let i = 0; i < stacks.length; i++) {
            let stack = stacks[i], nest;
            for (;;) {
                if (stack.pos > pos) {
                    newStacks.push(stack);
                }
                else if (nest = this.checkNest(stack)) {
                    if (!maybeNest || maybeNest.stack.score < stack.score)
                        maybeNest = nest;
                }
                else if (this.advanceStack(stack, newStacks, stacks)) {
                    continue;
                }
                else {
                    if (!stopped) {
                        stopped = [];
                        stoppedTokens = [];
                    }
                    stopped.push(stack);
                    let tok = this.tokens.mainToken;
                    stoppedTokens.push(tok.value, tok.end);
                }
                break;
            }
        }
        if (maybeNest) {
            this.startNested(maybeNest);
            return null;
        }
        if (!newStacks.length) {
            let finished = stopped && findFinished(stopped);
            if (finished)
                return this.stackToTree(finished);
            if (this.parser.strict) {
                if (verbose && stopped)
                    console.log("Stuck with token " + this.parser.getName(this.tokens.mainToken.value));
                throw new SyntaxError("No parse at " + pos);
            }
            if (!this.recovering)
                this.recovering = 5 /* Distance */;
        }
        if (this.recovering && stopped) {
            let finished = this.runRecovery(stopped, stoppedTokens, newStacks);
            if (finished)
                return this.stackToTree(finished.forceAll());
        }
        if (this.recovering) {
            let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3 /* MaxRemainingPerStep */;
            if (newStacks.length > maxRemaining) {
                newStacks.sort((a, b) => b.score - a.score);
                while (newStacks.length > maxRemaining)
                    newStacks.pop();
            }
            if (newStacks.some(s => s.reducePos > pos))
                this.recovering--;
        }
        else if (newStacks.length > 1) {
            // Prune stacks that are in the same state, or that have been
            // running without splitting for a while, to avoid getting stuck
            // with multiple successful stacks running endlessly on.
            outer: for (let i = 0; i < newStacks.length - 1; i++) {
                let stack = newStacks[i];
                for (let j = i + 1; j < newStacks.length; j++) {
                    let other = newStacks[j];
                    if (stack.sameState(other) ||
                        stack.buffer.length > 200 /* MinBufferLengthPrune */ && other.buffer.length > 200 /* MinBufferLengthPrune */) {
                        if (((stack.score - other.score) || (stack.buffer.length - other.buffer.length)) > 0) {
                            newStacks.splice(j--, 1);
                        }
                        else {
                            newStacks.splice(i--, 1);
                            continue outer;
                        }
                    }
                }
            }
        }
        this.pos = newStacks[0].pos;
        for (let i = 1; i < newStacks.length; i++)
            if (newStacks[i].pos < this.pos)
                this.pos = newStacks[i].pos;
        return null;
    }
    // Returns an updated version of the given stack, or null if the
    // stack can't advance normally. When `split` and `stacks` are
    // given, stacks split off by ambiguous operations will be pushed to
    // `split`, or added to `stacks` if they move `pos` forward.
    advanceStack(stack, stacks, split) {
        let start = stack.pos, { input, parser } = this;
        let base = verbose ? this.stackID(stack) + " -> " : "";
        if (this.fragments) {
            let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
            for (let cached = this.fragments.nodeAt(start); cached;) {
                let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser.getGoto(stack.state, cached.type.id) : -1;
                if (match > -1 && cached.length && (!strictCx || (cached.contextHash || 0) == cxHash)) {
                    stack.useNode(cached, match);
                    if (verbose)
                        console.log(base + this.stackID(stack) + ` (via reuse of ${parser.getName(cached.type.id)})`);
                    return true;
                }
                if (!(cached instanceof Tree) || cached.children.length == 0 || cached.positions[0] > 0)
                    break;
                let inner = cached.children[0];
                if (inner instanceof Tree)
                    cached = inner;
                else
                    break;
            }
        }
        let defaultReduce = parser.stateSlot(stack.state, 4 /* DefaultReduce */);
        if (defaultReduce > 0) {
            stack.reduce(defaultReduce);
            if (verbose)
                console.log(base + this.stackID(stack) + ` (via always-reduce ${parser.getName(defaultReduce & 65535 /* ValueMask */)})`);
            return true;
        }
        let actions = this.tokens.getActions(stack, input);
        for (let i = 0; i < actions.length;) {
            let action = actions[i++], term = actions[i++], end = actions[i++];
            let last = i == actions.length || !split;
            let localStack = last ? stack : stack.split();
            localStack.apply(action, term, end);
            if (verbose)
                console.log(base + this.stackID(localStack) + ` (via ${(action & 65536 /* ReduceFlag */) == 0 ? "shift"
                    : `reduce of ${parser.getName(action & 65535 /* ValueMask */)}`} for ${parser.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
            if (last)
                return true;
            else if (localStack.pos > start)
                stacks.push(localStack);
            else
                split.push(localStack);
        }
        return false;
    }
    // Advance a given stack forward as far as it will go. Returns the
    // (possibly updated) stack if it got stuck, or null if it moved
    // forward and was given to `pushStackDedup`.
    advanceFully(stack, newStacks) {
        let pos = stack.pos;
        for (;;) {
            let nest = this.checkNest(stack);
            if (nest)
                return nest;
            if (!this.advanceStack(stack, null, null))
                return false;
            if (stack.pos > pos) {
                pushStackDedup(stack, newStacks);
                return true;
            }
        }
    }
    runRecovery(stacks, tokens, newStacks) {
        let finished = null, restarted = false;
        let maybeNest;
        for (let i = 0; i < stacks.length; i++) {
            let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
            let base = verbose ? this.stackID(stack) + " -> " : "";
            if (stack.deadEnd) {
                if (restarted)
                    continue;
                restarted = true;
                stack.restart();
                if (verbose)
                    console.log(base + this.stackID(stack) + " (restarted)");
                let done = this.advanceFully(stack, newStacks);
                if (done) {
                    if (done !== true)
                        maybeNest = done;
                    continue;
                }
            }
            let force = stack.split(), forceBase = base;
            for (let j = 0; force.forceReduce() && j < 10 /* ForceReduceLimit */; j++) {
                if (verbose)
                    console.log(forceBase + this.stackID(force) + " (via force-reduce)");
                let done = this.advanceFully(force, newStacks);
                if (done) {
                    if (done !== true)
                        maybeNest = done;
                    break;
                }
                if (verbose)
                    forceBase = this.stackID(force) + " -> ";
            }
            for (let insert of stack.recoverByInsert(token)) {
                if (verbose)
                    console.log(base + this.stackID(insert) + " (via recover-insert)");
                this.advanceFully(insert, newStacks);
            }
            if (this.input.length > stack.pos) {
                if (tokenEnd == stack.pos) {
                    tokenEnd++;
                    token = 0 /* Err */;
                }
                stack.recoverByDelete(token, tokenEnd);
                if (verbose)
                    console.log(base + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
                pushStackDedup(stack, newStacks);
            }
            else if (!finished || finished.score < stack.score) {
                finished = stack;
            }
        }
        if (finished)
            return finished;
        if (maybeNest)
            for (let s of this.stacks)
                if (s.score > maybeNest.stack.score) {
                    maybeNest = undefined;
                    break;
                }
        if (maybeNest)
            this.startNested(maybeNest);
        return null;
    }
    forceFinish() {
        let stack = this.stacks[0].split();
        if (this.nested)
            this.finishNested(stack, this.nested.forceFinish());
        return this.stackToTree(stack.forceAll());
    }
    // Convert the stack's buffer to a syntax tree.
    stackToTree(stack, pos = stack.pos) {
        if (this.parser.context)
            stack.emitContext();
        return Tree.build({ buffer: StackBufferCursor.create(stack),
            nodeSet: this.parser.nodeSet,
            topID: this.topTerm,
            maxBufferLength: this.parser.bufferLength,
            reused: this.reused,
            start: this.startPos,
            length: pos - this.startPos,
            minRepeatType: this.parser.minRepeatTerm });
    }
    checkNest(stack) {
        let info = this.parser.findNested(stack.state);
        if (!info)
            return null;
        let spec = info.value;
        if (typeof spec == "function")
            spec = spec(this.input, stack);
        return spec ? { stack, info, spec } : null;
    }
    startNested(nest) {
        let { stack, info, spec } = nest;
        this.stacks = [stack];
        this.nestEnd = this.scanForNestEnd(stack, info.end, spec.filterEnd);
        this.nestWrap = typeof spec.wrapType == "number" ? this.parser.nodeSet.types[spec.wrapType] : spec.wrapType || null;
        if (spec.startParse) {
            this.nested = spec.startParse(this.input.clip(this.nestEnd), stack.pos, this.context);
        }
        else {
            this.finishNested(stack);
        }
    }
    scanForNestEnd(stack, endToken, filter) {
        for (let pos = stack.pos; pos < this.input.length; pos++) {
            dummyToken.start = pos;
            dummyToken.value = -1;
            endToken.token(this.input, dummyToken, stack);
            if (dummyToken.value > -1 && (!filter || filter(this.input.read(pos, dummyToken.end))))
                return pos;
        }
        return this.input.length;
    }
    finishNested(stack, tree) {
        if (this.nestWrap)
            tree = new Tree(this.nestWrap, tree ? [tree] : [], tree ? [0] : [], this.nestEnd - stack.pos);
        else if (!tree)
            tree = new Tree(NodeType.none, [], [], this.nestEnd - stack.pos);
        let info = this.parser.findNested(stack.state);
        stack.useNode(tree, this.parser.getGoto(stack.state, info.placeholder, true));
        if (verbose)
            console.log(this.stackID(stack) + ` (via unnest)`);
    }
    stackID(stack) {
        let id = (stackIDs || (stackIDs = new WeakMap)).get(stack);
        if (!id)
            stackIDs.set(stack, id = String.fromCodePoint(this.nextStackID++));
        return id + stack;
    }
}
function pushStackDedup(stack, newStacks) {
    for (let i = 0; i < newStacks.length; i++) {
        let other = newStacks[i];
        if (other.pos == stack.pos && other.sameState(stack)) {
            if (newStacks[i].score < stack.score)
                newStacks[i] = stack;
            return;
        }
    }
    newStacks.push(stack);
}
class Dialect {
    constructor(source, flags, disabled) {
        this.source = source;
        this.flags = flags;
        this.disabled = disabled;
    }
    allows(term) { return !this.disabled || this.disabled[term] == 0; }
}
/// A parser holds the parse tables for a given grammar, as generated
/// by `lezer-generator`.
class Parser {
    /// @internal
    constructor(spec) {
        /// @internal
        this.bufferLength = DefaultBufferLength;
        /// @internal
        this.strict = false;
        this.cachedDialect = null;
        if (spec.version != 13 /* Version */)
            throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${13 /* Version */})`);
        let tokenArray = decodeArray(spec.tokenData);
        let nodeNames = spec.nodeNames.split(" ");
        this.minRepeatTerm = nodeNames.length;
        this.context = spec.context;
        for (let i = 0; i < spec.repeatNodeCount; i++)
            nodeNames.push("");
        let nodeProps = [];
        for (let i = 0; i < nodeNames.length; i++)
            nodeProps.push([]);
        function setProp(nodeID, prop, value) {
            nodeProps[nodeID].push([prop, prop.deserialize(String(value))]);
        }
        if (spec.nodeProps)
            for (let propSpec of spec.nodeProps) {
                let prop = propSpec[0];
                for (let i = 1; i < propSpec.length;) {
                    let next = propSpec[i++];
                    if (next >= 0) {
                        setProp(next, prop, propSpec[i++]);
                    }
                    else {
                        let value = propSpec[i + -next];
                        for (let j = -next; j > 0; j--)
                            setProp(propSpec[i++], prop, value);
                        i++;
                    }
                }
            }
        this.specialized = new Uint16Array(spec.specialized ? spec.specialized.length : 0);
        this.specializers = [];
        if (spec.specialized)
            for (let i = 0; i < spec.specialized.length; i++) {
                this.specialized[i] = spec.specialized[i].term;
                this.specializers[i] = spec.specialized[i].get;
            }
        this.states = decodeArray(spec.states, Uint32Array);
        this.data = decodeArray(spec.stateData);
        this.goto = decodeArray(spec.goto);
        let topTerms = Object.keys(spec.topRules).map(r => spec.topRules[r][1]);
        this.nodeSet = new NodeSet(nodeNames.map((name, i) => NodeType.define({
            name: i >= this.minRepeatTerm ? undefined : name,
            id: i,
            props: nodeProps[i],
            top: topTerms.indexOf(i) > -1,
            error: i == 0,
            skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
        })));
        this.maxTerm = spec.maxTerm;
        this.tokenizers = spec.tokenizers.map(value => typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
        this.topRules = spec.topRules;
        this.nested = (spec.nested || []).map(([name, value, endToken, placeholder]) => {
            return { name, value, end: new TokenGroup(decodeArray(endToken), 0), placeholder };
        });
        this.dialects = spec.dialects || {};
        this.dynamicPrecedences = spec.dynamicPrecedences || null;
        this.tokenPrecTable = spec.tokenPrec;
        this.termNames = spec.termNames || null;
        this.maxNode = this.nodeSet.types.length - 1;
        this.dialect = this.parseDialect();
        this.top = this.topRules[Object.keys(this.topRules)[0]];
    }
    /// Parse a given string or stream.
    parse(input, startPos = 0, context = {}) {
        if (typeof input == "string")
            input = stringInput(input);
        let cx = new Parse(this, input, startPos, context);
        for (;;) {
            let done = cx.advance();
            if (done)
                return done;
        }
    }
    /// Start an incremental parse.
    startParse(input, startPos = 0, context = {}) {
        if (typeof input == "string")
            input = stringInput(input);
        return new Parse(this, input, startPos, context);
    }
    /// Get a goto table entry @internal
    getGoto(state, term, loose = false) {
        let table = this.goto;
        if (term >= table[0])
            return -1;
        for (let pos = table[term + 1];;) {
            let groupTag = table[pos++], last = groupTag & 1;
            let target = table[pos++];
            if (last && loose)
                return target;
            for (let end = pos + (groupTag >> 1); pos < end; pos++)
                if (table[pos] == state)
                    return target;
            if (last)
                return -1;
        }
    }
    /// Check if this state has an action for a given terminal @internal
    hasAction(state, terminal) {
        let data = this.data;
        for (let set = 0; set < 2; set++) {
            for (let i = this.stateSlot(state, set ? 2 /* Skip */ : 1 /* Actions */), next;; i += 3) {
                if ((next = data[i]) == 65535 /* End */) {
                    if (data[i + 1] == 1 /* Next */)
                        next = data[i = pair(data, i + 2)];
                    else if (data[i + 1] == 2 /* Other */)
                        return pair(data, i + 2);
                    else
                        break;
                }
                if (next == terminal || next == 0 /* Err */)
                    return pair(data, i + 1);
            }
        }
        return 0;
    }
    /// @internal
    stateSlot(state, slot) {
        return this.states[(state * 6 /* Size */) + slot];
    }
    /// @internal
    stateFlag(state, flag) {
        return (this.stateSlot(state, 0 /* Flags */) & flag) > 0;
    }
    /// @internal
    findNested(state) {
        let flags = this.stateSlot(state, 0 /* Flags */);
        return flags & 4 /* StartNest */ ? this.nested[flags >> 10 /* NestShift */] : null;
    }
    /// @internal
    validAction(state, action) {
        if (action == this.stateSlot(state, 4 /* DefaultReduce */))
            return true;
        for (let i = this.stateSlot(state, 1 /* Actions */);; i += 3) {
            if (this.data[i] == 65535 /* End */) {
                if (this.data[i + 1] == 1 /* Next */)
                    i = pair(this.data, i + 2);
                else
                    return false;
            }
            if (action == pair(this.data, i + 1))
                return true;
        }
    }
    /// Get the states that can follow this one through shift actions or
    /// goto jumps. @internal
    nextStates(state) {
        let result = [];
        for (let i = this.stateSlot(state, 1 /* Actions */);; i += 3) {
            if (this.data[i] == 65535 /* End */) {
                if (this.data[i + 1] == 1 /* Next */)
                    i = pair(this.data, i + 2);
                else
                    break;
            }
            if ((this.data[i + 2] & (65536 /* ReduceFlag */ >> 16)) == 0) {
                let value = this.data[i + 1];
                if (!result.some((v, i) => (i & 1) && v == value))
                    result.push(this.data[i], value);
            }
        }
        return result;
    }
    /// @internal
    overrides(token, prev) {
        let iPrev = findOffset(this.data, this.tokenPrecTable, prev);
        return iPrev < 0 || findOffset(this.data, this.tokenPrecTable, token) < iPrev;
    }
    /// Configure the parser. Returns a new parser instance that has the
    /// given settings modified. Settings not provided in `config` are
    /// kept from the original parser.
    configure(config) {
        // Hideous reflection-based kludge to make it easy to create a
        // slightly modified copy of a parser.
        let copy = Object.assign(Object.create(Parser.prototype), this);
        if (config.props)
            copy.nodeSet = this.nodeSet.extend(...config.props);
        if (config.top) {
            let info = this.topRules[config.top];
            if (!info)
                throw new RangeError(`Invalid top rule name ${config.top}`);
            copy.top = info;
        }
        if (config.tokenizers)
            copy.tokenizers = this.tokenizers.map(t => {
                let found = config.tokenizers.find(r => r.from == t);
                return found ? found.to : t;
            });
        if (config.dialect)
            copy.dialect = this.parseDialect(config.dialect);
        if (config.nested)
            copy.nested = this.nested.map(obj => {
                if (!Object.prototype.hasOwnProperty.call(config.nested, obj.name))
                    return obj;
                return { name: obj.name, value: config.nested[obj.name], end: obj.end, placeholder: obj.placeholder };
            });
        if (config.strict != null)
            copy.strict = config.strict;
        if (config.bufferLength != null)
            copy.bufferLength = config.bufferLength;
        return copy;
    }
    /// Returns the name associated with a given term. This will only
    /// work for all terms when the parser was generated with the
    /// `--names` option. By default, only the names of tagged terms are
    /// stored.
    getName(term) {
        return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
    }
    /// The eof term id is always allocated directly after the node
    /// types. @internal
    get eofTerm() { return this.maxNode + 1; }
    /// Tells you whether this grammar has any nested grammars.
    get hasNested() { return this.nested.length > 0; }
    /// The type of top node produced by the parser.
    get topNode() { return this.nodeSet.types[this.top[1]]; }
    /// @internal
    dynamicPrecedence(term) {
        let prec = this.dynamicPrecedences;
        return prec == null ? 0 : prec[term] || 0;
    }
    /// @internal
    parseDialect(dialect) {
        if (this.cachedDialect && this.cachedDialect.source == dialect)
            return this.cachedDialect;
        let values = Object.keys(this.dialects), flags = values.map(() => false);
        if (dialect)
            for (let part of dialect.split(" ")) {
                let id = values.indexOf(part);
                if (id >= 0)
                    flags[id] = true;
            }
        let disabled = null;
        for (let i = 0; i < values.length; i++)
            if (!flags[i]) {
                for (let j = this.dialects[values[i]], id; (id = this.data[j++]) != 65535 /* End */;)
                    (disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id] = 1;
            }
        return this.cachedDialect = new Dialect(dialect, flags, disabled);
    }
    /// (used by the output of the parser generator) @internal
    static deserialize(spec) {
        return new Parser(spec);
    }
}
function pair(data, off) { return data[off] | (data[off + 1] << 16); }
function findOffset(data, start, term) {
    for (let i = start, next; (next = data[i]) != 65535 /* End */; i++)
        if (next == term)
            return i - start;
    return -1;
}
function findFinished(stacks) {
    let best = null;
    for (let stack of stacks) {
        if (stack.pos == stack.p.input.length &&
            stack.p.parser.stateFlag(stack.state, 2 /* Accepting */) &&
            (!best || best.score < stack.score))
            best = stack;
    }
    return best;
}

// This file was generated by lezer-generator. You probably shouldn't edit it.
const noSemi = 269,
  incdec = 1,
  incdecPrefix = 2,
  templateContent = 270,
  templateDollarBrace = 271,
  templateEnd = 272,
  insertSemi = 273,
  TSExtends = 3,
  Dialect_ts = 1;

/* Hand-written tokenizers for JavaScript tokens that can't be
   expressed by lezer's built-in tokenizer. */

const newline = [10, 13, 8232, 8233];
const space = [9, 11, 12, 32, 133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8239, 8287, 12288];

const braceR = 125, braceL = 123, semicolon = 59, slash = 47, star = 42,
      plus = 43, minus = 45, dollar = 36, backtick = 96, backslash = 92;

// FIXME this should technically enter block comments
function newlineBefore(input, pos) {
  for (let i = pos - 1; i >= 0; i--) {
    let prev = input.get(i);
    if (newline.indexOf(prev) > -1) return true
    if (space.indexOf(prev) < 0) break
  }
  return false
}

const insertSemicolon = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start, next = input.get(pos);
  if ((next == braceR || next == -1 || newlineBefore(input, pos)) && stack.canShift(insertSemi))
    token.accept(insertSemi, token.start);
}, {contextual: true, fallback: true});

const noSemicolon = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start, next = input.get(pos++);
  if (space.indexOf(next) > -1 || newline.indexOf(next) > -1) return
  if (next == slash) {
    let after = input.get(pos++);
    if (after == slash || after == star) return
  }
  if (next != braceR && next != semicolon && next != -1 && !newlineBefore(input, token.start) &&
      stack.canShift(noSemi))
    token.accept(noSemi, token.start);
}, {contextual: true});

const incdecToken = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start, next = input.get(pos);
  if ((next == plus || next == minus) && next == input.get(pos + 1)) {
    let mayPostfix = !newlineBefore(input, token.start) && stack.canShift(incdec);
    token.accept(mayPostfix ? incdec : incdecPrefix, pos + 2);
  }
}, {contextual: true});

const template = new ExternalTokenizer((input, token) => {
  let pos = token.start, afterDollar = false;
  for (;;) {
    let next = input.get(pos++);
    if (next < 0) {
      if (pos - 1 > token.start) token.accept(templateContent, pos - 1);
      break
    } else if (next == backtick) {
      if (pos == token.start + 1) token.accept(templateEnd, pos);
      else token.accept(templateContent, pos - 1);
      break
    } else if (next == braceL && afterDollar) {
      if (pos == token.start + 2) token.accept(templateDollarBrace, pos);
      else token.accept(templateContent, pos - 2);
      break
    } else if (next == 10 /* "\n" */ && pos > token.start + 1) {
      // Break up template strings on lines, to avoid huge tokens
      token.accept(templateContent, pos);
      break
    } else if (next == backslash && pos != input.length) {
      pos++;
    }
    afterDollar = next == dollar;
  }
});

function tsExtends(value, stack) {
  return value == "extends" && stack.dialectEnabled(Dialect_ts) ? TSExtends : -1
}

// This file was generated by lezer-generator. You probably shouldn't edit it.
const spec_identifier = {__proto__:null,export:16, as:21, from:25, default:30, async:35, function:36, this:46, true:54, false:54, void:58, typeof:62, null:76, super:78, new:112, await:129, yield:131, delete:132, class:142, extends:144, public:181, private:181, protected:181, readonly:183, in:202, instanceof:204, const:206, import:238, keyof:289, unique:293, infer:299, is:333, abstract:353, implements:355, type:357, let:360, var:362, interface:369, enum:373, namespace:379, module:381, declare:385, global:389, for:410, of:419, while:422, with:426, do:430, if:434, else:436, switch:440, case:446, try:452, catch:454, finally:456, return:460, throw:464, break:468, continue:472, debugger:476};
const spec_word = {__proto__:null,async:99, get:101, set:103, public:151, private:151, protected:151, static:153, abstract:155, readonly:159, new:337};
const spec_LessThan = {__proto__:null,"<":119};
const parser = Parser.deserialize({
  version: 13,
  states: "$,lO]QYOOO&zQ!LdO'#CgO'ROSO'#DRO)ZQYO'#DWO)kQYO'#DcO)rQYO'#DmO-iQYO'#DsOOQO'#ET'#ETO-|QWO'#ESO.RQWO'#ESO0QQ!LdO'#IgO2hQ!LdO'#IhO3UQWO'#EqO3ZQpO'#FWOOQ!LS'#Ey'#EyO3cO!bO'#EyO3qQWO'#F_O4{QWO'#F^OOQ!LS'#Ih'#IhOOQ!LQ'#Ig'#IgOOQQ'#JR'#JRO5QQWO'#HeO5VQ!LYO'#HfOOQQ'#I['#I[OOQQ'#Hg'#HgQ]QYOOO)rQYO'#DeO5_QWO'#GRO5dQ#tO'#ClO5rQWO'#ERO5}Q#tO'#ExO6iQWO'#GRO6nQWO'#GVO6yQWO'#GVO7XQWO'#GYO7XQWO'#GZO7XQWO'#G]O5_QWO'#G`O7xQWO'#GcO9WQWO'#CcO9hQWO'#GpO9pQWO'#GvO9pQWO'#GxO]QYO'#GzO9pQWO'#G|O9pQWO'#HPO9uQWO'#HVO9zQ!LZO'#HZO)rQYO'#H]O:VQ!LZO'#H_O:bQ!LZO'#HaO5VQ!LYO'#HcO)rQYO'#IjOOOS'#Hh'#HhO:mOSO,59mOOQ!LS,59m,59mO=OQbO'#CgO=YQYO'#HiO=gQWO'#IlO?fQbO'#IlO'^QYO'#IlO?mQWO,59rO@TQ&jO'#D]O@|QWO'#ETOAZQWO'#IvOAfQWO'#IuOAnQWO,5:qOAsQWO'#ItOAzQWO'#DtO5dQ#tO'#EROBYQWO'#EROBeQ`O'#ExOOQ!LS,59},59}OBmQYO,59}ODkQ!LdO,5:XOEXQWO,5:_OErQ!LYO'#IsO6nQWO'#IrOEyQWO'#IrOFRQWO,5:pOFWQWO'#IrOFfQYO,5:nOHcQWO'#EPOIjQWO,5:nOJvQWO'#DgOJ}QYO'#DlOKXQ&jO,5:wO)rQYO,5:wOOQQ'#Ei'#EiOOQQ'#Ek'#EkO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xO)rQYO,5:xOOQQ'#Eo'#EoOK^QYO,5;YOOQ!LS,5;_,5;_OOQ!LS,5;`,5;`OMZQWO,5;`OOQ!LS,5;a,5;aO)rQYO'#HsOM`Q!LYO,5;zOMzQWO,5:xO)rQYO,5;]ONdQpO'#IzONRQpO'#IzONkQpO'#IzON|QpO,5;hOOQO,5;r,5;rO! [QYO'#FYOOOO'#Hr'#HrO3cO!bO,5;eO! cQpO'#F[OOQ!LS,5;e,5;eO!!PQ,UO'#CqOOQ!LS'#Ct'#CtO!!dQWO'#CtO!!zQ#tO,5;wO!#RQWO,5;yO!$[QWO'#FiO!$iQWO'#FjO!$nQWO'#FnO!%pQ&jO'#FrO!&cQ,UO'#IeOOQ!LS'#Ie'#IeO!&mQWO'#IdO!&{QWO'#IcOOQ!LS'#Cr'#CrOOQ!LS'#Cx'#CxO!'TQWO'#CzOIoQWO'#FaOIoQWO'#FcO!'YQWO'#FeOIeQWO'#FfO!'_QWO'#FlOIoQWO'#FqO!'dQWO'#EUO!'{QWO,5;xO]QYO,5>POOQQ'#I_'#I_OOQQ,5>Q,5>QOOQQ-E;e-E;eO!)wQ!LdO,5:POOQ!LQ'#Co'#CoO!*hQ#tO,5<mOOQO'#Ce'#CeO!*yQWO'#CpO!+RQ!LYO'#I`O4{QWO'#I`O9uQWO,59WO!+aQpO,59WO!+iQ#tO,59WO5dQ#tO,59WO!+tQWO,5:nO!+|QWO'#GoO!,UQWO'#JVO)rQYO,5;bOKXQ&jO,5;dO!,^QWO,5=YO!,cQWO,5=YO!,hQWO,5=YO5VQ!LYO,5=YO5_QWO,5<mO!,vQWO'#EVO!-XQ&jO'#EWOOQ!LQ'#It'#ItO!-jQ!LYO'#JSO5VQ!LYO,5<qO7XQWO,5<wOOQO'#Cq'#CqO!-uQpO,5<tO!-}Q#tO,5<uO!.YQWO,5<wO!._Q`O,5<zO9uQWO'#GeO5_QWO'#GgO!.gQWO'#GgO5dQ#tO'#GjO!.lQWO'#GjOOQQ,5<},5<}O!.qQWO'#GkO!.yQWO'#ClO!/OQWO,58}O!/YQWO,58}O!1XQYO,58}OOQQ,58},58}O!1fQ!LYO,58}O)rQYO,58}O!1qQYO'#GrOOQQ'#Gs'#GsOOQQ'#Gt'#GtO]QYO,5=[O!2RQWO,5=[O)rQYO'#DsO]QYO,5=bO]QYO,5=dO!2WQWO,5=fO]QYO,5=hO!2]QWO,5=kO!2bQYO,5=qOOQQ,5=u,5=uO)rQYO,5=uO5VQ!LYO,5=wOOQQ,5=y,5=yO!6`QWO,5=yOOQQ,5={,5={O!6`QWO,5={OOQQ,5=},5=}O!6eQ`O,5?UOOOS-E;f-E;fOOQ!LS1G/X1G/XO!6jQbO,5>TO)rQYO,5>TOOQO-E;g-E;gO!6tQWO,5?WO!6|QbO,5?WO!7TQWO,5?aOOQ!LS1G/^1G/^O!7]QpO'#DPOOQO'#In'#InO)rQYO'#InO!7zQpO'#InO!8iQpO'#D^O!8zQ&jO'#D^O!;SQYO'#D^O!;ZQWO'#ImO!;cQWO,59wO!;hQWO'#EXO!;vQWO'#IwO!<OQWO,5:rO!<fQ&jO'#D^O)rQYO,5?bO!<pQWO'#HnO!7TQWO,5?aOOQ!LQ1G0]1G0]O!=vQ&jO'#DwOOQ!LS,5:`,5:`O)rQYO,5:`OHcQWO,5:`O!=}QWO,5:`O9uQWO,5:mO!+aQpO,5:mO!+iQ#tO,5:mO5dQ#tO,5:mOOQ!LS1G/i1G/iOOQ!LS1G/y1G/yOOQ!LQ'#EO'#EOO)rQYO,5?_O!>YQ!LYO,5?_O!>kQ!LYO,5?_O!>rQWO,5?^O!>zQWO'#HpO!>rQWO,5?^OOQ!LQ1G0[1G0[O6nQWO,5?^OOQ!LS1G0Y1G0YO!?fQ!LdO1G0YO!@VQ!LbO,5:kOOQ!LS'#Fh'#FhO!@sQ!LdO'#IeOFfQYO1G0YO!BrQ#tO'#IoO!B|QWO,5:RO!CRQbO'#IpO)rQYO'#IpO!C]QWO,5:WOOQ!LS'#DP'#DPOOQ!LS1G0c1G0cO!CbQWO1G0cO!EsQ!LdO1G0dO!EzQ!LdO1G0dO!H_Q!LdO1G0dO!HfQ!LdO1G0dO!JmQ!LdO1G0dO!KQQ!LdO1G0dO!MqQ!LdO1G0dO!MxQ!LdO1G0dO#!]Q!LdO1G0dO#!dQ!LdO1G0dO#$XQ!LdO1G0dO#'RQ7^O'#CgO#(|Q7^O1G0tO#*wQ7^O'#IhOOQ!LS1G0z1G0zO#+[Q!LdO,5>_OOQ!LQ-E;q-E;qO#+{Q!LdO1G0dOOQ!LS1G0d1G0dO#-}Q!LdO1G0wO#.nQpO,5;jO#.sQpO,5;kO#.xQpO'#FRO#/^QWO'#FQOOQO'#I{'#I{OOQO'#Hq'#HqO#/cQpO1G1SOOQ!LS1G1S1G1SOOQO1G1]1G1]O#/qQ7^O'#IgO#/{QWO,5;tOK^QYO,5;tOOOO-E;p-E;pOOQ!LS1G1P1G1POOQ!LS,5;v,5;vO#0QQpO,5;vOOQ!LS,59`,59`O)rQYO1G1cOKXQ&jO'#HuO#0VQWO,5<[OOQ!LS,5<X,5<XOOQO'#F|'#F|OIoQWO,5<gOOQO'#GO'#GOOIoQWO,5<iOIoQWO,5<kOOQO1G1e1G1eO#0bQ`O'#CoO#0uQ`O,5<TO#0|QWO'#JOO5_QWO'#JOO#1[QWO,5<VOIoQWO,5<UO#1aQ`O'#FhO#1nQ`O'#JPO#1xQWO'#JPOHcQWO'#JPO#1}QWO,5<YOOQ!LQ'#Db'#DbO#2SQWO'#FkO#2_QpO'#FsO!%kQ&jO'#FsO!%kQ&jO'#FuO#2pQWO'#FvO!'_QWO'#FyOOQO'#Hw'#HwO#2uQ&jO,5<^OOQ!LS,5<^,5<^O#2|Q&jO'#FsO#3[Q&jO'#FtO#3dQ&jO'#FtOOQ!LS,5<l,5<lOIoQWO,5?OOIoQWO,5?OO#3iQWO'#HxO#3tQWO,5>}OOQ!LS'#Cg'#CgO#4hQ#tO,59fOOQ!LS,59f,59fO#5ZQ#tO,5;{O#5|Q#tO,5;}O#6WQWO,5<POOQ!LS,5<Q,5<QO#6]QWO,5<WO#6bQ#tO,5<]OFfQYO1G1dO#6rQWO1G1dOOQQ1G3k1G3kOOQ!LS1G/k1G/kOMZQWO1G/kOOQQ1G2X1G2XOHcQWO1G2XO)rQYO1G2XOHcQWO1G2XO#6wQWO1G2XO#7VQWO,59[O#8]QWO'#EPOOQ!LQ,5>z,5>zO#8gQ!LYO,5>zOOQQ1G.r1G.rO9uQWO1G.rO!+aQpO1G.rO!+iQ#tO1G.rO#8uQWO1G0YO#8zQWO'#CgO#9VQWO'#JWO#9_QWO,5=ZO#9dQWO'#JWO#9iQWO'#IQO#9wQWO,5?qO#:PQbO1G0|OOQ!LS1G1O1G1OO5_QWO1G2tO#:WQWO1G2tO#:]QWO1G2tO#:bQWO1G2tOOQQ1G2t1G2tO#:gQ#tO1G2XO6nQWO'#IuO6nQWO'#EXO6nQWO'#HzO#:xQ!LYO,5?nOOQQ1G2]1G2]O!.YQWO1G2cOHcQWO1G2`O#;TQWO1G2`OOQQ1G2a1G2aOHcQWO1G2aO#;YQWO1G2aO#;bQ&jO'#G_OOQQ1G2c1G2cO!%kQ&jO'#H|O!._Q`O1G2fOOQQ1G2f1G2fOOQQ,5=P,5=PO#;jQ#tO,5=RO5_QWO,5=RO#2pQWO,5=UO4{QWO,5=UO!+aQpO,5=UO!+iQ#tO,5=UO5dQ#tO,5=UO#;{QWO'#JUO#<WQWO,5=VOOQQ1G.i1G.iO#<]Q!LYO1G.iO#<hQWO1G.iO!'TQWO1G.iO5VQ!LYO1G.iO#<mQbO,5?sO#<wQWO,5?sO#=SQYO,5=^O#=ZQWO,5=^O6nQWO,5?sOOQQ1G2v1G2vO]QYO1G2vOOQQ1G2|1G2|OOQQ1G3O1G3OO9pQWO1G3QO#=`QYO1G3SO#AWQYO'#HROOQQ1G3V1G3VO9uQWO1G3]O#AeQWO1G3]O5VQ!LYO1G3aOOQQ1G3c1G3cOOQ!LQ'#Fo'#FoO5VQ!LYO1G3eO5VQ!LYO1G3gOOOS1G4p1G4pO#AmQ`O,5;zO#AuQbO1G3oO#BPQWO1G4rO#BXQWO1G4{O#BaQWO,5?YOK^QYO,5:sO6nQWO,5:sO9uQWO,59xOK^QYO,59xO!+aQpO,59xO#BfQ7^O,59xOOQO,5:s,5:sO#BpQ&jO'#HjO#CWQWO,5?XOOQ!LS1G/c1G/cO#C`Q&jO'#HoO#CtQWO,5?cOOQ!LQ1G0^1G0^O!8zQ&jO,59xO#C|QbO1G4|OOQO,5>Y,5>YO6nQWO,5>YOOQO-E;l-E;lO#DWQ!LrO'#D|O!%kQ&jO'#DxOOQO'#Hm'#HmO#DrQ&jO,5:cOOQ!LS,5:c,5:cO#DyQ&jO'#DxO#EXQ&jO'#D|O#EmQ&jO'#D|O!%kQ&jO'#D|O#EwQWO1G/zO#E|Q`O1G/zOOQ!LS1G/z1G/zO)rQYO1G/zOHcQWO1G/zOOQ!LS1G0X1G0XO9uQWO1G0XO!+aQpO1G0XO!+iQ#tO1G0XO#FTQ!LdO1G4yO)rQYO1G4yO#FeQ!LYO1G4yO#FvQWO1G4xO6nQWO,5>[OOQO,5>[,5>[O#GOQWO,5>[OOQO-E;n-E;nO#FvQWO1G4xO#G^Q!LdO,59fO#I]Q!LdO,5;{O#K_Q!LdO,5;}O#MaQ!LdO,5<]OOQ!LS7+%t7+%tO$ iQ!LdO7+%tO$!YQWO'#HkO$!dQWO,5?ZOOQ!LS1G/m1G/mO$!lQYO'#HlO$!yQWO,5?[O$#RQbO,5?[OOQ!LS1G/r1G/rOOQ!LS7+%}7+%}O$#]Q7^O,5:XO)rQYO7+&`O$#gQ7^O,5:POOQO1G1U1G1UOOQO1G1V1G1VO$#tQMhO,5;mOK^QYO,5;lOOQO-E;o-E;oOOQ!LS7+&n7+&nOOQO7+&w7+&wOOOO1G1`1G1`O$$PQWO1G1`OOQ!LS1G1b1G1bO$$UQ!LdO7+&}OOQ!LS,5>a,5>aO$$uQWO,5>aOOQ!LS1G1v1G1vP$$zQWO'#HuPOQ!LS-E;s-E;sO$%kQ#tO1G2RO$&^Q#tO1G2TO$&hQ#tO1G2VOOQ!LS1G1o1G1oO$&oQWO'#HtO$&}QWO,5?jO$&}QWO,5?jO$'VQWO,5?jO$'bQWO,5?jOOQO1G1q1G1qO$'pQ#tO1G1pO$(QQWO'#HvO$(bQWO,5?kOHcQWO,5?kO$(jQ`O,5?kOOQ!LS1G1t1G1tO5VQ!LYO,5<_O5VQ!LYO,5<`O$(tQWO,5<`O#2kQWO,5<`O!+aQpO,5<_O$(yQWO,5<aO5VQ!LYO,5<bO$(tQWO,5<eOOQO-E;u-E;uOOQ!LS1G1x1G1xO!%kQ&jO,5<_O$)RQWO,5<`O!%kQ&jO,5<aO!%kQ&jO,5<`O$)^Q#tO1G4jO$)hQ#tO1G4jOOQO,5>d,5>dOOQO-E;v-E;vOKXQ&jO,59hO)rQYO,59hO$)uQWO1G1kOIoQWO1G1rO$)zQ!LdO7+'OOOQ!LS7+'O7+'OOFfQYO7+'OOOQ!LS7+%V7+%VO$*kQ`O'#JQO#EwQWO7+'sO$*uQWO7+'sO$*}Q`O7+'sOOQQ7+'s7+'sOHcQWO7+'sO)rQYO7+'sOHcQWO7+'sOOQO1G.v1G.vO$+XQ!LbO'#CgO$+iQ!LbO,5<cO$,WQWO,5<cOOQ!LQ1G4f1G4fOOQQ7+$^7+$^O9uQWO7+$^O!+aQpO7+$^OFfQYO7+%tO$,]QWO'#IPO$,hQWO,5?rOOQO1G2u1G2uO5_QWO,5?rOOQO,5>l,5>lOOQO-E<O-E<OOOQ!LS7+&h7+&hO$,pQWO7+(`O5VQ!LYO7+(`O5_QWO7+(`O$,uQWO7+(`O$,zQWO7+'sOOQ!LQ,5>f,5>fOOQ!LQ-E;x-E;xOOQQ7+'}7+'}O$-YQ!LbO7+'zOHcQWO7+'zO$-dQ`O7+'{OOQQ7+'{7+'{OHcQWO7+'{O$-kQWO'#JTO$-vQWO,5<yOOQO,5>h,5>hOOQO-E;z-E;zOOQQ7+(Q7+(QO$.mQ&jO'#GhOOQQ1G2m1G2mOHcQWO1G2mO)rQYO1G2mOHcQWO1G2mO$.tQWO1G2mO$/SQ#tO1G2mO5VQ!LYO1G2pO#2pQWO1G2pO4{QWO1G2pO!+aQpO1G2pO!+iQ#tO1G2pO$/eQWO'#IOO$/pQWO,5?pO$/xQ&jO,5?pOOQ!LQ1G2q1G2qOOQQ7+$T7+$TO$/}QWO7+$TO5VQ!LYO7+$TO$0SQWO7+$TO)rQYO1G5_O)rQYO1G5`O$0XQYO1G2xO$0`QWO1G2xO$0eQYO1G2xO$0lQ!LYO1G5_OOQQ7+(b7+(bO5VQ!LYO7+(lO]QYO7+(nOOQQ'#JZ'#JZOOQQ'#IR'#IRO$0vQYO,5=mOOQQ,5=m,5=mO)rQYO'#HSO$1TQWO'#HUOOQQ7+(w7+(wO$1YQYO7+(wO6nQWO7+(wOOQQ7+({7+({OOQQ7+)P7+)POOQQ7+)R7+)ROOQO1G4t1G4tO$5TQ7^O1G0_O$5_QWO1G0_OOQO1G/d1G/dO$5jQ7^O1G/dO9uQWO1G/dOK^QYO'#D^OOQO,5>U,5>UOOQO-E;h-E;hOOQO,5>Z,5>ZOOQO-E;m-E;mO!+aQpO1G/dOOQO1G3t1G3tO9uQWO,5:dOOQO,5:h,5:hO)rQYO,5:hO$5tQ!LYO,5:hO$6PQ!LYO,5:hO!+aQpO,5:dOOQO-E;k-E;kOOQ!LS1G/}1G/}O!%kQ&jO,5:dO$6_Q!LrO,5:hO$6yQ&jO,5:dO!%kQ&jO,5:hO$7XQ&jO,5:hO$7mQ!LYO,5:hOOQ!LS7+%f7+%fO#EwQWO7+%fO#E|Q`O7+%fOOQ!LS7+%s7+%sO9uQWO7+%sO!+aQpO7+%sO$8RQ!LdO7+*eO)rQYO7+*eOOQO1G3v1G3vO6nQWO1G3vO$8cQWO7+*dO$8kQ!LdO1G2RO$:mQ!LdO1G2TO$<oQ!LdO1G1pO$>wQ#tO,5>VOOQO-E;i-E;iO$?RQbO,5>WO)rQYO,5>WOOQO-E;j-E;jO$?]QWO1G4vO$?eQ7^O1G0YO$AlQ7^O1G0dO$AsQ7^O1G0dO$CtQ7^O1G0dO$C{Q7^O1G0dO$EpQ7^O1G0dO$FTQ7^O1G0dO$HbQ7^O1G0dO$HiQ7^O1G0dO$JjQ7^O1G0dO$JqQ7^O1G0dO$LfQ7^O1G0dO$LyQ!LdO<<IzO$MjQ7^O1G0dO% YQ7^O'#IeO%#VQ7^O1G0wOK^QYO'#FTOOQO'#I|'#I|OOQO1G1X1G1XO%#dQWO1G1WO%#iQ7^O,5>_OOOO7+&z7+&zOOQ!LS1G3{1G3{OIoQWO7+'qO%#sQWO,5>`O5_QWO,5>`OOQO-E;r-E;rO%$RQWO1G5UO%$RQWO1G5UO%$ZQWO1G5UO%$fQ`O,5>bO%$pQWO,5>bOHcQWO,5>bOOQO-E;t-E;tO%$uQ`O1G5VO%%PQWO1G5VOOQO1G1y1G1yOOQO1G1z1G1zO5VQ!LYO1G1zO$(tQWO1G1zO5VQ!LYO1G1yO%%XQWO1G1{OHcQWO1G1{OOQO1G1|1G1|O5VQ!LYO1G2PO!+aQpO1G1yO#2kQWO1G1zO%%^QWO1G1{O%%fQWO1G1zOIoQWO7+*UOOQ!LS1G/S1G/SO%%qQWO1G/SOOQ!LS7+'V7+'VO%%vQ#tO7+'^O%&WQ!LdO<<JjOOQ!LS<<Jj<<JjOHcQWO'#HyO%&wQWO,5?lOOQQ<<K_<<K_OHcQWO<<K_O#EwQWO<<K_O%'PQWO<<K_O%'XQ`O<<K_OHcQWO1G1}OOQQ<<Gx<<GxO9uQWO<<GxO%'cQ!LdO<<I`OOQ!LS<<I`<<I`OOQO,5>k,5>kO%(SQWO,5>kOOQO-E;}-E;}O%(XQWO1G5^O%(aQWO<<KzOOQQ<<Kz<<KzO%(fQWO<<KzO5VQ!LYO<<KzO)rQYO<<K_OHcQWO<<K_OOQQ<<Kf<<KfO$-YQ!LbO<<KfOOQQ<<Kg<<KgO$-dQ`O<<KgO%(kQ&jO'#H{O%(vQWO,5?oOK^QYO,5?oOOQQ1G2e1G2eO#DWQ!LrO'#D|O!%kQ&jO'#GiOOQO'#H}'#H}O%)OQ&jO,5=SOOQQ,5=S,5=SO#3[Q&jO'#D|O%)VQ&jO'#D|O%)kQ&jO'#D|O%)uQ&jO'#GiO%*TQWO7+(XO%*YQWO7+(XO%*bQ`O7+(XOOQQ7+(X7+(XOHcQWO7+(XO)rQYO7+(XOHcQWO7+(XO%*lQWO7+(XOOQQ7+([7+([O5VQ!LYO7+([O#2pQWO7+([O4{QWO7+([O!+aQpO7+([O%*zQWO,5>jOOQO-E;|-E;|OOQO'#Gl'#GlO%+VQWO1G5[O5VQ!LYO<<GoOOQQ<<Go<<GoO%+_QWO<<GoO%+dQWO7+*yO%+iQWO7+*zOOQQ7+(d7+(dO%+nQWO7+(dO%+sQYO7+(dO%+zQWO7+(dO)rQYO7+*yO)rQYO7+*zOOQQ<<LW<<LWOOQQ<<LY<<LYOOQQ-E<P-E<POOQQ1G3X1G3XO%,PQWO,5=nOOQQ,5=p,5=pO9uQWO<<LcO%,UQWO<<LcOK^QYO7+%yOOQO7+%O7+%OO%,ZQ7^O1G4|O9uQWO7+%OOOQO1G0O1G0OO%,eQ!LdO1G0SOOQO1G0S1G0SO)rQYO1G0SO%,oQ!LYO1G0SO9uQWO1G0OO!+aQpO1G0OO%,zQ!LYO1G0SO!%kQ&jO1G0OO%-YQ!LYO1G0SO%-nQ!LrO1G0SO%-xQ&jO1G0OO!%kQ&jO1G0SOOQ!LS<<IQ<<IQOOQ!LS<<I_<<I_O9uQWO<<I_O%.WQ!LdO<<NPOOQO7+)b7+)bO%.hQ!LdO7+'^O%0pQbO1G3rO%0zQ7^O7+%tO%1XQ7^O,59fO%3UQ7^O,5;{O%5RQ7^O,5;}O%7OQ7^O,5<]O%8nQ7^O7+&}O%8{Q7^O7+'OO%9YQWO,5;oOOQO7+&r7+&rO%9_Q#tO<<K]OOQO1G3z1G3zO%9oQWO1G3zO%9zQWO1G3zO%:YQWO7+*pO%:YQWO7+*pOHcQWO1G3|O%:bQ`O1G3|O%:lQWO7+*qOOQO7+'f7+'fO5VQ!LYO7+'fOOQO7+'e7+'eO$(tQWO7+'gO%:tQ`O7+'gOOQO7+'k7+'kO5VQ!LYO7+'eO$(tQWO7+'fO%:{QWO7+'gOHcQWO7+'gO#2kQWO7+'fO%;QQ#tO<<MpOOQ!LS7+$n7+$nO%;[Q`O,5>eOOQO-E;w-E;wO#EwQWOAN@yOOQQAN@yAN@yOHcQWOAN@yO%;fQ!LbO7+'iOOQQAN=dAN=dO5_QWO1G4VO%;sQWO7+*xO5VQ!LYOANAfO%;{QWOANAfOOQQANAfANAfO%<QQWOAN@yO%<YQ`OAN@yOOQQANAQANAQOOQQANARANARO%<dQWO,5>gOOQO-E;y-E;yO%<oQ7^O1G5ZO#2pQWO,5=TO4{QWO,5=TO!+aQpO,5=TOOQO-E;{-E;{OOQQ1G2n1G2nO$6_Q!LrO,5:hO!%kQ&jO,5=TO%<yQ&jO,5=TO%=XQ&jO,5:hOOQQ<<Ks<<KsOHcQWO<<KsO%*TQWO<<KsO%=mQWO<<KsO%=uQ`O<<KsO)rQYO<<KsOHcQWO<<KsOOQQ<<Kv<<KvO5VQ!LYO<<KvO#2pQWO<<KvO4{QWO<<KvO%>PQ&jO1G4UO%>UQWO7+*vOOQQAN=ZAN=ZO5VQ!LYOAN=ZOOQQ<<Ne<<NeOOQQ<<Nf<<NfOOQQ<<LO<<LOO%>^QWO<<LOO%>cQYO<<LOO%>jQWO<<NeO%>oQWO<<NfOOQQ1G3Y1G3YOOQQANA}ANA}O9uQWOANA}O%>tQ7^O<<IeOOQO<<Hj<<HjOOQO7+%n7+%nO%,eQ!LdO7+%nO)rQYO7+%nOOQO7+%j7+%jO9uQWO7+%jO%?OQ!LYO7+%nO!+aQpO7+%jO%?ZQ!LYO7+%nO!%kQ&jO7+%jO%?iQ!LYO7+%nOOQ!LSAN>yAN>yO%?}Q!LdO<<K]O%BVQ7^O<<IzO%BdQ7^O1G1pO%DSQ7^O1G2RO%FPQ7^O1G2TO%G|Q7^O<<JjO%HZQ7^O<<I`OOQO1G1Z1G1ZOOQO7+)f7+)fO%HhQWO7+)fO%HsQWO<<N[O%H{Q`O7+)hOOQO<<KQ<<KQO5VQ!LYO<<KRO$(tQWO<<KROOQO<<KP<<KPO5VQ!LYO<<KQO%IVQ`O<<KRO$(tQWO<<KQOOQQG26eG26eO#EwQWOG26eOOQO7+)q7+)qOOQQG27QG27QO5VQ!LYOG27QOHcQWOG26eOK^QYO1G4RO%I^QWO7+*uO5VQ!LYO1G2oO#2pQWO1G2oO4{QWO1G2oO!+aQpO1G2oO!%kQ&jO1G2oO%-nQ!LrO1G0SO%IfQ&jO1G2oO%*TQWOANA_OOQQANA_ANA_OHcQWOANA_O%ItQWOANA_O%I|Q`OANA_OOQQANAbANAbO5VQ!LYOANAbO#2pQWOANAbOOQO'#Gm'#GmOOQO7+)p7+)pOOQQG22uG22uOOQQANAjANAjO%JWQWOANAjOOQQANDPANDPOOQQANDQANDQO%J]QYOG27iOOQO<<IY<<IYO%,eQ!LdO<<IYOOQO<<IU<<IUO)rQYO<<IYO9uQWO<<IUO%NWQ!LYO<<IYO!+aQpO<<IUO%NcQ!LYO<<IYO%NqQ7^O7+'^OOQO<<MQ<<MQOOQOAN@mAN@mO5VQ!LYOAN@mOOQOAN@lAN@lO$(tQWOAN@mO5VQ!LYOAN@lOOQQLD,PLD,POOQQLD,lLD,lO#EwQWOLD,PO&!aQ7^O7+)mOOQO7+(Z7+(ZO5VQ!LYO7+(ZO#2pQWO7+(ZO4{QWO7+(ZO!+aQpO7+(ZO!%kQ&jO7+(ZOOQQG26yG26yO%*TQWOG26yOHcQWOG26yOOQQG26|G26|O5VQ!LYOG26|OOQQG27UG27UO9uQWOLD-TOOQOAN>tAN>tO%,eQ!LdOAN>tOOQOAN>pAN>pO)rQYOAN>tO9uQWOAN>pO&!kQ!LYOAN>tO&!vQ7^O<<K]OOQOG26XG26XO5VQ!LYOG26XOOQOG26WG26WOOQQ!$( k!$( kOOQO<<Ku<<KuO5VQ!LYO<<KuO#2pQWO<<KuO4{QWO<<KuO!+aQpO<<KuOOQQLD,eLD,eO%*TQWOLD,eOOQQLD,hLD,hOOQQ!$(!o!$(!oOOQOG24`G24`O%,eQ!LdOG24`OOQOG24[G24[O)rQYOG24`OOQOLD+sLD+sOOQOANAaANAaO5VQ!LYOANAaO#2pQWOANAaO4{QWOANAaOOQQ!$(!P!$(!POOQOLD)zLD)zO%,eQ!LdOLD)zOOQOG26{G26{O5VQ!LYOG26{O#2pQWOG26{OOQO!$'Mf!$'MfOOQOLD,gLD,gO5VQ!LYOLD,gOOQO!$(!R!$(!ROK^QYO'#DmO&$fQbO'#IgOK^QYO'#DeO&$mQ!LdO'#CgO&%WQbO'#CgO&%hQYO,5:nOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO,5:xOK^QYO'#HsO&'eQWO,5;zO&(tQWO,5:xOK^QYO,5;]O!'TQWO'#CzO!'TQWO'#CzOHcQWO'#FaO&'mQWO'#FaOHcQWO'#FcO&'mQWO'#FcOHcQWO'#FqO&'mQWO'#FqOK^QYO,5?bO&%hQYO1G0YO&({Q7^O'#CgOK^QYO1G1cOHcQWO,5<gO&'mQWO,5<gOHcQWO,5<iO&'mQWO,5<iOHcQWO,5<UO&'mQWO,5<UO&%hQYO1G1dOK^QYO7+&`OHcQWO1G1rO&'mQWO1G1rO&%hQYO7+'OO&%hQYO7+%tOHcQWO7+'qO&'mQWO7+'qO&)VQWO'#ESO&)[QWO'#ESO&)dQWO'#EqO&)iQWO'#IvO&)tQWO'#ItO&*PQWO,5:nO&*UQ#tO,5;wO&*]QWO'#FjO&*bQWO'#FjO&*gQWO,5;xO&*oQWO,5:nO&*wQ7^O1G0tO&+OQWO,5<WO&+TQWO,5<WO&+YQWO1G1dO&+_QWO1G0YO&+dQ#tO1G2VO&+kQ#tO1G2VO3qQWO'#F_O4{QWO'#F^OBYQWO'#EROK^QYO,5;YO!'_QWO'#FlO!'_QWO'#FlOIoQWO,5<kOIoQWO,5<k",
  stateData: "&,e~O&}OSSOSTOS~OPTOQTOWwO]bO^gOamOblOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!OSO!YjO!_UO!bTO!cTO!dTO!eTO!fTO!ikO#ZqO#knO#o]O$voO$xrO$zpO${pO%OsO%QtO%TuO%UuO%WvO%exO%kyO%mzO%o{O%q|O%t}O%z!OO&O!PO&Q!QO&S!RO&U!SO&W!TO'PPO']QO'q`O~OPZXYZX^ZXiZXqZXrZXtZX|ZX![ZX!]ZX!_ZX!eZX!tZX#OcX#RZX#SZX#TZX#UZX#VZX#WZX#XZX#YZX#[ZX#^ZX#`ZX#aZX#fZX&{ZX']ZX'eZX'lZX'mZX~O!W$cX~P$tO&x!VO&y!UO&z!XO~OPTOQTO]bOa!hOb!gOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!O!`O!YjO!_UO!bTO!cTO!dTO!eTO!fTO!i!fO#k!iO#o]O'P!YO']QO'q`O~O{!^O|!ZOy'`Py'iP~P'^O}!jO~P]OPTOQTO]bOa!hOb!gOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!O!`O!YjO!_UO!bTO!cTO!dTO!eTO!fTO!i!fO#k!iO#o]O'P8cO']QO'q`O~OPTOQTO]bOa!hOb!gOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!O!`O!YjO!_UO!bTO!cTO!dTO!eTO!fTO!i!fO#k!iO#o]O']QO'q`O~O{!oO!|!rO!}!oO'P8dO!^'fP~P+oO#O!sO~O!W!tO#O!sO~OP#ZOY#aOi#OOq!xOr!xOt!yO|#_O![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO#^#TO#`#VO#a#WO']QO'e#XO'l!zO'm!{O~O^'ZX&{'ZX!^'ZXy'ZX!O'ZX$w'ZX!W'ZX~P.ZO!t#bO#f#bOP'[XY'[X^'[Xi'[Xq'[Xr'[Xt'[X|'[X!['[X!]'[X!_'[X!e'[X#R'[X#S'[X#T'[X#U'[X#V'[X#W'[X#Y'[X#['[X#^'[X#`'[X#a'[X']'[X'e'[X'l'[X'm'[X~O#X'[X&{'[Xy'[X!^'[X'_'[X!O'[X$w'[X!W'[X~P0kO!t#bO~O#q#cO#x#gO~O!O#hO#o]O#{#iO#}#kO~O]#nOg#zOi#oOj#nOk#nOm#{Oo#|Ot#tO!O#uO!Y$RO!_#rO!}$SO#k$PO$U#}O$W$OO$Z$QO'P#mO'T'VP~O!_$TO~O!W$VO~O^$WO&{$WO~O'P$[O~O!_$TO'P$[O'Q$^O'U$_O~Ob$eO!_$TO'P$[O~O]$nOq$jO!O$gO!_$iO$x$mO'P$[O'Q$^O['yP~O!i$oO~Ot$pO!O$qO'P$[O~Ot$pO!O$qO%Q$uO'P$[O~O'P$vO~O#ZqO$xrO$zpO${pO%OsO%QtO%TuO%UuO~Oa%POb%OO!i$|O$v$}O%Y${O~P7^Oa%SOblO!O%RO!ikO#ZqO$voO$zpO${pO%OsO%QtO%TuO%UuO%WvO~O_%VO!t%YO$x%TO'Q$^O~P8]O!_%ZO!b%_O~O!_%`O~O!OSO~O^$WO&w%hO&{$WO~O^$WO&w%kO&{$WO~O^$WO&w%mO&{$WO~O&x!VO&y!UO&z%qO~OPZXYZXiZXqZXrZXtZX|ZX|cX![ZX!]ZX!_ZX!eZX!tZX!tcX#OcX#RZX#SZX#TZX#UZX#VZX#WZX#XZX#YZX#[ZX#^ZX#`ZX#aZX#fZX']ZX'eZX'lZX'mZX~OyZXycX~P:xO{%sOy&]X|&]X~P)rO|!ZOy'`X~OP#ZOY#aOi#OOq!xOr!xOt!yO|!ZO![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO#^#TO#`#VO#a#WO']QO'e#XO'l!zO'm!{O~Oy'`X~P=oOy%xO~Ot%{O!R&VO!S&OO!T&OO'Q$^O~O]%|Oj%|O{&PO'Y%yO}'aP}'kP~P?rOy'hX|'hX!W'hX!^'hX'e'hX~O!t'hX#O!wX}'hX~P@kO!t&WOy'jX|'jX~O|&XOy'iX~Oy&ZO~O!t#bO~P@kOR&_O!O&[O!j&^O'P$[O~Ob&dO!_$TO'P$[O~Oq$jO!_$iO~O}&eO~P]Oq!xOr!xOt!yO!]!vO!_!wO']QOP!aaY!aai!aa|!aa![!aa!e!aa#R!aa#S!aa#T!aa#U!aa#V!aa#W!aa#X!aa#Y!aa#[!aa#^!aa#`!aa#a!aa'e!aa'l!aa'm!aa~O^!aa&{!aay!aa!^!aa'_!aa!O!aa$w!aa!W!aa~PBtO!^&fO~O!W!tO!t&hO'e&gO|'gX^'gX&{'gX~O!^'gX~PE^O|&lO!^'fX~O!^&nO~Ot$pO!O$qO!}&oO'P$[O~OPTOQTO]bOa!hOb!gOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!OSO!YjO!_UO!bTO!cTO!dTO!eTO!fTO!i!fO#k!iO#o]O'P8cO']QO'q`O~O]#nOg#zOi#oOj#nOk#nOm#{Oo8uOt#tO!O#uO!Y9wO!_#rO!}8{O#k$PO$U8wO$W8yO$Z$QO'P&sO~O#O&uO~O]#nOg#zOi#oOj#nOk#nOm#{Oo#|Ot#tO!O#uO!Y$RO!_#rO!}$SO#k$PO$U#}O$W$OO$Z$QO'P&sO~O'T'cP~PIoO{&yO!^'dP~P)rO'Y&{O~OP8`OQ8`O]bOa9uOb!gOgbOi8`OjbOkbOm8`Oo8`OtROvbOwbOxbO!O!`O!Y8bO!_UO!b8`O!c8`O!d8`O!e8`O!f8`O!i!fO#k!iO#o]O'P'ZO']QO'q9sO~O!_!wO~O|#_O^$Sa&{$Sa!^$Say$Sa!O$Sa$w$Sa!W$Sa~O#Z'bO~PHcO!W'dO!O'nX#n'nX#q'nX#x'nX~Oq'eO~PNROq'eO!O'nX#n'nX#q'nX#x'nX~O!O'gO#n'kO#q'fO#x'lO~O{'oO~PK^O#q#cO#x'rO~Oq$[Xt$[X!]$[X'e$[X'l$[X'm$[X~OReX|eX!teX'TeX'T$[X~P! kOj'tO~Oq'vOt'wO'e#XO'l'yO'm'{O~O'T'uO~P!!iO'T(OO~O]#nOg#zOi#oOj#nOk#nOm#{Oo8uOt#tO!O#uO!Y9wO!_#rO!}8{O#k$PO$U8wO$W8yO$Z$QO~O{(SO'P(PO!^'rP~P!#WO#O(UO~O{(YO'P(VOy'sP~P!#WO^(cOi(hOt(`O!R(fO!S(_O!T(_O!_(]O!q(gO$n(bO'Q$^O'Y([O~O}(eO~P!${O!]!vOq'XXt'XX'e'XX'l'XX'm'XX|'XX!t'XX~O'T'XX#d'XX~P!%wOR(kO!t(jO|'WX'T'WX~O|(lO'T'VX~O'P(nO~O!_(sO~O!_(]O~Ot$pO{!oO!O$qO!|!rO!}!oO'P$[O!^'fP~O!W!tO#O(wO~OP#ZOY#aOi#OOq!xOr!xOt!yO![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO#^#TO#`#VO#a#WO']QO'e#XO'l!zO'm!{O~O^!Xa|!Xa&{!Xay!Xa!^!Xa'_!Xa!O!Xa$w!Xa!W!Xa~P!(TOR)PO!O&[O!j)OO$w(}O'U$_O~O'P$vO'T'VP~O!W)SO!O'SX^'SX&{'SX~O!_$TO'U$_O~O!_$TO'P$[O'U$_O~O!W!tO#O&uO~O'P)[O}'zP~O|)`O['yX~OY)dO~O[)eO~O!O$gO'P$[O'Q$^O['yP~Ot$pO{)jO!O$qO'P$[Oy'iP~O]&SOj&SO{)kO'Y&{O}'kP~O|)lO^'vX&{'vX~O!t)pO'U$_O~OR)sO!O#uO'U$_O~O!O)uO~Oq)wO!OSO~O!i)|O~Ob*RO~O'P(nO}'xP~Ob$eO~O$xrO'P$vO~P8]OY*XO[*WO~OPTOQTO]bOamOblOgbOiTOjbOkbOmTOoTOtROvbOwbOxbO!YjO!_UO!bTO!cTO!dTO!eTO!fTO!ikO#o]O$voO']QO'q`O~O!O!`O#k!iO'P8cO~P!/bO[*WO^$WO&{$WO~O^*]O#Z*_O$z*_O${*_O~P)rO!_%ZO~O%k*dO~O!O*fO~O%{*iO%|*hOP%yaQ%yaW%ya]%ya^%yaa%yab%yag%yai%yaj%yak%yam%yao%yat%yav%yaw%yax%ya!O%ya!Y%ya!_%ya!b%ya!c%ya!d%ya!e%ya!f%ya!i%ya#Z%ya#k%ya#o%ya$v%ya$x%ya$z%ya${%ya%O%ya%Q%ya%T%ya%U%ya%W%ya%e%ya%k%ya%m%ya%o%ya%q%ya%t%ya%z%ya&O%ya&Q%ya&S%ya&U%ya&W%ya&v%ya'P%ya']%ya'q%ya}%ya%r%ya_%ya%w%ya~O'P*lO~O'_*oO~Oy&]a|&]a~P!(TO|!ZOy'`a~Oy'`a~P=oO|&XOy'ia~O|sX|!UX}sX}!UX!WsX!W!UX!_!UX!tsX'U!UX~O!W*vO!t*uO|!{X|'bX}!{X}'bX!W'bX!_'bX'U'bX~O!W*xO!_$TO'U$_O|!QX}!QX~O]%zOj%zOt%{O'Y([O~OP8`OQ8`O]bOa9uOb!gOgbOi8`OjbOkbOm8`Oo8`OtROvbOwbOxbO!O!`O!Y8bO!_UO!b8`O!c8`O!d8`O!e8`O!f8`O!i!fO#k!iO#o]O']QO'q9sO~O'P9PO~P!9YO|*|O}'aX~O}+OO~O!W*vO!t*uO|!{X}!{X~O|+PO}'kX~O}+RO~O]%zOj%zOt%{O'Q$^O'Y([O~O!S+SO!T+SO~P!<TOt$pO{+VO!O$qO'P$[Oy&bX|&bX~O^+ZO!R+^O!S+YO!T+YO!m+`O!n+_O!o+_O!q+aO'Q$^O'Y([O~O}+]O~P!=UOR+fO!O&[O!j+eO~O!t+lO|'ga!^'ga^'ga&{'ga~O!W!tO~P!>YO|&lO!^'fa~Ot$pO{+oO!O$qO!|+qO!}+oO'P$[O|&dX!^&dX~O^!vi|!vi&{!viy!vi!^!vi'_!vi!O!vi$w!vi!W!vi~P!(TO#O!sa|!sa!^!sa!t!sa!O!sa^!sa&{!say!sa~P!!iO#O'XXP'XXY'XX^'XXi'XXr'XX!['XX!_'XX!e'XX#R'XX#S'XX#T'XX#U'XX#V'XX#W'XX#X'XX#Y'XX#['XX#^'XX#`'XX#a'XX&{'XX']'XX!^'XXy'XX!O'XX$w'XX'_'XX!W'XX~P!%wO|+zO'T'cX~P!!iO'T+|O~O|+}O!^'dX~P!(TO!^,QO~Oy,RO~OP#ZOq!xOr!xOt!yO!]!vO!_!wO!e#ZO']QOY#Qi^#Qii#Qi|#Qi![#Qi#S#Qi#T#Qi#U#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi&{#Qi'e#Qi'l#Qi'm#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~O#R#Qi~P!CgO#R!|O~P!CgOP#ZOq!xOr!xOt!yO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O']QOY#Qi^#Qi|#Qi![#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi&{#Qi'e#Qi'l#Qi'm#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~Oi#Qi~P!FROi#OO~P!FROP#ZOi#OOq!xOr!xOt!yO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO']QO^#Qi|#Qi#[#Qi#^#Qi#`#Qi#a#Qi&{#Qi'e#Qi'l#Qi'm#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~OY#Qi![#Qi#W#Qi#X#Qi#Y#Qi~P!HmOY#aO![#QO#W#QO#X#QO#Y#QO~P!HmOP#ZOY#aOi#OOq!xOr!xOt!yO![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO']QO^#Qi|#Qi#^#Qi#`#Qi#a#Qi&{#Qi'e#Qi'm#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~O'l#Qi~P!KeO'l!zO~P!KeOP#ZOY#aOi#OOq!xOr!xOt!yO![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO#^#TO']QO'l!zO^#Qi|#Qi#`#Qi#a#Qi&{#Qi'e#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~O'm#Qi~P!NPO'm!{O~P!NPOP#ZOY#aOi#OOq!xOr!xOt!yO![#QO!]!vO!_!wO!e#ZO#R!|O#S!}O#T!}O#U!}O#V#PO#W#QO#X#QO#Y#QO#[#RO#^#TO#`#VO']QO'l!zO'm!{O~O^#Qi|#Qi#a#Qi&{#Qi'e#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~P#!kOPZXYZXiZXqZXrZXtZX![ZX!]ZX!_ZX!eZX!tZX#OcX#RZX#SZX#TZX#UZX#VZX#WZX#XZX#YZX#[ZX#^ZX#`ZX#aZX#fZX']ZX'eZX'lZX'mZX|ZX}ZX~O#dZX~P#%OOP#ZOY8sOi8hOq!xOr!xOt!yO![8jO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO#V8iO#W8jO#X8jO#Y8jO#[8kO#^8mO#`8oO#a8pO']QO'e#XO'l!zO'm!{O~O#d,TO~P#'YOP'[XY'[Xi'[Xq'[Xr'[Xt'[X!['[X!]'[X!_'[X!e'[X#R'[X#S'[X#T'[X#U'[X#V'[X#W'[X#Y'[X#['[X#^'[X#`'[X#a'[X']'[X'e'[X'l'[X'm'[X|'[X~O!t8tO#f8tO#X'[X#d'[X}'[X~P#)TO^&ga|&ga&{&ga!^&ga'_&gay&ga!O&ga$w&ga!W&ga~P!(TOP#QiY#Qi^#Qii#Qir#Qi|#Qi![#Qi!]#Qi!_#Qi!e#Qi#R#Qi#S#Qi#T#Qi#U#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi&{#Qi']#Qiy#Qi!^#Qi'_#Qi!O#Qi$w#Qi!W#Qi~P!!iO^#ei|#ei&{#eiy#ei!^#ei'_#ei!O#ei$w#ei!W#ei~P!(TO#q,VO~O#q,WO~O!W'dO!t,XO!O#uX#n#uX#q#uX#x#uX~O{,YO~O!O'gO#n,[O#q'fO#x,]O~O|8qO}'ZX~P#'YO},^O~O#x,`O~O],cOj,cOy,dO~O|cX!WcX!^cX!^$[X'ecX~P! kO!^,jO~P!!iO|,kO!W!tO'e&gO!^'rX~O!^,pO~Oy$[X|$[X!W$cX~P! kO|,rOy'sX~P!!iO!W,tO~Oy,vO~O{(SO'P$[O!^'rP~Oi,zO!W!tO!_$TO'U$_O'e&gO~O!W)SO~O}-QO~P!${O!S-RO!T-RO'Q$^O'Y([O~Ot-TO'Y([O~O!q-UO~O'P$vO|&lX'T&lX~O|(lO'T'Va~Oq-ZOr-ZOt-[O'ena'lna'mna|na!tna~O'Tna#dna~P#3|Oq'vOt'wO'e$Ta'l$Ta'm$Ta|$Ta!t$Ta~O'T$Ta#d$Ta~P#4rOq'vOt'wO'e$Va'l$Va'm$Va|$Va!t$Va~O'T$Va#d$Va~P#5eO]-]O~O#O-^O~O'T$ea|$ea#d$ea!t$ea~P!!iO#O-aO~OR-jO!O&[O!j-iO$w-hO~O'T-kO~O]#nOi#oOj#nOk#nOm#{Oo8uOt#tO!O#uO!Y9wO!_#rO!}8{O#k$PO$U8wO$W8yO$Z$QO~Og-mO'P-lO~P#7[O!W)SO!O'Sa^'Sa&{'Sa~O#O-sO~OYZX|cX}cX~O|-tO}'zX~O}-vO~OY-wO~O!O$gO'P$[O[&tX|&tX~O|)`O['ya~O!^-zO~P!(TO]-|O~OY-}O~O[.OO~OR-jO!O&[O!j-iO$w-hO'U$_O~O|)lO^'va&{'va~O!t.UO~OR.XO!O#uO~O'Y&{O}'wP~OR.cO!O._O!j.bO$w.aO'U$_O~OY.mO|.kO}'xX~O}.nO~O[.pO^$WO&{$WO~O].qO~O#X.sO%i.tO~P0kO!t#bO#X.sO%i.tO~O^.uO~P)rO^.wO~O%r.{OP%piQ%piW%pi]%pi^%pia%pib%pig%pii%pij%pik%pim%pio%pit%piv%piw%pix%pi!O%pi!Y%pi!_%pi!b%pi!c%pi!d%pi!e%pi!f%pi!i%pi#Z%pi#k%pi#o%pi$v%pi$x%pi$z%pi${%pi%O%pi%Q%pi%T%pi%U%pi%W%pi%e%pi%k%pi%m%pi%o%pi%q%pi%t%pi%z%pi&O%pi&Q%pi&S%pi&U%pi&W%pi&v%pi'P%pi']%pi'q%pi}%pi_%pi%w%pi~O_/RO}/PO%w/QO~P]O!OSO!_/UO~O|#_O'_$Sa~Oy&]i|&]i~P!(TO|!ZOy'`i~O|&XOy'ii~Oy/YO~O|!Qa}!Qa~P#'YO]%zOj%zO{/`O'Y([O|&^X}&^X~P?rO|*|O}'aa~O]&SOj&SO{)kO'Y&{O|&cX}&cX~O|+PO}'ka~Oy'ji|'ji~P!(TO^$WO!W!tO!_$TO!e/kO!t/iO&{$WO'U$_O'e&gO~O}/nO~P!=UO!S/oO!T/oO'Q$^O'Y([O~O!R/qO!S/oO!T/oO!q/rO'Q$^O'Y([O~O!n/sO!o/sO~P#EXO!O&[O~O!O&[O~P!!iO|'gi!^'gi^'gi&{'gi~P!(TO!t/|O|'gi!^'gi^'gi&{'gi~O|&lO!^'fi~Ot$pO!O$qO!}0OO'P$[O~O#OnaPnaYna^naina![na!]na!_na!ena#Rna#Sna#Tna#Una#Vna#Wna#Xna#Yna#[na#^na#`na#ana&{na']na!^nayna!Ona$wna'_na!Wna~P#3|O#O$TaP$TaY$Ta^$Tai$Tar$Ta![$Ta!]$Ta!_$Ta!e$Ta#R$Ta#S$Ta#T$Ta#U$Ta#V$Ta#W$Ta#X$Ta#Y$Ta#[$Ta#^$Ta#`$Ta#a$Ta&{$Ta']$Ta!^$Tay$Ta!O$Ta$w$Ta'_$Ta!W$Ta~P#4rO#O$VaP$VaY$Va^$Vai$Var$Va![$Va!]$Va!_$Va!e$Va#R$Va#S$Va#T$Va#U$Va#V$Va#W$Va#X$Va#Y$Va#[$Va#^$Va#`$Va#a$Va&{$Va']$Va!^$Vay$Va!O$Va$w$Va'_$Va!W$Va~P#5eO#O$eaP$eaY$ea^$eai$ear$ea|$ea![$ea!]$ea!_$ea!e$ea#R$ea#S$ea#T$ea#U$ea#V$ea#W$ea#X$ea#Y$ea#[$ea#^$ea#`$ea#a$ea&{$ea']$ea!^$eay$ea!O$ea!t$ea$w$ea'_$ea!W$ea~P!!iO^!vq|!vq&{!vqy!vq!^!vq'_!vq!O!vq$w!vq!W!vq~P!(TO|&_X'T&_X~PIoO|+zO'T'ca~O{0WO|&`X!^&`X~P)rO|+}O!^'da~O|+}O!^'da~P!(TO#d!aa}!aa~PBtO#d!Xa|!Xa}!Xa~P#'YO!O0kO#o]O#v0lO~O}0pO~O^$Pq|$Pq&{$Pqy$Pq!^$Pq'_$Pq!O$Pq$w$Pq!W$Pq~P!(TOy0qO~O],cOj,cO~Oq'vOt'wO'm'{O'e$oi'l$oi|$oi!t$oi~O'T$oi#d$oi~P$%SOq'vOt'wO'e$qi'l$qi'm$qi|$qi!t$qi~O'T$qi#d$qi~P$%uO#d0rO~P!!iO{0tO'P$[O|&hX!^&hX~O|,kO!^'ra~O|,kO!W!tO!^'ra~O|,kO!W!tO'e&gO!^'ra~O'T$^i|$^i#d$^i!t$^i~P!!iO{0{O'P(VOy&jX|&jX~P!#WO|,rOy'sa~O|,rOy'sa~P!!iO!W!tO~O!W!tO#X1VO~Oi1ZO!W!tO'e&gO~O|'Wi'T'Wi~P!!iO!t1^O|'Wi'T'Wi~P!!iO!^1aO~O^$Qq|$Qq&{$Qqy$Qq!^$Qq'_$Qq!O$Qq$w$Qq!W$Qq~P!(TO|1eO!O'tX~P!!iO!O&[O$w1hO~O!O&[O$w1hO~P!!iO!O$[X$lZX^$[X&{$[X~P! kO$l1lOqfXtfX!OfX'efX'lfX'mfX^fX&{fX~O$l1lO~O'P)[O|&sX}&sX~O|-tO}'za~O[1uO~O]1xO~OR1zO!O&[O!j1yO$w1hO~O^$WO&{$WO~P!!iO!O#uO~P!!iO|2PO!t2RO}'wX~O}2SO~Ot(`O!R2]O!S2UO!T2UO!m2[O!n2ZO!o2ZO!q2YO'Q$^O'Y([O~O}2XO~P$-{OR2dO!O._O!j2cO$w2bO~OR2dO!O._O!j2cO$w2bO'U$_O~O'P(nO|&rX}&rX~O|.kO}'xa~O'Y2mO~O]2oO~O[2qO~O!^2tO~P)rO^2vO~O^2vO~P)rO#X2xO%i2yO~PE^O_/RO}2}O%w/QO~P]O!W3PO~O%|3QOP%yqQ%yqW%yq]%yq^%yqa%yqb%yqg%yqi%yqj%yqk%yqm%yqo%yqt%yqv%yqw%yqx%yq!O%yq!Y%yq!_%yq!b%yq!c%yq!d%yq!e%yq!f%yq!i%yq#Z%yq#k%yq#o%yq$v%yq$x%yq$z%yq${%yq%O%yq%Q%yq%T%yq%U%yq%W%yq%e%yq%k%yq%m%yq%o%yq%q%yq%t%yq%z%yq&O%yq&Q%yq&S%yq&U%yq&W%yq&v%yq'P%yq']%yq'q%yq}%yq%r%yq_%yq%w%yq~O|!{i}!{i~P#'YO!t3SO|!{i}!{i~O|!Qi}!Qi~P#'YO^$WO!t3ZO&{$WO~O^$WO!W!tO!t3ZO&{$WO~O^$WO!W!tO!_$TO!e3_O!t3ZO&{$WO'U$_O'e&gO~O!S3`O!T3`O'Q$^O'Y([O~O!R3cO!S3`O!T3`O!q3dO'Q$^O'Y([O~O^$WO!W!tO!e3_O!t3ZO&{$WO'e&gO~O|'gq!^'gq^'gq&{'gq~P!(TO|&lO!^'fq~O#O$oiP$oiY$oi^$oii$oir$oi![$oi!]$oi!_$oi!e$oi#R$oi#S$oi#T$oi#U$oi#V$oi#W$oi#X$oi#Y$oi#[$oi#^$oi#`$oi#a$oi&{$oi']$oi!^$oiy$oi!O$oi$w$oi'_$oi!W$oi~P$%SO#O$qiP$qiY$qi^$qii$qir$qi![$qi!]$qi!_$qi!e$qi#R$qi#S$qi#T$qi#U$qi#V$qi#W$qi#X$qi#Y$qi#[$qi#^$qi#`$qi#a$qi&{$qi']$qi!^$qiy$qi!O$qi$w$qi'_$qi!W$qi~P$%uO#O$^iP$^iY$^i^$^ii$^ir$^i|$^i![$^i!]$^i!_$^i!e$^i#R$^i#S$^i#T$^i#U$^i#V$^i#W$^i#X$^i#Y$^i#[$^i#^$^i#`$^i#a$^i&{$^i']$^i!^$^iy$^i!O$^i!t$^i$w$^i'_$^i!W$^i~P!!iO|&_a'T&_a~P!!iO|&`a!^&`a~P!(TO|+}O!^'di~O#d!vi|!vi}!vi~P#'YOP#ZOq!xOr!xOt!yO!]!vO!_!wO!e#ZO']QOY#Qii#Qi![#Qi#S#Qi#T#Qi#U#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi#d#Qi'e#Qi'l#Qi'm#Qi|#Qi}#Qi~O#R#Qi~P$?rO#R8fO~P$?rOP#ZOq!xOr!xOt!yO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO']QOY#Qi![#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi#d#Qi'e#Qi'l#Qi'm#Qi|#Qi}#Qi~Oi#Qi~P$AzOi8hO~P$AzOP#ZOi8hOq!xOr!xOt!yO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO#V8iO']QO#[#Qi#^#Qi#`#Qi#a#Qi#d#Qi'e#Qi'l#Qi'm#Qi|#Qi}#Qi~OY#Qi![#Qi#W#Qi#X#Qi#Y#Qi~P$DSOY8sO![8jO#W8jO#X8jO#Y8jO~P$DSOP#ZOY8sOi8hOq!xOr!xOt!yO![8jO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO#V8iO#W8jO#X8jO#Y8jO#[8kO']QO#^#Qi#`#Qi#a#Qi#d#Qi'e#Qi'm#Qi|#Qi}#Qi~O'l#Qi~P$FhO'l!zO~P$FhOP#ZOY8sOi8hOq!xOr!xOt!yO![8jO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO#V8iO#W8jO#X8jO#Y8jO#[8kO#^8mO']QO'l!zO#`#Qi#a#Qi#d#Qi'e#Qi|#Qi}#Qi~O'm#Qi~P$HpO'm!{O~P$HpOP#ZOY8sOi8hOq!xOr!xOt!yO![8jO!]!vO!_!wO!e#ZO#R8fO#S8gO#T8gO#U8gO#V8iO#W8jO#X8jO#Y8jO#[8kO#^8mO#`8oO']QO'l!zO'm!{O~O#a#Qi#d#Qi'e#Qi|#Qi}#Qi~P$JxO^#by|#by&{#byy#by!^#by'_#by!O#by$w#by!W#by~P!(TOP#QiY#Qii#Qir#Qi![#Qi!]#Qi!_#Qi!e#Qi#R#Qi#S#Qi#T#Qi#U#Qi#V#Qi#W#Qi#X#Qi#Y#Qi#[#Qi#^#Qi#`#Qi#a#Qi#d#Qi']#Qi|#Qi}#Qi~P!!iO!]!vOP'XXY'XXi'XXq'XXr'XXt'XX!['XX!_'XX!e'XX#R'XX#S'XX#T'XX#U'XX#V'XX#W'XX#X'XX#Y'XX#['XX#^'XX#`'XX#a'XX#d'XX']'XX'e'XX'l'XX'm'XX|'XX}'XX~O#d#ei|#ei}#ei~P#'YO}3tO~O|&ga}&ga~P#'YO!W!tO'e&gO|&ha!^&ha~O|,kO!^'ri~O|,kO!W!tO!^'ri~Oy&ja|&ja~P!!iO!W3{O~O|,rOy'si~P!!iO|,rOy'si~Oy4RO~O!W!tO#X4XO~Oi4YO!W!tO'e&gO~Oy4[O~O'T$`q|$`q#d$`q!t$`q~P!!iO^$Qy|$Qy&{$Qyy$Qy!^$Qy'_$Qy!O$Qy$w$Qy!W$Qy~P!(TO|1eO!O'ta~O!O&[O$w4aO~O!O&[O$w4aO~P!!iO^!vy|!vy&{!vyy!vy!^!vy'_!vy!O!vy$w!vy!W!vy~P!(TOY4dO~O|-tO}'zi~O]4fO~O[4gO~O'Y&{O|&oX}&oX~O|2PO}'wa~O}4tO~P$-{O!R4wO!S4vO!T4vO!q/rO'Q$^O'Y([O~O!n4xO!o4xO~P%)VO!S4vO!T4vO'Q$^O'Y([O~O!O._O~O!O._O$w4zO~O!O._O$w4zO~P!!iOR5PO!O._O!j5OO$w4zO~OY5UO|&ra}&ra~O|.kO}'xi~O]5XO~O!^5YO~O!^5ZO~O!^5[O~O!^5[O~P)rO^5^O~O!W5aO~O!^5cO~O|'ji}'ji~P#'YO^$WO&{$WO~P!(TO^$WO!t5hO&{$WO~O^$WO!W!tO!t5hO&{$WO~O^$WO!W!tO!e5mO!t5hO&{$WO'e&gO~O!_$TO'U$_O~P%-YO!S5nO!T5nO'Q$^O'Y([O~O|'gy!^'gy^'gy&{'gy~P!(TO#O$`qP$`qY$`q^$`qi$`qr$`q|$`q![$`q!]$`q!_$`q!e$`q#R$`q#S$`q#T$`q#U$`q#V$`q#W$`q#X$`q#Y$`q#[$`q#^$`q#`$`q#a$`q&{$`q']$`q!^$`qy$`q!O$`q!t$`q$w$`q'_$`q!W$`q~P!!iO|&`i!^&`i~P!(TO#d!vq|!vq}!vq~P#'YOq-ZOr-ZOt-[OPnaYnaina![na!]na!_na!ena#Rna#Sna#Tna#Una#Vna#Wna#Xna#Yna#[na#^na#`na#ana#dna']na'ena'lna'mna|na}na~Oq'vOt'wOP$TaY$Tai$Tar$Ta![$Ta!]$Ta!_$Ta!e$Ta#R$Ta#S$Ta#T$Ta#U$Ta#V$Ta#W$Ta#X$Ta#Y$Ta#[$Ta#^$Ta#`$Ta#a$Ta#d$Ta']$Ta'e$Ta'l$Ta'm$Ta|$Ta}$Ta~Oq'vOt'wOP$VaY$Vai$Var$Va![$Va!]$Va!_$Va!e$Va#R$Va#S$Va#T$Va#U$Va#V$Va#W$Va#X$Va#Y$Va#[$Va#^$Va#`$Va#a$Va#d$Va']$Va'e$Va'l$Va'm$Va|$Va}$Va~OP$eaY$eai$ear$ea![$ea!]$ea!_$ea!e$ea#R$ea#S$ea#T$ea#U$ea#V$ea#W$ea#X$ea#Y$ea#[$ea#^$ea#`$ea#a$ea#d$ea']$ea|$ea}$ea~P!!iO#d$Pq|$Pq}$Pq~P#'YO#d$Qq|$Qq}$Qq~P#'YO}5xO~O'T$sy|$sy#d$sy!t$sy~P!!iO!W!tO|&hi!^&hi~O!W!tO'e&gO|&hi!^&hi~O|,kO!^'rq~Oy&ji|&ji~P!!iO|,rOy'sq~Oy6PO~P!!iOy6PO~O|'Wy'T'Wy~P!!iO|&ma!O&ma~P!!iO!O$kq^$kq&{$kq~P!!iO|-tO}'zq~O]6YO~O!O&[O$w6ZO~O!O&[O$w6ZO~P!!iO!t6[O|&oa}&oa~O|2PO}'wi~P#'YO!S6bO!T6bO'Q$^O'Y([O~O!R6dO!S6bO!T6bO!q3dO'Q$^O'Y([O~O!O._O$w6gO~O!O._O$w6gO~P!!iO'Y6mO~O|.kO}'xq~O!^6pO~O!^6pO~P)rO!^6rO~O!^6sO~O|!{y}!{y~P#'YO^$WO!t6xO&{$WO~O^$WO!W!tO!t6xO&{$WO~O^$WO!W!tO!e6|O!t6xO&{$WO'e&gO~O#O$syP$syY$sy^$syi$syr$sy|$sy![$sy!]$sy!_$sy!e$sy#R$sy#S$sy#T$sy#U$sy#V$sy#W$sy#X$sy#Y$sy#[$sy#^$sy#`$sy#a$sy&{$sy']$sy!^$syy$sy!O$sy!t$sy$w$sy'_$sy!W$sy~P!!iO#d#by|#by}#by~P#'YOP$^iY$^ii$^ir$^i![$^i!]$^i!_$^i!e$^i#R$^i#S$^i#T$^i#U$^i#V$^i#W$^i#X$^i#Y$^i#[$^i#^$^i#`$^i#a$^i#d$^i']$^i|$^i}$^i~P!!iOq'vOt'wO'm'{OP$oiY$oii$oir$oi![$oi!]$oi!_$oi!e$oi#R$oi#S$oi#T$oi#U$oi#V$oi#W$oi#X$oi#Y$oi#[$oi#^$oi#`$oi#a$oi#d$oi']$oi'e$oi'l$oi|$oi}$oi~Oq'vOt'wOP$qiY$qii$qir$qi![$qi!]$qi!_$qi!e$qi#R$qi#S$qi#T$qi#U$qi#V$qi#W$qi#X$qi#Y$qi#[$qi#^$qi#`$qi#a$qi#d$qi']$qi'e$qi'l$qi'm$qi|$qi}$qi~O#d$Qy|$Qy}$Qy~P#'YO#d!vy|!vy}!vy~P#'YO!W!tO|&hq!^&hq~O|,kO!^'ry~Oy&jq|&jq~P!!iOy7SO~P!!iO|2PO}'wq~O!S7_O!T7_O'Q$^O'Y([O~O!O._O$w7bO~O!O._O$w7bO~P!!iO!^7eO~O%|7fOP%y!ZQ%y!ZW%y!Z]%y!Z^%y!Za%y!Zb%y!Zg%y!Zi%y!Zj%y!Zk%y!Zm%y!Zo%y!Zt%y!Zv%y!Zw%y!Zx%y!Z!O%y!Z!Y%y!Z!_%y!Z!b%y!Z!c%y!Z!d%y!Z!e%y!Z!f%y!Z!i%y!Z#Z%y!Z#k%y!Z#o%y!Z$v%y!Z$x%y!Z$z%y!Z${%y!Z%O%y!Z%Q%y!Z%T%y!Z%U%y!Z%W%y!Z%e%y!Z%k%y!Z%m%y!Z%o%y!Z%q%y!Z%t%y!Z%z%y!Z&O%y!Z&Q%y!Z&S%y!Z&U%y!Z&W%y!Z&v%y!Z'P%y!Z']%y!Z'q%y!Z}%y!Z%r%y!Z_%y!Z%w%y!Z~O^$WO!t7jO&{$WO~O^$WO!W!tO!t7jO&{$WO~OP$`qY$`qi$`qr$`q![$`q!]$`q!_$`q!e$`q#R$`q#S$`q#T$`q#U$`q#V$`q#W$`q#X$`q#Y$`q#[$`q#^$`q#`$`q#a$`q#d$`q']$`q|$`q}$`q~P!!iO|&oq}&oq~P#'YO^$WO!t8OO&{$WO~OP$syY$syi$syr$sy![$sy!]$sy!_$sy!e$sy#R$sy#S$sy#T$sy#U$sy#V$sy#W$sy#X$sy#Y$sy#[$sy#^$sy#`$sy#a$sy#d$sy']$sy|$sy}$sy~P!!iO'_'ZX~P.ZO'_ZXyZX!^ZX%iZX!OZX$wZX!WZX~P$tO!WcX!^ZX!^cX'ecX~P:xOP8`OQ8`O]bOa9uOb!gOgbOi8`OjbOkbOm8`Oo8`OtROvbOwbOxbO!OSO!Y8bO!_UO!b8`O!c8`O!d8`O!e8`O!f8`O!i!fO#k!iO#o]O'P'ZO']QO'q9sO~O|8qO}$Sa~O]#nOg#zOi#oOj#nOk#nOm#{Oo8vOt#tO!O#uO!Y9xO!_#rO!}8|O#k$PO$U8xO$W8zO$Z$QO'P&sO~O#Z'bO~P&'mO}ZX}cX~P:xO#O8eO~O!W!tO#O8eO~O!t8tO~O!t8}O|'jX}'jX~O!t8tO|'hX}'hX~O#O9OO~O'T9QO~P!!iO#O9VO~O#O9WO~O!W!tO#O9XO~O!W!tO#O9OO~O#d9YO~P#'YO#O9ZO~O#O9[O~O#O9]O~O#O9^O~O#d9_O~P!!iO#d9`O~P!!iO#o~!]!m!o!|!}'q$U$W$Z$l$v$w$x%O%Q%T%U%W%Y~TS#o'q#q'Y'P&}#Sx~",
  goto: "#<v(OPPPPPPP(PP(aP)|PPPP-]PP-r2v4i4|P4|PPP4|P4|P6iPP6nP7VPPPP;fPPPP;f>UPPP>[@_P;fPBrPPPPDj;fPPPPPFc;fPPIbJ_PPPJcPJkKlP;f;fNs!#l!([!([!+iPPP!+p;fPPPPPPPPPP!.dP!/uPP;f!1SP;fP;f;f;f;fP;f!3fPP!6]P!9O!9W!9[!9[P!6YP!9`!9`P!<RP!<V;f;f!<]!>}4|P4|P4|4|P!@Q4|4|!At4|4|4|!Cu4|4|!Dc!F[!F[!F`!F[!FhP!F[P4|!Gd4|!Hm4|4|-]PPP!IyPP!Jc!JcP!JcP!Jx!JcPP!KOP!JuP!Ju!KbJg!Ju!LP!LV!LY(P!L](PP!Ld!Ld!LdP(PP(PP(PP(PPP(PP!Lj!LmP!Lm(PPPP(PP(PP(PP(PP(PP(P(P!Lq!L{!MR!Ma!Mg!Mm!Mw!M}!NX!N_!Nm!Ns!Ny# X# n##P##_##e##k##q##w#$R#$X#$_#$i#$s#$yPPPPPPPP#%PPP#%s#)qPP#+U#+]#+eP#/n#2RP#7{P#8P#8S#8V#8b#8eP#8h#8l#9Z#:O#:S#:fPP#:j#:p#:tP#:w#:{#;O#;n#<U#<Z#<^#<a#<g#<j#<n#<rmgOSi{!k$V%^%a%b%d*a*f.{/OQ$dlQ$knQ%UwS&O!`*|Q&c!gS(_#u(dQ)Y$eQ)f$mQ*Q%OQ+S&VS+Y&[+[Q+j&dQ-R(fQ.j*RU/o+^+_+`S2U._2WS3`/q/sU4v2Z2[2]Q5n3cS6b4w4xR7_6d$lZORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8O!j']#Y#h&P'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vQ(o#|Q)_$gQ*S%RQ*Z%ZQ+t8uQ-n)SQ.r*XQ1r-tQ2k.kR3m8vpdOSiw{!k$V%T%^%a%b%d*a*f.{/OR*U%V&WVOSTijm{!Q!U!Z!h!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h$V$i%V%Y%Z%^%`%a%b%d%h%s%{&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9u9vW!aRU!^&PQ$]kQ$clS$hn$mv$rpq!o!r$T$p&X&l&o)j)k)l*_*v+V+o+q/U0OQ$zuQ&`!fQ&b!gS(R#r(]S)X$d$eQ)]$gQ)i$oQ){$|Q*P%OS+i&c&dQ,o(SQ-r)YQ-x)`Q-{)dQ.e)|S.i*Q*RQ/z+jQ0s,kQ1q-tQ1t-wQ1w-}Q2j.jQ3x0tR6W4d!W$al!g$c$d$e%}&b&c&d(^)X)Y*y+X+i+j,{-r/e/l/p/z1Y3^3b5l6{Q)Q$]Q)q$wQ)t$xQ*O%OQ.P)iQ.d){U.h*P*Q*RQ2e.eS2i.i.jQ4q2TQ5T2jS6`4r4uS7]6a6cQ7u7^R8T7vW#x`$_(l9sS$wr%TQ$xsQ$ytR)o$u$T#w`!t!v#a#r#t#}$O$S&_'z'|'}(U(Y(j(k(})P)S)p)s+f+z,r,t-^-h-j.U.X.a.c0r0{1V1^1e1h1l1z2b2d3{4X4a4z5P6Z6g7b8s8w8x8y8z8{8|9R9S9T9U9V9W9Z9[9_9`9s9y9zV(p#|8u8vU&S!`$q+PQ&|!xQ)c$jQ,b'vQ.Y)uQ1_-ZR4m2P&YbORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9v$]#^Y!]!l$Z%r%v&q&x'O'P'Q'R'S'T'U'V'W'X'Y'['_'c'm)b*q*z+T+k+y,P,S,U,a-_/Z/^/{0V0Z0[0]0^0_0`0a0b0c0d0e0f0g0j0o1c1o3U3X3h3k3l3q3r4o5d5g5r5v5w6v7X7h7|8W8a9l&ZbORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vQ&Q!`R/a*|Y%z!`&O&V*|+SS(^#u(dS+X&[+[S,{(_(fQ,|(`Q-S(gQ.[)wS/l+Y+^S/p+_+`S/t+a2YQ1Y-RQ1[-TQ1]-US2T._2WS3^/o/qQ3a/rQ3b/sS4r2U2]S4u2Z2[S5l3`3cQ5o3dS6a4v4wQ6c4xQ6{5nS7^6b6dR7v7_lgOSi{!k$V%^%a%b%d*a*f.{/OQ%f!OS&p!s8eQ)V$bQ)y$zQ)z${Q+g&aS+x&u9OS-`(w9XQ-p)WQ.^)xQ/S*hQ/T*iQ/]*wQ/x+hS1d-a9]Q1m-qS1p-s9^Q3T/_Q3W/gQ3f/yQ4c1nQ5b3QQ5e3VQ5i3]Q5p3gQ6t5cQ6w5jQ7i6yQ7z7fR7}7k$W#]Y!]!l%r%v&q&x'O'P'Q'R'S'T'U'V'W'X'Y'['_'c'm)b*q*z+T+k+y,P,S,a-_/Z/^/{0V0Z0[0]0^0_0`0a0b0c0d0e0f0g0j0o1c1o3U3X3h3k3l3q3r4o5d5g5r5v5w6v7X7h7|8W8a9lU(i#v&t0iT({$Z,U$W#[Y!]!l%r%v&q&x'O'P'Q'R'S'T'U'V'W'X'Y'['_'c'm)b*q*z+T+k+y,P,S,a-_/Z/^/{0V0Z0[0]0^0_0`0a0b0c0d0e0f0g0j0o1c1o3U3X3h3k3l3q3r4o5d5g5r5v5w6v7X7h7|8W8a9lQ'^#]S(z$Z,UR-b({&YbORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vQ%ayQ%bzQ%d|Q%e}R.z*dQ&]!fQ(|$]Q+d&`S-g)Q)iS/u+b+cW1g-d-e-f.PS3e/v/wU4`1i1j1kU6U4_4i4jQ7U6VR7q7WT+Z&[+[S+Z&[+[T2V._2WS&j!n.xQ,n(RQ,y(^S/k+X2TQ0x,oS1S,z-SU3_/p/t4uQ3w0sS4V1Z1]U5m3a3b6cQ5z3xQ6T4YR6|5oQ!uXS&i!n.xQ(x$UQ)T$`Q)Z$fQ+m&jQ,m(RQ,x(^Q,}(aQ-o)UQ.f)}S/j+X2TS0w,n,oS1R,y-SQ1U,|Q1X-OQ2g.gW3[/k/p/t4uQ3v0sQ3z0xS4P1S1]Q4W1[Q5R2hW5k3_3a3b6cS5y3w3xQ6O4RQ6R4VQ6^4pQ6k5SS6z5m5oQ7O5zQ7Q6PQ7T6TQ7Z6_Q7d6lQ7l6|Q7o7SQ7s7[Q8R7tQ8Y8SQ8^8ZQ9f9bQ9o9jR9p9k$nWORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%Z%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8OS!um!h!j9a#Y#h&P'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vR9f9u$nXORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%Z%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8OQ$Ua!W$`l!g$c$d$e%}&b&c&d(^)X)Y*y+X+i+j,{-r/e/l/p/z1Y3^3b5l6{S$fm!hQ)U$aQ)}%OW.g*O*P*Q*RU2h.h.i.jQ4p2TS5S2i2jU6_4q4r4uQ6l5TU7[6`6a6cS7t7]7^S8S7u7vQ8Z8T!j9b#Y#h&P'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vQ9j9tR9k9u$f[OSTij{!Q!U!Z!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8OU!eRU!^v$rpq!o!r$T$p&X&l&o)j)k)l*_*v+V+o+q/U0OQ*[%Z!h9c#Y#h'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vR9e&PS&T!`$qR/c+P$lZORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8O!j']#Y#h&P'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vR*Z%Z!h#SY!]$Z%r%v&q&x'V'W'X'Y'_'c)b*q+T+k+y,P,a-_/{0V0g1c1o3X3h3k5g6v7h7|8W8a!R8l'['m*z,U/Z/^0Z0c0d0e0f0j0o3U3l3q3r4o5d5r5v5w7X9l!d#UY!]$Z%r%v&q&x'X'Y'_'c)b*q+T+k+y,P,a-_/{0V0g1c1o3X3h3k5g6v7h7|8W8a}8n'['m*z,U/Z/^0Z0e0f0j0o3U3l3q3r4o5d5r5v5w7X9l!`#YY!]$Z%r%v&q&x'_'c)b*q+T+k+y,P,a-_/{0V0g1c1o3X3h3k5g6v7h7|8W8al'}#p&v(v,i,q-V-W0T1b3u4Z9g9q9rx9v'['m*z,U/Z/^0Z0j0o3U3l3q3r4o5d5r5v5w7X9l!^9y&r'a(Q(W+c+w,u-c-f.T.V/w0S0y0}1k1|2O2`3j3|4S4]4b4j4}5q5|6S6iZ9z0h3p5s6}7m&YbORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vS#i_#jR0l,X&a^ORSTU_ij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h#j$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,X,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vS#d]#kT'f#f'jT#e]#kT'h#f'j&a_ORSTU_ij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#Y#_#b#h#j$V$i%V%Y%Z%^%`%a%b%d%h%s%{&P&W&^&h&u&y'o'u(w)O*]*a*f*u*x+e+l+},T,X,Y-[-a-i-s.b.s.t.u.w.{/O/Q/`/i/|0W0k1y2R2c2v2x2y3S3Z5O5^5h6[6x7j8O8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9vT#i_#jQ#l_R'q#j$naORSTUij{!Q!U!Z!^!k!s!w!y!|!}#O#P#Q#R#S#T#U#V#W#_#b$V$i%V%Y%Z%^%`%a%b%d%h%s%{&W&^&h&u&y'u(w)O*]*a*f+e+l+},T-[-a-i-s.b.s.t.u.w.{/O/Q/i/|0W1y2c2v2x2y3Z5O5^5h6x7j8O!k9t#Y#h&P'o*u*x,Y/`0k2R3S6[8`8b8e8f8g8h8i8j8k8l8m8n8o8p8q8t8}9O9Q9X9Y9]9^9v#RcOSUi{!Q!U!k!y#h$V%V%Y%Z%^%`%a%b%d%h%{&^'o)O*]*a*f+e,Y-[-i.b.s.t.u.w.{/O/Q0k1y2c2v2x2y5O5^t#v`!v#}$O$S'z'|'}(U(j(k+z-^0r1^9s9y9z!z&t!t#a#r#t&_(Y(})P)S)p)s+f,r,t-h-j.U.X.a.c0{1V1e1h1l1z2b2d3{4X4a4z5P6Z6g7b8w8y8{9R9T9V9Z9_Q(t$Qc0i8s8x8z8|9S9U9W9[9`t#s`!v#}$O$S'z'|'}(U(j(k+z-^0r1^9s9y9zS(a#u(dQ(u$RQ-O(b!z9h!t#a#r#t&_(Y(})P)S)p)s+f,r,t-h-j.U.X.a.c0{1V1e1h1l1z2b2d3{4X4a4z5P6Z6g7b8w8y8{9R9T9V9Z9_b9i8s8x8z8|9S9U9W9[9`Q9m9wR9n9xleOSi{!k$V%^%a%b%d*a*f.{/OQ(X#tQ*m%kQ*n%mR0z,r$S#w`!t!v#a#r#t#}$O$S&_'z'|'}(U(Y(j(k(})P)S)p)s+f+z,r,t-^-h-j.U.X.a.c0r0{1V1^1e1h1l1z2b2d3{4X4a4z5P6Z6g7b8s8w8x8y8z8{8|9R9S9T9U9V9W9Z9[9_9`9s9y9zQ)r$xQ.W)tQ1}.VR4l2OT(c#u(dS(c#u(dT2V._2WQ)T$`Q,}(aQ-o)UQ.f)}Q2g.gQ5R2hQ6^4pQ6k5SQ7Z6_Q7d6lQ7s7[Q8R7tQ8Y8SR8^8Zl'z#p&v(v,i,q-V-W0T1b3u4Z9g9q9r!^9R&r'a(Q(W+c+w,u-c-f.T.V/w0S0y0}1k1|2O2`3j3|4S4]4b4j4}5q5|6S6iZ9S0h3p5s6}7mn'|#p&v(v,g,i,q-V-W0T1b3u4Z9g9q9r!`9T&r'a(Q(W+c+w,u-c-f.T.V/w0Q0S0y0}1k1|2O2`3j3|4S4]4b4j4}5q5|6S6i]9U0h3p5s5t6}7mpdOSiw{!k$V%T%^%a%b%d*a*f.{/OQ%QvR*]%ZpdOSiw{!k$V%T%^%a%b%d*a*f.{/OR%QvQ)v$yR.S)oqdOSiw{!k$V%T%^%a%b%d*a*f.{/OQ.`){S2a.d.eW4y2^2_2`2eU6f4{4|4}U7`6e6h6iQ7w7aR8U7xQ%XwR*V%TR2n.mR6n5US$hn$mR-x)`Q%^xR*a%_R*g%eT.|*f/OQiOQ!kST$Yi!kQ!WQR%p!WQ![RU%t![%u*rQ%u!]R*r%vQ*}&QR/b*}Q+{&vR0U+{Q,O&xS0X,O0YR0Y,PQ+[&[R/m+[Q&Y!cQ*s%wT+W&Y*sQ+Q&TR/d+QQ&m!pQ+n&kU+r&m+n0PR0P+sQ'j#fR,Z'jQ#j_R'p#jQ#`YU'`#`*p8rQ*p8aR8r'mQ,l(RW0u,l0v3y5{U0v,m,n,oS3y0w0xR5{3z#o'x#p&r&v'a(Q(W(q(r(v+c+u+v+w,g,h,i,q,u-V-W-c-f.T.V/w0Q0R0S0T0h0y0}1b1k1|2O2`3j3n3o3p3u3|4S4Z4]4b4j4}5q5s5t5u5|6S6i6}7m9g9q9rQ,s(WU0|,s1O3}Q1O,uR3}0}Q(d#uR-P(dQ(m#yR-Y(mQ1f-cR4^1fQ)m$sR.R)mQ2Q.YS4n2Q6]R6]4oQ)x$zR.])xQ2W._R4s2WQ.l*SS2l.l5VR5V2nQ-u)]S1s-u4eR4e1tQ)a$hR-y)aQ/O*fR2|/OWhOSi!kQ%c{Q(y$VQ*`%^Q*b%aQ*c%bQ*e%dQ.y*aS.|*f/OR2{.{Q$XfQ%g!PQ%j!RQ%l!SQ%n!TQ)h$nQ)n$tQ*U%XQ*k%iS.o*V*YQ/V*jQ/W*mQ/X*nS/h+X2TQ1P,wQ1Q,xQ1W,}Q1v-|Q1{.TQ2f.fQ2p.qQ2z.zY3Y/j/k/p/t4uQ4O1RQ4Q1TQ4T1XQ4h1xQ4k1|Q5Q2gQ5W2o[5f3X3[3_3a3b6cQ5}4PQ6Q4UQ6X4fQ6j5RQ6o5XW6u5g5k5m5oQ7P6OQ7R6RQ7V6YQ7Y6^Q7c6kU7g6v6z6|Q7n7QQ7p7TQ7r7ZQ7y7dS7{7h7lQ8P7oQ8Q7sQ8V7|Q8X8RQ8[8WQ8]8YR8_8^Q$blQ&a!gU)W$c$d$eQ*w%}U+h&b&c&dQ,w(^S-q)X)YQ/_*yQ/g+XS/y+i+jQ1T,{Q1n-rQ3V/eS3]/l/pQ3g/zQ4U1YS5j3^3bQ6y5lR7k6{S#q`9sR)R$_U#y`$_9sR-X(lQ#p`S&r!t)SQ&v!vQ'a#aQ(Q#rQ(W#tQ(q#}Q(r$OQ(v$SQ+c&_Q+u8wQ+v8yQ+w8{Q,g'zQ,h'|Q,i'}Q,q(UQ,u(YQ-V(jQ-W(kd-c(}-h.a1h2b4a4z6Z6g7bQ-f)PQ.T)pQ.V)sQ/w+fQ0Q9RQ0R9TQ0S9VQ0T+zQ0h8sQ0y,rQ0},tQ1b-^Q1k-jQ1|.UQ2O.XQ2`.cQ3j9ZQ3n8xQ3o8zQ3p8|Q3u0rQ3|0{Q4S1VQ4Z1^Q4]1eQ4b1lQ4j1zQ4}2dQ5q9_Q5s9WQ5t9SQ5u9UQ5|3{Q6S4XQ6i5PQ6}9[Q7m9`Q9g9sQ9q9yR9r9zlfOSi{!k$V%^%a%b%d*a*f.{/OS!mU%`Q%i!QQ%o!UQ&}!yQ'n#hS*Y%V%YQ*^%ZQ*j%hQ*t%{Q+b&^Q,_'oQ-e)OQ.v*]Q/v+eQ0n,YQ1`-[Q1j-iQ2_.bQ2r.sQ2s.tQ2u.uQ2w.wQ3O/QQ3s0kQ4i1yQ4|2cQ5]2vQ5_2xQ5`2yQ6h5OR6q5^!vYOSUi{!Q!k!y$V%V%Y%Z%^%`%a%b%d%h%{&^)O*]*a*f+e-[-i.b.s.t.u.w.{/O/Q1y2c2v2x2y5O5^Q!]RQ!lTQ$ZjQ%r!ZQ%v!^Q&q!sQ&x!wQ'O!|Q'P!}Q'Q#OQ'R#PQ'S#QQ'T#RQ'U#SQ'V#TQ'W#UQ'X#VQ'Y#WQ'[#YQ'_#_Q'c#bW'm#h'o,Y0kQ)b$iQ*q%sS*z&P/`Q+T&WQ+k&hQ+y&uQ,P&yQ,S8`Q,U8bQ,a'uQ-_(wQ/Z*uQ/^*xQ/{+lQ0V+}Q0Z8eQ0[8fQ0]8gQ0^8hQ0_8iQ0`8jQ0a8kQ0b8lQ0c8mQ0d8nQ0e8oQ0f8pQ0g,TQ0j8tQ0o8qQ1c-aQ1o-sQ3U8}Q3X/iQ3h/|Q3k0WQ3l9OQ3q9QQ3r9XQ4o2RQ5d3SQ5g3ZQ5r9YQ5v9]Q5w9^Q6v5hQ7X6[Q7h6xQ7|7jQ8W8OQ8a!UR9l9vT!VQ!WR!_RR&R!`S%}!`*|S*y&O&VR/e+SR&w!vR&z!wT!qU$TS!pU$TU$spq*_S&k!o!rQ+p&lQ+s&oQ.Q)lS/}+o+qR3i0O[!bR!^$p&X)j+Vh!nUpq!o!r$T&l&o)l+o+q0OQ.x*_Q/[*vQ3R/UT9d&P)kT!dR$pS!cR$pS%w!^)jS*{&P)kQ+U&XR/f+VT&U!`$qQ#f]R's#kT'i#f'jR0m,XT(T#r(]R(Z#tQ-d(}Q1i-hQ2^.aQ4_1hQ4{2bQ6V4aQ6e4zQ7W6ZQ7a6gR7x7blgOSi{!k$V%^%a%b%d*a*f.{/OQ%WwR*U%TV$tpq*_R.Z)uR*T%RQ$lnR)g$mR)^$gT%[x%_T%]x%_T.}*f/O",
  nodeNames: "⚠ ArithOp ArithOp extends LineComment BlockComment Script ExportDeclaration export Star as VariableName from String ; default FunctionDeclaration async function VariableDefinition TypeParamList TypeDefinition ThisType this LiteralType ArithOp Number BooleanLiteral VoidType void TypeofType typeof MemberExpression . ?. PropertyName [ TemplateString null super RegExp ] ArrayExpression Spread , } { ObjectExpression Property async get set PropertyNameDefinition Block : NewExpression new TypeArgList CompareOp < ) ( ArgList UnaryExpression await yield delete LogicOp BitOp ParenthesizedExpression ClassExpression class extends ClassBody MethodDeclaration Privacy static abstract PropertyDeclaration readonly Optional TypeAnnotation Equals FunctionExpression ArrowFunction ParamList ParamList ArrayPattern ObjectPattern PatternProperty Privacy readonly Arrow MemberExpression BinaryExpression ArithOp ArithOp ArithOp ArithOp BitOp CompareOp in instanceof const CompareOp BitOp BitOp BitOp LogicOp LogicOp ConditionalExpression LogicOp LogicOp AssignmentExpression UpdateOp PostfixExpression CallExpression TaggedTemplatExpression DynamicImport import ImportMeta JSXElement JSXSelfCloseEndTag JSXStartTag JSXSelfClosingTag JSXIdentifier JSXNamespacedName JSXMemberExpression JSXSpreadAttribute JSXAttribute JSXAttributeValue JSXEscape JSXEndTag JSXOpenTag JSXFragmentTag JSXText JSXEscape JSXStartCloseTag JSXCloseTag PrefixCast ArrowFunction TypeParamList SequenceExpression KeyofType keyof UniqueType unique ImportType InferredType infer TypeName ParenthesizedType FunctionSignature ParamList NewSignature IndexedType TupleType Label ArrayType ReadonlyType ObjectType MethodType PropertyType IndexSignature CallSignature TypePredicate is NewSignature new UnionType LogicOp IntersectionType LogicOp ConditionalType ParameterizedType ClassDeclaration abstract implements type VariableDeclaration let var TypeAliasDeclaration InterfaceDeclaration interface EnumDeclaration enum EnumBody NamespaceDeclaration namespace module AmbientDeclaration declare GlobalDeclaration global ClassDeclaration ClassBody MethodDeclaration AmbientFunctionDeclaration ExportGroup VariableName VariableName ImportDeclaration ImportGroup ForStatement for ForSpec ForInSpec ForOfSpec of WhileStatement while WithStatement with DoStatement do IfStatement if else SwitchStatement switch SwitchBody CaseLabel case DefaultLabel TryStatement try catch finally ReturnStatement return ThrowStatement throw BreakStatement break ContinueStatement continue DebuggerStatement debugger LabeledStatement ExpressionStatement",
  maxTerm: 321,
  nodeProps: [
    [NodeProp.group, -26,7,14,16,53,175,179,182,183,185,188,191,202,204,210,212,214,216,219,225,229,231,233,235,237,239,240,"Statement",-30,11,13,23,26,27,37,38,39,40,42,47,55,63,69,70,83,84,93,94,110,113,115,116,117,118,120,121,139,140,142,"Expression",-21,22,24,28,30,143,145,147,148,150,151,152,154,155,156,158,159,160,169,171,173,174,"Type",-2,74,78,"ClassItem"],
    [NodeProp.closedBy, 36,"]",46,"}",61,")",123,"JSXSelfCloseEndTag JSXEndTag",137,"JSXEndTag"],
    [NodeProp.openedBy, 41,"[",45,"{",60,"(",122,"JSXStartTag",132,"JSXStartTag JSXStartCloseTag"]
  ],
  skippedNodes: [0,4,5],
  repeatNodeCount: 27,
  tokenData: "!?v~R!ZOX$tX^%S^p$tpq%Sqr&rrs'zst$ttu/wuv2Xvw2|wx3zxy:byz:rz{;S{|<S|}<g}!O<S!O!P<w!P!QAT!Q!R!-s!R![!/Y![!]!4x!]!^!5[!^!_!5l!_!`!6i!`!a!7a!a!b!9W!b!c$t!c!}/w!}#O!:i#O#P$t#P#Q!:y#Q#R!;Z#R#S/w#S#T!;n#T#o/w#o#p!<O#p#q!<T#q#r!<k#r#s!<}#s#y$t#y#z%S#z$f$t$f$g%S$g#BY/w#BY#BZ!=_#BZ$IS/w$IS$I_!=_$I_$I|/w$I|$JO!=_$JO$JT/w$JT$JU!=_$JU$KV/w$KV$KW!=_$KW&FU/w&FU&FV!=_&FV~/wW$yR#{WO!^$t!_#o$t#p~$t,T%Zg#{W&}+{OX$tX^%S^p$tpq%Sq!^$t!_#o$t#p#y$t#y#z%S#z$f$t$f$g%S$g#BY$t#BY#BZ%S#BZ$IS$t$IS$I_%S$I_$I|$t$I|$JO%S$JO$JT$t$JT$JU%S$JU$KV$t$KV$KW%S$KW&FU$t&FU&FV%S&FV~$t$T&yS#{W!e#{O!^$t!_!`'V!`#o$t#p~$t$O'^S#[#v#{WO!^$t!_!`'j!`#o$t#p~$t$O'qR#[#v#{WO!^$t!_#o$t#p~$t'u(RZ#{W]!ROY'zYZ(tZr'zrs*Rs!^'z!^!_*e!_#O'z#O#P,q#P#o'z#o#p*e#p~'z&r(yV#{WOr(trs)`s!^(t!^!_)p!_#o(t#o#p)p#p~(t&r)gR#v&j#{WO!^$t!_#o$t#p~$t&j)sROr)prs)|s~)p&j*RO#v&j'u*[R#v&j#{W]!RO!^$t!_#o$t#p~$t'm*jV]!ROY*eYZ)pZr*ers+Ps#O*e#O#P+W#P~*e'm+WO#v&j]!R'm+ZROr*ers+ds~*e'm+kU#v&j]!ROY+}Zr+}rs,fs#O+}#O#P,k#P~+}!R,SU]!ROY+}Zr+}rs,fs#O+}#O#P,k#P~+}!R,kO]!R!R,nPO~+}'u,vV#{WOr'zrs-]s!^'z!^!_*e!_#o'z#o#p*e#p~'z'u-fZ#v&j#{W]!ROY.XYZ$tZr.Xrs/Rs!^.X!^!_+}!_#O.X#O#P/c#P#o.X#o#p+}#p~.X!Z.`Z#{W]!ROY.XYZ$tZr.Xrs/Rs!^.X!^!_+}!_#O.X#O#P/c#P#o.X#o#p+}#p~.X!Z/YR#{W]!RO!^$t!_#o$t#p~$t!Z/hT#{WO!^.X!^!_+}!_#o.X#o#p+}#p~.X&i0S_#{W#qS'Yp'P%kOt$ttu/wu}$t}!O1R!O!Q$t!Q![/w![!^$t!_!c$t!c!}/w!}#R$t#R#S/w#S#T$t#T#o/w#p$g$t$g~/w[1Y_#{W#qSOt$ttu1Ru}$t}!O1R!O!Q$t!Q![1R![!^$t!_!c$t!c!}1R!}#R$t#R#S1R#S#T$t#T#o1R#p$g$t$g~1R$O2`S#T#v#{WO!^$t!_!`2l!`#o$t#p~$t$O2sR#{W#f#vO!^$t!_#o$t#p~$t%r3TU'm%j#{WOv$tvw3gw!^$t!_!`2l!`#o$t#p~$t$O3nS#{W#`#vO!^$t!_!`2l!`#o$t#p~$t'u4RZ#{W]!ROY3zYZ4tZw3zwx*Rx!^3z!^!_5l!_#O3z#O#P7l#P#o3z#o#p5l#p~3z&r4yV#{WOw4twx)`x!^4t!^!_5`!_#o4t#o#p5`#p~4t&j5cROw5`wx)|x~5`'m5qV]!ROY5lYZ5`Zw5lwx+Px#O5l#O#P6W#P~5l'm6ZROw5lwx6dx~5l'm6kU#v&j]!ROY6}Zw6}wx,fx#O6}#O#P7f#P~6}!R7SU]!ROY6}Zw6}wx,fx#O6}#O#P7f#P~6}!R7iPO~6}'u7qV#{WOw3zwx8Wx!^3z!^!_5l!_#o3z#o#p5l#p~3z'u8aZ#v&j#{W]!ROY9SYZ$tZw9Swx/Rx!^9S!^!_6}!_#O9S#O#P9|#P#o9S#o#p6}#p~9S!Z9ZZ#{W]!ROY9SYZ$tZw9Swx/Rx!^9S!^!_6}!_#O9S#O#P9|#P#o9S#o#p6}#p~9S!Z:RT#{WO!^9S!^!_6}!_#o9S#o#p6}#p~9S%V:iR!_$}#{WO!^$t!_#o$t#p~$tZ:yR!^R#{WO!^$t!_#o$t#p~$t%R;]U'Q!R#U#v#{WOz$tz{;o{!^$t!_!`2l!`#o$t#p~$t$O;vS#R#v#{WO!^$t!_!`2l!`#o$t#p~$t$u<ZSi$m#{WO!^$t!_!`2l!`#o$t#p~$t&i<nR|&a#{WO!^$t!_#o$t#p~$t&i=OVq%n#{WO!O$t!O!P=e!P!Q$t!Q![>Z![!^$t!_#o$t#p~$ty=jT#{WO!O$t!O!P=y!P!^$t!_#o$t#p~$ty>QR{q#{WO!^$t!_#o$t#p~$ty>bZ#{WjqO!Q$t!Q![>Z![!^$t!_!g$t!g!h?T!h#R$t#R#S>Z#S#X$t#X#Y?T#Y#o$t#p~$ty?YZ#{WO{$t{|?{|}$t}!O?{!O!Q$t!Q![@g![!^$t!_#R$t#R#S@g#S#o$t#p~$ty@QV#{WO!Q$t!Q![@g![!^$t!_#R$t#R#S@g#S#o$t#p~$ty@nV#{WjqO!Q$t!Q![@g![!^$t!_#R$t#R#S@g#S#o$t#p~$t,TA[`#{W#S#vOYB^YZ$tZzB^z{HT{!PB^!P!Q!*|!Q!^B^!^!_Da!_!`!+u!`!a!,t!a!}B^!}#OFY#O#PGi#P#oB^#o#pDa#p~B^XBe[#{WxPOYB^YZ$tZ!PB^!P!QCZ!Q!^B^!^!_Da!_!}B^!}#OFY#O#PGi#P#oB^#o#pDa#p~B^XCb_#{WxPO!^$t!_#Z$t#Z#[CZ#[#]$t#]#^CZ#^#a$t#a#bCZ#b#g$t#g#hCZ#h#i$t#i#jCZ#j#m$t#m#nCZ#n#o$t#p~$tPDfVxPOYDaZ!PDa!P!QD{!Q!}Da!}#OEd#O#PFP#P~DaPEQUxP#Z#[D{#]#^D{#a#bD{#g#hD{#i#jD{#m#nD{PEgTOYEdZ#OEd#O#PEv#P#QDa#Q~EdPEyQOYEdZ~EdPFSQOYDaZ~DaXF_Y#{WOYFYYZ$tZ!^FY!^!_Ed!_#OFY#O#PF}#P#QB^#Q#oFY#o#pEd#p~FYXGSV#{WOYFYYZ$tZ!^FY!^!_Ed!_#oFY#o#pEd#p~FYXGnV#{WOYB^YZ$tZ!^B^!^!_Da!_#oB^#o#pDa#p~B^,TH[^#{WxPOYHTYZIWZzHTz{Ki{!PHT!P!Q!)j!Q!^HT!^!_Mt!_!}HT!}#O!%e#O#P!(x#P#oHT#o#pMt#p~HT,TI]V#{WOzIWz{Ir{!^IW!^!_Jt!_#oIW#o#pJt#p~IW,TIwX#{WOzIWz{Ir{!PIW!P!QJd!Q!^IW!^!_Jt!_#oIW#o#pJt#p~IW,TJkR#{WT+{O!^$t!_#o$t#p~$t+{JwROzJtz{KQ{~Jt+{KTTOzJtz{KQ{!PJt!P!QKd!Q~Jt+{KiOT+{,TKp^#{WxPOYHTYZIWZzHTz{Ki{!PHT!P!QLl!Q!^HT!^!_Mt!_!}HT!}#O!%e#O#P!(x#P#oHT#o#pMt#p~HT,TLu_#{WT+{xPO!^$t!_#Z$t#Z#[CZ#[#]$t#]#^CZ#^#a$t#a#bCZ#b#g$t#g#hCZ#h#i$t#i#jCZ#j#m$t#m#nCZ#n#o$t#p~$t+{MyYxPOYMtYZJtZzMtz{Ni{!PMt!P!Q!$a!Q!}Mt!}#O! w#O#P!#}#P~Mt+{NnYxPOYMtYZJtZzMtz{Ni{!PMt!P!Q! ^!Q!}Mt!}#O! w#O#P!#}#P~Mt+{! eUT+{xP#Z#[D{#]#^D{#a#bD{#g#hD{#i#jD{#m#nD{+{! zWOY! wYZJtZz! wz{!!d{#O! w#O#P!#k#P#QMt#Q~! w+{!!gYOY! wYZJtZz! wz{!!d{!P! w!P!Q!#V!Q#O! w#O#P!#k#P#QMt#Q~! w+{!#[TT+{OYEdZ#OEd#O#PEv#P#QDa#Q~Ed+{!#nTOY! wYZJtZz! wz{!!d{~! w+{!$QTOYMtYZJtZzMtz{Ni{~Mt+{!$f_xPOzJtz{KQ{#ZJt#Z#[!$a#[#]Jt#]#^!$a#^#aJt#a#b!$a#b#gJt#g#h!$a#h#iJt#i#j!$a#j#mJt#m#n!$a#n~Jt,T!%j[#{WOY!%eYZIWZz!%ez{!&`{!^!%e!^!_! w!_#O!%e#O#P!(W#P#QHT#Q#o!%e#o#p! w#p~!%e,T!&e^#{WOY!%eYZIWZz!%ez{!&`{!P!%e!P!Q!'a!Q!^!%e!^!_! w!_#O!%e#O#P!(W#P#QHT#Q#o!%e#o#p! w#p~!%e,T!'hY#{WT+{OYFYYZ$tZ!^FY!^!_Ed!_#OFY#O#PF}#P#QB^#Q#oFY#o#pEd#p~FY,T!(]X#{WOY!%eYZIWZz!%ez{!&`{!^!%e!^!_! w!_#o!%e#o#p! w#p~!%e,T!(}X#{WOYHTYZIWZzHTz{Ki{!^HT!^!_Mt!_#oHT#o#pMt#p~HT,T!)qc#{WxPOzIWz{Ir{!^IW!^!_Jt!_#ZIW#Z#[!)j#[#]IW#]#^!)j#^#aIW#a#b!)j#b#gIW#g#h!)j#h#iIW#i#j!)j#j#mIW#m#n!)j#n#oIW#o#pJt#p~IW,T!+TV#{WS+{OY!*|YZ$tZ!^!*|!^!_!+j!_#o!*|#o#p!+j#p~!*|+{!+oQS+{OY!+jZ~!+j$P!,O[#{W#f#vxPOYB^YZ$tZ!PB^!P!QCZ!Q!^B^!^!_Da!_!}B^!}#OFY#O#PGi#P#oB^#o#pDa#p~B^]!,}[#nS#{WxPOYB^YZ$tZ!PB^!P!QCZ!Q!^B^!^!_Da!_!}B^!}#OFY#O#PGi#P#oB^#o#pDa#p~B^y!-zd#{WjqO!O$t!O!P>Z!P!Q$t!Q![!/Y![!^$t!_!g$t!g!h?T!h#R$t#R#S!/Y#S#U$t#U#V!0p#V#X$t#X#Y?T#Y#b$t#b#c!0`#c#d!2O#d#l$t#l#m!3W#m#o$t#p~$ty!/a_#{WjqO!O$t!O!P>Z!P!Q$t!Q![!/Y![!^$t!_!g$t!g!h?T!h#R$t#R#S!/Y#S#X$t#X#Y?T#Y#b$t#b#c!0`#c#o$t#p~$ty!0gR#{WjqO!^$t!_#o$t#p~$ty!0uW#{WO!Q$t!Q!R!1_!R!S!1_!S!^$t!_#R$t#R#S!1_#S#o$t#p~$ty!1fW#{WjqO!Q$t!Q!R!1_!R!S!1_!S!^$t!_#R$t#R#S!1_#S#o$t#p~$ty!2TV#{WO!Q$t!Q!Y!2j!Y!^$t!_#R$t#R#S!2j#S#o$t#p~$ty!2qV#{WjqO!Q$t!Q!Y!2j!Y!^$t!_#R$t#R#S!2j#S#o$t#p~$ty!3]Z#{WO!Q$t!Q![!4O![!^$t!_!c$t!c!i!4O!i#R$t#R#S!4O#S#T$t#T#Z!4O#Z#o$t#p~$ty!4VZ#{WjqO!Q$t!Q![!4O![!^$t!_!c$t!c!i!4O!i#R$t#R#S!4O#S#T$t#T#Z!4O#Z#o$t#p~$t%w!5RR!WV#{W#d%hO!^$t!_#o$t#p~$t!P!5cR^w#{WO!^$t!_#o$t#p~$t+c!5wR'Ud![%Y#o&s'qP!P!Q!6Q!^!_!6V!_!`!6dW!6VO#}W#v!6[P#V#v!_!`!6_#v!6dO#f#v#v!6iO#W#v%w!6pT!t%o#{WO!^$t!_!`'V!`!a!7P!a#o$t#p~$t$P!7WR#O#w#{WO!^$t!_#o$t#p~$t%w!7lT'T!s#W#v#xS#{WO!^$t!_!`!7{!`!a!8]!a#o$t#p~$t$O!8SR#W#v#{WO!^$t!_#o$t#p~$t$O!8dT#V#v#{WO!^$t!_!`2l!`!a!8s!a#o$t#p~$t$O!8zS#V#v#{WO!^$t!_!`2l!`#o$t#p~$t%w!9_V'e%o#{WO!O$t!O!P!9t!P!^$t!_!a$t!a!b!:U!b#o$t#p~$t$`!9{Rr$W#{WO!^$t!_#o$t#p~$t$O!:]S#{W#a#vO!^$t!_!`2l!`#o$t#p~$t&e!:pRt&]#{WO!^$t!_#o$t#p~$tZ!;QRyR#{WO!^$t!_#o$t#p~$t$O!;bS#^#v#{WO!^$t!_!`2l!`#o$t#p~$t$P!;uR#{W']#wO!^$t!_#o$t#p~$t~!<TO!O~%r!<[T'l%j#{WO!^$t!_!`2l!`#o$t#p#q!:U#q~$t$u!<tR}$k#{W'_QO!^$t!_#o$t#p~$tX!=UR!fP#{WO!^$t!_#o$t#p~$t,T!=lr#{W#qS'Yp'P%k&}+{OX$tX^%S^p$tpq%Sqt$ttu/wu}$t}!O1R!O!Q$t!Q![/w![!^$t!_!c$t!c!}/w!}#R$t#R#S/w#S#T$t#T#o/w#p#y$t#y#z%S#z$f$t$f$g%S$g#BY/w#BY#BZ!=_#BZ$IS/w$IS$I_!=_$I_$I|/w$I|$JO!=_$JO$JT/w$JT$JU!=_$JU$KV/w$KV$KW!=_$KW&FU/w&FU&FV!=_&FV~/w",
  tokenizers: [noSemicolon, incdecToken, template, 0, 1, 2, 3, 4, 5, 6, 7, 8, insertSemicolon],
  topRules: {"Script":[0,6]},
  dialects: {jsx: 11074, ts: 11076},
  dynamicPrecedences: {"140":1,"167":1},
  specialized: [{term: 277, get: (value, stack) => (tsExtends(value, stack) << 1) | 1},{term: 277, get: value => spec_identifier[value] || -1},{term: 286, get: value => spec_word[value] || -1},{term: 58, get: value => spec_LessThan[value] || -1}],
  tokenPrec: 11096
});

/// A collection of JavaScript-related
/// [snippets](#autocomplete.snippet).
const snippets = [
    snippetCompletion("function ${name}(${params}) {\n\t${}\n}", {
        label: "function",
        detail: "definition",
        type: "keyword"
    }),
    snippetCompletion("for (let ${index} = 0; ${index} < ${bound}; ${index}++) {\n\t${}\n}", {
        label: "for",
        detail: "loop",
        type: "keyword"
    }),
    snippetCompletion("for (let ${name} of ${collection}) {\n\t${}\n}", {
        label: "for",
        detail: "of loop",
        type: "keyword"
    }),
    snippetCompletion("try {\n\t${}\n} catch (${error}) {\n\t${}\n}", {
        label: "try",
        detail: "block",
        type: "keyword"
    }),
    snippetCompletion("class ${name} {\n\tconstructor(${params}) {\n\t\t${}\n\t}\n}", {
        label: "class",
        detail: "definition",
        type: "keyword"
    }),
    snippetCompletion("import {${names}} from \"${module}\"\n${}", {
        label: "import",
        detail: "named",
        type: "keyword"
    }),
    snippetCompletion("import ${name} from \"${module}\"\n${}", {
        label: "import",
        detail: "default",
        type: "keyword"
    })
];

/// A language provider based on the [Lezer JavaScript
/// parser](https://github.com/lezer-parser/javascript), extended with
/// highlighting and indentation information.
const javascriptLanguage = LezerLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                IfStatement: continuedIndent({ except: /^\s*({|else\b)/ }),
                TryStatement: continuedIndent({ except: /^\s*({|catch|finally)\b/ }),
                LabeledStatement: flatIndent,
                SwitchBody: context => {
                    let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
                    return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
                },
                Block: delimitedIndent({ closing: "}" }),
                ArrowFunction: cx => cx.baseIndent + cx.unit,
                "TemplateString BlockComment": () => -1,
                "Statement Property": continuedIndent({ except: /^{/ }),
                JSXElement(context) {
                    let closed = /^\s*<\//.test(context.textAfter);
                    return context.lineIndent(context.state.doc.lineAt(context.node.from)) + (closed ? 0 : context.unit);
                },
                JSXEscape(context) {
                    let closed = /\s*\}/.test(context.textAfter);
                    return context.lineIndent(context.state.doc.lineAt(context.node.from)) + (closed ? 0 : context.unit);
                },
                "JSXOpenTag JSXSelfClosingTag"(context) {
                    return context.column(context.node.from) + context.unit;
                }
            }),
            foldNodeProp.add({
                "Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression": foldInside,
                BlockComment(tree) { return { from: tree.from + 2, to: tree.to - 2 }; }
            }),
            styleTags({
                "get set async static": tags.modifier,
                "for while do if else switch try catch finally return throw break continue default case": tags.controlKeyword,
                "in of await yield void typeof delete instanceof": tags.operatorKeyword,
                "export import let var const function class extends": tags.definitionKeyword,
                "with debugger from as new": tags.keyword,
                TemplateString: tags.special(tags.string),
                Super: tags.atom,
                BooleanLiteral: tags.bool,
                this: tags.self,
                null: tags.null,
                Star: tags.modifier,
                VariableName: tags.variableName,
                "CallExpression/VariableName": tags.function(tags.variableName),
                VariableDefinition: tags.definition(tags.variableName),
                Label: tags.labelName,
                PropertyName: tags.propertyName,
                "CallExpression/MemberExpression/PropertyName": tags.function(tags.propertyName),
                "FunctionDeclaration/VariableDefinition": tags.function(tags.definition(tags.variableName)),
                "ClassDeclaration/VariableDefinition": tags.definition(tags.className),
                PropertyNameDefinition: tags.definition(tags.propertyName),
                UpdateOp: tags.updateOperator,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                Number: tags.number,
                String: tags.string,
                ArithOp: tags.arithmeticOperator,
                LogicOp: tags.logicOperator,
                BitOp: tags.bitwiseOperator,
                CompareOp: tags.compareOperator,
                RegExp: tags.regexp,
                Equals: tags.definitionOperator,
                "Arrow : Spread": tags.punctuation,
                "( )": tags.paren,
                "[ ]": tags.squareBracket,
                "{ }": tags.brace,
                ".": tags.derefOperator,
                ", ;": tags.separator,
                TypeName: tags.typeName,
                TypeDefinition: tags.definition(tags.typeName),
                "type enum interface implements namespace module declare": tags.definitionKeyword,
                "abstract global privacy readonly": tags.modifier,
                "is keyof unique infer": tags.operatorKeyword,
                JSXAttributeValue: tags.string,
                JSXText: tags.content,
                "JSXStartTag JSXStartCloseTag JSXSelfCloseEndTag JSXEndTag": tags.angleBracket,
                "JSXIdentifier JSXNameSpacedName": tags.tagName,
                "JSXAttribute/JSXIdentifier JSXAttribute/JSXNameSpacedName": tags.propertyName
            })
        ]
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
        wordChars: "$"
    }
});
/// A language provider for TypeScript.
const typescriptLanguage = javascriptLanguage.configure({ dialect: "ts" });
/// Language provider for JSX.
const jsxLanguage = javascriptLanguage.configure({ dialect: "jsx" });
/// Language provider for JSX + TypeScript.
const tsxLanguage = javascriptLanguage.configure({ dialect: "jsx ts" });
/// JavaScript support. Includes [snippet](#lang-javascript.snippets)
/// completion.
function javascript(config = {}) {
    let lang = config.jsx ? (config.typescript ? tsxLanguage : jsxLanguage)
        : config.typescript ? typescriptLanguage : javascriptLanguage;
    return new LanguageSupport(lang, javascriptLanguage.data.of({
        autocomplete: ifNotIn(["LineComment", "BlockComment", "String"], completeFromList(snippets))
    }));
}

export { javascript };
