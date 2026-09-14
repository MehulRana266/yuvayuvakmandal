import React, { useState, useEffect, useRef, useContext } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Printer, Download, Share2, ArrowLeft, Check, ShieldCheck, Home, FileText } from 'lucide-react';
import { getApiBaseUrl } from '../context/SiteDataContext';
import { LanguageContext } from '../context/LanguageContext';

export default function DonationReceiptPage({ onGoToHome }) {
  const { t, currentLang } = useContext(LanguageContext);
  const [donation, setDonation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    // 1. Try to read from URL search params
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('d');
    const receiptNoParam = params.get('no') || params.get('receipt');

    if (encodedData) {
      try {
        const decodedStr = decodeURIComponent(escape(atob(encodedData)));
        const parsed = JSON.parse(decodedStr);
        if (parsed && (parsed.donorName || parsed.receiptNo)) {
          setDonation(parsed);
          return;
        }
      } catch (e) {
        console.error('Error decoding receipt data param:', e);
      }
    }

    // 2. Fallback: Search in localStorage or siteData
    try {
      const storedSiteData = localStorage.getItem('yuva_site_data');
      if (storedSiteData) {
        const parsedData = JSON.parse(storedSiteData);
        if (Array.isArray(parsedData.donations)) {
          const match = parsedData.donations.find(d => 
            String(d.receiptNo) === String(receiptNoParam) || 
            String(d.id) === String(receiptNoParam)
          );
          if (match) {
            setDonation(match);
            return;
          }
        }
      }
    } catch (e) {}

    // 3. Fallback: Fetch from backend API
    if (receiptNoParam) {
      fetch(`${getApiBaseUrl()}/api/site-data?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.donations)) {
            const match = data.donations.find(d => 
              String(d.receiptNo) === String(receiptNoParam) || 
              String(d.id) === String(receiptNoParam)
            );
            if (match) setDonation(match);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handlePrint = () => {
    const el = receiptRef.current;
    if (!el) {
      window.print();
      return;
    }
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donation Receipt - ${donation?.receiptNo || 'YYM'}</title>
          <style>
            @page { size: A5 portrait; margin: 6mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #FFF; color: #2B0507; font-family: "Times New Roman", serif, sans-serif; display: flex; justify-content: center; padding: 10px; }
            .donation-receipt-print-area { width: 100% !important; max-width: 580px !important; background: #FFFDF6 !important; color: #2B0507 !important; border: 3px double #B8860B !important; border-radius: 12px !important; padding: 24px !important; box-shadow: none !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
          </style>
        </head>
        <body>
          ${el.outerHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const prevScroll = window.scrollY;
      window.scrollTo(0, 0);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFDF6',
        scrollX: 0,
        scrollY: 0
      });
      window.scrollTo(0, prevScroll);
      const link = document.createElement('a');
      link.download = `Donation_Slip_${donation?.receiptNo || 'YYM'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const prevScroll = window.scrollY;
      window.scrollTo(0, 0);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFDF6',
        scrollX: 0,
        scrollY: 0
      });
      window.scrollTo(0, prevScroll);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - (margin * 2)));
      pdf.save(`Donation_Receipt_${donation?.receiptNo || 'YYM'}.pdf`);
    } catch (err) {
      console.error('PDF Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!donation) return;
    const pdfFileName = `Donation_Receipt_${donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}.pdf`;
    const msg = `🚩 *YUVA YUVAK MANDAL - OFFICIAL DONATION RECEIPT* 🚩\n` +
      `Shri Ganesh Utsav Mahotsav 2026 • Surat, Gujarat\n` +
      `---------------------------------------------\n` +
      `*Official Donation Receipt PDF attached (${pdfFileName})*\n` +
      `*Receipt No:* ${donation.receiptNo}\n` +
      `*Donor Name:* ${donation.donorName}\n` +
      `*Donation Amount:* ₹${Number(donation.amount).toLocaleString('en-IN')} /-\n` +
      `*In Words:* ${donation.amountInWords || ''}\n` +
      `*Seva Category:* ${donation.category}\n` +
      `*Date:* ${donation.date} ${donation.time || ''}\n` +
      `---------------------------------------------\n` +
      `*Ganpati Bappa Morya!*\n` +
      `Yuva Yuvak Mandal parivar ki or se aapka hardik aabhar. Bappa aapko sukh, shanti aur samriddhi pradaan karein! 🚩`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const navigateHome = () => {
    if (onGoToHome) {
      onGoToHome();
    } else {
      window.location.href = '/';
    }
  };

  if (!donation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a0305 0%, #2b060a 50%, #150203 100%)',
        color: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '16px',
          padding: '40px 24px',
          maxWidth: '450px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}>
          <FileText size={48} color="#FFD700" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ color: '#FFD700', fontSize: '20px', margin: '0 0 10px' }}>
            Donation Receipt Not Found
          </h2>
          <p style={{ color: '#DDD', fontSize: '13.5px', lineHeight: 1.5, marginBottom: '24px' }}>
            Kripya link check karein ya mandal adhyaksh / volunteer se sampark karein.
          </p>
          <button
            onClick={navigateHome}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              color: '#2B0507',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Home size={16} /> Mandal Website Par Jayein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0305 0%, #2b060a 50%, #150203 100%)',
      color: '#FFF',
      padding: '20px 16px 60px',
      fontFamily: 'sans-serif'
    }}>
      {/* Top Header Bar (Hidden during Print) */}
      <div className="no-print" style={{
        maxWidth: '680px',
        margin: '0 auto 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          onClick={navigateHome}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,215,0,0.3)',
            color: '#FFD700',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={16} /> {t.receiptBackHome || 'Home Website'}
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              background: '#D32F2F',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(211,47,47,0.4)'
            }}
          >
            <FileText size={15} /> {downloading ? (t.loading || 'Generating PDF...') : (t.receiptDownloadPdf || 'Download PDF (पावती PDF)')}
          </button>

          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              color: '#2B0507',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(255,215,0,0.4)'
            }}
          >
            <Printer size={15} /> {t.printReceipt || 'Print Slip / Save PDF'}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#FFF',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} /> {downloading ? (t.loading || 'Downloading...') : (t.receiptDownloadPng || 'Slip Image (PNG)')}
          </button>

          <button
            onClick={handleShareWhatsApp}
            style={{
              background: '#25D366',
              color: '#000',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={15} /> {t.receiptShareWhatsapp || 'WhatsApp'}
          </button>
        </div>
      </div>

      {/* Main Printable Slip Container */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          ref={receiptRef}
          className="donation-receipt-print-area"
          style={{
            width: '100%',
            maxWidth: '580px',
            background: '#FFFDF6',
            color: '#2B0507',
            border: '3px double #B8860B',
            borderRadius: '14px',
            padding: '28px 24px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            fontFamily: '"Times New Roman", serif, sans-serif',
            position: 'relative'
          }}
        >
          {/* Subtle Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '54px',
            color: 'rgba(184, 134, 11, 0.04)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0
          }}>
            ॐ श्री गणेशाय नमः
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Mandir Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #B8860B', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', color: '#B8860B', fontWeight: 800, letterSpacing: '2px' }}>
                ॥ श्री गणेशाय नमः ॥
              </div>
              <h1 style={{ margin: '4px 0 2px', fontSize: '26px', color: '#8B0000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                YUVA YUVAK MANDAL
              </h1>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#333' }}>
                🚩 Shri Ganesh Utsav Mahotsav 2026 • 58th Glorious Year
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>
                Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat - 395002
              </div>
              <div style={{
                display: 'inline-block',
                background: '#8B0000',
                color: '#FFD700',
                fontWeight: 700,
                fontSize: '12px',
                padding: '3px 16px',
                borderRadius: '14px',
                marginTop: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Official Donation Receipt Voucher (दान पावती)
              </div>
            </div>

            {/* Receipt Metadata Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444', marginBottom: '14px', borderBottom: '1px dashed #B8860B', paddingBottom: '8px' }}>
              <div>
                <strong>Receipt No:</strong> <span style={{ color: '#8B0000', fontWeight: 800 }}>{donation.receiptNo || ('YYM-DON-' + String(donation.id).slice(-6))}</span>
              </div>
              <div>
                <strong>Date:</strong> {donation.date} {donation.time || ''}
              </div>
            </div>

            {/* Donor Particulars Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                  <td style={{ padding: '8px 4px', color: '#666', width: '35%' }}>Donor Full Name:</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: '#111', fontSize: '14.5px' }}>
                    श्री / श्रीमती {donation.donorName}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                  <td style={{ padding: '8px 4px', color: '#666' }}>Mobile Number:</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: '#111' }}>
                    +91 {donation.donorPhone}
                  </td>
                </tr>
                {donation.donorWhatsApp && donation.donorWhatsApp !== donation.donorPhone && (
                  <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                    <td style={{ padding: '8px 4px', color: '#666' }}>WhatsApp Number:</td>
                    <td style={{ padding: '8px 4px', fontWeight: 700, color: '#1B5E20' }}>
                      +91 {donation.donorWhatsApp}
                    </td>
                  </tr>
                )}
                {donation.donorEmail && (
                  <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                    <td style={{ padding: '8px 4px', color: '#666' }}>Email Address:</td>
                    <td style={{ padding: '8px 4px', color: '#111' }}>
                      {donation.donorEmail}
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                  <td style={{ padding: '8px 4px', color: '#666' }}>Seva Category / Purpose:</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: '#8B0000' }}>
                    {donation.category || 'General Festival Fund'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                  <td style={{ padding: '8px 4px', color: '#666' }}>Payment Mode:</td>
                  <td style={{ padding: '8px 4px', fontWeight: 600, color: '#111' }}>
                    {donation.type || 'Cash Collection'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E0D0B0', background: 'rgba(255, 215, 0, 0.12)' }}>
                  <td style={{ padding: '10px 4px', color: '#8B0000', fontWeight: 800, fontSize: '13.5px' }}>Donation Amount:</td>
                  <td style={{ padding: '10px 4px', fontWeight: 900, color: '#8B0000', fontSize: '20px' }}>
                    ₹ {Number(donation.amount).toLocaleString('en-IN')} /-
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E0D0B0' }}>
                  <td style={{ padding: '8px 4px', color: '#666' }}>Amount in Words:</td>
                  <td style={{ padding: '8px 4px', fontStyle: 'italic', fontWeight: 700, color: '#2B0507' }}>
                    {donation.amountInWords || ''}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Divine Blessings Note */}
            <div style={{
              background: 'rgba(139, 0, 0, 0.05)',
              border: '1px solid rgba(184, 134, 11, 0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#4A1517',
              textAlign: 'center',
              marginBottom: '18px',
              lineHeight: 1.5
            }}>
              <strong>गणपति बप्पा मोरया!</strong><br />
              युवा युवक मंडल परिवार की ओर से आपका हार्दिक आभार। भगवान श्री गणेश जी आपके परिवार को सुख, शांति, समृद्धि एवं उत्तम स्वास्थ्य प्रदान करें। 🚩
            </div>

            {/* Signatures & Seal Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '22px', paddingTop: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '2px dashed #8B0000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.5px',
                  color: '#8B0000',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  transform: 'rotate(-10deg)',
                  margin: '0 auto 4px'
                }}>
                  OFFICIAL<br />SEAL<br />YYM 2026
                </div>
                <span style={{ fontSize: '10.5px', color: '#666' }}>Trust Verified Seal</span>
              </div>

              <div style={{ textAlign: 'right', fontSize: '12px', color: '#333', minWidth: '160px' }}>
                <div style={{ height: '28px' }}></div>
                <div style={{ borderTop: '1px solid #555', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#8B0000' }}>
                  Authorized Signatory
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  Yuva Yuvak Mandal, Surat
                </div>
              </div>
            </div>

            {/* Slip Disclaimer */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', marginTop: '16px', borderTop: '1px dashed #CCC', paddingTop: '8px' }}>
              * This is a computer-generated official receipt slip of Yuva Yuvak Mandal, Surat.
            </div>
          </div>
        </div>
      </div>

      {/* Copy Link button footer (Hidden during Print) */}
      <div className="no-print" style={{ maxWidth: '580px', margin: '20px auto 0', textAlign: 'center' }}>
        <button
          onClick={handleCopyLink}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#FFD700',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {copied ? <Check size={14} color="#69F0AE" /> : <ShieldCheck size={14} />}
          {copied ? 'Link Copied to Clipboard!' : 'Copy Official Receipt Link'}
        </button>
      </div>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body {
            background: #FFF !important;
            color: #000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .donation-receipt-print-area {
            border: 2px solid #8B0000 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </div>
  );
}
