/** A-P5B-10: why a locked protocol is never edited in place. */
export function ProtocolNote() {
  return (
    <p role="note" className="text-sm text-fg-muted">
      Candidates keep the protocol version they were selected under. Editing a locked protocol
      creates a new version; the earlier version is never changed.
    </p>
  );
}
