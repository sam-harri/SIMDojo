"use client"

import { useRef, useEffect, useCallback } from "react"
import { EditorState, Compartment } from "@codemirror/state"
import { EditorView, keymap, hoverTooltip } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { indentOnInput, indentUnit, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language"
import { closeBrackets, closeBracketsKeymap, autocompletion, acceptCompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view"
import { cpp } from "@codemirror/lang-cpp"
import { oneDark } from "@codemirror/theme-one-dark"
import { oneLight } from "./theme-one-light"
import { useTheme } from "@/components/theme/theme-provider"
import intrinsicsData from "./avx2_intrinsics.json.json"

type Intrinsic = {
  name: string
  sig: string
  detail: string
  description: string
  operation: string
  instruction: string
  category: string
}

const intrinsics = intrinsicsData as Intrinsic[]

const intrinsicMap = new Map(intrinsics.map((i) => [i.name, i]))

const completionOptions = intrinsics.map((i) => ({
  label: i.name,
  type: "function",
  detail: i.detail,
  info: () => {
    const dom = document.createElement("div")
    dom.className = "cm-intrinsic-info"
    dom.innerHTML = `<code class="cm-intrinsic-sig">${i.sig}</code><p class="cm-intrinsic-desc">${i.description}</p><pre class="cm-intrinsic-op">${i.operation}</pre>`
    return dom
  },
}))

function simdCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[_\w]+/)
  if (!word || (word.from === word.to && !context.explicit)) return null
  return { from: word.from, options: completionOptions }
}

const simdHover = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos)
  const text = line.text
  const offset = pos - line.from
  let start = offset
  let end = offset
  while (start > 0 && /[_\w]/.test(text[start - 1])) start--
  while (end < text.length && /[_\w]/.test(text[end])) end++
  const word = text.slice(start, end)
  const intrinsic = intrinsicMap.get(word)
  if (!intrinsic) return null
  return {
    pos: line.from + start,
    end: line.from + end,
    above: true,
    create() {
      const dom = document.createElement("div")
      dom.className = "cm-intrinsic-tooltip"
      dom.innerHTML = `<code class="cm-intrinsic-sig">${intrinsic.sig}</code><p class="cm-intrinsic-desc">${intrinsic.description}</p><pre class="cm-intrinsic-op">${intrinsic.operation}</pre>`
      return { dom }
    },
  }
})

interface CodeEditorProps {
  initialCode: string
  onChange: (code: string) => void
  acEnabled?: boolean
}

const themeCompartment = new Compartment()
const autocompleteCompartment = new Compartment()

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

export function CodeEditor({ initialCode, onChange, acEnabled = true }: CodeEditorProps) {
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
          { key: "Tab", run: acceptCompletion },
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
        autocompleteCompartment.of(autocompletion({ override: [simdCompletions] })),
        simdHover,
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

  // Reconfigure autocomplete when toggled
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: autocompleteCompartment.reconfigure(
          acEnabled ? autocompletion({ override: [simdCompletions] }) : []
        ),
      })
    }
  }, [acEnabled])

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden" />
  )
}
