import type { Settings, JlptLevel, Scenario, Register, CorrectionMode, MascotType } from '../types';
import { MASCOTS } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (s: Settings) => void;
  disabled: boolean;
  mascot: MascotType;
  onMascotChange: (m: MascotType) => void;
}

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface ScenarioCard { value: Scenario; label: string; desc: string; emoji: string; bg: string; }
const SCENARIOS: ScenarioCard[] = [
  { value: 'restaurant',       label: 'Restaurant',       desc: 'Ordering food & drinks',         emoji: '🍱', bg: '#FFE7D1' },
  { value: 'cafe',             label: 'Pastel Cafe',       desc: 'Casual chatting & sweets',       emoji: '🍵', bg: '#FFDEE9' },
  { value: 'station',          label: 'Train Station',     desc: 'Asking directions & tickets',    emoji: '🚄', bg: '#D4F0F0' },
  { value: 'shopping',         label: 'Anime Shop',        desc: 'Asking prices & options',        emoji: '🛍️', bg: '#E8F5E9' },
  { value: 'self_intro_work',  label: 'Intro at Work',     desc: 'Japanese office self-intro',     emoji: '👔', bg: '#E9E4F0' },
  { value: 'asking_directions','label': 'Street Directions','desc': 'Navigate around Japan',       emoji: '🗺️', bg: '#FFF9F5' },
  { value: 'job_interview',    label: 'Job Interview',     desc: 'Formal business Japanese',       emoji: '📋', bg: '#F3E8FF' },
];

const REGISTERS: { value: Register; label: string }[] = [
  { value: 'polite',   label: 'Polite (です / ます)' },
  { value: 'casual',   label: 'Casual (ため口)' },
  { value: 'business', label: 'Formal Keigo (敬語)' },
];

const CORRECTION_MODES: { value: CorrectionMode; label: string }[] = [
  { value: 'immediate',      label: 'Immediate ✨' },
  { value: 'end_of_session', label: 'End of Session 📝' },
];

const MASCOT_LIST: { type: MascotType }[] = [
  { type: 'kitsune' },
  { type: 'shiba' },
  { type: 'neko' },
];

export default function SettingsPanel({ settings, onChange, disabled, mascot, onMascotChange }: SettingsPanelProps) {
  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="settings-panel">

      {/* ── Mascot ── */}
      <div className="settings-section">
        <div className="settings-section-title">🐾 AI Mascot</div>
        <div className="mascot-grid">
          {MASCOT_LIST.map(({ type }) => {
            const m = MASCOTS[type];
            return (
              <button
                key={type}
                className={`mascot-card ${mascot === type ? 'active' : ''}`}
                onClick={() => onMascotChange(type)}
                aria-pressed={mascot === type}
              >
                <span className="mascot-emoji">{m.emoji}</span>
                <span className="mascot-name">{m.name.split('-')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── JLPT Level ── */}
      <div className="settings-section">
        <div className="settings-section-title">JLPT Level</div>
        <div className="jlpt-pills">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`jlpt-pill ${settings.level === l ? 'active' : ''}`}
              onClick={() => !disabled && set('level', l)}
              disabled={disabled}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scenarios ── */}
      <div className="settings-section flex-1">
        <div className="settings-section-title">Practice Scenarios</div>
        {disabled && (
          <div className="settings-locked-notice">🔒 Settings locked during a session</div>
        )}
        <div className="scenario-list">
          {SCENARIOS.map((s) => (
            <button
              key={s.value}
              className={`scenario-card ${settings.scenario === s.value ? 'active' : ''}`}
              onClick={() => !disabled && set('scenario', s.value)}
              disabled={disabled}
            >
              <span className="scenario-icon" style={{ background: s.bg }}>{s.emoji}</span>
              <span className="scenario-text">
                <span className="scenario-label">{s.label}</span>
                <span className="scenario-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Register & Correction ── */}
      <div className="settings-section">
        <div className="field">
          <label className="field-label" htmlFor="setting-register">Speech Register</label>
          <select
            id="setting-register"
            value={settings.register}
            onChange={(e) => set('register', e.target.value as Register)}
            disabled={disabled}
          >
            {REGISTERS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label className="field-label" htmlFor="setting-correction-mode">Corrections Mode</label>
          <select
            id="setting-correction-mode"
            value={settings.correctionMode}
            onChange={(e) => set('correctionMode', e.target.value as CorrectionMode)}
            disabled={disabled}
          >
            {CORRECTION_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}
