import RegulationExplorerClient from "./regulation-explorer-client";

// Keep the document request on the edge Worker so security response headers
// cannot be bypassed by the static-asset fast path. The heavy explorer remains
// a client-only lazy chunk, so the server render stays intentionally small.
export const dynamic = "force-dynamic";

export default function Home() {
  return <RegulationExplorerClient />;
}
