"use client";

import {
  BookOpenText,
  BrainCircuit,
  Database,
  FileText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { SearchResult } from "./search-engine";

type SearchLayerState = {
  phase: "idle" | "loading" | "ready" | "error";
  error?: string;
};

type SearchComboboxProps = {
  query: string;
  results: SearchResult[];
  inputRef: RefObject<HTMLInputElement | null>;
  isPending: boolean;
  fullTextState: SearchLayerState;
  onQueryChange: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  onLoadFullText: () => void;
};

const resultKindLabels = {
  instrument: "LEGAL SOURCE",
  provision: "ARTICLE",
  concept: "CORE CONCEPT",
} as const;

function ResultKindIcon({ kind }: { kind: SearchResult["document"]["type"] }) {
  if (kind === "instrument") return <BookOpenText aria-hidden="true" />;
  if (kind === "provision") return <FileText aria-hidden="true" />;
  return <BrainCircuit aria-hidden="true" />;
}

export function SearchCombobox({
  query,
  results,
  inputRef,
  isPending,
  fullTextState,
  onQueryChange,
  onSelect,
  onLoadFullText,
}: SearchComboboxProps) {
  const generatedId = useId().replaceAll(":", "");
  const listboxId = `search-suggestions-${generatedId}`;
  const statusId = `search-status-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const hasQuery = query.trim().length > 0;
  const popupVisible = open && hasQuery;
  const effectiveActiveIndex =
    popupVisible && results.length
      ? activeIndex >= 0 && activeIndex < results.length
        ? activeIndex
        : 0
      : -1;

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    if (!popupVisible || effectiveActiveIndex < 0) return;
    document
      .getElementById(`${listboxId}-option-${effectiveActiveIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [effectiveActiveIndex, listboxId, popupVisible]);

  function selectResult(result: SearchResult) {
    setOpen(false);
    setActiveIndex(-1);
    onSelect(result);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Escape") {
      if (popupVisible) {
        event.preventDefault();
        setOpen(false);
      } else if (query) {
        event.preventDefault();
        onQueryChange("");
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "Tab") {
      // Keep the popup mounted while focus moves to the explicit full-text
      // action. The root blur handler closes it only after focus leaves.
      return;
    }

    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((effectiveActiveIndex + 1 + results.length) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        effectiveActiveIndex <= 0 ? results.length - 1 : effectiveActiveIndex - 1,
      );
    } else if (event.key === "Home" && popupVisible) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && popupVisible) {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (
      event.key === "Enter" &&
      popupVisible &&
      effectiveActiveIndex >= 0
    ) {
      event.preventDefault();
      selectResult(results[effectiveActiveIndex]);
    }
  }

  const statusMessage = isPending
    ? "Updating search suggestions."
    : results.length
      ? `${results.length} ranked suggestions. Use the up and down arrow keys to review them.`
      : hasQuery
        ? "No immediate title, concept, or loaded-text match."
        : "Type to search the regulatory atlas.";

  return (
    <div
      className="global-search-shell"
      role="search"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <label className="global-search" htmlFor={`global-search-${generatedId}`}>
        <span className="sr-only">
          Search legal sources, provisions, and core concepts
        </span>
        <Search aria-hidden="true" />
        <input
          id={`global-search-${generatedId}`}
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={popupVisible}
          aria-controls={listboxId}
          aria-activedescendant={
            popupVisible && effectiveActiveIndex >= 0
              ? `${listboxId}-option-${effectiveActiveIndex}`
              : undefined
          }
          aria-describedby={statusId}
          aria-keyshortcuts="Meta+K Control+K"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => setOpen(hasQuery)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(Boolean(event.target.value.trim()));
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search laws, articles, concepts…"
        />
        {query ? (
          <button
            type="button"
            className="search-clear-button"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <kbd>⌘K</kbd>
        )}
      </label>

      <span id={statusId} className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>

      {popupVisible && (
        <section className="search-suggestions" aria-label="Search suggestions">
          <header>
            <span>HYBRID SEARCH</span>
            <small>
              {isPending ? "RANKING…" : `${results.length} SUGGESTIONS`}
            </small>
          </header>
          <div id={listboxId} role="listbox" aria-label="Regulatory search results">
            {results.map((result, index) => (
              <button
                type="button"
                role="option"
                tabIndex={-1}
                id={`${listboxId}-option-${index}`}
                key={`${result.document.type}-${result.document.id}`}
                aria-selected={index === effectiveActiveIndex}
                className="search-suggestion"
                data-result-kind={result.document.type}
                onMouseMove={() => setActiveIndex(index)}
                onPointerDown={(event) => {
                  event.preventDefault();
                  selectResult(result);
                }}
              >
                <span className="search-suggestion-icon">
                  <ResultKindIcon kind={result.document.type} />
                </span>
                <span className="search-suggestion-copy">
                  <span className="search-suggestion-heading">
                    <strong>{result.document.label}</strong>
                    <em>{resultKindLabels[result.document.type]}</em>
                  </span>
                  <small>
                    {result.document.title ??
                      result.document.description ??
                      result.document.summary ??
                      result.document.jurisdiction}
                  </small>
                  <span className="search-suggestion-reason">
                    <Sparkles aria-hidden="true" />
                    {result.reason}
                  </span>
                </span>
                <span className="search-suggestion-enter" aria-hidden="true">
                  ↵
                </span>
              </button>
            ))}
            {!results.length && (
              <p className="search-suggestion-empty">
                {isPending
                  ? "Updating ranked suggestions…"
                  : "No immediate match. Check the spelling or load complete legal text for a deeper search."}
              </p>
            )}
          </div>
          <footer>
            {fullTextState.phase === "idle" && (
              <button
                type="button"
                className="search-full-text-action"
                onPointerDown={(event) => event.preventDefault()}
                onClick={onLoadFullText}
              >
                <Database aria-hidden="true" />
                SEARCH COMPLETE LEGAL TEXT
              </button>
            )}
            {fullTextState.phase === "loading" && (
              <span className="search-layer-status" role="status">
                <Database aria-hidden="true" />
                LOADING FULL-TEXT LAYER…
              </span>
            )}
            {fullTextState.phase === "ready" && (
              <span className="search-layer-status">
                <Database aria-hidden="true" />
                COMPLETE TEXT INDEXED
              </span>
            )}
            {fullTextState.phase === "error" && (
              <button
                type="button"
                className="search-full-text-action"
                onPointerDown={(event) => event.preventDefault()}
                onClick={onLoadFullText}
              >
                <Database aria-hidden="true" />
                RETRY FULL-TEXT LAYER
              </button>
            )}
            <span className="search-privacy-note">
              LOCAL RANKING · NO QUERY UPLOAD
            </span>
          </footer>
        </section>
      )}
    </div>
  );
}
