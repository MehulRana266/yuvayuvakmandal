import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { getApiBaseUrl } from '../context/SiteDataContext';

const memoryCache = new Map();
const CACHE_PREFIX = 'trans_v4_';

// 🚩 Instant Client-Side Glossary for Devotional & Festival Terms
const CLIENT_GLOSSARY = {
  HI: {
    'the king of': 'राजा',
    'the king of yuva yuvak mandal': 'युवा युवक मंडल के राजा',
    'the king of yuva yuvak mandal is arriving on 12-09-2026': 'युवा युवक मंडल के राजा का आगमन 12-09-2026 को हो रहा है',
    'is arriving': 'पधार रहे हैं',
    'on 12-09-2026': '12-09-2026 को',
    'bappa is arriving! please join us for the ganesh aagman ceremony.': 'बाप्पा पधार रहे हैं! गणेश आगमन उत्सव में आप सभी का सहर्ष स्वागत है।',
    'countdown to utsav': 'उत्सव की उल्टी गिनती',
    'days': 'दिन',
    'hours': 'घंटे',
    'mins': 'मिनट',
    'secs': 'सेकंड',
    'feel the devotion - on the big screen': 'भक्ति का अनुभव - बड़ी स्क्रीन पर',
    'feel the devotion – on the big screen': 'भक्ति का अनुभव - बड़ी स्क्रीन पर',
    'feel the devotion — on the big screen': 'भक्ति का अनुभव - बड़ी स्क्रीन पर',
    'watch hd live darshan & grand aarti stream.': 'एचडी लाइव दर्शन और भव्य महाआरती का सीधा प्रसारण देखें।',
    'video coming soon': 'वीडियो जल्द आ रहा है',
    'aagman': 'आगमन',
    'visarjan': 'विसर्जन',
    'schedule': 'शेड्यूल',
    'aarti': 'आरती',
    'prasad': 'प्रसाद',
    'mahaprasad': 'महाप्रसाद',
    'ganesh aagman': 'गणेश आगमन',
    'ganesh visarjan': 'गणेश विसर्जन',
    'aagman day': 'आगमन दिवस',
    'visarjan day': 'विसर्जन दिवस',
    'aagman & visarjan': 'आगमन एवं विसर्जन',
    'aagman and visarjan': 'आगमन एवं विसर्जन',
    'grand ganesh aagman': 'भव्य गणेश आगमन',
    'grand visarjan': 'भव्य विसर्जन',
    'grand aagman': 'भव्य आगमन',
    'devotee message & inquiries': 'भक्त संदेश एवं पूछताछ',
    'devotee message and inquiries': 'भक्त संदेश एवं पूछताछ',
    'send a message to yuva yuvak mandal admin committee for mahaprasad seva or volunteer inquiry.': 'महाप्रसाद सेवा या स्वयंसेवक पूछताछ के लिए युवा युवक मंडल व्यवस्थापक समिति को संदेश भेजें।',
    'follow our official instagram page for daily hd live darshan, aarti videos, and celebration updates.': 'दैनिक लाइव दर्शन, आरती वीडियो और अपडेट के लिए हमारे आधिकारिक इंस्टाग्राम पेज को फॉलो करें।',
    'select inquiry': 'पूछताछ चुनें',
    'general inquiry': 'सामान्य पूछताछ',
    'mahaprasad seva': 'महाप्रसाद सेवा',
    'volunteer registration': 'स्वयंसेवक पंजीकरण',
    'pandal visit inquiry': 'पंडाल दर्शन पूछताछ',
    'pandal address': 'पंडाल का पता',
    'map location & street view': 'नक्शा एवं स्ट्रीट व्यू',
    'map location and street view': 'नक्शा एवं स्ट्रीट व्यू',
    'map location': 'नक्शा एवं स्थान',
    'open in google maps': 'गूगल मैप्स में देखें',
    'join instagram community': 'इंस्टाग्राम से जुड़ें',
    'yuva yuvak': 'युवा युवक',
    'yuva yuvak mandal': 'युवा युवक मंडल',
    'yuva yuvak mandal 🚩': 'युवा युवक मंडल',
    'ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002',
    'yuva yuvak mandal, ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'युवा युवक मंडल, राम निवास सोसायटी, राजश्री हॉल के पीछे, नवसारी बाजार, संग्रामपुरा, सूरत, गुजरात - 395002',
    'respected idol sculptor • mumbai': 'सम्मानित मूर्तिकार - मुंबई',
    'respected idol sculptor - mumbai': 'सम्मानित मूर्तिकार - मुंबई',
    'crafted with devotion in mumbai • revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'crafted with devotion in mumbai and revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'crafted with devotion in mumbai, revered in surat ganesh-utsav': 'मुंबई में भक्तिभाव से निर्मित और सूरत गणेश-उत्सव में आदरणीय',
    'divine creation - our idol sculptor': 'दिव्य सृजन - हमारे मूर्तिकार',
    'all rights reserved': 'सर्वाधिकार सुरक्षित',
    'all rights reserved.': 'सर्वाधिकार सुरक्षित.',
    'yuva yuvak mandal. all rights reserved': 'युवा युवक मंडल. सर्वाधिकार सुरक्षित',
    'yuva yuvak mandal. all rights reserved.': 'युवा युवक मंडल. सर्वाधिकार सुरक्षित.',
    'about us': 'हमारे बारे में',
    'about yuva yuvak mandal': 'युवा युवक मंडल के बारे में',
    'contact yuva yuvak mandal': 'युवा युवक मंडल से संपर्क करें',
    'surat, gujarat': 'सूरत, गुजरात',
    'shri ganesh utsav mahotsav • organised with devotion, grandeur and unity since 1968 in surat, gujarat.': 'श्री गणेश उत्सव महोत्सव • सूरत, गुजरात में 1968 से भक्ति, भव्यता और एकता के साथ आयोजित।',
    'shri ganesh utsav mahotsav - organised with devotion, grandeur and unity since 1968 in surat, gujarat.': 'श्री गणेश उत्सव महोत्सव • सूरत, गुजरात में 1968 से भक्ति, भव्यता और एकता के साथ आयोजित।',
    'devotee experiences & reviews': 'भक्त अनुभव एवं समीक्षाएं',
    'devotee feedback & blessings': 'भक्तों की प्रतिक्रिया एवं अनुभव',
    'share your divine experience and blessings of shri ganesh utsav mahotsav!': 'श्री गणेश उत्सव के अपने दिव्य अनुभव एवं आशीर्वाद साझा करें!',
    'glorious celebrations': 'गौरवशाली वर्ष',
    'dedicated volunteers': 'समर्पित स्वयंसेवक',
    'blessed devotees': 'आनंदित भक्त',
    'view full schedule →': 'पूरा शेड्यूल देखें →',
    'read full about us →': 'हमारे बारे में पूरी जानकारी पढ़ें →',
    'today\'s schedule': 'आज का शेड्यूल',
    'no more schedule': 'आज का कोई अन्य कार्यक्रम शेष नहीं है',
    'latest reels from instagram': 'इंस्टाग्राम से नवीनतम रील्स',
    'divine photo & video gallery': 'दिव्य फोटो एवं वीडियो गैलरी',
    'divine aarti & utsav schedule': 'दिव्य आरती एवं उत्सव सारणी',
    'sacred pandal address': 'पवित्र पंडाल स्थान',
    'click to view': 'देखने के लिए क्लिक करें',
    'morning aarti': 'सुबह की आरती',
    'evening aarti': 'संध्या आरती',
    'morning aarti (subhah ki aarti)': 'सुबह की आरती',
    'evening maha aarti (shaam ki aarti)': 'शाम की महा आरती',
    '50+ years glorious legacy': '50+ वर्ष की गौरवशाली विरासत',
    'cultural mission & vision': 'सांस्कृतिक मिशन और विजन',
    'cultural mission and vision': 'सांस्कृतिक मिशन और विजन',
    'a glorious legacy of togetherness': 'एकजुटता की एक गौरवशाली विरासत',
    'our mission is to preserve rich sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.': 'हमारा मिशन समृद्ध सनातन परंपराओं को संरक्षित करना, आध्यात्मिक सद्भाव को बढ़ावा देना और सामुदायिक नेतृत्व और दिव्य सेवा के माध्यम से युवाओं को सशक्त बनाना है।',
    'this is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.': 'यह महज़ एक उत्सव से कहीं अधिक है; यह एकता, भक्ति और साझा यादों की परंपरा है जो हमारे पूरे समुदाय को साल-दर-साल एक साथ लाती है।',
    'founded in 1968 by passionate youth of sagrampura, navsari bazaar, surat, yuva yuvak mandal has grown into one of the most respected ganesh utsav mandals in gujarat.': '1968 में सग्रामपुरा, नवसारी बाज़ार, सूरत के उत्साही युवाओं द्वारा स्थापित, युवा युवक मंडल गुजरात में सबसे सम्मानित गणेश उत्सव मंडलों में से एक बन गया है।',
    'inspired by the spirit of devotion, unity, and culture, yuva yuvak mandal has been organizing the ganesh utsav mahotsav since 1968.\nour mission is to preserve our rich cultural heritage, pass on the sacred traditions of ganesh utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.': 'भक्ति, एकता और संस्कृति की भावना से प्रेरित होकर युवा युवक मंडल 1968 से गणेश उत्सव महोत्सव का आयोजन करता आ रहा है।\nहमारा मिशन हमारी समृद्ध सांस्कृतिक विरासत को संरक्षित करना, गणेश उत्सव की पवित्र परंपराओं को युवा पीढ़ी तक पहुंचाना और भक्ति, सांस्कृतिक मूल्यों और सामुदायिक एकता के माध्यम से युवाओं को एक साथ लाना है।',
    'preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.': '1968 से समृद्ध सांस्कृतिक विरासत को संरक्षित करना, रक्तदान और भोजन वितरण के माध्यम से मानवता की सेवा करना और युवाओं को दिव्य भक्ति में एकजुट करना।'
  },
  GU: {
    'the king of': 'રાજા',
    'the king of yuva yuvak mandal': 'યુવા યુવક મંડળના રાજા',
    'the king of yuva yuvak mandal is arriving on 12-09-2026': 'યુવા યુવક મંડળના રાજાનું આગમન 12-09-2026 ના રોજ થઈ રહ્યું છે',
    'is arriving': 'પધારી રહ્યા છે',
    'on 12-09-2026': '12-09-2026 ના રોજ',
    'bappa is arriving! please join us for the ganesh aagman ceremony.': 'બાપ્પા પધારી રહ્યા છે! ગણેશ આગમન મહોત્સવમાં આપ સૌનું હાર્દિક સ્વાગત છે.',
    'countdown to utsav': 'મહોત્સવની ઊંધી ગણતરી',
    'days': 'દિવસ',
    'hours': 'કલાક',
    'mins': 'મિનિટ',
    'secs': 'સેકન્ડ',
    'feel the devotion - on the big screen': 'ભક્તિનો અનુભવ - બિગ સ્ક્રીન પર',
    'feel the devotion – on the big screen': 'ભક્તિનો અનુભવ - બિગ સ્ક્રીન પર',
    'feel the devotion — on the big screen': 'ભક્તિનો અનુભવ - બિગ સ્ક્રીન પર',
    'watch hd live darshan & grand aarti stream.': 'એચડી લાઈવ દર્શન અને ભવ્ય મહાઆરતીનું સીધું પ્રસારણ જુઓ.',
    'video coming soon': 'વિડિયો ટૂંક સમયમાં આવી રહ્યો છે',
    'aagman': 'આગમન',
    'visarjan': 'વિસર્જન',
    'schedule': 'શિડ્યુલ',
    'aarti': 'આરતી',
    'prasad': 'પ્રસાદ',
    'mahaprasad': 'મહાપ્રસાદ',
    'ganesh aagman': 'ગણેશ આગમન',
    'ganesh visarjan': 'ગણેશ વિસર્જન',
    'aagman day': 'આગમન દિવસ',
    'visarjan day': 'વિસર્જન દિવસ',
    'aagman & visarjan': 'આગમન અને વિસર્જન',
    'aagman and visarjan': 'આગમન અને વિસર્જન',
    'grand ganesh aagman': 'ભવ્ય ગણેશ આગમન',
    'grand visarjan': 'ભવ્ય વિસર્જન',
    'grand aagman': 'ભવ્ય આગમન',
    'devotee message & inquiries': 'ભક્ત સંદેશ અને પૂછપરછ',
    'devotee message and inquiries': 'ભક્ત સંદેશ અને પૂછપરછ',
    'send a message to yuva yuvak mandal admin committee for mahaprasad seva or volunteer inquiry.': 'મહાપ્રસાદ સેવા અથવા સ્વયંસેવક પૂછપરછ માટે યુવા યુવક મંડળ વ્યવસ્થાપક સમિતિને સંદેશ મોકલો.',
    'follow our official instagram page for daily hd live darshan, aarti videos, and celebration updates.': 'અમારા સત્તાવાર ઇન્સ્ટાગ્રામ પેજ સાથે જોડાઈને દૈનિક લાઈવ દર્શન અને રીલ્સ જુઓ.',
    'select inquiry': 'પૂછપરછ પસંદ કરો',
    'general inquiry': 'સામાન્ય પૂછપરછ',
    'mahaprasad seva': 'મહાપ્રસાદ સેવા',
    'volunteer registration': 'સ્વયંસેવક રજીસ્ટ્રેશન',
    'pandal visit inquiry': 'મંડપ દર્શન પૂછપરછ',
    'pandal address': 'પંડાલનું સરનામું',
    'map location & street view': 'નકશો અને સ્ટ્રીટ વ્યૂ',
    'map location and street view': 'નકશો અને સ્ટ્રીટ વ્યૂ',
    'map location': 'નકશો અને માર્ગદર્શન',
    'open in google maps': 'ગૂગલ મેપ્સમાં જુઓ',
    'join instagram community': 'ઇન્સ્ટાગ્રામ સાથે જોડાઓ',
    'yuva yuvak': 'યુવા યુવક',
    'yuva yuvak mandal': 'યુવા યુવક મંડળ',
    'yuva yuvak mandal 🚩': 'યુવા યુવક મંડળ',
    'ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002',
    'yuva yuvak mandal, ram nivas society, behind rajeshree hall, navsari bazaar, sagrampura, surat, gujarat - 395002': 'યુવા યુવક મંડળ, રામ નિવાસ સોસાયટી, રાજશ્રી હોલ પાછળ, નવસારી બજાર, સંગ્રામપુરા, સુરત, ગુજરાત - 395002',
    'respected idol sculptor • mumbai': 'આદરણીય મૂર્તિકાર - મુંબઈ',
    'respected idol sculptor - mumbai': 'આદરણીય મૂર્તિકાર - મુંબઈ',
    'crafted with devotion in mumbai • revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'crafted with devotion in mumbai and revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'crafted with devotion in mumbai, revered in surat ganesh-utsav': 'મુંબઈમાં ભક્તિ સાથે રચાયેલ અને સુરત ગણેશ-ઉત્સવમાં આદરણીય',
    'divine creation - our idol sculptor': 'દિવ્ય સર્જન - આપણા મૂર્તિકાર',
    'all rights reserved': 'સર્વ હક સુરક્ષિત',
    'all rights reserved.': 'સર્વ હક સુરક્ષિત.',
    'yuva yuvak mandal. all rights reserved': 'યુવા યુવક મંડળ. સર્વ હક સુરક્ષિત',
    'yuva yuvak mandal. all rights reserved.': 'યુવા યુવક મંડળ. સર્વ હક સુરક્ષિત.',
    'about us': 'અમારા વિશે',
    'about yuva yuvak mandal': 'યુવા યુવક મંડળ વિશે',
    'contact yuva yuvak mandal': 'યુવા યુવક મંડળ સંપર્ક વિગત',
    'surat, gujarat': 'સુરત, ગુજરાત',
    'shri ganesh utsav mahotsav • organised with devotion, grandeur and unity since 1968 in surat, gujarat.': 'શ્રી ગણેશ ઉત્સવ મહોત્સવ • સુરત, ગુજરાતમાં ૧૯૬૮ થી ભક્તિ, ભવ્યતા અને એકતા સાથે આયોજિત.',
    'shri ganesh utsav mahotsav - organised with devotion, grandeur and unity since 1968 in surat, gujarat.': 'શ્રી ગણેશ ઉત્સવ મહોત્સવ • સુરત, ગુજરાતમાં ૧૯૬૮ થી ભક્તિ, ભવ્યતા અને એકતા સાથે આયોજિત.',
    'devotee experiences & reviews': 'ભક્ત અનુભવ અને સમીક્ષાઓ',
    'devotee feedback & blessings': 'ભક્તોનો પ્રતિભાવ અને આશીર્વાદ',
    'share your divine experience and blessings of shri ganesh utsav mahotsav!': 'શ્રી ગણેશ ઉત્સવના આપના દિવ્ય અનુભવ અને આશીર્વાદ જણાવો!',
    'glorious celebrations': 'ગૌરવશાળી વર્ષો',
    'dedicated volunteers': 'સક્રિય સ્વયંસેવકો',
    'blessed devotees': 'દર્શનાર્થી ભક્તો',
    'view full schedule →': 'પૂરું શિડ્યુલ જુઓ →',
    'read full about us →': 'અમારા વિશે સંપૂર્ણ વિગત વાંચો →',
    'today\'s schedule': 'આજનું શિડ્યુલ',
    'no more schedule': 'આજનો કોઈ અન્ય કાર્યક્રમ બાકી નથી',
    'latest reels from instagram': 'ઇન્સ્ટાગ્રામ પરથી લેટેસ્ટ રીલ્સ',
    'divine photo & video gallery': 'દિવ્ય ફોટો અને વિડિયો ગેલેરી',
    'divine aarti & utsav schedule': 'દિવ્ય આરતી અને ઉત્સવ શિડ્યુલ',
    'sacred pandal address': 'પવિત્ર મંડપ સરનામું',
    'click to view': 'જોવા માટે ક્લિક કરો',
    'morning aarti': 'સવારની આરતી',
    'evening aarti': 'સાંજની આરતી',
    'morning aarti (subhah ki aarti)': 'સવારની આરતી',
    'evening maha aarti (shaam ki aarti)': 'સાંજની મહા આરતી',
    '50+ years glorious legacy': '50+ વર્ષનો ભવ્ય વારસો',
    'cultural mission & vision': 'સાંસ્કૃતિક મિશન અને વિઝન',
    'cultural mission and vision': 'સાંસ્કૃતિક મિશન અને વિઝન',
    'a glorious legacy of togetherness': 'એકતાનો ભવ્ય વારસો',
    'our mission is to preserve rich sanatan traditions, promote spiritual harmony, and empower youth through community leadership and divine service.': 'અમારું ધ્યેય સમૃદ્ધ સનાતન પરંપરાઓને જાળવી રાખવાનું, આધ્યાત્મિક સંવાદિતાને પ્રોત્સાહન આપવાનું અને સમુદાય નેતૃત્વ અને દૈવી સેવા દ્વારા યુવાનોને સશક્ત કરવાનું છે.',
    'this is more than just a celebration; it is a tradition of unity, devotion, and shared memories that brings our entire community together year after year.': 'આ માત્ર એક ઉજવણી કરતાં વધુ છે; તે એકતા, ભક્તિ અને સહિયારી યાદોની પરંપરા છે જે આપણા સમગ્ર સમુદાયને વર્ષ-દર વર્ષે સાથે લાવે છે.',
    'founded in 1968 by passionate youth of sagrampura, navsari bazaar, surat, yuva yuvak mandal has grown into one of the most respected ganesh utsav mandals in gujarat.': 'સગરામપુરા, નવસારી બજાર, સુરતના જુસ્સાદાર યુવાનો દ્વારા 1968માં સ્થપાયેલ, યુવા યુવક મંડળ ગુજરાતના સૌથી પ્રતિષ્ઠિત ગણેશ ઉત્સવ મંડળોમાંનું એક બની ગયું છે.',
    'inspired by the spirit of devotion, unity, and culture, yuva yuvak mandal has been organizing the ganesh utsav mahotsav since 1968.\nour mission is to preserve our rich cultural heritage, pass on the sacred traditions of ganesh utsav to the younger generation, and bring youth together through devotion, cultural values, and community unity.': 'ભક્તિ, એકતા અને સંસ્કૃતિની ભાવનાથી પ્રેરિત, યુવા યુવક મંડળ 1968 થી ગણેશ ઉત્સવ મહોત્સવનું આયોજન કરે છે.\nઅમારું ધ્યેય આપણા સમૃદ્ધ સાંસ્કૃતિક વારસાને સાચવવાનું, ગણેશ ઉત્સવની પવિત્ર પરંપરાઓને યુવા પેઢી સુધી પહોંચાડવાનું અને ભક્તિ, સાંસ્કૃતિક મૂલ્યો અને સમુદાય એકતા દ્વારા યુવાનોને સાથે લાવવાનું છે.',
    'preserving rich cultural heritage, serving humanity through blood donation & food distribution, and uniting youth in divine devotion since 1968.': 'સમૃદ્ધ સાંસ્કૃતિક વારસાની જાળવણી, રક્તદાન અને અન્ન વિતરણ દ્વારા માનવતાની સેવા કરવી અને 1968 થી યુવાનોને દૈવી ભક્તિમાં જોડવા.'
  }
};

