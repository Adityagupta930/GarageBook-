'use client';

interface Props {
  input: string;
  setInput: (v: string) => void;
  onConfirm: () => void;
}

export default function OperatorModal({ input, setInput, onConfirm }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>👤</div>
        <h3 style={{ marginBottom: '6px' }}>Aap kaun hain?</h3>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          Apna naam daalo — bill aur sale record mein save hoga
        </p>
        <input
          className="gb-input w-full"
          placeholder="Operator naam (e.g. Ramesh, Suresh...)"
          value={input}
          autoFocus
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && onConfirm()}
          style={{ marginBottom: '14px', textAlign: 'center', fontSize: '15px' }}
        />
        <button
          className="btn w-full"
          onClick={onConfirm}
          disabled={!input.trim()}>
          ✅ Shuru Karo
        </button>
      </div>
    </div>
  );
}
