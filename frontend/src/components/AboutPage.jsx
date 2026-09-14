import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { SiteDataContext } from '../context/SiteDataContext';
import { Heart, Users, Trophy, MapPin, Instagram, Calendar, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useAutoTranslate, Translate } from '../utils/useAutoTranslate';

export default function AboutPage() {
  const { t, currentLang } = useContext(LanguageContext);
  const { siteData } = useContext(SiteDataContext);
  const logoUrl = siteData?.mandalLogoUrl || "/mandal-logo.jpg";
  const gmapsUrl = siteData?.contactInfo?.gmapsUrl || "https://www.google.com/maps/place/Ram+Nivas+Society,+Navsari+Bazaar,+Surat,+Gujarat+395002,+India/@21.1871118,72.825237,3a,75y,337.92h,85.85t/data=!3m7!1e1!3m5!1srqOE0FbUYi8YMVZEIz6Jjw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.147363467408482%26panoid%3DrqOE0FbUYi8YMVZEIz6Jjw%26yaw%3D337.91676810130474!7i16384!8i8192!4m15!1m8!3m7!1s0x3be04e687e62c5af:0xcd4ddfde3a15fae7!2sRam+Nivas+Society,+Navsari+Bazaar,+Surat,+Gujarat+395002,+India!3b1!8m2!3d21.1874551!4d72.8251338!16s%2Fg%2F11x91lcrh1!3m5!1s0x3be04e687e62c5af:0xcd4ddfde3a15fae7!8m2!3d21.1874551!4d72.8251338!16s%2Fg%2F11x91lcrh1?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDgxMS4wIKXMDSoASAFQAw%3D%3D";
  const instaUrl = siteData?.aboutInstaUrl || siteData?.contactInfo?.instaUrl || "https://www.instagram.com/yuva_yuvak_mandal/";
  const instaHandle = siteData?.aboutInstaHandle || siteData?.contactInfo?.instaHandle || "@yuva_yuvak_mandal 🚩";
  const isDefaultMandalName = !siteData?.mandalName || siteData.mandalName.toLowerCase().includes('yuva yuvak mandal');
  const mandalName = (currentLang !== 'EN' && isDefaultMandalName)
    ? (t.mandalName || (currentLang === 'GU' ? 'યુવા યુવક મંડળ' : 'युवा युवक मंडल'))
    : (siteData?.mandalName ? siteData.mandalName.replace('🚩', '').trim() : (t.mandalName || 'YUVA YUVAK MANDAL'));
  const rawAddress = siteData?.mandalAddress || siteData?.contactInfo?.address || "Ram Nivas Society, Behind Rajeshree Hall, Navsari Bazaar, Sagrampura, Surat, Gujarat - 395002";
  const isDefaultAddress = !rawAddress || rawAddress.toLowerCase().includes('ram nivas society');
  const mandalAddress = (currentLang !== 'EN' && isDefaultAddress)
    ? (currentLang === 'GU' ? 'રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002' : 'राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002')
    : rawAddress;
  const fullAboutHeader = siteData?.fullAboutHeader || t.fullAboutHeader || "ABOUT YUVA YUVAK MANDAL";
  const isDefaultFullAbout = !siteData?.fullAboutSubText || siteData.fullAboutSubText.toLowerCase().includes('preserving rich cultural heritage');
  const fullAboutSubText = (currentLang !== 'EN' && isDefaultFullAbout)
    ? (t.fullAboutSubText || siteData?.fullAboutSubText || "")
    : (siteData?.fullAboutSubText !== undefined ? siteData.fullAboutSubText : (t.fullAboutSubText || ""));

  const isDefaultCard1 = !siteData?.aboutCard1Desc || siteData.aboutCard1Desc.toLowerCase().includes('founded in 1968');
  const card1Title = (currentLang === 'GU' && (!siteData?.aboutCard1Title || siteData.aboutCard1Title.toLowerCase().includes('50+ years')))
    ? '50+ વર્ષનો ભવ્ય વારસો'
    : (currentLang === 'HI' && (!siteData?.aboutCard1Title || siteData.aboutCard1Title.toLowerCase().includes('50+ years')))
    ? '50+ वर्ष की गौरवशाली विरासत'
    : (siteData?.aboutCard1Title || "50+ Years Glorious Legacy");
  const card1Desc = (currentLang !== 'EN' && isDefaultCard1)
    ? (currentLang === 'GU' ? 'સગરામપુરા, નવસારી બજાર, સુરતના જુસ્સાદાર યુવાનો દ્વારા 1968માં સ્થપાયેલ, યુવા યુવક મંડળ ગુજરાતના સૌથી પ્રતિષ્ઠિત ગણેશ ઉત્સવ મંડળોમાંનું એક બની ગયું છે.' : '1968 में सग्रामपुरा, नवसारी बाज़ार, सूरत के उत्साही युवाओं द्वारा स्थापित, युवा युवक मंडल गुजरात में सबसे सम्मानित गणेश उत्सव मंडलों में से एक बन गया है।')
    : (siteData?.aboutCard1Desc || "");

  const isDefaultCard2 = !siteData?.aboutCard2Desc || siteData.aboutCard2Desc.toLowerCase().includes('our mission is to preserve');
  const card2Title = (currentLang === 'GU' && (!siteData?.aboutCard2Title || siteData.aboutCard2Title.toLowerCase().includes('cultural mission')))
    ? 'સાંસ્કૃતિક મિશન અને વિઝન'
    : (currentLang === 'HI' && (!siteData?.aboutCard2Title || siteData.aboutCard2Title.toLowerCase().includes('cultural mission')))
    ? 'सांस्कृतिक मिशन और विजन'
    : (siteData?.aboutCard2Title || "Cultural Mission & Vision");
  const card2Desc = (currentLang !== 'EN' && isDefaultCard2)
    ? (currentLang === 'GU' ? 'અમારું ધ્યેય સમૃદ્ધ સનાતન પરંપરાઓને જાળવી રાખવાનું, આધ્યાત્મિક સંવાદિતાને પ્રોત્સાહન આપવાનું અને સમુદાય નેતૃત્વ અને દૈવી સેવા દ્વારા યુવાનોને સશક્ત કરવાનું છે.' : 'हमारा मिशन समृद्ध सनातन परंपराओं को संरक्षित करना, आध्यात्मिक सद्भाव को बढ़ावा देना और सामुदायिक नेतृत्व और दिव्य सेवा के माध्यम से युवाओं को सशक्त बनाना है।')
    : (siteData?.aboutCard2Desc || "");

  const isDefaultCard3 = !siteData?.aboutCard3Desc || siteData.aboutCard3Desc.toLowerCase().includes('this is more than just a celebration');
  const card3Title = (currentLang === 'GU' && (!siteData?.aboutCard3Title || siteData.aboutCard3Title.toLowerCase().includes('glorious legacy of togetherness')))
    ? 'એકતાનો ભવ્ય વારસો'
    : (currentLang === 'HI' && (!siteData?.aboutCard3Title || siteData.aboutCard3Title.toLowerCase().includes('glorious legacy of togetherness')))
    ? 'एकजुटता की एक गौरवशाली विरासत'
    : (siteData?.aboutCard3Title || "A Glorious Legacy of Togetherness");
  const card3Desc = (currentLang !== 'EN' && isDefaultCard3)
    ? (currentLang === 'GU' ? 'આ માત્ર એક ઉજવણી કરતાં વધુ છે; તે એકતા, ભક્તિ અને સહિયારી યાદોની પરંપરા છે જે આપણા સમગ્ર સમુદાયને વર્ષ-દર વર્ષે સાથે લાવે છે.' : 'यह महज़ एक उत्सव से कहीं अधिक है; यह एकता, भक्ति और साझा यादों की परंपरा है जो हमारे पूरे समुदाय को साल-दर-साल एक साथ लाती है।')
    : (siteData?.aboutCard3Desc || "");

  return (
    <div className="about-page-container mobile-entrance-fade-up" style={{ padding: '40px 20px 40px', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        .about-story-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 2vw, 24px);
          margin-bottom: 40px;
        }
        .about-story-card {
          min-height: 195px;
          padding: 28px 24px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          box-sizing: border-box;
        }
        .about-story-card-title {
          font-size: clamp(15px, 1.6vw, 18px) !important;
        }
        .about-story-card-desc {
          font-size: clamp(12px, 1.2vw, 14px) !important;
          line-height: 1.75 !important;
        }
        @media (max-width: 768px) {
          .about-page-container {
            padding: 30px 14px 40px !important;
          }
          .about-story-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .about-story-card {
            min-height: 185px !important;
            padding: 30px 22px !important;
          }
          .about-story-card-title {
            font-size: 17px !important;
          }
          .about-story-card-desc {
            font-size: 14px !important;
            line-height: 1.75 !important;
          }
          .about-profile-card {
            flex-direction: column !important;
            text-align: center !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 28px 16px !important;
          }
          .about-profile-logo-wrap {
            margin: 0 auto 16px auto !important;
          }
          .about-profile-info {
            text-align: center !important;
            align-items: center !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
          }
          .about-profile-title {
            text-align: center !important;
            font-size: clamp(20px, 5.5vw, 24px) !important;
            width: 100% !important;
          }
          .about-profile-address {
            display: block !important;
            text-align: center !important;
            line-height: 1.5 !important;
            width: 100% !important;
            margin: 0 auto 14px auto !important;
          }
          .about-profile-address span {
            text-align: center !important;
            display: inline !important;
          }
          .about-profile-address svg {
            display: inline-block !important;
            vertical-align: -2px !important;
            margin-right: 5px !important;
          }
          .about-profile-insta-wrap {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
          .about-profile-insta-wrap a {
            margin: 0 auto !important;
          }
        }
      `}</style>
      
      {/* Section Title with Exact Gold Line matching About Us design */}
      <div style={{ textAlign: 'center', marginBottom: '38px' }}>
        <h2 className="heading-font gold-text" style={{
          fontSize: 'clamp(24px, 5vw, 34px)',
          margin: 0,
          letterSpacing: currentLang === 'EN' ? '1px' : 'normal',
          textTransform: currentLang === 'EN' ? 'uppercase' : 'none',
          lineHeight: currentLang === 'EN' ? 1.25 : 1.45
        }}>
          <Translate text={fullAboutHeader} />
        </h2>

        {/* Exact Golden Underline Bar matching About Us card */}
        <div style={{
          width: '80px',
          height: '3px',
          background: 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)',
          margin: '12px auto 24px',
          borderRadius: '2px'
        }} />

        <p style={{ color: '#FFECB3', fontSize: '15px', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
          <Translate text={fullAboutSubText} />
        </p>
      </div>

      {/* Main Profile Card Header */}
      <div className="maroon-card gold-box-hover about-profile-card" style={{
        padding: '30px',
        background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
        borderRadius: '20px',
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div className="about-profile-logo-wrap" style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #FFB300',
          boxShadow: '0 0 20px rgba(255, 179, 0, 0.6)',
          flexShrink: 0
        }}>
          <img src={logoUrl} alt="Mandal Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="about-profile-info" style={{ flex: 1, minWidth: '260px' }}>
          <h3 className="heading-font gold-text about-profile-title" style={{
            fontSize: '24px',
            margin: '0 0 6px',
            lineHeight: currentLang === 'EN' ? 1.25 : 1.45,
            paddingTop: '2px',
            paddingBottom: '2px'
          }}>
            <Translate text={mandalName} />
          </h3>
          <p className="about-profile-address" style={{ color: '#FFECB3', fontSize: '14px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="#FFB300" style={{ flexShrink: 0 }} /> <span><Translate text={mandalAddress} /></span>
          </p>
          <div className="about-profile-insta-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <a 
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)',
                color: '#FFF',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Instagram size={14} /> {instaHandle}
            </a>
          </div>
        </div>
      </div>

      {/* 3 Detail Highlight Story Cards */}
      <div className="about-story-cards-grid">
        
        {/* Card 1: Legacy */}
        <div className="gold-box-hover about-story-card" style={{
          background: 'rgba(43, 5, 7, 0.85)',
          border: '1.5px solid var(--gold-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,179,0,0.15)', padding: '8px 10px', borderRadius: '10px', border: '1px solid #FFB300', flexShrink: 0 }}>
              <Trophy size={22} color="#FFB300" />
            </div>
            <h4 className="heading-font gold-text about-story-card-title" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Translate text={card1Title} />
            </h4>
          </div>
          <p className="about-story-card-desc" style={{ color: '#FFECB3', margin: 0 }}>
            <Translate text={card1Desc} />
          </p>
        </div>

        {/* Card 2: Mission */}
        <div className="gold-box-hover about-story-card" style={{
          background: 'rgba(43, 5, 7, 0.85)',
          border: '1.5px solid var(--gold-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,179,0,0.15)', padding: '8px 10px', borderRadius: '10px', border: '1px solid #FFB300', flexShrink: 0 }}>
              <ShieldCheck size={22} color="#FFB300" />
            </div>
            <h4 className="heading-font gold-text about-story-card-title" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Translate text={card2Title} />
            </h4>
          </div>
          <p className="about-story-card-desc" style={{ color: '#FFECB3', margin: 0 }}>
            <Translate text={card2Desc} />
          </p>
        </div>

        {/* Card 3: Grand Celebrations */}
        <div className="gold-box-hover about-story-card" style={{
          background: 'rgba(43, 5, 7, 0.85)',
          border: '1.5px solid var(--gold-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,179,0,0.15)', padding: '8px 10px', borderRadius: '10px', border: '1px solid #FFB300', flexShrink: 0 }}>
              <Sparkles size={22} color="#FFB300" />
            </div>
            <h4 className="heading-font gold-text about-story-card-title" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Translate text={card3Title} />
            </h4>
          </div>
          <p className="about-story-card-desc" style={{ color: '#FFECB3', margin: 0 }}>
            <Translate text={card3Desc} />
          </p>
        </div>

      </div>

      {/* 3 Impact Stats Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #3D0B0D 0%, #250406 100%)',
        padding: '30px',
        borderRadius: '20px',
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
      }}>
        <div className="gold-box-hover" style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
          <Trophy size={32} color="#D4AF37" style={{ margin: '0 auto 8px' }} />
          <h3 className="heading-font gold-text" style={{ fontSize: '28px', margin: '4px 0' }}>{siteData?.yearsCount || "15+"}</h3>
          <p style={{ fontSize: '13.5px', color: '#E6C687', margin: 0 }}>{t.gloriousCelebrations}</p>
        </div>

        <div className="gold-box-hover" style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
          <Users size={32} color="#D4AF37" style={{ margin: '0 auto 8px' }} />
          <h3 className="heading-font gold-text" style={{ fontSize: '28px', margin: '4px 0' }}>{siteData?.volunteersCount || "200+"}</h3>
          <p style={{ fontSize: '13.5px', color: '#E6C687', margin: 0 }}>{t.dedicatedVolunteers}</p>
        </div>

        <div className="gold-box-hover" style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--gold-border)' }}>
          <Heart size={32} color="#D4AF37" style={{ margin: '0 auto 8px' }} />
          <h3 className="heading-font gold-text" style={{ fontSize: '28px', margin: '4px 0' }}>{siteData?.devoteesCount || "50,000+"}</h3>
          <p style={{ fontSize: '13.5px', color: '#E6C687', margin: 0 }}>{t.blessedDevotees}</p>
        </div>
      </div>

    </div>
  );
}
