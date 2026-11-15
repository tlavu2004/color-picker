import { createRoot } from 'react-dom/client';
import { SnapshotPicker } from './SnapshotPicker';
import './snapshot.css';

// Session data is consumed once; do not double-load it through StrictMode.
createRoot(document.getElementById('root')!).render(<SnapshotPicker />);
