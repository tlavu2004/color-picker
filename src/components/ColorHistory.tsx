import { messages } from '../i18n/messages';
type ColorHistoryProps = {
  text?: Record<keyof typeof messages.en, string>;
  colors: string[];
  selected: string | null;
  disabled: boolean;
  onSelect: (color: string) => void;
  onClear: () => void;
};

export function ColorHistory({ colors, selected, disabled, onSelect, onClear, text = messages.en }: ColorHistoryProps) {
  return (
    <section className="history" aria-labelledby="history-title">
      <div className="history-heading">
        <h3 id="history-title">{text.recent}</h3>
        <button className="clear-button" disabled={disabled || colors.length === 0} onClick={onClear}>{text.clear}</button>
      </div>
      {colors.length === 0 ? <p className="empty-history">{text.emptyHistory}</p> : (
        <div className="history-grid" aria-label={text.recent}>
          {colors.map(color => (
            <button
              key={color}
              className="history-swatch"
              style={{ backgroundColor: color }}
              aria-label={`${text.selectColor} ${color}`}
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
