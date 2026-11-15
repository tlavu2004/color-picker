type ColorResultProps = {
  color: string;
  copying: boolean;
  copied: boolean;
  onCopy: () => void;
  copyLabel?: string;
  copiedLabel?: string;
};

export function ColorResult({ color, copying, copied, onCopy, copyLabel = 'Copy', copiedLabel = 'Copied!' }: ColorResultProps) {
  return (
    <div className="color-result">
      <div className="color-box" style={{ backgroundColor: color }} />
      <span>{color}</span>
      <button className="copy-button" onClick={onCopy} disabled={copying || copied} aria-live="polite">
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
