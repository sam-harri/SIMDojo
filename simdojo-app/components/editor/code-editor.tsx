"use client"

import { useRef, useEffect, useCallback } from "react"
import { EditorState, Compartment } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { indentOnInput, indentUnit, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view"
import { cpp } from "@codemirror/lang-cpp"
import { oneDark } from "@codemirror/theme-one-dark"
import { oneLight } from "./theme-one-light"
import { useTheme } from "@/components/theme/theme-provider"

interface CodeEditorProps {
  initialCode: string
  onChange: (code: string) => void
}

const themeCompartment = new Compartment()

const editorBaseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
})

export function CodeEditor({ initialCode, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const { theme } = useTheme()

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const createEditor = useCallback(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          {
            key: "Tab",
            run: (view) => {
              view.dispatch(view.state.replaceSelection("    "))
              return true
            },
          },
        ]),
        cpp(),
        themeCompartment.of(theme === "dark" ? oneDark : oneLight),
        editorBaseTheme,
        updateListener,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // initialCode intentionally captured once

  useEffect(() => {
    createEditor()
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [createEditor])

  // Reconfigure theme when it changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(
          theme === "dark" ? oneDark : oneLight
        ),
      })
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden border border-border"
    />
  )
}
