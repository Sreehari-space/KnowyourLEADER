let rawStrings = [
  'Gold, 86.3 gms 11,78,426 11 Lacs+',
  'Gold Jewellery-1500 grams 2,10,00,000 2 Crore+ Silver Jewellery and Articles-37 kg 92,50,000 92 Lacs+',
  'Gold Jewelry 1050 Grams 1,47,00,000 1 Crore+ Silver Items 3 KG 7,50,000 7 Lacs+',
  '120 Grams of Gold 15,90,000 15 Lacs+',
  '250 Grams 35,00,000 35 Lacs+' // THIS ONE HAS NO MATERIAL. JUST "250 Grams".
];

rawStrings.forEach(rawJewelry => {
    let cleaned = rawJewelry.replace(/(?:Rs\.?\/?-?\s*)?[\d,.]+\s*(?:Lacs?\+?|Crores?\+?|Cr|Lakhs?|Lakh|Thou\+?|Thousand\+?)\b/gi, '');
    cleaned = cleaned.replace(/(?:Rs\.?\/?-?\s*)[\d,.]+\b/gi, '');
    cleaned = cleaned.replace(/\b\d{5,}\b/g, ''); 
    cleaned = cleaned.replace(/\b\d{1,3}(?:,\d{2,3})+\b/g, '');

    cleaned = cleaned.replace(/[,-]/g, ' ');
    cleaned = cleaned.replace(/\bof\b/gi, ' ');
    cleaned = cleaned.replace(/\band\b/gi, ' ');
    cleaned = cleaned.replace(/\bitems?\b/gi, ' ');
    cleaned = cleaned.replace(/\barticles?\b/gi, ' ');
    cleaned = cleaned.replace(/\b(gold|silver|diamond|platinum)\s+(?:jeweller[a-z]*|jewelry|jewels?)\b/gi, '$1');

    const regex = /((?:\d+[.,]?\d*\s*(?:grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?)\s*)?(?:gold|silver|diamond|platinum|jeweller[a-z]*|jewel|vairam|thangam)\s*(?:\d+[.,]?\d*\s*(?:grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?))?)/gi;
    const matches = cleaned.match(regex);

    if (matches) {
        let jewelry = matches.map((m, i) => {
            let text = m.trim();
            let materialMatch = text.match(/(gold|silver|diamond|platinum|jeweller[a-z]*|jewel)/i);
            let material = materialMatch ? materialMatch[0].toUpperCase() : 'JEWELRY';
            
            let weightMatch = text.match(/(\d+[.,]?\d*)\s*(grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?)/i);
            let weight = weightMatch ? `${weightMatch[1]}${weightMatch[2].toLowerCase()}` : '';
            
            return weight ? `${i + 1}. ${material} - ${weight}` : `${i + 1}. ${material}`;
        }).join(' ');
        console.log('=>', jewelry);
    } else {
        // Fallback for "250 Grams" (no material)
        let fallbackMatch = cleaned.match(/(\d+[.,]?\d*)\s*(grams?|gms?|kg|soverigns?|sovereigns?|ct|carrots?|carats?)/i);
        if (fallbackMatch) {
            console.log('=> 1. JEWELRY - ' + fallbackMatch[1] + fallbackMatch[2].toLowerCase());
        } else {
            console.log('=> NO MATCH for:', cleaned);
        }
    }
});
