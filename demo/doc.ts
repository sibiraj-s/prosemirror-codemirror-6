export const emptyDoc = {
  type: "doc",
  content: [],
};

export default {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: {
        level: 2,
        align: null,
      },
      content: [
        {
          type: "text",
          text: "The code block is a code editor",
        },
      ],
    },
    {
      type: "paragraph",
      attrs: {
        align: null,
      },
      content: [
        {
          type: "text",
          text: "This editor has been wired up to render code blocks as instances of the CodeMirror",
        },
        {
          type: "text",
          text: " code editor, which provides syntax highlighting",
        },
        {
          type: "text",
          text: ", auto-indentation, and similar.",
        },
      ],
    },
    {
      type: "code_mirror",
      content: [
        {
          type: "text",
          text: "function max(a, b) {\n  return a > b ? a : b\n}",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is editable text. You can focus it and start typing.",
        },
      ],
    },
  ],
};
