export const emptyDoc = {
  type: "doc",
  content: [],
};

export default {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is editable text. You can focus it and start typing.",
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
