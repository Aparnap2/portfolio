const styles = {
  Implemented: {
    borderColor: 'rgba(52, 211, 153, 0.4)',
    color: '#34d399',
    label: 'Implemented in project',
  },
  Demonstration: {
    borderColor: 'rgba(139, 156, 255, 0.4)',
    color: '#8b9cff',
    label: 'Demonstration',
  },
  Conceptual: {
    borderColor: 'rgba(245, 181, 68, 0.4)',
    color: '#f5b544',
    label: 'Conceptual',
  },
};

export default function HonestLabel({ kind, note }) {
  const s = styles[kind] || styles.Demonstration;
  return (
    <span
      tabIndex={0}
      role="note"
      aria-label={`${s.label}. ${note || ''}`}
      title={note}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: `1px solid ${s.borderColor}`,
        color: s.color,
        background: 'rgba(255,255,255,0.02)',
        maxWidth: '100%',
      }}
    >
      {s.label}
    </span>
  );
}
