import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

const PHONE_REGEX = /^\+?[\d\s\-().]{7,15}$/;

export function EmergencyContacts() {
    const contacts = useAppStore(s => s.contacts);
    const addContact = useAppStore(s => s.addContact);
    const removeContact = useAppStore(s => s.removeContact);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!name.trim()) { setError('Name is required'); return; }
        if (!PHONE_REGEX.test(phone)) { setError('Invalid phone number'); return; }
        try {
            addContact(name, phone);
            setName(''); setPhone('');
        } catch (err: any) {
            setError(err.message);
        }
    }

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-icon">📞</span>
                <h2>Emergency Contacts</h2>
            </div>

            <form className="contact-form" onSubmit={handleAdd}>
                <div className="form-row">
                    <input
                        className="input" placeholder="Contact name" value={name}
                        onChange={e => setName(e.target.value)} />
                    <input
                        className="input" placeholder="+91 98765 43210" value={phone}
                        onChange={e => setPhone(e.target.value)} />
                    <button className="btn btn--accent" type="submit">Add</button>
                </div>
                {error && <p className="form-error">{error}</p>}
            </form>

            {contacts.length === 0 ? (
                <p className="empty-state">No emergency contacts added yet.</p>
            ) : (
                <ul className="contact-list">
                    {contacts.map(c => (
                        <li key={c.id} className="contact-item">
                            <div className="contact-info">
                                <span className="contact-name">{c.name}</span>
                                <a className="contact-phone" href={`tel:${c.phone}`}>{c.phone}</a>
                            </div>
                            <div className="contact-actions">
                                <a className="btn btn--small btn--green" href={`tel:${c.phone}`}>📞 Call</a>
                                {confirmRemove === c.id ? (
                                    <>
                                        <button className="btn btn--small btn--danger" onClick={() => { removeContact(c.id); setConfirmRemove(null); }}>Confirm</button>
                                        <button className="btn btn--small" onClick={() => setConfirmRemove(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <button className="btn btn--small btn--ghost" onClick={() => setConfirmRemove(c.id)}>Remove</button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
