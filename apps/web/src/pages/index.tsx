import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addPendingIntake,
  loadPendingIntakes,
  removePendingIntake,
  type PendingIntake
} from '../lib/offlineStore';

const scopeOptions = [
  'Interiors demolition + build-back',
  'Guest rooms',
  'Corridors',
  'Lobby / public areas',
  'F&B outlets',
  'Meeting / ballroom',
  'Back-of-house',
  'MEP upgrades',
  'Fire/life-safety remediation',
  'Windows / envelope',
  'Millwork / casegoods / fabrication',
  'FF&E procurement / logistics',
  'Signage / wayfinding',
  'Site / parking / exterior scopes'
];

const Home: NextPage = () => {
  const [scopeBuckets, setScopeBuckets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingIntake[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [completion, setCompletion] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState({
    property_name: '',
    city: '',
    state: '',
    brand_flag: '',
    owner_entity: '',
    management_company: '',
    contact_name: '',
    contact_role: '',
    contact_email: '',
    contact_phone: '',
    renovation_type: '',
    occupancy_status: '',
    phasing: '',
    quiet_hours: '',
    notes: ''
  });
  const formRef = useRef<HTMLFormElement | null>(null);

  const requiredFields = useMemo(
    () => [
      { name: 'property_name', label: 'Property / Project name' },
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State' },
      { name: 'brand_flag', label: 'Brand / Flag' },
      { name: 'owner_entity', label: 'Owner entity' },
      { name: 'contact_name', label: 'Contact name' },
      { name: 'contact_role', label: 'Contact role' },
      { name: 'renovation_type', label: 'Renovation type' },
      { name: 'occupancy_status', label: 'Occupancy status' }
    ],
    []
  );

  useEffect(() => {
    const updateOnline = () => {
      setIsOnline(navigator.onLine);
      loadPendingIntakes().then((items) => {
        setPendingCount(items.length);
        setPendingItems(items);
      });
    };
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    const urls = attachments.map((file) => URL.createObjectURL(file));
    setAttachmentPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const compute = () => {
      const data = new FormData(form);
      const total = requiredFields.length;
      const done = requiredFields.reduce((count, field) => {
        const value = data.get(field.name)?.toString().trim() ?? '';
        return count + (value ? 1 : 0);
      }, 0);
      const missing = requiredFields
        .filter((field) => !(data.get(field.name)?.toString().trim() ?? ''))
        .map((field) => field.label);
      setCompletion({ done, total });
      setMissingRequired(missing);
      setSnapshot({
        property_name: data.get('property_name')?.toString().trim() ?? '',
        city: data.get('city')?.toString().trim() ?? '',
        state: data.get('state')?.toString().trim() ?? '',
        brand_flag: data.get('brand_flag')?.toString().trim() ?? '',
        owner_entity: data.get('owner_entity')?.toString().trim() ?? '',
        management_company: data.get('management_company')?.toString().trim() ?? '',
        contact_name: data.get('contact_name')?.toString().trim() ?? '',
        contact_role: data.get('contact_role')?.toString().trim() ?? '',
        contact_email: data.get('contact_email')?.toString().trim() ?? '',
        contact_phone: data.get('contact_phone')?.toString().trim() ?? '',
        renovation_type: data.get('renovation_type')?.toString().trim() ?? '',
        occupancy_status: data.get('occupancy_status')?.toString().trim() ?? '',
        phasing: data.get('phasing')?.toString().trim() ?? '',
        quiet_hours: data.get('quiet_hours')?.toString().trim() ?? '',
        notes: data.get('notes')?.toString().trim() ?? ''
      });
    };

    compute();
    form.addEventListener('input', compute, { passive: true });
    form.addEventListener('change', compute, { passive: true });
    return () => {
      form.removeEventListener('input', compute);
      form.removeEventListener('change', compute);
    };
  }, [requiredFields, scopeBuckets]);

  const toggleScope = (scope: string) => {
    setScopeBuckets((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope]
    );
  };

  const jumpTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (el instanceof HTMLDetailsElement) el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetForm = () => {
    formRef.current?.reset();
    setScopeBuckets([]);
    setAttachments([]);
    setIntakeId(null);
    setPdfUrl(null);
    setStatusMessage('');
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setPdfUrl(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const opportunity = {
      property_name: formData.get('property_name')?.toString() ?? '',
      city: formData.get('city')?.toString() ?? '',
      state: formData.get('state')?.toString() ?? '',
      brand_flag: formData.get('brand_flag')?.toString() ?? '',
      owner_entity: formData.get('owner_entity')?.toString() ?? '',
      management_company: formData.get('management_company')?.toString() ?? ''
    };

    const intake = {
      operator: {
        name: formData.get('operator_name')?.toString() ?? '',
        email: formData.get('operator_email')?.toString() ?? ''
      },
      contact: {
        name: formData.get('contact_name')?.toString() ?? '',
        role: formData.get('contact_role')?.toString() ?? '',
        email: formData.get('contact_email')?.toString() ?? '',
        phone: formData.get('contact_phone')?.toString() ?? ''
      },
      scope: {
        renovation_type: formData.get('renovation_type')?.toString() ?? '',
        occupancy_status: formData.get('occupancy_status')?.toString() ?? '',
        scope_buckets: scopeBuckets
      },
      constraints: {
        phasing: formData.get('phasing')?.toString() ?? '',
        quiet_hours: formData.get('quiet_hours')?.toString() ?? ''
      },
      procurement: {
        casegoods: formData.get('casegoods')?.toString() ?? '',
        ffe: formData.get('ffe')?.toString() ?? '',
        mep: formData.get('mep')?.toString() ?? '',
        owner_items: formData.get('owner_items')?.toString() ?? '',
        notes: {
          casegoods: formData.get('casegoods_notes')?.toString() ?? '',
          ffe: formData.get('ffe_notes')?.toString() ?? '',
          mep: formData.get('mep_notes')?.toString() ?? '',
          owner_items: formData.get('owner_items_notes')?.toString() ?? ''
        }
      },
      risks: {
        key_risks: formData.get('key_risks')?.toString() ?? '',
        open_questions: formData.get('open_questions')?.toString() ?? ''
      },
      next_steps: {
        follow_up: formData.get('follow_up')?.toString() ?? '',
        step_one: formData.get('step_one')?.toString() ?? '',
        step_two: formData.get('step_two')?.toString() ?? '',
        step_three: formData.get('step_three')?.toString() ?? ''
      },
      notes: formData.get('notes')?.toString() ?? ''
    };

    const localId = crypto.randomUUID();
    const payload = { opportunity, intake, captured_at: new Date().toISOString() };

    if (!isOnline) {
      const attachmentData = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          type: file.type,
          dataUrl: await fileToDataUrl(file)
        }))
      );
      await addPendingIntake({ intakeId: localId, payload, attachments: attachmentData, createdAt: payload.captured_at });
      const nextPending = await loadPendingIntakes();
      setPendingCount(nextPending.length);
      setPendingItems(nextPending);
      setIntakeId(localId);
      setStatusMessage('Saved offline. Will sync when online.');
      setSaving(false);
      return;
    }

    const response = await fetch('/api/intakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity, intake, intakeId: localId })
    });

    const body = await response.json();
    if (!response.ok) {
      setStatusMessage(body.error ?? 'Failed to save intake');
      setSaving(false);
      return;
    }

    setIntakeId(body.intakeId);
    setStatusMessage('Intake saved. Ready to generate document.');

    if (attachments.length) {
      await uploadAttachments(body.intakeId);
    }

    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!intakeId) return;
    setGenerating(true);
    setStatusMessage('Generating PDF...');

    const response = await fetch('/api/documents/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intakeId,
        templateId: 'lead-call-intake-worksheet',
        wrClass: 'worksheet'
      })
    });

    const body = await response.json();
    if (!response.ok) {
      setStatusMessage(body.error ?? 'Document generation failed');
    } else {
      setStatusMessage('Document generated.');
      setPdfUrl(body.pdfUrl ?? null);
    }

    setGenerating(false);
  };

  async function uploadAttachments(currentIntakeId: string) {
    const attachmentData = await Promise.all(
      attachments.map(async (file) => ({
        name: file.name,
        type: file.type,
        dataUrl: await fileToDataUrl(file)
      }))
    );

    const response = await fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId: currentIntakeId, attachments: attachmentData })
    });

    const body = await response.json();
    if (!response.ok) {
      setStatusMessage(body.error ?? 'Attachment upload failed');
    } else if (body.urls?.length) {
      setStatusMessage('Attachments uploaded.');
    }
  }

  async function syncPending() {
    if (!isOnline) return;
    const pending = await loadPendingIntakes();
    if (!pending.length) {
      setStatusMessage('No pending offline drafts.');
      return;
    }

    for (const item of pending) {
      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item.payload, intakeId: item.intakeId })
      });
      const body = await response.json();
      if (response.ok) {
        if (item.attachments?.length) {
          await fetch('/api/attachments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intakeId: item.intakeId, attachments: item.attachments })
          });
        }
        await removePendingIntake(item.intakeId);
      }
    }

    const remaining = await loadPendingIntakes();
    setPendingCount(remaining.length);
    setPendingItems(remaining);
    setStatusMessage('Offline drafts synced.');
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  return (
    <>
      <Head>
        <title>Walden Ridge Ops Intake</title>
        <meta name="description" content="Lead call intake for Walden Ridge field teams" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap"
        />
      </Head>
      <main className="page page-ops">
        <header className="site-header">
          <div className="logo-block">
            <img src="/wr-logo.png" alt="Walden Ridge" className="logo-image" />
          </div>
          <div className="ops-title-block">
            <div className="ops-title-row">
              <h1 className="ops-title">Ops Intake</h1>
              <span className="ops-tag">Internal</span>
            </div>
            <div className="ops-title-rule" />
            <p className="ops-subtitle">Phase 0 · Lead Call Intake — capture the call and generate the WR worksheet PDF.</p>
          </div>
        </header>
        <div className="card">
          <header className="header">
            <div className="topbar" role="status" aria-live="polite">
              <span className={isOnline ? 'badge badge-good' : 'badge badge-danger'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="badge">Pending drafts: {pendingCount}</span>
              {attachments.length > 0 && <span className="badge">Photos: {attachments.length}</span>}
              <span className="badge">Required: {completion.done}/{completion.total}</span>
              {intakeId && <span className="badge">Draft ID: {intakeId.slice(0, 8)}</span>}
              <div className="topbar-actions">
                <select
                  aria-label="Jump to section"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    jumpTo(value);
                    e.target.value = '';
                  }}
                  style={{ height: 36, borderRadius: 12, border: '1px solid var(--wr-border)', padding: '0 10px' }}
                  defaultValue=""
                >
                  <option value="" disabled>Jump to…</option>
                  <option value="sec-opportunity">Opportunity</option>
                  <option value="sec-contact">Contact</option>
                  <option value="sec-scope">Scope</option>
                  <option value="sec-procurement">Procurement</option>
                  <option value="sec-risks">Risks</option>
                  <option value="sec-next">Next steps</option>
                  <option value="sec-notes">Notes</option>
                  <option value="sec-photos">Photos</option>
                </select>
                <button type="button" className="btn-ghost" onClick={syncPending} disabled={!isOnline || pendingCount === 0}>
                  Sync drafts
                </button>
              </div>
            </div>
            <p className="subtext">
              No login required. Fill the intake, save when ready, then generate the worksheet PDF.
            </p>

          </header>

          {(statusMessage || pdfUrl) && (
            <div className="alert">
              {statusMessage && <p className="status">{statusMessage}</p>}
              {pdfUrl && (
                <p className="status">
                  PDF: <a className="link" href={pdfUrl} target="_blank" rel="noreferrer">Open in Drive</a>
                </p>
              )}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSave} className="form">
            <div className="panel">
              <div className="panel-title">Phases</div>
              <div className="phase-rail">
                <div className={completion.done === completion.total ? 'phase-card is-complete' : 'phase-card'}>
                  <div className="phase-title">Phase 1</div>
                  <div className="phase-name">Capture</div>
                  <div className="phase-meta">{completion.done}/{completion.total} required fields</div>
                </div>
                <div className={intakeId ? 'phase-card is-complete' : 'phase-card'}>
                  <div className="phase-title">Phase 2</div>
                  <div className="phase-name">Review</div>
                  <div className="phase-meta">{intakeId ? 'Saved' : 'Not saved'}</div>
                </div>
                <div className={pdfUrl ? 'phase-card is-complete' : 'phase-card'}>
                  <div className="phase-title">Phase 3</div>
                  <div className="phase-name">Generate</div>
                  <div className="phase-meta">{pdfUrl ? 'PDF ready' : 'Not generated'}</div>
                </div>
                <div className={pdfUrl ? 'phase-card is-complete' : 'phase-card'}>
                  <div className="phase-title">Phase 4</div>
                  <div className="phase-name">Share</div>
                  <div className="phase-meta">{pdfUrl ? 'Drive link' : 'Pending'}</div>
                </div>
              </div>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{ width: `${completion.total ? Math.round((completion.done / completion.total) * 100) : 0}%` }}
                />
              </div>
            </div>

            {pendingItems.length > 0 && (
              <div className="panel">
                <div className="panel-title">Offline drafts</div>
                <div className="draft-list">
                  {pendingItems.map((item) => (
                    <div className="draft-row" key={item.intakeId}>
                      <div>
                        <div className="draft-title">
                          {item.payload?.opportunity?.property_name || 'Untitled intake'}
                        </div>
                        <div className="draft-meta">
                          {item.payload?.opportunity?.city || 'City'}{item.payload?.opportunity?.state ? `, ${item.payload.opportunity.state}` : ''} ·
                          {item.attachments?.length ?? 0} photos ·
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button type="button" className="btn-ghost" onClick={() => jumpTo('sec-opportunity')}>
                        Open form
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="details" id="sec-operator">
              <summary className="summary">
                <span className="summary-title">Operator</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <input name="operator_name" placeholder="Operator name" />
                  <input name="operator_email" placeholder="Operator email" inputMode="email" />
                </div>
              </div>
            </details>

            <details className="details" open id="sec-opportunity">
              <summary className="summary">
                <span className="summary-title">Opportunity stub</span>
                <span className="summary-hint">Required</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <input name="property_name" placeholder="Property / Project name" required />
                  <input name="city" placeholder="City" required />
                  <input name="state" placeholder="State" required />
                  <input name="brand_flag" placeholder="Brand / Flag" required />
                  <input name="owner_entity" placeholder="Owner entity" required />
                  <input name="management_company" placeholder="Management company" />
                </div>
              </div>
            </details>

            <details className="details" open id="sec-contact">
              <summary className="summary">
                <span className="summary-title">Contact</span>
                <span className="summary-hint">Required</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <input name="contact_name" placeholder="Contact name" required />
                  <input name="contact_role" placeholder="Role" required />
                  <input name="contact_email" placeholder="Email" inputMode="email" />
                  <input name="contact_phone" placeholder="Phone" inputMode="tel" />
                </div>
              </div>
            </details>

            <details className="details" open id="sec-scope">
              <summary className="summary">
                <span className="summary-title">Scope + constraints</span>
                <span className="summary-hint">Required</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <select name="renovation_type" required>
                    <option value="">Renovation type</option>
                    <option value="PIP">PIP</option>
                    <option value="Soft goods">Soft goods</option>
                    <option value="Full guestroom">Full guestroom</option>
                    <option value="Public areas">Public areas</option>
                    <option value="Conversion">Conversion</option>
                    <option value="Other">Other</option>
                  </select>
                  <select name="occupancy_status" required>
                    <option value="">Occupancy status</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Dark">Dark</option>
                    <option value="Phased">Phased</option>
                  </select>
                  <input name="phasing" placeholder="Phasing constraints" />
                  <input name="quiet_hours" placeholder="Quiet hours / guest impact" />
                </div>
                <div className="chips">
                  {scopeOptions.map((scope) => (
                    <button
                      type="button"
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={scopeBuckets.includes(scope) ? 'chip chip-active' : 'chip'}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details className="details" id="sec-procurement">
              <summary className="summary">
                <span className="summary-title">Procurement boundaries</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <input name="casegoods" placeholder="Casegoods provider" />
                  <input name="casegoods_notes" placeholder="Casegoods notes" />
                  <input name="ffe" placeholder="FF&E provider" />
                  <input name="ffe_notes" placeholder="FF&E notes" />
                  <input name="mep" placeholder="MEP provider" />
                  <input name="mep_notes" placeholder="MEP notes" />
                  <input name="owner_items" placeholder="Owner items" />
                  <input name="owner_items_notes" placeholder="Owner items notes" />
                </div>
              </div>
            </details>

            <details className="details" id="sec-risks">
              <summary className="summary">
                <span className="summary-title">Risks + questions</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <div className="stack">
                  <textarea name="key_risks" placeholder="Key risks" rows={3} />
                  <textarea name="open_questions" placeholder="Open questions / follow-up" rows={3} />
                </div>
              </div>
            </details>

            <details className="details" id="sec-next">
              <summary className="summary">
                <span className="summary-title">Next steps</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <div className="grid">
                  <input name="follow_up" placeholder="Preferred follow-up" />
                  <input name="step_one" placeholder="Step one" />
                  <input name="step_two" placeholder="Step two" />
                  <input name="step_three" placeholder="Step three" />
                </div>
              </div>
            </details>

            <details className="details" id="sec-notes">
              <summary className="summary">
                <span className="summary-title">Notes</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <textarea name="notes" placeholder="Additional notes" rows={4} />
              </div>
            </details>

            <details className="details" id="sec-photos">
              <summary className="summary">
                <span className="summary-title">Photos</span>
                <span className="summary-hint">Optional</span>
              </summary>
              <div className="details-body">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
                />
                {attachments.length > 0 && (
                  <div className="stack" style={{ marginTop: 12 }}>
                    <p className="status">{attachments.length} photo(s) ready to upload</p>
                    <div className="grid">
                      {attachmentPreviews.map((src, index) => (
                        <img
                          key={`${src}-${index}`}
                          src={src}
                          alt={`Attachment ${index + 1}`}
                          style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>

            <div className="panel">
              <div className="panel-title">Review + confirm</div>
              {missingRequired.length > 0 ? (
                <div className="missing">
                  Missing required fields: {missingRequired.join(', ')}
                </div>
              ) : (
                <span className="badge badge-good">Required fields complete</span>
              )}
              <div className="summary-grid" style={{ marginTop: 12 }}>
                <div className="summary-item">
                  <label>Property</label>
                  <div className="summary-value">{snapshot.property_name || '—'}</div>
                </div>
                <div className="summary-item">
                  <label>Location</label>
                  <div className="summary-value">
                    {snapshot.city || '—'}{snapshot.state ? `, ${snapshot.state}` : ''}
                  </div>
                </div>
                <div className="summary-item">
                  <label>Brand / Flag</label>
                  <div className="summary-value">{snapshot.brand_flag || '—'}</div>
                </div>
                <div className="summary-item">
                  <label>Owner entity</label>
                  <div className="summary-value">{snapshot.owner_entity || '—'}</div>
                </div>
                <div className="summary-item">
                  <label>Contact</label>
                  <div className="summary-value">
                    {snapshot.contact_name || '—'}{snapshot.contact_role ? ` · ${snapshot.contact_role}` : ''}
                  </div>
                </div>
                <div className="summary-item">
                  <label>Scope</label>
                  <div className="summary-value">
                    {snapshot.renovation_type || '—'}{snapshot.occupancy_status ? ` · ${snapshot.occupancy_status}` : ''}
                  </div>
                </div>
              </div>
              {scopeBuckets.length > 0 && (
                <div className="chips" style={{ marginTop: 12 }}>
                  {scopeBuckets.map((scope) => (
                    <span key={scope} className="chip chip-active" aria-disabled="true">
                      {scope}
                    </span>
                  ))}
                </div>
              )}
              {snapshot.notes && (
                <div className="summary-notes">
                  <label>Notes</label>
                  <p>{snapshot.notes}</p>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">Actions</div>
              <div className="actions-stack">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : isOnline ? 'Save intake' : 'Save offline'}
                </button>
                <button type="button" className="btn-secondary" disabled={!intakeId || generating} onClick={handleGenerate}>
                  {generating ? 'Generating…' : 'Generate PDF'}
                </button>
                <button type="button" className="btn-ghost" onClick={syncPending} disabled={!isOnline || pendingCount === 0}>
                  Sync drafts
                </button>
                <button type="button" className="btn-ghost" onClick={resetForm}>
                  Start new intake
                </button>
              </div>
            </div>

            <div className="sticky-actions">
              <div className="sticky-actions-inner">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : isOnline ? 'Save intake' : 'Save offline'}
                </button>
                <button type="button" className="btn-secondary" disabled={!intakeId || generating} onClick={handleGenerate}>
                  {generating ? 'Generating…' : 'Generate PDF'}
                </button>
                <button type="button" className="btn-ghost" onClick={syncPending} disabled={!isOnline || pendingCount === 0}>
                  Sync drafts
                </button>
                <button type="button" className="btn-ghost" onClick={resetForm}>
                  Start new intake
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Home;
