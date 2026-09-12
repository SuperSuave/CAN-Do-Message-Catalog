import React, { useState } from 'react';
import { Command, Catalog } from '../types/catalog';
import { PayloadByteVisualizer } from './PayloadByteVisualizer';
import { validateCommand } from '../utils/canValidator';
import { exportCommandToDbcSnippet } from '../utils/dbcConverter';
import { formatCommandAsCanCapture } from '../utils/canCaptureParser';
import {
  X,
  Copy,
  Check,
  Edit3,
  Car,
  AlertTriangle,
  Info,
  Layers,
  Code2,
  Cpu,
  Trash2,
  Github,
  User,
  ExternalLink,
  FileCode,
  FileText
} from 'lucide-react';

interface CommandDetailModalProps {
  command: Command | null;
  catalog: Catalog;
  onClose: () => void;
  onEdit: (cmd: Command) => void;
  onDelete?: (cmdId: string) => void;
}

export const CommandDetailModal: React.FC<CommandDetailModalProps> = ({
  command,
  catalog,
  onClose,
  onEdit,
  onDelete
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedDbc, setCopiedDbc] = useState(false);
  const [copiedCapture, setCopiedCapture] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'cancapture' | 'raw_json' | 'dbc'>('overview');

  if (!command) return null;

  const dbcSnippet = exportCommandToDbcSnippet(command);

  const issues = validateCommand(command, catalog, false);
  const hasErrors = issues.some(i => i.type === 'error');
  const hasWarnings = issues.some(i => i.type === 'warning');

  // Check vehicle compatibility
  const compatibleVehicles = catalog.vehicles.filter(v => {
    if (command.requires_feature && !v.features.includes(command.requires_feature)) {
      return false;
    }
    if (command.tags && command.tags.length > 0) {
      const matchesAnyTag = command.tags.some(
        tag =>
          v.id.includes(tag) ||
          v.family.includes(tag) ||
          v.model.toLowerCase().replace(/\s+/g, '_').includes(tag)
      );
      if (!matchesAnyTag) return false;
    }
    return true;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(command, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-[16px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-heading)] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--border-color)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {command.roles.map(r => (
                <span
                  key={r}
                  className={`can-do-ha-pill ${
                    r === 'trigger' ? 'trig-pill' : r === 'condition' ? 'cond-pill' : 'act-pill'
                  }`}
                >
                  {r}
                </span>
              ))}
              {(command.state_can_id || command.can_id) && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-[var(--input-bg)] text-cyan-400 border border-[var(--border-color)]">
                  {command.action_can_id ? `Rx: ${command.state_can_id || command.can_id}` : (command.state_can_id || command.can_id)} • Bus {command.bus ?? 0}
                </span>
              )}
              {command.action_can_id && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-[var(--input-bg)] text-emerald-400 border border-emerald-900/50">
                  Tx: {command.action_can_id} • Bus {command.action_bus ?? command.bus ?? 0}
                </span>
              )}
              {command.type && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-[6px] bg-[var(--input-bg)] text-slate-300 border border-[var(--border-color)]">
                  Type: {command.type}
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {command.name}
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1 flex items-center gap-1.5 flex-wrap">
              <span>ID: <span className="text-slate-200">{command.id}</span></span>
              <span>•</span>
              <span>Category: <span className="text-cyan-400 font-sans">{command.category}</span></span>
              {command.subcategory && (
                <>
                  <span>•</span>
                  <span>Subsystem: <span className="text-cyan-300 font-sans font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">{command.subcategory}</span></span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-white rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 border-b border-[var(--border-color)] bg-[var(--md-sys-color-surface-container-lowest)] text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-[var(--md-sys-color-primary)] text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 inline-block mr-1.5" />
            CAN Parameters
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 px-3 font-medium border-b-2 transition ${
              activeTab === 'vehicles'
                ? 'border-[var(--md-sys-color-primary)] text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4 inline-block mr-1.5" />
            Vehicle Compatibility ({compatibleVehicles.length}/{catalog.vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('cancapture')}
            className={`py-3 px-3 font-medium border-b-2 transition ${
              activeTab === 'cancapture'
                ? 'border-[var(--md-sys-color-primary)] text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-1.5" />
            Capture Note (D1–D8)
          </button>
          <button
            onClick={() => setActiveTab('raw_json')}
            className={`py-3 px-3 font-medium border-b-2 transition ${
              activeTab === 'raw_json'
                ? 'border-[var(--md-sys-color-primary)] text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 inline-block mr-1.5" />
            Raw JSON
          </button>
          <button
            onClick={() => setActiveTab('dbc')}
            className={`py-3 px-3 font-medium border-b-2 transition ${
              activeTab === 'dbc'
                ? 'border-[var(--md-sys-color-primary)] text-cyan-400 font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 inline-block mr-1.5" />
            Vector DBC Signal
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* Validation Banner if any issues */}
          {(hasErrors || hasWarnings) && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
                hasErrors
                  ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold">
                  {hasErrors ? 'Validation Errors' : 'Validation Warnings'}
                </div>
                {issues.map((iss, i) => (
                  <div key={i}>
                    • {iss.field ? `[${iss.field}] ` : ''}
                    {iss.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Community Contributor Credit */}
              {command.contributor && (command.contributor.name || command.contributor.github) && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Discovered & Contributed By
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {command.contributor.name && (
                          <span className="text-sm font-bold text-white">
                            {command.contributor.name}
                          </span>
                        )}
                        {command.contributor.github && (
                          <a
                            href={`https://github.com/${command.contributor.github.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-700/60 hover:border-cyan-500 transition"
                          >
                            <span>@{command.contributor.github.replace(/^@/, '')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {command.contributor.notes && (
                    <div className="text-xs text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/90 max-w-sm">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Verification & Vehicle Info:
                      </span>
                      <span>{command.contributor.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payloads section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  CAN Payload & Byte Transition
                </h4>
                <PayloadByteVisualizer
                  fromPayload={command.from_payload}
                  toPayload={command.to_payload}
                  matchPayload={command.match_payload}
                />
              </div>

              {/* Options Breakdown if present */}
              {command.options && command.options.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Available Options ({command.options.length})
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Option Label</th>
                          <th className="p-3 font-mono">Transition (From → To)</th>
                          <th className="p-3 font-mono">Match Pattern</th>
                          <th className="p-3">Popup Toast</th>
                          <th className="p-3 text-right">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {command.options.map((opt, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition">
                            <td className="p-3 font-sans font-medium text-white flex items-center gap-1.5 flex-wrap">
                              <span>{opt.label}</span>
                              {opt.requires_feature && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                                  req: {opt.requires_feature}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-cyan-300">
                              {opt.steps && opt.steps.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {opt.steps.map((st, sidx) => (
                                      <span
                                        key={sidx}
                                        className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]"
                                      >
                                        {st.payload}{' '}
                                        {st.repeat ? (
                                          <span className="text-amber-400 font-bold">x{st.repeat}</span>
                                        ) : null}
                                      </span>
                                    ))}
                                  </div>
                                  {opt.from_payload && (
                                    <span className="text-[10px] text-slate-400 font-sans">
                                      Trigger: <span className="font-mono text-amber-300">{opt.from_payload}</span>
                                    </span>
                                  )}
                                </div>
                              ) : opt.from_payload || opt.to_payload ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="text-amber-300">{opt.from_payload || '*'}</span>
                                  <span className="text-slate-500 font-sans">→</span>
                                  <span className="text-emerald-300">{opt.to_payload || '*'}</span>
                                  {opt.repeat && opt.repeat > 1 && (
                                    <span className="text-amber-400 font-bold ml-1">x{opt.repeat}</span>
                                  )}
                                </span>
                              ) : opt.payload ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="text-cyan-300">{opt.payload}</span>
                                  {opt.repeat && opt.repeat > 1 && (
                                    <span className="text-amber-400 font-bold ml-1">x{opt.repeat}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300">
                              {opt.match_payload ? (
                                <span className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                  {opt.match_payload}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="p-3 font-sans text-slate-400">
                              {opt.popup || '-'}
                            </td>
                            <td className="p-3 text-right">
                              {opt.default ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-700">
                                  Default
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sequence Steps if present */}
              {command.steps && command.steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sequence Steps ({command.steps.length} Frames, Delay: {command.delay_ms ?? 0}ms)
                  </h4>
                  <div className="space-y-2">
                    {command.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-cyan-300">{step.payload}</span>
                        </div>
                        <span className="text-slate-400">
                          Repeat: <strong className="text-white">{step.repeat ?? 1}x</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Parameters & Properties
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="text-slate-400 mb-1">CAN Bus</div>
                    <div className="font-mono text-white font-semibold">
                      Bus {command.bus ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="text-slate-400 mb-1">Delay (ms)</div>
                    <div className="font-mono text-white font-semibold">
                      {command.delay_ms !== undefined ? `${command.delay_ms} ms` : 'Immediate'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                    <div className="text-slate-400 mb-1">Required Feature</div>
                    <div className="font-semibold text-emerald-300">
                      {command.requires_feature || 'None (Universal)'}
                    </div>
                  </div>
                  {command.popup_message && (
                    <div className="p-3 col-span-2 rounded-lg bg-slate-950/50 border border-slate-800">
                      <div className="text-slate-400 mb-1">Popup OSD Message</div>
                      <div className="font-mono text-amber-300">{command.popup_message}</div>
                    </div>
                  )}
                  {command.expression && (
                    <div className="p-3 col-span-2 rounded-lg bg-slate-950/50 border border-slate-800">
                      <div className="text-slate-400 mb-1">Logical Expression</div>
                      <div className="font-mono text-cyan-300">{command.expression}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  Required Feature:{' '}
                  <strong className="text-emerald-300">
                    {command.requires_feature || 'None (Works on all Gen5W models)'}
                  </strong>
                </div>
                <div>
                  Compatible: <strong className="text-white">{compatibleVehicles.length}</strong> /{' '}
                  {catalog.vehicles.length} Trims
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalog.vehicles.map(v => {
                  const isCompatible = compatibleVehicles.some(cv => cv.id === v.id);
                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        isCompatible
                          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                          : 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {v.make} {v.model}
                          <span className="text-[11px] font-normal text-slate-400">
                            ({v.trim})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {v.id} • Region: {v.region}
                        </div>
                      </div>
                      <div>
                        {isCompatible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            Supported
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-500">
                            Missing Feature
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'cancapture' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>
                    Community <strong className="text-white font-mono">!cancapture</strong> note format (D1–D8 notation)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const note = formatCommandAsCanCapture(command);
                    navigator.clipboard.writeText(note);
                    setCopiedCapture(true);
                    setTimeout(() => setCopiedCapture(false), 2000);
                  }}
                  className="dash-outline-btn px-2.5 py-1 text-[11px] inline-flex items-center gap-1"
                >
                  {copiedCapture ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied Note</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Note</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {formatCommandAsCanCapture(command)}
              </pre>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold">Discord & Forum Sharing:</div>
                <p>
                  • Formatted with D1–D8 byte references, multi-packet steps, and CAN IDs ready to paste directly into community notes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'raw_json' && (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {JSON.stringify(command, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'dbc' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>
                    Standard Vector CAN DBC syntax for CAN ID{' '}
                    <strong className="text-white font-mono">{command.state_can_id || command.can_id}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dbcSnippet);
                    setCopiedDbc(true);
                    setTimeout(() => setCopiedDbc(false), 2000);
                  }}
                  className="dash-outline-btn px-2.5 py-1 text-[11px] inline-flex items-center gap-1"
                >
                  {copiedDbc ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied DBC</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy DBC</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {dbcSnippet}
              </pre>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold">DBC Signal Mapping:</div>
                <p>
                  • CAN message defined as <code className="text-cyan-300 font-mono">BO_ {parseInt(command.state_can_id || command.can_id || '0', 16)}</code>
                </p>
                <p>
                  • Bit position & length calculated from payload mask <code className="text-cyan-300 font-mono">{command.payload_mask}</code>
                </p>
                {command.options && command.options.length > 0 && (
                  <p>
                    • Discrete states exported as DBC Value Table <code className="text-cyan-300 font-mono">VAL_</code>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 px-6 border-t border-[var(--border-color)] bg-[var(--md-sys-color-surface-container-low)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="dash-outline-btn inline-flex items-center gap-2 text-xs py-2 px-3.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Snippet
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy JSON
                </>
              )}
            </button>

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-700/80 px-2.5 py-1 rounded-lg">
                  <span className="text-xs font-semibold text-rose-200">Delete command?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(command.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs transition"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="dash-outline-btn inline-flex items-center gap-1.5 text-xs py-2 px-3 text-slate-400 hover:text-rose-400 hover:border-rose-800/60"
                  title="Delete this command"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="dash-outline-btn px-4 py-2 text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(command);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-[var(--md-sys-color-primary)] hover:opacity-90 transition shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Command
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
