import { useState } from 'react'

const STEPS = ['Informations', 'Détails', 'Confirmation']
const SUBJECTS = [
  'Question générale',
  'Support technique',
  'Partenariat',
  'Demande de devis',
  'Autre',
]

function validateStep1(data) {
  const errors = {}
  if (!data.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!data.lastName.trim()) errors.lastName = 'Le nom est requis'
  if (!data.email.trim()) {
    errors.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format d'email invalide"
  }
  if (data.phone && !/^[0-9+\-\s()]{8,}$/.test(data.phone)) {
    errors.phone = 'Numéro de téléphone invalide'
  }
  return errors
}

function validateStep2(data) {
  const errors = {}
  if (!data.subject) errors.subject = 'Veuillez choisir un sujet'
  if (!data.message.trim()) {
    errors.message = 'Le message est requis'
  } else if (data.message.trim().length < 10) {
    errors.message = 'Le message doit contenir au moins 10 caractères'
  }
  return errors
}

export default function App() {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    contactMethod: 'email',
    consent: false,
  newsletter: false,
  budget: '',
  urgency: 'normal',
  preferredDate: '',
  preferredTime: '',
    company: '',
    position: '',
    website: '',
    source: '',
    additionalInfo: '',
    rating: '',
    followUpDate: '',
    tags: '',
    priority: 'medium',
    status: 'new',
    assignedTo: '',
    internalNotes: '',
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleNext = () => {
    const validation = step === 0 ? validateStep1(formData) : validateStep2(formData)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setErrors({})
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setErrors({})
    setStep((prev) => prev - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.consent) {
      setErrors({ consent: "Vous devez accepter les conditions pour continuer" })
      return
    }
    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    setStep(0)
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', subject: '', message: '',
      contactMethod: 'email', consent: false, newsletter: false,
    })
    setErrors({})
  }

  if (submitted) {
    return (
      <div className="app">
        <div className="card fade-in">
          <div className="card-body">
            <div className="success-screen">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Message envoyé !</h2>
              <p>Merci {formData.firstName}, votre demande a bien été enregistrée. Nous vous répondrons dans les plus brefs délais.</p>
              <div className="summary">
                <div className="summary-row">
                  <span className="label">Nom</span>
                  <span className="value">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Email</span>
                  <span className="value">{formData.email}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Sujet</span>
                  <span className="value">{formData.subject}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Méthode de contact</span>
                  <span className="value">{formData.contactMethod === 'email' ? 'Email' : 'Téléphone'}</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleReset}>
                Envoyer un nouveau message
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="card">
        <div className="card-header">
          <h1>Formulaire de contact</h1>
          <p>Remplissez ce formulaire et nous vous répondrons rapidement</p>
        </div>
        <div className="card-body">
          <div className="progress-bar">
            {STEPS.map((label, i) => (
              <div key={label} className={`progress-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="dot">
                  {i < step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="line" />
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="fade-in">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">Prénom<span className="required">*</span></label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'error' : ''}
                      placeholder="Jean"
                    />
                    {errors.firstName && <div className="error-text">{errors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Nom<span className="required">*</span></label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'error' : ''}
                      placeholder="Dupont"
                    />
                    {errors.lastName && <div className="error-text">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email<span className="required">*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="jean.dupont@email.com"
                  />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.phone && <div className="error-text">{errors.phone}</div>}
                </div>

                <div className="form-group">
                  <label>Méthode de contact préférée</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="contactMethod"
                        value="email"
                        checked={formData.contactMethod === 'email'}
                        onChange={handleChange}
                      />
                      Email
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="contactMethod"
                        value="phone"
                        checked={formData.contactMethod === 'phone'}
                        onChange={handleChange}
                      />
                      Téléphone
                    </label>
                  </div>
                </div>

                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Continuer
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="fade-in">
                <div className="form-group">
                  <label htmlFor="subject">Sujet<span className="required">*</span></label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={errors.subject ? 'error' : ''}
                  >
                    <option value="">-- Choisir un sujet --</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <div className="error-text">{errors.subject}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message<span className="required">*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className={errors.message ? 'error' : ''}
                    placeholder="Décrivez votre demande en détail..."
                  />
                  <div className="hint">{formData.message.length} caractères (minimum 10)</div>
                  {errors.message && <div className="error-text">{errors.message}</div>}
                </div>

                <div className="form-group">
                  <label className="checkbox-option" style={{ border: errors.consent ? '2px solid var(--error)' : '2px solid var(--neutral-200)' }}>
                    <input
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleChange}
                    />
                    J'accepte que mes données soient utilisées pour me recontacter<span className="required">*</span>
                  </label>
                  {errors.consent && <div className="error-text">{errors.consent}</div>}
                </div>

                <div className="form-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                    />
                    Je souhaite recevoir la newsletter
                  </label>
                </div>

                <div className="btn-group">
                  <button type="button" className="btn btn-secondary" onClick={handleBack}>
                    Retour
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleNext}>
                    Vérifier
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--neutral-900)' }}>
                  Vérifiez vos informations
                </h3>
                <div className="summary">
                  <div className="summary-row">
                    <span className="label">Prénom</span>
                    <span className="value">{formData.firstName || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Nom</span>
                    <span className="value">{formData.lastName || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Email</span>
                    <span className="value">{formData.email || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Téléphone</span>
                    <span className="value">{formData.phone || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Sujet</span>
                    <span className="value">{formData.subject || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Contact par</span>
                    <span className="value">{formData.contactMethod === 'email' ? 'Email' : 'Téléphone'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Newsletter</span>
                    <span className="value">{formData.newsletter ? 'Oui' : 'Non'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Message</span>
                    <span className="value">{formData.message || '—'}</span>
                  </div>
                </div>

                <div className="btn-group">
                  <button type="button" className="btn btn-secondary" onClick={handleBack}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-success">
                    Envoyer le formulaire
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
