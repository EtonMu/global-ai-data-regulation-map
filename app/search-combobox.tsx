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
  Fragment,
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
  instrument: "Laws and frameworks",
  provision: "Articles and provisions",
  concept: "Core concepts",
} as const;

const starterSearches = [
  {
    query: "GDPR Article 22",
    description: "Open a specific provision",
  },
  {
    query: "China cross-border data",
    description: "Search across jurisdictions and topics",
  },
  {
    query: "data minimization",
    description: "Start from a core concept",
  },
] as const;

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
  const popupVisible = open;
  const displayResults = hasQuery
    ? (["instrument", "provision", "concept"] as const).flatMap((kind) =>
        results.filter((result) => result.document.type === kind),
      )
    : [];
  const effectiveActiveIndex =
    popupVisible && displayResults.length
      ? activeIndex >= 0 && activeIndex < displayResults.length
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

    if (!displayResults.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        (effectiveActiveIndex + 1 + displayResults.length) %
          displayResults.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        effectiveActiveIndex <= 0
          ? displayResults.length - 1
          : effectiveActiveIndex - 1,
      );
    } else if (event.key === "Home" && popupVisible) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && popupVisible) {
      event.preventDefault();
      setActiveIndex(displayResults.length - 1);
    } else if (
      event.key === "Enter" &&
      popupVisible &&
      effectiveActiveIndex >= 0
    ) {
      event.preventDefault();
      selectResult(displayResults[effectiveActiveIndex]);
    }
  }

  const statusMessage = isPending
    ? "Updating search suggestions."
    : displayResults.length
      ? `${displayResults.length} ranked suggestions. Use the up and down arrow keys to review them.`
      : hasQuery
        ? "No immediate title, concept, or loaded-text match."
        : "Choose an example or type to search the regulatory atlas.";

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
          onFocus={() => setOpen(true)}
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
            <span>{hasQuery ? "SEARCH RESULTS" : "START HERE"}</span>
            <small>
              {hasQuery
                ? isPending
                  ? "UPDATING…"
                  : `${displayResults.length} SUGGESTIONS`
                : "EXAMPLE SEARCHES"}
            </small>
          </header>
          <div id={listboxId} role="listbox" aria-label="Regulatory search results">
            {!hasQuery && (
              <div className="search-starter-list" role="presentation">
                {starterSearches.map((starter) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    key={starter.query}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onQueryChange(starter.query);
                      setOpen(true);
                      setActiveIndex(-1);
                      inputRef.current?.focus();
                    }}
                  >
                    <Search aria-hidden="true" />
                    <span>
                      <strong>{starter.query}</strong>
                      <small>{starter.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {hasQuery &&
              (["instrument", "provision", "concept"] as const).map((kind) => {
                const groupedResults = displayResults.filter(
                  (result) => result.document.type === kind,
                );
                if (!groupedResults.length) return null;
                return (
                  <div className="search-result-group" role="presentation" key={kind}>
                    <span className="search-result-group-label">
                      {resultKindLabels[kind]}
                    </span>
                    {groupedResults.map((result) => {
                      const index = displayResults.indexOf(result);
                      return (
                        <Fragment key={`${result.document.type}-${result.document.id}`}>
                          <button
                            type="button"
                            role="option"
                            tabIndex={-1}
                            id={`${listboxId}-option-${index}`}
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
                        </Fragment>
                      );
                    })}
                  </div>
                );
              })}
            {hasQuery && !displayResults.length && (
              <p className="search-suggestion-empty">
                {isPending
                  ? "Updating ranked suggestions…"
                  : "No immediate match. Check the spelling or load complete legal text for a deeper search."}
              </p>
            )}
          </div>
          {hasQuery && (
            <footer>
              {fullTextState.phase === "idle" && (
                <button
                  type="button"
                  className="search-full-text-action"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={onLoadFullText}
                >
                  <Database aria-hidden="true" />
                  INCLUDE FULL ARTICLE TEXT
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
                SEARCH RUNS ON THIS DEVICE
              </span>
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
