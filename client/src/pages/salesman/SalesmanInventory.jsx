import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../../api/axios';
import SearchInput from '../../components/ui/SearchInput';
import { PRODUCT_CATEGORIES } from '../../constants';

const API_BASE =
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  'http://localhost:5000';

// Sub-component for Grouped Product Card
function ProductCard({ group }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedProduct = group.subtypes[selectedIdx] || group.subtypes[0];

  const isLow = selectedProduct.quantity <= selectedProduct.reorderLevel;
  const isOut = selectedProduct.quantity === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg hover:border-primary-100 transition-all duration-300 group flex flex-col justify-between">
      {/* Card Image Block */}
      <div>
        <div className="relative aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
          {selectedProduct.image ? (
            <img
              src={`${API_BASE}${selectedProduct.image}`}
              alt={group.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const localPath = `${window.location.origin}${selectedProduct.image}`;
                if (e.target.src !== localPath) {
                  e.target.src = selectedProduct.image;
                } else {
                  e.target.src = '/placeholder-product.png';
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={60} />
            </div>
          )}

          {/* Stock Status Badge */}
          <div
            className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isOut
                ? 'bg-red-500 text-white'
                : isLow
                  ? 'bg-orange-500 text-white'
                  : 'bg-green-500 text-white'
            }`}
          >
            {isOut ? 'Out' : isLow ? 'Low' : 'In Stock'}
          </div>
        </div>

        {/* Details Block */}
        <div className="p-4 space-y-3">
          {/* Category */}
          <div>
            <span className="text-[9px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {group.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {group.name}
          </h3>

          {/* HSN Code */}
          <p className="text-[10px] text-gray-400 font-medium">
            {selectedProduct.hsnCode ? `HSN: ${selectedProduct.hsnCode}` : 'No HSN'}
          </p>

          {/* Subtypes dropdown selector */}
          {group.subtypes.length > 1 ? (
            <div className="space-y-1 pt-1">
              <label className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Select Variant</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-gray-50 hover:bg-white focus:border-primary-400 focus:bg-white focus:ring-1 focus:ring-primary-400 transition-all cursor-pointer outline-none"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
              >
                {group.subtypes.map((sub, idx) => (
                  <option key={sub._id} value={idx}>
                    {sub.subtypeName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100 font-semibold truncate">
              Variant: {selectedProduct.subtypeName}
            </div>
          )}
        </div>
      </div>

      {/* Stock & Price Footer */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div>
          <p className="text-lg font-black text-primary-600">
            ₹{selectedProduct.sellingPrice?.toLocaleString('en-IN')}
          </p>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            + {selectedProduct.gstPercentage}% GST
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-sm font-black ${
              isOut
                ? 'text-red-600'
                : isLow
                  ? 'text-orange-600'
                  : 'text-gray-800'
            }`}
          >
            {selectedProduct.quantity} {formatUnit(selectedProduct.unit)}
          </p>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            Stock Qty
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: unit abbreviation display ──────────────────────────────────────
function formatUnit(unit) {
  const map = {
    'Meter': 'MTR', 'meter': 'MTR',
    'Piece': 'PCS', 'piece': 'PCS',
    'NOS': 'PCS', 'nos': 'PCS',
    'Box': 'Box',
    'KG': 'KG', 'kg': 'KG',
    'Liter': 'LTR', 'liter': 'LTR',
    'Set': 'Set',
    'Pair': 'Pair',
    'Roll': 'Roll',
    'Packet': 'Pkt',
  };
  return map[unit] || unit || 'PCS';
}

// ─── Helper: longest common word-level prefix ────────────────────────────────
function commonWordPrefix(a, b) {
  const wa = a.trim().toUpperCase().split(/\s+/);
  const wb = b.trim().toUpperCase().split(/\s+/);
  let i = 0;
  while (i < wa.length && i < wb.length && wa[i] === wb[i]) i++;
  // Return the prefix using original casing from `a`
  return a.trim().split(/\s+/).slice(0, i).join(' ');
}

// Helper to tokenize strings for natural numeric sorting (handles integers, decimals, fractions like 1/2, and text)
function tokenize(str) {
  const s = (str || '').toLowerCase().trim();
  const regex = /(\d+\/\d+|\d+(?:\.\d+)?|\D+)/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(s)) !== null) {
    const part = match[0];
    if (/^\d+\/\d+$/.test(part)) {
      const [num, den] = part.split('/').map(Number);
      tokens.push({ type: 'number', val: den !== 0 ? num / den : 0, raw: part });
    } else if (/^\d+(?:\.\d+)?$/.test(part)) {
      tokens.push({ type: 'number', val: parseFloat(part), raw: part });
    } else {
      tokens.push({ type: 'text', val: part, raw: part });
    }
  }
  return tokens;
}

