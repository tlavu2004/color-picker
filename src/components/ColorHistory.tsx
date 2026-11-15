type ColorHistoryProps = {
  colors: string[];
  selected: string | null;
  disabled: boolean;
  onSelect: (color: string) => void;
  onClear: () => void;
};

export function ColorHistory({ colors, selected, disabled, onSelect, onClear }: ColorHistoryProps) {
  return (
    <section className="history" aria-labelledby="history-title">
      <div className="history-heading">
        <h3 id="history-title">Recent colors</h3>
        <button className="clear-button" disabled={disabled || colors.length === 0} onClick={onClear}>Clear history</button>
      </div>
      {colors.length === 0 ? <p className="empty-history">Pick a color to start your history.</p> : (
        <div className="history-grid" aria-label="Recent colors">
          {colors.map(color => (
            <button
              key={color}
              className="history-swatch"
              style={{ backgroundColor: color }}
              aria-label={`Select ${color}`}
              aria-pressed={selected === color}
              title={color}
              disabled={disabled}
              onClick={() => onSelect(color)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
