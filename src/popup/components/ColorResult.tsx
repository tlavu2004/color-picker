type ColorResultProps = {
  color: string;
  copying: boolean;
  copied: boolean;
  onCopy: () => void;
};

export function ColorResult({ color, copying, copied, onCopy }: ColorResultProps) {
  return (
    <div className="color-result">
      <div className="color-box" style={{ backgroundColor: color }} />
      <span>{color}</span>
      <button className="copy-button" onClick={onCopy} disabled={copying || copied} aria-live="polite">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
