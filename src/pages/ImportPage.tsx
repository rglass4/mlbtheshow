import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { parseGameHtml } from '../parser/htmlParser';
import type { ParsedGameData } from '../types/stats';
import { saveImportedGame } from '../lib/api';

const initialPlayers = ['',''];

export const ImportPage = () => {
  const [players, setPlayers] = useState<string[]>(initialPlayers);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ParsedGameData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const canAddThirdPlayer = players.length < 3;

  const normalizedPlayers = useMemo(() => players.map((value) => value.trim()).filter(Boolean), [players]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const html = await file.text();
      const parsed = parseGameHtml(html, { coopPlayers: normalizedPlayers, filename: file.name });
      setPreview(parsed);
      setFileName(file.name);
      setError(null);
    } catch (reason) {
      setPreview(null);
      setError(reason instanceof Error ? reason.message : 'Failed to parse file.');
    }
  };

  const savePreview = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      await saveImportedGame({ ...preview, metadata: { ...preview.metadata, coopPlayers: normalizedPlayers } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to save import.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <Card title="Import saved box score HTML" subtitle="Parse in-browser, preview extracted fields, then commit to Supabase.">
        <div className="import-grid">
          <label>
            <span>Co-op player 1</span>
            <input value={players[0] ?? ''} onChange={(event) => setPlayers((current) => [event.target.value, current[1] ?? '', current[2] ?? ''].slice(0, current.length))} placeholder="Primary username" />
          </label>
          <label>
            <span>Co-op player 2</span>
            <input value={players[1] ?? ''} onChange={(event) => setPlayers((current) => [current[0] ?? '', event.target.value, current[2] ?? ''].slice(0, current.length))} placeholder="Partner username" />
          </label>
          {players[2] !== undefined ? (
            <label>
              <span>Co-op player 3</span>
              <input value={players[2] ?? ''} onChange={(event) => setPlayers((current) => [current[0] ?? '', current[1] ?? '', event.target.value])} placeholder="Optional third player" />
            </label>
          ) : null}
          {canAddThirdPlayer ? (
            <button type="button" className="button secondary" onClick={() => setPlayers((current) => [...current, ''])}>
              Add third player
            </button>
          ) : null}
          <label className="file-drop">
            <span>Saved MLB The Show HTML file</span>
            <input type="file" accept=".html,text/html" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
          </label>
        </div>
        <p className="muted">Tip: once you can paste a raw sample HTML file, the parser selectors can be tightened further.</p>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {preview ? (
        <div className="dashboard-grid two-up">
          <Card title="Parsed preview" subtitle={fileName || preview.metadata.rawHtmlFilename || 'Unsaved upload'} action={<button className="button primary" onClick={() => void savePreview()} disabled={saving}>{saving ? 'Saving…' : 'Save to Supabase'}</button>}>
            <dl className="detail-grid">
              <div><dt>Game ID</dt><dd>{preview.metadata.id}</dd></div>
              <div><dt>Date</dt><dd>{new Date(preview.metadata.playedAt).toLocaleString()}</dd></div>
              <div><dt>Users</dt><dd>{preview.metadata.userUsername} vs {preview.metadata.opponentUsername}</dd></div>
              <div><dt>Teams</dt><dd>{preview.metadata.userTeam} vs {preview.metadata.opponentTeam}</dd></div>
              <div><dt>Score</dt><dd>{preview.metadata.userScore}-{preview.metadata.opponentScore}</dd></div>
              <div><dt>Difficulty</dt><dd>{preview.metadata.hittingDifficulty ?? '--'} / {preview.metadata.pitchingDifficulty ?? '--'}</dd></div>
              <div><dt>Stadium</dt><dd>{preview.metadata.stadium ?? '--'}</dd></div>
              <div><dt>Perfect-perfect</dt><dd>{preview.perfectPerfectEvents.length}</dd></div>
            </dl>
            {preview.notes.length ? (
              <div className="note-list">
                {preview.notes.map((note) => (
                  <span key={note} className="pill info">{note}</span>
                ))}
              </div>
            ) : null}
          </Card>
          <Card title="Extracted counts" subtitle="Use this to validate parser coverage before save.">
            <div className="stats-grid tight">
              <div className="stat-card"><span>Inning lines</span><strong>{preview.inningLines.length}</strong></div>
              <div className="stat-card"><span>Batting rows</span><strong>{preview.battingLines.length}</strong></div>
              <div className="stat-card"><span>Pitching rows</span><strong>{preview.pitchingLines.length}</strong></div>
              <div className="stat-card"><span>Play events</span><strong>{preview.playEvents.length}</strong></div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="empty-state">Upload a saved HTML file to preview parsed metadata, tables, and play-by-play.</div>
      )}
    </div>
  );
};