function getGlossaryOverride(lang, text) {
  if (!text || !lang) return null;
  const l = String(lang).toUpperCase();
  if (!CLIENT_GLOSSARY[l]) return null;

  const raw = text.trim();
  const lower = raw.toLowerCase();
  const normNewlines = lower.replace(/\r\n/g, '\n');

  // 1. Direct dictionary match
  if (CLIENT_GLOSSARY[l][lower]) {
    return CLIENT_GLOSSARY[l][lower];
  }
  if (CLIENT_GLOSSARY[l][normNewlines]) {
    return CLIENT_GLOSSARY[l][normNewlines];
  }

  // 2. Normalized dashes & stripped trailing punctuation match
  const normalized = lower.replace(/[–—]/g, '-').replace(/[.!?🚩\s]+$/, '');
  if (CLIENT_GLOSSARY[l][normalized]) {
    return CLIENT_GLOSSARY[l][normalized];
  }
  const normBoth = normNewlines.replace(/[–—]/g, '-').replace(/[.!?🚩\s]+$/, '');
  if (CLIENT_GLOSSARY[l][normBoth]) {
    return CLIENT_GLOSSARY[l][normBoth];
  }

  // 3. Dynamic Date pattern e.g. "on 12-09-2026"
  const dateMatch = raw.match(/^on\s+(\d{2}-\d{2}-\d{4})$/i);
  if (dateMatch) {
    return l === 'GU' ? `${dateMatch[1]} ના રોજ` : `${dateMatch[1]} को`;
  }

  // 4. Dynamic Year count e.g. "50+ Years"
  const yearMatch = raw.match(/^(\d+\+)\s*years?$/i);
  if (yearMatch) {
    return l === 'GU' ? `${yearMatch[1]} વર્ષ` : `${yearMatch[1]} वर्ष`;
  }

  return null;
}