// Compare two strings naturally
function naturalCompare(a, b) {
  const poleOrder = {
    'single pole mcb': 1,
    'double pole mcb': 2,
    'duble pole mcb': 2,
    'three pole mcb': 3,
    'triple pole mcb': 3,
    'four pole mcb': 4
  };
  const valA = (a || '').toString().toLowerCase().trim();
  const valB = (b || '').toString().toLowerCase().trim();
  if (poleOrder[valA] !== undefined && poleOrder[valB] !== undefined) {
    return poleOrder[valA] - poleOrder[valB];
  }

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const len = Math.max(tokensA.length, tokensB.length);
  for (let i = 0; i < len; i++) {
    const tA = tokensA[i];
    const tB = tokensB[i];
    if (tA === undefined) return -1;
    if (tB === undefined) return 1;

    if (tA.type === 'number' && tB.type === 'number') {
      if (tA.val !== tB.val) {
        return tA.val - tB.val;
      }
    } else if (tA.type === 'text' && tB.type === 'text') {
      const cmp = tA.val.localeCompare(tB.val, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    } else {
      return tA.type === 'number' ? -1 : 1;
    }
  }
  return 0;
}

// ─── Smart 2-Pass Grouping Engine ────────────────────────────────────────────
// Pass 1A: scan all products per category to build a shared-prefix lookup table.
// Pass 1B: parse each product → { mainName, subtypeName } using:
//   1. Explicit named rules (MCB, Bearings, Hoses, etc.)
//   2. Structural separators ( - , _)
//   3. Trailing numeric-unit size suffix
//   4. General shared-prefix engine (catches JOLLY WORM DRIVE, PAKAD, etc.)
// Pass 2:  group by (category + mainName) → array of card groups.
function buildGroupedProducts(list) {
  if (!list || !Array.isArray(list) || list.length === 0) return [];

  // ── Pass 1A: build prefix lookup map ────────────────────────────────────────
  const byCategory = {};
  list.forEach(p => {
    if (!p || !p.name) return;
    const cat = p.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p.name.trim());
  });

  // prefixMap: "CATEGORY|||fullName" → { mainName, subtypeName }
  const prefixMap = {};

  Object.entries(byCategory).forEach(([cat, names]) => {
    // Count how many products share each common prefix
    const prefixCount = {};
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const pfx = commonWordPrefix(names[i], names[j]);
        if (
          pfx.length >= 3 &&
          pfx.toUpperCase() !== names[i].toUpperCase() &&
          pfx.toUpperCase() !== names[j].toUpperCase()
        ) {
          prefixCount[pfx.toUpperCase()] = (prefixCount[pfx.toUpperCase()] || 0) + 1;
        }
      }
    }

    names.forEach(name => {
      const mapKey = `${cat}|||${name}`;
      const nameUpper = name.toUpperCase();
      // Find all prefixes that are a strict prefix of this name
      const candidates = Object.keys(prefixCount).filter(pfxUpper =>
        nameUpper.startsWith(pfxUpper) &&
        nameUpper.length > pfxUpper.length &&
        (nameUpper[pfxUpper.length] === ' ' || nameUpper[pfxUpper.length] === '_') &&
        prefixCount[pfxUpper] >= 1
      );
      if (candidates.length > 0) {
        // Use the longest matching prefix
        const bestPfxUpper = candidates.reduce((a, b) => a.length >= b.length ? a : b);
        // Recover original-case mainName from the name string
        const mainName = name.substring(0, bestPfxUpper.length).trim();
        const suffix = name.substring(bestPfxUpper.length).trim().replace(/^[-_\s]+/, '');
        prefixMap[mapKey] = { mainName, subtypeName: suffix || 'Standard' };
      }
    });
  });

  // ── Pass 1B: classify every product ─────────────────────────────────────────
  const parsed = list.map(p => {
    if (!p || !p.name) return null;
    const name = p.name.trim();
    const U = name.toUpperCase();
    let mainName = name;
    let subtypeName = 'Standard';

    // ── 1. MCB (exclude MCB Accessories) ───────────────────────────────────────
    if (U.includes('MCB') && !U.includes('ACCESSOR')) {
      let v = name;
      if (U.includes('SINGLE')) v = 'Single Pole MCB';
      else if (U.includes('DUBLE') || U.includes('DOUBLE')) v = 'Double Pole MCB';
      else if (U.includes('THREE') || U.includes('TRIPLE')) v = 'Three Pole MCB';
      else if (U.includes('FOUR')) v = 'Four Pole MCB';
      mainName = 'MCB'; subtypeName = v;
    }
    // ── 1b. MCB Accessories (16amp 3P2N, 32amp 5P2N etc.) ─────────────────────
    else if (U.includes('MCB') && U.includes('ACCESSOR')) {
      const suffix = name.replace(/MCB ACCESSORIES?/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'MCB Accessories'; subtypeName = suffix || 'Standard';
    }
    // ── 1c. Schneider Contactor ───────────────────────────────────────────────
    else if (U.includes('SCHNEIDER')) {
      const suffix = name.replace(/SCHNEIDER CONT[AE]CTOR?/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Schneider Contactor'; subtypeName = suffix || 'Standard';
    }
    // ── 2. Switches & Indicators ──────────────────────────────────────────────
    else if (U === 'INDICATOR' || U === 'PUSH BUTTON' || U.includes('EMERGENCY STOP') || U.includes('SELECTOR SWITCH')) {
      let v = name;
      if (U === 'INDICATOR') v = 'Indicator';
      else if (U === 'PUSH BUTTON') v = 'Push Button';
      else if (U.includes('EMERGENCY STOP')) v = 'Emergency Stop Button';
      else if (U.includes('SELECTOR SWITCH')) v = 'Selector Switch';
      mainName = 'Switches & Indicators'; subtypeName = v;
    }
    // ── 3. Relay Series ───────────────────────────────────────────────────────
    else if (U.includes('AM 91') || U === 'VAF' || U.includes('P2P') || U.includes('AM 93') || U.includes('MPR 932')) {
      let v = name;
      if (U.includes('AM 91')) v = 'AM 91 / VM 91';
      else if (U === 'VAF') v = 'VAF';
      else if (U.includes('P2P')) v = 'P2P 912 / 712 / 412';
      else if (U.includes('AM 93')) v = 'AM 93 / VM 93';
      else if (U.includes('MPR 932')) v = 'MPR 932';
      mainName = 'Relay Series'; subtypeName = v;
    }
    // ── 4. Protection Devices ─────────────────────────────────────────────────
    else if ((U.includes('ELCB') && U.includes('POL')) || (U.includes('AVM') && U.includes('POL'))) {
      mainName = 'Protection Devices';
      subtypeName = U.includes('ELCB') ? 'ELCB 2 POL' : 'AVM 2 POL';
    }
    // ── 4b. Contactor (non-Schneider) ─────────────────────────────────────────
    else if (U.includes('CONTACTOR') || U.includes('CONTECTOR')) {
      const suffix = name.replace(/CONT[AE]CTOR?/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Contactor'; subtypeName = suffix || 'Standard';
    }
    // ── 5. Spiral Sleeve ──────────────────────────────────────────────────────
    else if (U.includes('SPYRAL') || U.includes('SPIRAL')) {
      const m = name.match(/(\d+mm)/i);
      mainName = 'Spiral'; subtypeName = m ? m[1] : 'Standard';
    }
    // ── 5b. TRY SMALL ─────────────────────────────────────────────────────────
    else if (U.startsWith('TRY SMALL')) {
      const suffix = name.replace(/TRY SMALL/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'TRY SMALL'; subtypeName = suffix || 'Standard';
    }
    // ── 5c. TRY BIG ───────────────────────────────────────────────────────────
    else if (U.startsWith('TRY BIG')) {
      const suffix = name.replace(/TRY BIG/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'TRY BIG'; subtypeName = suffix || 'Standard';
    }
    // ── 5d. Cable Tie ─────────────────────────────────────────────────────────
    else if (U.includes('CABLE TIE')) {
      const suffix = name.replace(/CABLE TIE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Cable Tie'; subtypeName = suffix || 'Standard';
    }
    // ── 5e. Connector (standalone wiring connectors, not lock) ────────────────
    else if (U.startsWith('CONNECTOR') && !U.includes('LOCK')) {
      const suffix = name.replace(/CONNECTOR/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Connector'; subtypeName = suffix || 'Standard';
    }
    // ── 5f. R2NR ──────────────────────────────────────────────────────────────
    else if (U.startsWith('R2NR')) {
      const suffix = name.replace(/R2NR/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'R2NR'; subtypeName = suffix || 'Standard';
    }
    // ── 5g. AW (cable lug) ────────────────────────────────────────────────────
    else if (/^AW\s*[-–]/.test(name) || U.startsWith('AW ')) {
      const suffix = name.replace(/^AW/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'AW'; subtypeName = suffix || 'Standard';
    }
    // ── 5h. A2V ───────────────────────────────────────────────────────────────
    else if (U.startsWith('A2V')) {
      const suffix = name.replace(/A2V/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'A2V'; subtypeName = suffix || 'Standard';
    }
    // ── 5i. Fan ───────────────────────────────────────────────────────────────
    else if (U.startsWith('FAN ') || U === 'FAN') {
      const suffix = name.replace(/FAN/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Fan'; subtypeName = suffix || 'Standard';
    }
    // ── 5j. Plastic Wire Tray ─────────────────────────────────────────────────
    else if (U.includes('PLASTIC WIRE TRAY') || U.includes('WIRE TRAY')) {
      const suffix = name.replace(/PLASTIC WIRE TRAY/gi, '').replace(/WIRE TRAY/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Plastic Wire Tray'; subtypeName = suffix || 'Standard';
    }
    // ── 5k. F.T.I ─────────────────────────────────────────────────────────────
    else if (U.startsWith('F.T.I')) {
      const suffix = name.replace(/F\.T\.I/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'F.T.I'; subtypeName = suffix || 'Standard';
    }
    // ── 7. Spherical Bearing ──────────────────────────────────────────────────
    else if (U.startsWith('BEARING 22211') || U.startsWith('BEARING 22217')) {
      let v = '22211';
      if (U.includes('22211 K') || U.includes('22211K')) v = '22211 K';
      else if (U.includes('22211')) v = '22211';
      else if (U.includes('22217 K') || U.includes('22217K')) v = '22217 K';
      else if (U.includes('22217')) v = '22217';
      mainName = 'Spherical Bearing'; subtypeName = v;
    }
    // ── 8. Bearing Series 6000 / 6200 / 6300 ─────────────────────────────────
    else if (U.startsWith('BEARING ')) {
      const m = name.match(/^BEARING\s+(\d+)\s*[_\s-]*\s*(.*)/i);
      if (m) {
        const num = m[1];
        const suffix = m[2].trim().replace(/^_/, '').replace(/_/g, ' ');
        const series = num.substring(0, 2) + '00';
        mainName = `Bearing Series ${series}`;
        subtypeName = `${num}${suffix ? ' ' + suffix : ''}`.trim();
      }
    }
    // ── 9. PVC Braided Hose ───────────────────────────────────────────────────
    else if (U.includes('PVC BRADIED') || U.includes('PVC BRAIDED')) {
      const suffix = name.replace(/PVC BR[AI]+DIED?/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'PVC Braided Hose'; subtypeName = suffix || 'Standard';
    }
    // ── 10. Pneumatic Rubber Hose ─────────────────────────────────────────────
    else if (U.includes('PNEUMATIC') && U.includes('RUBBER') && U.includes('HOSE')) {
      const suffix = name.replace(/PNEUMATIC RUBBER HOSE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Pneumatic Rubber Hose'; subtypeName = suffix || 'Standard';
    }
    // ── 11. Samson PVC Braided Hose ───────────────────────────────────────────
    else if (U.includes('SAMSON PVC') && U.includes('HOSE')) {
      const size = name.replace(/SAMSON PVC BR[AI]+DIED HOSE/gi, '').trim().replace(/^[-_\s]+/, '').replace(/_/g, ' ');
      mainName = 'Samson PVC Braided Hose'; subtypeName = size || 'Standard';
    }
    // ── 12. Samson Thermo Acty ────────────────────────────────────────────────
    else if (U.includes('SAMSON THERMO ACTY')) {
      let v = name.replace(/SAMSON THERMO ACTY/gi, '').trim().replace(/^[-_\s]+/, '');
      if (U.includes('BLACK')) v = U.includes('6MM') ? 'Black 6MM' : 'Black 8MM';
      else if (U.includes('RED')) v = 'Red 8MM';
      else if (U.includes('BLUE')) v = 'Blue 8MM';
      mainName = 'Samson Thermo Acty'; subtypeName = v;
    }
    // ── 13. Regulators ────────────────────────────────────────────────────────
    else if (U.includes('REGULATOR') && (U.includes('CO2') || U.includes('OXYGEN') || U.includes('NITROGEN') || U.includes('ACETYLENE') || U.includes('ARGON'))) {
      let v = 'Regulator';
      if (U.includes('CO2')) v = 'CO2';
      else if (U.includes('OXYGEN')) v = 'Oxygen';
      else if (U.includes('NITROGEN')) v = 'Nitrogen';
      else if (U.includes('ACETYLENE')) v = 'Acetylene';
      else if (U.includes('ARGON')) v = 'Argon';
      mainName = 'Regulators'; subtypeName = `${v} Regulator`;
    }
    // ── 14. Ganga R6 Rubber Hose ──────────────────────────────────────────────
    else if (U.includes('GANGA R6 RUBBER HOSE')) {
      const m = name.match(/(\d+MM|\d+\s*MM)/i);
      mainName = 'Ganga R6 Rubber Hose'; subtypeName = m ? m[1].toUpperCase() : 'Standard';
    }
    // ── 15. Samson High Pressure Hose ─────────────────────────────────────────
    else if (U.includes('SAMSON HIGH PRESSURE HOSE')) {
      const m = name.match(/(\d+MM|\d+\s*MM)/i);
      mainName = 'Samson High Pressure Hose'; subtypeName = m ? m[1].toUpperCase() : '8MM';
    }
    // ── 16. LPG Rubber Hose ───────────────────────────────────────────────────
    else if (U.includes('LPG RUBBER HOSE')) {
      const m = name.match(/(\d+MM|\d+\s*MM)/i);
      mainName = 'LPG Rubber Hose'; subtypeName = m ? m[1].toUpperCase() : '8MM';
    }
    // ── 17. Jolly Worm Drive Hose Clips ──────────────────────────────────────
    else if (U.includes('WORM DRIVE HOSE CLIPS')) {
      const suffix = name.replace(/JOLLY WORM DRIVE HOSE CLIPS/gi, '').replace(/WORM DRIVE HOSE CLIPS/gi, '').trim().replace(/^[-_\s]+/, '');
      mainName = 'Jolly Worm Drive Hose Clips'; subtypeName = suffix || 'Standard';
    }
    // ── H1. ABC Fire Extinguisher ────────────────────────────────────────────
    else if (U.includes('FIRE EXTINGUISHER') || U.includes('EXTINGUISHER')) {
      const suffix = name.replace(/ABC FIRE EXTINGUISHERS?/gi, '').replace(/FIRE EXTINGUISHERS?/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'ABC Fire Extinguisher'; subtypeName = suffix || 'Standard';
    }
    // ── H2. Fire Safety (Fire Stop / Fire Ball) ──────────────────────────────
    else if (U.includes('FIRE STOP') || U.includes('FIRE BALL')) {
      mainName = 'Fire Safety';
      subtypeName = U.includes('FIRE STOP') ? 'Fire Stop' : 'Fire Ball';
    }
    // ── H3. LPG Adaptor Multipoint ───────────────────────────────────────────
    else if (U.includes('LPG ADAPTOR') || U.includes('LPG ADAPTER')) {
      const suffix = name.replace(/LPG ADAPT[OE]R MULTIPOINT/gi, '').replace(/LPG ADAPT[OE]R/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'LPG Adaptor Multipoint'; subtypeName = suffix || 'Standard';
    }
    // ── H4. LPG Variable High Pressure Regulator ─────────────────────────────
    else if (U.includes('LPG VARIABLE') || U.includes('HIGH PRESSURE REGULATOR')) {
      const suffix = name.replace(/LPG VARIABLE HIGH PRESSURE REGULATOR/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'LPG Variable High Pressure Regulator'; subtypeName = suffix || 'Standard';
    }
    // ── H5. Pragati Regulator ────────────────────────────────────────────────
    else if (U.includes('PRAGATI')) {
      const suffix = name.replace(/PRAGATI REGULATOR/gi, '').replace(/PRAGATI/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Pragati Regulator'; subtypeName = suffix || 'Standard';
    }
    // ── H6. M S Bush ─────────────────────────────────────────────────────────
    else if (U.includes('M S BUSH') || U.includes('MS BUSH')) {
      const suffix = name.replace(/M\s*S\s*BUSH/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Bush'; subtypeName = suffix || 'Standard';
    }
    // ── H7. Brass Nut Nipple ─────────────────────────────────────────────────
    else if (U.includes('BRASS NUT NIPPLE')) {
      const suffix = name.replace(/BRASS NUT NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Brass Nut Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H8. LP Cap ───────────────────────────────────────────────────────────
    else if (U.startsWith('LP CAP')) {
      const suffix = name.replace(/LP CAP/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'LP Cap'; subtypeName = suffix || 'Standard';
    }
    // ── H9. LP Nut Nipple ────────────────────────────────────────────────────
    else if (U.includes('LP NUT NIPPLE')) {
      const suffix = name.replace(/LP NUT NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'LP Nut Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H10. M S Hex Nipple ──────────────────────────────────────────────────
    else if (U.includes('M S HEX NIPPLE') || U.includes('MS HEX NIPPLE')) {
      const suffix = name.replace(/M\s*S\s*HEX NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Hex Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H11. SS 304 Hex Nipple ───────────────────────────────────────────────
    else if (U.includes('SS 304 HEX NIPPLE') || U.includes('SS304 HEX NIPPLE')) {
      const suffix = name.replace(/SS\s*304\s*HEX NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'SS 304 Hex Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H12. M S Female Tee ──────────────────────────────────────────────────
    else if (U.includes('M S FEMALE TEE') || U.includes('MS FEMALE TEE')) {
      const suffix = name.replace(/M\s*S\s*FEMALE TEE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Female Tee'; subtypeName = suffix || 'Standard';
    }
    // ── H13. M S Male Elbow ──────────────────────────────────────────────────
    else if (U.includes('M S MALE ELBOW') || U.includes('MS MALE ELBOW')) {
      const suffix = name.replace(/M\s*S\s*MALE ELBOW/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Male Elbow'; subtypeName = suffix || 'Standard';
    }
    // ── H14. M S Female Elbow ────────────────────────────────────────────────
    else if (U.includes('M S FEMALE ELBOW') || U.includes('MS FEMALE ELBOW') || U.includes('FE MALE ELBOW')) {
      const suffix = name.replace(/M\s*S\s*FEMALE ELBOW/gi, '').replace(/FE MALE ELBOW/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Female Elbow'; subtypeName = suffix || 'Standard';
    }
    // ── H15. M S Male Tee ────────────────────────────────────────────────────
    else if (U.includes('M S MALE TEE') || U.includes('MS MALE TEE')) {
      const suffix = name.replace(/M\s*S\s*MALE TEE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Male Tee'; subtypeName = suffix || 'Standard';
    }
    // ── H16. M S Long Nipple ─────────────────────────────────────────────────
    else if (U.includes('M S LONG NIPPLE') || U.includes('MS LONG NIPPLE')) {
      const suffix = name.replace(/M\s*S\s*LONG NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Long Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H17. M S Dead Plug ───────────────────────────────────────────────────
    else if (U.includes('M S DEAD PLUG') || U.includes('MS DEAD PLUG')) {
      const suffix = name.replace(/M\s*S\s*DEAD PLUG/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Dead Plug'; subtypeName = suffix || 'Standard';
    }
    // ── H18. SS 304 Coupling ─────────────────────────────────────────────────
    else if (U.includes('SS 304 COUPLING') || U.includes('SS304 COUPLING')) {
      const suffix = name.replace(/SS\s*304\s*COUPLING/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'SS 304 Coupling'; subtypeName = suffix || 'Standard';
    }
    // ── H19. PU Male Connector ───────────────────────────────────────────────
    else if (U.includes('PU MALE CONNECTOR')) {
      const suffix = name.replace(/PU MALE CONNECTOR/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'PU Male Connector'; subtypeName = suffix || 'Standard';
    }
    // ── H20. PU Tee ──────────────────────────────────────────────────────────
    else if (U.includes('PU TEE')) {
      const suffix = name.replace(/PU TEE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'PU Tee'; subtypeName = suffix || 'Standard';
    }
    // ── H21. PU Joint ────────────────────────────────────────────────────────
    else if (U.includes('PU JOINT')) {
      const suffix = name.replace(/PU JOINT/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'PU Joint'; subtypeName = suffix || 'Standard';
    }
    // ── H22. PU Pipe ─────────────────────────────────────────────────────────
    else if (U.includes('PU PIPE')) {
      const suffix = name.replace(/PU PIPE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'PU Pipe'; subtypeName = suffix || 'Standard';
    }
    // ── H23. Brass Male Hose Nipple ──────────────────────────────────────────
    else if (U.includes('BRASS MALE HOSE NIPPLE')) {
      const suffix = name.replace(/BRASS MALE HOSE NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Brass Male Hose Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H24. Brass Female Hose Nipple ────────────────────────────────────────
    else if (U.includes('BRASS FEMALE HOSE NIPPLE')) {
      const suffix = name.replace(/BRASS FEMALE HOSE NIPPLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Brass Female Hose Nipple'; subtypeName = suffix || 'Standard';
    }
    // ── H25. Car Washing Nozzle ──────────────────────────────────────────────
    else if (U.includes('CAR WASHING NOZZLE') || U.includes('CAR WASH NOZZLE')) {
      const suffix = name.replace(/CAR WASHING NOZZLE/gi, '').replace(/CAR WASH NOZZLE/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Car Washing Nozzle'; subtypeName = suffix || 'Standard';
    }
    // ── H26. M S Socket ──────────────────────────────────────────────────────
    else if (U.includes('M S SOCKET') || U.includes('MS SOCKET')) {
      const suffix = name.replace(/M\s*S\s*SOCKET/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'M S Socket'; subtypeName = suffix || 'Standard';
    }
    // ── H27. Healtfo Faulet ──────────────────────────────────────────────────
    else if (U.includes('HEALTFO') || U.includes('FAULET')) {
      const suffix = name.replace(/HEALTFO FAULET/gi, '').replace(/HEALTFO/gi, '').trim().replace(/^[-\s]+/, '');
      mainName = 'Healtfo Faulet'; subtypeName = suffix || 'Standard';
    }
    // ── 18. Consumable Abrasive Wheels & Discs ─────────────────────────────────
    else if (U.includes('FLAP DISC')) {
      mainName = 'Flap Disc';
      subtypeName = name.replace(/FLAP DISC/gi, '').replace(/\s+/g, ' ').trim() || 'Standard';
    }
    else if (U.includes('MOP WHEEL')) {
      mainName = 'Mop Wheel';
      subtypeName = name.replace(/MOP WHEEL/gi, '').replace(/\s+/g, ' ').trim() || 'Standard';
    }
    else if (U.includes('CUT OFF WHEEL') || U.includes('CUT OF WHEEL')) {
      mainName = 'Cut Off Wheel';
      subtypeName = name.replace(/CUT O[F]+\s*WHEEL/gi, '').replace(/\s+/g, ' ').trim() || 'Standard';
    }
    else if (U.includes('DC WHEEL')) {
      mainName = 'DC Wheel';
      subtypeName = name.replace(/DC WHEEL/gi, '').replace(/\s+/g, ' ').trim() || 'Standard';
    }

    // ── 19. UCP / UCF / UCFL / UCT Bearing Housing (explicit, before separators) ───
    else if (/^(UCP|UCF|UCFL|UCT)\s+\d+/i.test(name)) {
      const m = name.match(/^(UCP|UCF|UCFL|UCT)\s+(.*)/i);
      mainName = `${m[1].toUpperCase()} Bearing Housing`;
      subtypeName = m[2].trim() || 'Standard';
    }

    // ── Structural separator: " - " ───────────────────────────────────────────
    else if (name.includes(' - ')) {
      const parts = name.split(' - ');
      mainName = parts[0].trim();
      subtypeName = parts.slice(1).join(' - ').trim();
    }
    // ── Structural separator: "_" ─────────────────────────────────────────────
    else if (name.includes('_')) {
      const parts = name.split('_');
      mainName = parts[0].trim();
      subtypeName = parts.slice(1).join('_').replace(/_/g, ' ').trim();
    }
    // ── General trailing numeric-unit size ────────────────────────────────────
    else {
      const sizeRegex = /\s+((?:\d+(?:\.\d+)?|\d+\/\d+|\d+\.\d+\/\d+)\s*(?:MM|KG|MTR|METER|INCH|LTR|LITER|Nos|PCS|Pcs|Amp|A|HP|V|W|")(?:\s+.*)?)$/i;
      const dimRegex  = /\s+((?:\d+(?:\.\d+)?|\d+\/\d+|\d+\.\d+\/\d+)"?\s*X\s*(?:\d+(?:\.\d+)?|\d+\/\d+|\d+\.\d+\/\d+).*)$/i;

      let sizeMatched = false;
      let m = name.match(dimRegex);
      if (m) {
        const suffix = m[1];
        const base = name.slice(0, name.lastIndexOf(suffix)).trim();
        if (base.length > 2) { mainName = base; subtypeName = suffix; sizeMatched = true; }
      }
      if (!sizeMatched) {
        m = name.match(sizeRegex);
        if (m) {
          const suffix = m[1];
          const base = name.slice(0, name.lastIndexOf(suffix)).trim();
          if (base.length > 2) { mainName = base; subtypeName = suffix; sizeMatched = true; }
        }
      }
      // ── General shared-prefix engine (last resort) ────────────────────────
      if (!sizeMatched) {
        const prefixKey = `${p.category}|||${name}`;
        if (prefixMap[prefixKey]) {
          mainName = prefixMap[prefixKey].mainName;
          subtypeName = prefixMap[prefixKey].subtypeName;
        }
      }
    }

    return { ...p, _mainName: mainName, _subtypeName: subtypeName || 'Standard' };
  }).filter(Boolean);

  // ── Pass 2: group into card objects ─────────────────────────────────────────
  const groups = {};
  parsed.forEach(p => {
    const key = `${p.category}_${p._mainName}`;
    if (!groups[key]) {
      groups[key] = { name: p._mainName, category: p.category, subtypes: [] };
    }
    groups[key].subtypes.push({ ...p, subtypeName: p._subtypeName });
  });

  const sortedGroups = Object.values(groups).map(group => {
    // Sort subtypes within each group in ascending order of their size
    group.subtypes.sort((a, b) => naturalCompare(a.subtypeName, b.subtypeName));
    return group;
  });

  // Sort groups:
  // 1. First by category (Electrical, Hydraulic, Bearing, Consumable order)
  // 2. Then by product name (name) naturally
  sortedGroups.sort((a, b) => {
    const catOrder = ['Electrical', 'Hydraulic', 'Bearing', 'Consumable'];
    const idxA = catOrder.indexOf(a.category);
    const idxB = catOrder.indexOf(b.category);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return naturalCompare(a.name, b.name);
  });

  return sortedGroups;
}

export default function SalesmanInventory() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', {
        params: {
          limit: 2000,
          status: 'active',
        },
      })
      .then((r) => setAllProducts(r.data?.data || []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = allProducts.filter(p => {
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      p.productId?.toLowerCase().includes(search.toLowerCase().trim()) ||
      p.hsnCode?.toLowerCase().includes(search.toLowerCase().trim()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const groupedProducts = buildGroupedProducts(filteredProducts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-500 mt-1">View available products and stock levels</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search products..."
          value={search}
          onChange={setSearch}
          className="flex-1 min-w-48"
        />
        <select
          className="border rounded-xl px-3 py-2 w-48 text-sm font-semibold bg-white cursor-pointer select-field"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border">
              <div className="h-52 bg-gray-50" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : groupedProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-2xl border">
            <Package size={50} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No products found in this selection</p>
          </div>
        ) : (
          groupedProducts.map((group) => (
            <ProductCard key={`${group.category}_${group.name}`} group={group} />
          ))
        )}
      </div>
    </div>
  );
}