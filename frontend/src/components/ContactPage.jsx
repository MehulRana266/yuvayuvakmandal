import React, { useState, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { MapPin, Phone, Mail, Instagram, Clock, Send, ExternalLink, CheckCircle2, ShieldCheck, Heart, Sparkles, Navigation } from 'lucide-react';
import { Translate } from '../utils/useAutoTranslate';

export default function ContactPage() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData, addInquiry } = useContext(SiteDataContext);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = siteData?.contactInfo || {};
  const pageHeader = contactInfo.headerTitle || t.fullContactHeader || "CONTACT YUVA YUVAK MANDAL";
  const pageSubText = contactInfo.headerSubText !== undefined ? contactInfo.headerSubText : (t.fullContactSubText || "");
  const isDefaultAddress = !contactInfo.address || contactInfo.address.trim().toLowerCase().includes('ram nivas society');
  const addressText = (currentLang !== 'EN' && isDefaultAddress) ? (t.pandalAddressFull || contactInfo.address) : (contactInfo.address || t.pandalAddressFull || "Yuva Yuvak Mandal, Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002");
  const mapLink = contactInfo.gmapsUrl !== undefined ? contactInfo.gmapsUrl : "https://www.google.com/maps/place/21%C2%B011'14.8%22N+72%C2%B049'30.5%22E/@21.1873731,72.8218984,17z/data=!4m4!3m3!8m2!3d21.1874444!4d72.8251389?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgyMy4wIKXMDSoASAFQAw%3D%3D";
  const instaHandle = contactInfo.instaHandle !== undefined ? contactInfo.instaHandle : "@yuva_yuvak_mandal 🚩";
  const instaLink = contactInfo.instaUrl !== undefined ? contactInfo.instaUrl : "https://www.instagram.com/yuva_yuvak_mandal/";
  const isDefaultSocialDesc = !contactInfo.socialDesc || contactInfo.socialDesc.trim().toLowerCase().includes('follow our official instagram page');
  const socialDesc = (currentLang !== 'EN' && isDefaultSocialDesc) ? (t.socialMediaDesc || contactInfo.socialDesc) : (contactInfo.socialDesc !== undefined ? contactInfo.socialDesc : (t.socialMediaDesc || ""));
  const pandalOpenTiming = contactInfo.timingPandalOpen !== undefined ? contactInfo.timingPandalOpen : (t.timingPandalOpenValue || "");
  const morningAartiTiming = contactInfo.timingMorningAarti !== undefined ? contactInfo.timingMorningAarti : (t.timingMorningAartiValue || "");
  const eveningAartiTiming = contactInfo.timingEveningAarti !== undefined ? contactInfo.timingEveningAarti : (t.timingEveningAartiValue || "");
  const prasadTiming = contactInfo.timingPrasad !== undefined ? contactInfo.timingPrasad : (t.timingPrasadValue || "");
  const isDefaultFormHeading = !contactInfo.formHeader || contactInfo.formHeader.trim().toLowerCase().includes('devotee message') || contactInfo.formHeader.trim().toLowerCase().includes('send us a message');
  const formHeading = (currentLang !== 'EN' && isDefaultFormHeading) ? (t.formHeader || contactInfo.formHeader) : (contactInfo.formHeader || t.formHeader || "Devotee Message & Inquiries");
  const isDefaultFormSubtitle = !contactInfo.formSubText || contactInfo.formSubText.trim().toLowerCase().includes('send a message to yuva yuvak mandal');
  const formSubtitle = (currentLang !== 'EN' && isDefaultFormSubtitle) ? (t.formSubText || contactInfo.formSubText) : (contactInfo.formSubText !== undefined ? contactInfo.formSubText : (t.formSubText || ""));
  const primaryPhone = contactInfo.phone1 || "8469474973";
  const secondaryPhone = contactInfo.phone2 || "";
  const officialEmail = contactInfo.email || "yuvayuvakmandal@gmail.com";

  const handlePhoneChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: clean }));
    setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = { name: '', phone: '', subject: '', message: '' };
    let hasError = false;

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = currentLang === 'HI' ? '(नाम आवश्यक है)' : currentLang === 'GU' ? '(નામ જરૂરી છે)' : '(Required)';
      hasError = true;
    }

    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      newErrors.phone = currentLang === 'HI' ? '(10 अंकों का मान्य नंबर दर्ज करें)' : currentLang === 'GU' ? '(10 અંકનો નંબર હોવો જોઈએ)' : '(Must be 10 digits)';
      hasError = true;
    }

    if (!formData.subject || !formData.subject.trim()) {
      newErrors.subject = currentLang === 'HI' ? '(पूछताछ का प्रकार चुनें)' : currentLang === 'GU' ? '(પૂછપરછનો પ્રકાર પસંદ કરો)' : '(Please select an inquiry)';
      hasError = true;
    }

    if (!formData.message || !formData.message.trim()) {
      newErrors.message = currentLang === 'HI' ? '(संदेश आवश्यक है)' : currentLang === 'GU' ? '(સંદેશ લખવો જરૂરી છે)' : '(Required)';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      return;
    }

    if (addInquiry) {
      addInquiry(formData);
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ganpati_inquiries_sync');
        channel.postMessage('NEW_INQUIRY');
        channel.close();
      }
      window.dispatchEvent(new CustomEvent('new_inquiry_added'));
    } catch (e) {}

    setSubmitted(true);
    setErrors({ name: '', phone: '', subject: '', message: '' });
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="contact-page-container mobile-entrance-fade-up" style={{ padding: '40px 20px 40px', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        @media (max-width: 768px) {
          .contact-insta-btn-wrap {
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }
          .contact-insta-btn {
            margin: 0 auto !important;
            align-self: center !important;
          }
        }
      `}</style>
      
      {/* Section Title with Gold Line */}
      <div style={{ textAlign: 'center', marginBottom: '38px' }}>
        <h2 className="heading-font gold-text" style={{
          fontSize: 'clamp(24px, 5vw, 34px)',
          margin: 0,
          letterSpacing: currentLang === 'EN' ? '1px' : 'normal',
          textTransform: currentLang === 'EN' ? 'uppercase' : 'none',
          lineHeight: currentLang === 'EN' ? 1.25 : 1.45,
          whiteSpace: 'pre-line'
        }}>
          <Translate text={pageHeader} />
        </h2>

        {/* Exact Golden Underline Bar */}
        <div style={{
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 24px',
          borderRadius: '2px'
        }} />

        <p style={{ color: '#FFECB3', fontSize: '15px', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          <Translate text={pageSubText} />
        </p>
      </div>

      {/* Grid: Left Contact Info Cards & Right Message Form */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        alignItems: 'stretch'
      }}>
        
        {/* Left Column: 3 Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
          
          {/* Card 1: Mandal Address */}
          <div className="maroon-card gold-box-hover" style={{
            background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
            border: '1.5px solid var(--gold-border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255,179,0,0.15)', padding: '10px', borderRadius: '10px', border: '1px solid #FFB300' }}>
                  <MapPin size={22} color="#FFB300" />
                </div>
                <h3 className="heading-font gold-text" style={{ fontSize: '18px', margin: 0 }}>
                  {t.pandalAddressHeader || "Sacred Pandal Address"}
                </h3>
              </div>

              <p style={{ color: '#FFECB3', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                <Translate text={addressText} />
              </p>
            </div>

            <a 
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold gmaps-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                fontSize: '14px',
                padding: '10px 18px',
                borderRadius: '24px',
                textDecoration: 'none',
                fontWeight: 700,
                transition: 'none',
                transform: 'none'
              }}
            >
              <Navigation size={17} /> {t.openGoogleMapsBtn || "Open in Google Maps"}
            </a>
          </div>

          {/* Card 2: Social Media & Handles */}
          <div className="maroon-card gold-box-hover" style={{
            background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
            border: '1.5px solid var(--gold-border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255,179,0,0.15)', padding: '10px', borderRadius: '10px', border: '1px solid #FFB300' }}>
                  <Instagram size={22} color="#FFB300" />
                </div>
                <h3 className="heading-font gold-text" style={{ fontSize: '18px', margin: 0 }}>
                  {t.socialMediaHeader || "Official Social Media"}
                </h3>
              </div>

              <p style={{ color: '#FFECB3', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '14px' }}>
                <Translate text={socialDesc} />
              </p>
            </div>

            <div className="contact-insta-btn-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <a
                href={instaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-insta-btn"
                style={{
                  background: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)',
                  color: '#FFF',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'fit-content'
                }}
              >
                <Instagram size={16} /> {instaHandle}
              </a>
            </div>
          </div>

          {/* Card 3: Pandal & Aarti Timings */}
          <div className="maroon-card gold-box-hover" style={{
            background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
            border: '1.5px solid var(--gold-border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(255,179,0,0.15)', padding: '10px', borderRadius: '10px', border: '1px solid #FFB300' }}>
                <Clock size={22} color="#FFB300" />
              </div>
              <h3 className="heading-font gold-text" style={{ fontSize: '18px', margin: 0 }}>
                {t.timingsHeader || "Pandal & Aarti Timings"}
              </h3>
            </div>

            <div style={{ color: '#FFECB3', fontSize: '13px', lineHeight: 1.8 }}>
              <div>• <strong>{t.timingPandalOpenLabel || "Pandal Open:"}</strong> <Translate text={pandalOpenTiming} /></div>
              <div>• <strong>{t.timingMorningAartiLabel || "Morning Aarti:"}</strong> <Translate text={morningAartiTiming} /></div>
              <div>• <strong>{t.timingEveningAartiLabel || "Evening Aarti:"}</strong> <Translate text={eveningAartiTiming} /></div>
              <div>• <strong>{t.timingPrasadLabel || "Prasad Distribution:"}</strong> <Translate text={prasadTiming} /></div>
            </div>
          </div>

        </div>

        {/* Right Column: Devotee Message & Inquiry Form (Card 4) */}
        <div className="maroon-card gold-box-hover" style={{
          background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
          border: '1.5px solid var(--gold-border)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div>
            <h3 className="heading-font gold-text" style={{ fontSize: '22px', marginTop: 0, marginBottom: '6px' }}>
              <Translate text={formHeading} />
            </h3>
            <p style={{ color: '#FFECB3', fontSize: '13.5px', marginBottom: '20px' }}>
              <Translate text={formSubtitle} />
            </p>
          </div>

          {submitted ? (
            <div style={{
              background: 'rgba(255, 179, 0, 0.15)',
              border: '1.5px solid #FFB300',
              color: '#FFB300',
              padding: '24px',
              borderRadius: '16px',
              textAlign: 'center',
              margin: 'auto 0'
            }}>
              <CheckCircle2 size={40} color="#FFB300" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '18px', color: '#FFF' }}>
                {t.msgReceived || 'Jai Shree Ganesh! Message Received.'}
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#FFECB3' }}>
                {t.msgReceivedSub || 'Yuva Yuvak Mandal committee will get back to you shortly. 🚩'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <label style={{ display: 'block', color: '#FFECB3', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>
                  {t.formNameLabel || 'Your Name'} <span style={{ color: '#FF5252' }}>*</span>
                  {errors.name && <span style={{ color: '#FF5252', fontSize: '12px', marginLeft: '6px', fontWeight: '600' }}>{errors.name}</span>}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.formPlaceholderName || "Enter your full name"}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: errors.name ? '1.5px solid #FF5252' : '1px solid var(--gold-border)',
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  className="input-gold-hover"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#FFECB3', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>
                  {t.formPhoneLabel || 'Phone Number'} <span style={{ color: '#FF5252' }}>*</span>
                  {errors.phone && <span style={{ color: '#FF5252', fontSize: '12px', marginLeft: '6px', fontWeight: '600' }}>{errors.phone}</span>}
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder={t.formPlaceholderPhone || "10-digit mobile number"}
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: errors.phone ? '1.5px solid #FF5252' : '1px solid var(--gold-border)',
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  className="input-gold-hover"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#FFECB3', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>
                  {t.formSubjectLabel || 'Subject'} <span style={{ color: '#FF5252' }}>*</span>
                  {errors.subject && <span style={{ color: '#FF5252', fontSize: '12px', marginLeft: '6px', fontWeight: '600' }}>{errors.subject}</span>}
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, subject: val }));
                    if (val && val.trim()) {
                      setErrors(prev => ({ ...prev, subject: '' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(0,0,0,0.6)',
                    border: errors.subject ? '1.5px solid #FF5252' : '1px solid var(--gold-border)',
                    boxShadow: errors.subject ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined,
                    borderRadius: '10px',
                    color: formData.subject ? '#FFF' : '#AAA',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  className="input-gold-hover"
                >
                  <option value="" disabled style={{ color: '#888', background: '#1c0c0e' }}>
                    {t.subjectSelect || 'Select Inquiry'}
                  </option>
                  <option value="General Inquiry" style={{ color: '#FFF', background: '#1c0c0e' }}>{t.subjectGeneral || 'General Inquiry'}</option>
                  <option value="Mahaprasad Seva" style={{ color: '#FFF', background: '#1c0c0e' }}>{t.subjectSeva || 'Mahaprasad Seva'}</option>
                  <option value="Volunteer Registration" style={{ color: '#FFF', background: '#1c0c0e' }}>{t.subjectVolunteer || 'Volunteer Registration'}</option>
                  <option value="Pandal Visit" style={{ color: '#FFF', background: '#1c0c0e' }}>{t.subjectVisit || 'Pandal Visit Inquiry'}</option>
                </select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '140px' }}>
                <label style={{ display: 'block', color: '#FFECB3', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>
                  {t.formMessageLabel || 'Message'} <span style={{ color: '#FF5252' }}>*</span>
                  {errors.message && <span style={{ color: '#FF5252', fontSize: '12px', marginLeft: '6px', fontWeight: '600' }}>{errors.message}</span>}
                </label>
                <textarea
                  required
                  placeholder={t.formPlaceholderMessage || "Write your devotional message or inquiry..."}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, message: '' }));
                  }}
                  className="input-gold-hover"
                  style={{
                    width: '100%',
                    flex: 1,
                    height: '100%',
                    minHeight: '140px',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: errors.message ? '1.5px solid #FF5252' : '1px solid var(--gold-border)',
                    boxShadow: errors.message ? '0 0 10px rgba(255, 82, 82, 0.45)' : undefined,
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
                  color: '#2B0507',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '24px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)'
                }}
              >
                <Send size={18} /> {t.formSubmitBtn || 'Send Message'}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
