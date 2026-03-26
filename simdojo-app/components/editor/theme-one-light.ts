import { EditorView } from "@codemirror/view"
import { Extension } from "@codemirror/state"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"

// Based on Atom One Light — https://github.com/atom/one-light-syntax

const mono1 = "#383a42",       // default text
  mono2 = "#686b77",           // slightly muted
  mono3 = "#a0a1a7",           // comments, line numbers
  hue1 = "#0184bc",            // cyan — constants, attributes
  hue2 = "#4078f2",            // blue — functions
  hue3 = "#a626a4",            // purple — keywords
  hue4 = "#50a14f",            // green — strings
  hue5 = "#e45649",            // red — names, tags
  hue52 = "#ca1243",           // dark red — special
  hue6 = "#986801",            // orange — numbers
  hue62 = "#c18401",           // light orange — operators

  background = "#fafafa",
  darkBackground = "#f0f0f0",
  highlightBackground = "#e8e8e8",
  tooltipBackground = "#f0f0f0",
  selection = "#d3e1f2",
  cursor = "#526fff"

export const color = {
  mono1, mono2, mono3,
  hue1, hue2, hue3, hue4, hue5, hue52, hue6, hue62,
  background, darkBackground, highlightBackground,
  tooltipBackground, selection, cursor,
}

export const oneLightTheme = EditorView.theme({
  "&": {
    color: mono1,
    backgroundColor: background,
  },

  ".cm-content": {
    caretColor: cursor,
  },

  ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: selection,
  },

  ".cm-panels": { backgroundColor: darkBackground, color: mono1 },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid #e0e0e0" },
  ".cm-panels.cm-panels-bottom": { borderTop: "1px solid #e0e0e0" },

  ".cm-searchMatch": {
    backgroundColor: "#ffeead",
    outline: "1px solid #e6c76d",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#ffd96b44",
  },

  ".cm-activeLine": { backgroundColor: "#eaeaeb80" },
  ".cm-selectionMatch": { backgroundColor: "#c9daf866" },

  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "#c9daf8",
    outline: "1px solid #a8bfe0",
  },

  ".cm-gutters": {
    backgroundColor: background,
    color: mono3,
    border: "none",
  },

  ".cm-activeLineGutter": {
    backgroundColor: highlightBackground,
  },

  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: mono3,
  },

  ".cm-tooltip": {
    border: "1px solid #e0e0e0",
    backgroundColor: tooltipBackground,
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: tooltipBackground,
    borderBottomColor: tooltipBackground,
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: selection,
      color: mono1,
    },
  },
}, { dark: false })

export const oneLightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword,
    color: hue3 },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: hue5 },
  { tag: [t.function(t.variableName), t.labelName],
    color: hue2 },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: hue6 },
  { tag: [t.definition(t.name), t.separator],
    color: mono1 },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
    color: hue6 },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: hue1 },
  { tag: [t.meta, t.comment],
    color: mono3 },
  { tag: t.strong,
    fontWeight: "bold" },
  { tag: t.emphasis,
    fontStyle: "italic" },
  { tag: t.strikethrough,
    textDecoration: "line-through" },
  { tag: t.link,
    color: mono3,
    textDecoration: "underline" },
  { tag: t.heading,
    fontWeight: "bold",
    color: hue5 },
  { tag: [t.atom, t.bool, t.special(t.variableName)],
    color: hue6 },
  { tag: [t.processingInstruction, t.string, t.inserted],
    color: hue4 },
  { tag: t.invalid,
    color: hue52 },
])

/// Extension to enable the One Light theme (both the editor theme and
/// the highlight style).
export const oneLight: Extension = [oneLightTheme, syntaxHighlighting(oneLightHighlightStyle)]
