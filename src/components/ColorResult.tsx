type ColorResultProps = {
  color: string;
  copying: boolean;
  copied: boolean;
  disabled?: boolean;
  onCopy: () => void;
};

export function ColorResult({ color, copying, copied, disabled = false, onCopy }: ColorResultProps) {
  return (
    <div className="color-result">
      <div className="color-box" style={{ backgroundColor: color }} />
      <span>{color}</span>
      <button className="copy-button" onClick={onCopy} disabled={disabled || copying || copied} aria-live="polite">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