function postProcessTranslation(translatedText, lang) {
  if (!translatedText) return '';
  let res = String(translatedText);
  const l = String(lang).toUpperCase();
  if (l === 'GU') {
    // Fix Google Translate's funny transliteration of Aagman -> 'એગમેન'
    res = res.replace(/એગમેન/gi, 'આગમન');
    res = res.replace(/\bAagman\b/gi, 'આગમન');
    res = res.replace(/\bVisarjan\b/gi, 'વિસર્જન');
  } else if (l === 'HI') {
    res = res.replace(/\bAagman\b/gi, 'आगमन');
    res = res.replace(/\bVisarjan\b/gi, 'विसर्जन');
  }
  return res;
}

function getCached(lang, text) {
  if (!text || !text.trim()) return '';
  const clean = text.trim();
  const glossary = getGlossaryOverride(lang, clean);
  if (glossary) return glossary;

  const key = `${lang}:${clean}`;
  if (memoryCache.has(key)) {
    return postProcessTranslation(memoryCache.get(key), lang);
  }
  try {
    const stored = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (stored) {
      const cleaned = postProcessTranslation(stored, lang);
      memoryCache.set(key, cleaned);
      return cleaned;
    }

    // Check pre-translated siteData dictionary saved from backend
    const rawSiteData = localStorage.getItem('yuva_site_data');
    if (rawSiteData) {
      const parsed = JSON.parse(rawSiteData);
      const dict = parsed?.translations?.[lang];
      if (dict) {
        if (dict[clean]) {
          const cleaned = postProcessTranslation(dict[clean], lang);
          memoryCache.set(key, cleaned);
          return cleaned;
        }
        const normClean = clean.replace(/\r\n/g, '\n');
        if (dict[normClean]) {
          const cleaned = postProcessTranslation(dict[normClean], lang);
          memoryCache.set(key, cleaned);
          return cleaned;
        }
        const lowerClean = clean.toLowerCase();
        for (const [k, v] of Object.entries(dict)) {
          if (k.toLowerCase() === lowerClean || k.toLowerCase().replace(/\r\n/g, '\n') === normClean.toLowerCase()) {
            const cleaned = postProcessTranslation(v, lang);
            memoryCache.set(key, cleaned);
            return cleaned;
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

function setCached(lang, text, translation) {
  const cleaned = postProcessTranslation(translation, lang);
  const key = `${lang}:${text.trim()}`;
  memoryCache.set(key, cleaned);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, cleaned);
  } catch (e) {}
}

/**
 * Hook to dynamically translate any newly added or existing text from Admin CMS into Hindi or Gujarati
 */
export function useAutoTranslate(text, currentLang) {
  const cleanText = (text !== undefined && text !== null) ? String(text).trim() : '';
  const lang = currentLang || 'EN';

  const glossaryMatch = getGlossaryOverride(lang, cleanText);

  const [translated, setTranslated] = useState(() => {
    if (!cleanText || lang === 'EN') return cleanText;
    if (glossaryMatch) return glossaryMatch;
    if (lang === 'HI' && /[\u0900-\u097F]/.test(cleanText)) return cleanText;
    if (lang === 'GU' && /[\u0A80-\u0AFF]/.test(cleanText)) return cleanText;
    return getCached(lang, cleanText) || cleanText;
  });

  useEffect(() => {
    if (!cleanText || lang === 'EN') {
      setTranslated(cleanText);
      return;
    }

    if (glossaryMatch) {
      setTranslated(glossaryMatch);
      return;
    }

    if (lang === 'HI' && /[\u0900-\u097F]/.test(cleanText)) {
      setTranslated(cleanText);
      return;
    }

    if (lang === 'GU' && /[\u0A80-\u0AFF]/.test(cleanText)) {
      setTranslated(cleanText);
      return;
    }

    const cached = getCached(lang, cleanText);
    if (cached) {
      setTranslated(cached);
      return;
    }

    let isMounted = true;

    // Multi-tier Translation Engine:
    // 1. Google Translate GTX directly from browser (fastest ~40ms, zero server dependencies, unthrottled)
    // 2. Google Translate GTX sl=auto fallback
    // 3. Backend /api/translate proxy fallback
    async function executeAutoTranslate() {
      const tl = lang.toLowerCase();

      // Tier 1: Direct Google Translate GTX (sl=en)
      try {
        const urlEn = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const res = await fetch(urlEn);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            const trans = data[0].map(item => item[0]).join('');
            if (trans && trans.trim()) {
              const processed = postProcessTranslation(trans, lang);
              if (isMounted) {
                setCached(lang, cleanText, processed);
                setTranslated(processed);
              }
              return;
            }
          }
        }
      } catch (e) {}

      // Tier 2: Direct Google Translate GTX (sl=auto)
      try {
        const urlAuto = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const resAuto = await fetch(urlAuto);
        if (resAuto.ok) {
          const data = await resAuto.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            const trans = data[0].map(item => item[0]).join('');
            if (trans && trans.trim()) {
              const processed = postProcessTranslation(trans, lang);
              if (isMounted) {
                setCached(lang, cleanText, processed);
                setTranslated(processed);
              }
              return;
            }
          }
        }
      } catch (e) {}

      // Tier 3: Backend /api/translate proxy fallback
      try {
        const apiBase = getApiBaseUrl();
        const resBack = await fetch(`${apiBase}/api/translate?q=${encodeURIComponent(cleanText)}&to=${tl}`);
        if (resBack.ok) {
          const data = await resBack.json();
          if (data && data.translatedText) {
            const processed = postProcessTranslation(data.translatedText, lang);
            if (isMounted) {
              setCached(lang, cleanText, processed);
              setTranslated(processed);
            }
            return;
          }
        }
      } catch (e) {}
    }

    executeAutoTranslate();

    return () => {
      isMounted = false;
    };
  }, [cleanText, lang, glossaryMatch]);

  return translated || cleanText;
}

/**
 * Simple Component to dynamically translate and display any dynamic CMS text in JSX
 * Example: <h3><Translate text={item.title} /></h3>
 */
export function Translate({ text, fallback = '' }) {
  const { currentLang } = useContext(LanguageContext);
  const translated = useAutoTranslate(text, currentLang);
  return React.createElement(React.Fragment, null, translated || fallback || text || '');
}

export function getTranslatedField(siteData, field, currentLang, fallback = '') {
  if (!siteData) return fallback;
  return siteData[field] || fallback || '';
}

