// Translation interfaces
interface CountryTranslations {
  [key: string]: {
    en: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

interface LeagueTranslations {
  [key: string]: {
    en: string;
    zh: string;
    'zh-hk': string;
    'zh-tw': string;
    es: string;
    de: string;
    it: string;
    pt: string;
  };
}

// Static list of all countries from the API
export const ALL_COUNTRIES = [
  // Europe
  { code: 'AD', name: 'Andorra', flag: "https://media.api-sports.io/flags/ad.svg" },
  { code: 'AL', name: 'Albania', flag: "https://media.api-sports.io/flags/al.svg" },
  { code: 'AM', name: 'Armenia', flag: "https://media.api-sports.io/flags/am.svg" },
  { code: 'AT', name: 'Austria', flag: "https://media.api-sports.io/flags/at.svg" },
  { code: 'AZ', name: 'Azerbaijan', flag: "https://media.api-sports.io/flags/az.svg" },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: "https://media.api-sports.io/flags/ba.svg" },
  { code: 'BE', name: 'Belgium', flag: "https://media.api-sports.io/flags/be.svg" },
  { code: 'BG', name: 'Bulgaria', flag: "https://media.api-sports.io/flags/bg.svg" },
  { code: 'BY', name: 'Belarus', flag: "https://media.api-sports.io/flags/by.svg" },
  { code: 'CH', name: 'Switzerland', flag: "https://media.api-sports.io/flags/ch.svg" },
  { code: 'CY', name: 'Cyprus', flag: "https://media.api-sports.io/flags/cy.svg" },
  { code: 'CZ', name: 'Czech Republic', flag: "https://media.api-sports.io/flags/cz.svg" },
  { code: 'DE', name: 'Germany', flag: "https://media.api-sports.io/flags/de.svg" },
  { code: 'DK', name: 'Denmark', flag: "https://media.api-sports.io/flags/dk.svg" },
  { code: 'EE', name: 'Estonia', flag: "https://media.api-sports.io/flags/ee.svg" },
  { code: 'ES', name: 'Spain', flag: "https://media.api-sports.io/flags/es.svg" },
  { code: 'FI', name: 'Finland', flag: "https://media.api-sports.io/flags/fi.svg" },
  { code: 'FO', name: 'Faroe Islands', flag: "https://media.api-sports.io/flags/fo.svg" },
  { code: 'FR', name: 'France', flag: "https://media.api-sports.io/flags/fr.svg" },
  { code: 'GB', name: 'United Kingdom', flag: "https://media.api-sports.io/flags/gb.svg" },
  { code: 'GB-ENG', name: 'England', flag: "https://media.api-sports.io/flags/gb.svg" },
  { code: 'GB-NIR', name: 'Northern Ireland', flag: "https://media.api-sports.io/flags/gb-nir.svg" },
  { code: 'GB-SCT', name: 'Scotland', flag: "https://media.api-sports.io/flags/gb-sct.svg" },
  { code: 'GB-WLS', name: 'Wales', flag: "https://media.api-sports.io/flags/gb-wls.svg" },
  { code: 'GE', name: 'Georgia', flag: "https://media.api-sports.io/flags/ge.svg" },
  { code: 'GI', name: 'Gibraltar', flag: "https://media.api-sports.io/flags/gi.svg" },
  { code: 'GR', name: 'Greece', flag: "https://media.api-sports.io/flags/gr.svg" },
  { code: 'HR', name: 'Croatia', flag: "https://media.api-sports.io/flags/hr.svg" },
  { code: 'HU', name: 'Hungary', flag: "https://media.api-sports.io/flags/hu.svg" },
  { code: 'IE', name: 'Ireland', flag: "https://media.api-sports.io/flags/ie.svg" },
  { code: 'IS', name: 'Iceland', flag: "https://media.api-sports.io/flags/is.svg" },
  { code: 'IT', name: 'Italy', flag: "https://media.api-sports.io/flags/it.svg" },
  { code: 'LI', name: 'Liechtenstein', flag: "https://media.api-sports.io/flags/li.svg" },
  { code: 'LT', name: 'Lithuania', flag: "https://media.api-sports.io/flags/lt.svg" },
  { code: 'LU', name: 'Luxembourg', flag: "https://media.api-sports.io/flags/lu.svg" },
  { code: 'LV', name: 'Latvia', flag: "https://media.api-sports.io/flags/lv.svg" },
  { code: 'MC', name: 'Monaco', flag: "https://media.api-sports.io/flags/mc.svg" },
  { code: 'MD', name: 'Moldova', flag: "https://media.api-sports.io/flags/md.svg" },
  { code: 'ME', name: 'Montenegro', flag: "https://media.api-sports.io/flags/me.svg" },
  { code: 'MK', name: 'North Macedonia', flag: "https://media.api-sports.io/flags/mk.svg" },
  { code: 'MT', name: 'Malta', flag: "https://media.api-sports.io/flags/mt.svg" },
  { code: 'NL', name: 'Netherlands', flag: "https://media.api-sports.io/flags/nl.svg" },
  { code: 'NO', name: 'Norway', flag: "https://media.api-sports.io/flags/no.svg" },
  { code: 'PL', name: 'Poland', flag: "https://media.api-sports.io/flags/pl.svg" },
  { code: 'PT', name: 'Portugal', flag: "https://media.api-sports.io/flags/pt.svg" },
  { code: 'RO', name: 'Romania', flag: "https://media.api-sports.io/flags/ro.svg" },
  { code: 'RS', name: 'Serbia', flag: "https://media.api-sports.io/flags/rs.svg" },
  { code: 'RU', name: 'Russia', flag: "https://media.api-sports.io/flags/ru.svg" },
  { code: 'SE', name: 'Sweden', flag: "https://media.api-sports.io/flags/se.svg" },
  { code: 'SI', name: 'Slovenia', flag: "https://media.api-sports.io/flags/si.svg" },
  { code: 'SK', name: 'Slovakia', flag: "https://media.api-sports.io/flags/sk.svg" },
  { code: 'SM', name: 'San Marino', flag: "https://media.api-sports.io/flags/sm.svg" },
  { code: 'TR', name: 'Turkey', flag: "https://media.api-sports.io/flags/tr.svg" },
  { code: 'UA', name: 'Ukraine', flag: "https://media.api-sports.io/flags/ua.svg" },
  { code: 'VA', name: 'Vatican City', flag: "https://media.api-sports.io/flags/va.svg" },

  // Asia
  { code: 'AF', name: 'Afghanistan', flag: "https://media.api-sports.io/flags/af.svg" },
  { code: 'BD', name: 'Bangladesh', flag: "https://media.api-sports.io/flags/bd.svg" },
  { code: 'BH', name: 'Bahrain', flag: "https://media.api-sports.io/flags/bh.svg" },
  { code: 'BN', name: 'Brunei', flag: "https://media.api-sports.io/flags/bn.svg" },
  { code: 'BT', name: 'Bhutan', flag: "https://media.api-sports.io/flags/bt.svg" },
  { code: 'CN', name: 'China', flag: "https://media.api-sports.io/flags/cn.svg" },
  { code: 'HK', name: 'Hong Kong', flag: "https://media.api-sports.io/flags/hk.svg" },
  { code: 'ID', name: 'Indonesia', flag: "https://media.api-sports.io/flags/id.svg" },
  { code: 'IL', name: 'Israel', flag: "https://media.api-sports.io/flags/il.svg" },
  { code: 'IN', name: 'India', flag: "https://media.api-sports.io/flags/in.svg" },
  { code: 'IQ', name: 'Iraq', flag: "https://media.api-sports.io/flags/iq.svg" },
  { code: 'IR', name: 'Iran', flag: "https://media.api-sports.io/flags/ir.svg" },
  { code: 'JO', name: 'Jordan', flag: "https://media.api-sports.io/flags/jo.svg" },
  { code: 'JP', name: 'Japan', flag: "https://media.api-sports.io/flags/jp.svg" },
  { code: 'KG', name: 'Kyrgyzstan', flag: "https://media.api-sports.io/flags/kg.svg" },
  { code: 'KH', name: 'Cambodia', flag: "https://media.api-sports.io/flags/kh.svg" },
  { code: 'KP', name: 'North Korea', flag: "https://media.api-sports.io/flags/kp.svg" },
  { code: 'KR', name: 'South Korea', flag: "https://media.api-sports.io/flags/kr.svg" },
  { code: 'KW', name: 'Kuwait', flag: "https://media.api-sports.io/flags/kw.svg" },
  { code: 'KZ', name: 'Kazakhstan', flag: "https://media.api-sports.io/flags/kz.svg" },
  { code: 'LA', name: 'Laos', flag: "https://media.api-sports.io/flags/la.svg" },
  { code: 'LB', name: 'Lebanon', flag: "https://media.api-sports.io/flags/lb.svg" },
  { code: 'LK', name: 'Sri Lanka', flag: "https://media.api-sports.io/flags/lk.svg" },
  { code: 'MM', name: 'Myanmar', flag: "https://media.api-sports.io/flags/mm.svg" },
  { code: 'MN', name: 'Mongolia', flag: "https://media.api-sports.io/flags/mn.svg" },
  { code: 'MO', name: 'Macau', flag: "https://media.api-sports.io/flags/mo.svg" },
  { code: 'MV', name: 'Maldives', flag: "https://media.api-sports.io/flags/mv.svg" },
  { code: 'MY', name: 'Malaysia', flag: "https://media.api-sports.io/flags/my.svg" },
  { code: 'NP', name: 'Nepal', flag: "https://media.api-sports.io/flags/np.svg" },
  { code: 'OM', name: 'Oman', flag: "https://media.api-sports.io/flags/om.svg" },
  { code: 'PH', name: 'Philippines', flag: "https://media.api-sports.io/flags/ph.svg" },
  { code: 'PK', name: 'Pakistan', flag: "https://media.api-sports.io/flags/pk.svg" },
  { code: 'PS', name: 'Palestine', flag: "https://media.api-sports.io/flags/ps.svg" },
  { code: 'QA', name: 'Qatar', flag: "https://media.api-sports.io/flags/qa.svg" },
  { code: 'SA', name: 'Saudi Arabia', flag: "https://media.api-sports.io/flags/sa.svg" },
  { code: 'SG', name: 'Singapore', flag: "https://media.api-sports.io/flags/sg.svg" },
  { code: 'SY', name: 'Syria', flag: "https://media.api-sports.io/flags/sy.svg" },
  { code: 'TH', name: 'Thailand', flag: "https://media.api-sports.io/flags/th.svg" },
  { code: 'TJ', name: 'Tajikistan', flag: "https://media.api-sports.io/flags/tj.svg" },
  { code: 'TL', name: 'Timor-Leste', flag: "https://media.api-sports.io/flags/tl.svg" },
  { code: 'TM', name: 'Turkmenistan', flag: "https://media.api-sports.io/flags/tm.svg" },
  { code: 'TW', name: 'Taiwan', flag: "https://media.api-sports.io/flags/tw.svg" },
  { code: 'UZ', name: 'Uzbekistan', flag: "https://media.api-sports.io/flags/uz.svg" },
  { code: 'VN', name: 'Vietnam', flag: "https://media.api-sports.io/flags/vn.svg" },
  { code: 'YE', name: 'Yemen', flag: "https://media.api-sports.io/flags/ye.svg" },
  { code: 'AE', name: 'United Arab Emirates', flag: "https://media.api-sports.io/flags/ae.svg" },

  // Africa
  { code: 'DZ', name: 'Algeria', flag: "https://media.api-sports.io/flags/dz.svg" },
  { code: 'AO', name: 'Angola', flag: "https://media.api-sports.io/flags/ao.svg" },
  { code: 'BJ', name: 'Benin', flag: "https://media.api-sports.io/flags/bj.svg" },
  { code: 'BF', name: 'Burkina Faso', flag: "https://media.api-sports.io/flags/bf.svg" },
  { code: 'BI', name: 'Burundi', flag: "https://media.api-sports.io/flags/bi.svg" },
  { code: 'BW', name: 'Botswana', flag: "https://media.api-sports.io/flags/bw.svg" },
  { code: 'CD', name: 'Democratic Republic of the Congo', flag: "https://media.api-sports.io/flags/cd.svg" },
  { code: 'CF', name: 'Central African Republic', flag: "https://media.api-sports.io/flags/cf.svg" },
  { code: 'CG', name: 'Republic of the Congo', flag: "https://media.api-sports.io/flags/cg.svg" },
  { code: 'CI', name: 'Ivory Coast', flag: "https://media.api-sports.io/flags/ci.svg" },
  { code: 'CM', name: 'Cameroon', flag: "https://media.api-sports.io/flags/cm.svg" },
  { code: 'CV', name: 'Cape Verde', flag: "https://media.api-sports.io/flags/cv.svg" },
  { code: 'DJ', name: 'Djibouti', flag: "https://media.api-sports.io/flags/dj.svg" },
  { code: 'EG', name: 'Egypt', flag: "https://media.api-sports.io/flags/eg.svg" },
  { code: 'ER', name: 'Eritrea', flag: "https://media.api-sports.io/flags/er.svg" },
  { code: 'ET', name: 'Ethiopia', flag: "https://media.api-sports.io/flags/et.svg" },
  { code: 'GA', name: 'Gabon', flag: "https://media.api-sports.io/flags/ga.svg" },
  { code: 'GH', name: 'Ghana', flag: "https://media.api-sports.io/flags/gh.svg" },
  { code: 'GM', name: 'Gambia', flag: "https://media.api-sports.io/flags/gm.svg" },
  { code: 'GN', name: 'Guinea', flag: "https://media.api-sports.io/flags/gn.svg" },
  { code: 'GQ', name: 'Equatorial Guinea', flag: "https://media.api-sports.io/flags/gq.svg" },
  { code: 'GW', name: 'Guinea-Bissau', flag: "https://media.api-sports.io/flags/gw.svg" },
  { code: 'KE', name: 'Kenya', flag: "https://media.api-sports.io/flags/ke.svg" },
  { code: 'KM', name: 'Comoros', flag: "https://media.api-sports.io/flags/km.svg" },
  { code: 'LR', name: 'Liberia', flag: "https://media.api-sports.io/flags/lr.svg" },
  { code: 'LS', name: 'Lesotho', flag: "https://media.api-sports.io/flags/ls.svg" },
  { code: 'LY', name: 'Libya', flag: "https://media.api-sports.io/flags/ly.svg" },
  { code: 'MA', name: 'Morocco', flag: "https://media.api-sports.io/flags/ma.svg" },
  { code: 'MG', name: 'Madagascar', flag: "https://media.api-sports.io/flags/mg.svg" },
  { code: 'ML', name: 'Mali', flag: "https://media.api-sports.io/flags/ml.svg" },
  { code: 'MR', name: 'Mauritania', flag: "https://media.api-sports.io/flags/mr.svg" },
  { code: 'MU', name: 'Mauritius', flag: "https://media.api-sports.io/flags/mu.svg" },
  { code: 'MW', name: 'Malawi', flag: "https://media.api-sports.io/flags/mw.svg" },
  { code: 'MZ', name: 'Mozambique', flag: "https://media.api-sports.io/flags/mz.svg" },
  { code: 'NA', name: 'Namibia', flag: "https://media.api-sports.io/flags/na.svg" },
  { code: 'NE', name: 'Niger', flag: "https://media.api-sports.io/flags/ne.svg" },
  { code: 'NG', name: 'Nigeria', flag: "https://media.api-sports.io/flags/ng.svg" },
  { code: 'RW', name: 'Rwanda', flag: "https://media.api-sports.io/flags/rw.svg" },
  { code: 'SC', name: 'Seychelles', flag: "https://media.api-sports.io/flags/sc.svg" },
  { code: 'SD', name: 'Sudan', flag: "https://media.api-sports.io/flags/sd.svg" },
  { code: 'SL', name: 'Sierra Leone', flag: "https://media.api-sports.io/flags/sl.svg" },
  { code: 'SN', name: 'Senegal', flag: "https://media.api-sports.io/flags/sn.svg" },
  { code: 'SO', name: 'Somalia', flag: "https://media.api-sports.io/flags/so.svg" },
  { code: 'SS', name: 'South Sudan', flag: "https://media.api-sports.io/flags/ss.svg" },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: "https://media.api-sports.io/flags/st.svg" },
  { code: 'SZ', name: 'Eswatini', flag: "https://media.api-sports.io/flags/sz.svg" },
  { code: 'TD', name: 'Chad', flag: "https://media.api-sports.io/flags/td.svg" },
  { code: 'TG', name: 'Togo', flag: "https://media.api-sports.io/flags/tg.svg" },
  { code: 'TN', name: 'Tunisia', flag: "https://media.api-sports.io/flags/tn.svg" },
  { code: 'TZ', name: 'Tanzania', flag: "https://media.api-sports.io/flags/tz.svg" },
  { code: 'UG', name: 'Uganda', flag: "https://media.api-sports.io/flags/ug.svg" },
  { code: 'ZA', name: 'South Africa', flag: "https://media.api-sports.io/flags/za.svg" },
  { code: 'ZM', name: 'Zambia', flag: "https://media.api-sports.io/flags/zm.svg" },
  { code: 'ZW', name: 'Zimbabwe', flag: "https://media.api-sports.io/flags/zw.svg" },

  // North America
  { code: 'AG', name: 'Antigua and Barbuda', flag: "https://media.api-sports.io/flags/ag.svg" },
  { code: 'BB', name: 'Barbados', flag: "https://media.api-sports.io/flags/bb.svg" },
  { code: 'BZ', name: 'Belize', flag: "https://media.api-sports.io/flags/bz.svg" },
  { code: 'BS', name: 'Bahamas', flag: "https://media.api-sports.io/flags/bs.svg" },
  { code: 'CA', name: 'Canada', flag: "https://media.api-sports.io/flags/ca.svg" },
  { code: 'CR', name: 'Costa Rica', flag: "https://media.api-sports.io/flags/cr.svg" },
  { code: 'CU', name: 'Cuba', flag: "https://media.api-sports.io/flags/cu.svg" },
  { code: 'DM', name: 'Dominica', flag: "https://media.api-sports.io/flags/dm.svg" },
  { code: 'DO', name: 'Dominican Republic', flag: "https://media.api-sports.io/flags/do.svg" },
  { code: 'GD', name: 'Grenada', flag: "https://media.api-sports.io/flags/gd.svg" },
  { code: 'GT', name: 'Guatemala', flag: "https://media.api-sports.io/flags/gt.svg" },
  { code: 'HN', name: 'Honduras', flag: "https://media.api-sports.io/flags/hn.svg" },
  { code: 'HT', name: 'Haiti', flag: "https://media.api-sports.io/flags/ht.svg" },
  { code: 'JM', name: 'Jamaica', flag: "https://media.api-sports.io/flags/jm.svg" },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: "https://media.api-sports.io/flags/kn.svg" },
  { code: 'LC', name: 'Saint Lucia', flag: "https://media.api-sports.io/flags/lc.svg" },
  { code: 'MX', name: 'Mexico', flag: "https://media.api-sports.io/flags/mx.svg" },
  { code: 'NI', name: 'Nicaragua', flag: "https://media.api-sports.io/flags/ni.svg" },
  { code: 'PA', name: 'Panama', flag: "https://media.api-sports.io/flags/pa.svg" },
  { code: 'SV', name: 'El Salvador', flag: "https://media.api-sports.io/flags/sv.svg" },
  { code: 'TT', name: 'Trinidad and Tobago', flag: "https://media.api-sports.io/flags/tt.svg" },
  { code: 'US', name: 'USA', flag: "https://media.api-sports.io/flags/us.svg" },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: "https://media.api-sports.io/flags/vc.svg" },

  // South America
  { code: 'AR', name: 'Argentina', flag: "https://media.api-sports.io/flags/ar.svg" },
  { code: 'BO', name: 'Bolivia', flag: "https://media.api-sports.io/flags/bo.svg" },
  { code: 'BR', name: 'Brazil', flag: "https://media.api-sports.io/flags/br.svg" },
  { code: 'CL', name: 'Chile', flag: "https://media.api-sports.io/flags/cl.svg" },
  { code: 'CO', name: 'Colombia', flag: "https://media.api-sports.io/flags/co.svg" },
  { code: 'EC', name: 'Ecuador', flag: "https://media.api-sports.io/flags/ec.svg" },
  { code: 'FK', name: 'Falkland Islands', flag: "https://media.api-sports.io/flags/fk.svg" },
  { code: 'GF', name: 'French Guiana', flag: "https://media.api-sports.io/flags/gf.svg" },
  { code: 'GY', name: 'Guyana', flag: "https://media.api-sports.io/flags/gy.svg" },
  { code: 'PE', name: 'Peru', flag: "https://media.api-sports.io/flags/pe.svg" },
  { code: 'PY', name: 'Paraguay', flag: "https://media.api-sports.io/flags/py.svg" },
  { code: 'SR', name: 'Suriname', flag: "https://media.api-sports.io/flags/sr.svg" },
  { code: 'UY', name: 'Uruguay', flag: "https://media.api-sports.io/flags/uy.svg" },
  { code: 'VE', name: 'Venezuela', flag: "https://media.api-sports.io/flags/ve.svg" },

  // Oceania
  { code: 'AU', name: 'Australia', flag: "https://media.api-sports.io/flags/au.svg" },
  { code: 'CK', name: 'Cook Islands', flag: "https://media.api-sports.io/flags/ck.svg" },
  { code: 'FJ', name: 'Fiji', flag: "https://media.api-sports.io/flags/fj.svg" },
  { code: 'FM', name: 'Micronesia', flag: "https://media.api-sports.io/flags/fm.svg" },
  { code: 'KI', name: 'Kiribati', flag: "https://media.api-sports.io/flags/ki.svg" },
  { code: 'MH', name: 'Marshall Islands', flag: "https://media.api-sports.io/flags/mh.svg" },
  { code: 'NC', name: 'New Caledonia', flag: "https://media.api-sports.io/flags/nc.svg" },
  { code: 'NR', name: 'Nauru', flag: "https://media.api-sports.io/flags/nr.svg" },
  { code: 'NU', name: 'Niue', flag: "https://media.api-sports.io/flags/nu.svg" },
  { code: 'NZ', name: 'New Zealand', flag: "https://media.api-sports.io/flags/nz.svg" },
  { code: 'PF', name: 'French Polynesia', flag: "https://media.api-sports.io/flags/pf.svg" },
  { code: 'PG', name: 'Papua New Guinea', flag: "https://media.api-sports.io/flags/pg.svg" },
  { code: 'PW', name: 'Palau', flag: "https://media.api-sports.io/flags/pw.svg" },
  { code: 'SB', name: 'Solomon Islands', flag: "https://media.api-sports.io/flags/sb.svg" },
  { code: 'TK', name: 'Tokelau', flag: "https://media.api-sports.io/flags/tk.svg" },
  { code: 'TO', name: 'Tonga', flag: "https://media.api-sports.io/flags/to.svg" },
  { code: 'TV', name: 'Tuvalu', flag: "https://media.api-sports.io/flags/tv.svg" },
  { code: 'VU', name: 'Vanuatu', flag: "https://media.api-sports.io/flags/vu.svg" },
  { code: 'WF', name: 'Wallis and Futuna', flag: "https://media.api-sports.io/flags/wf.svg" },
  { code: 'WS', name: 'Samoa', flag: "https://media.api-sports.io/flags/ws.svg" },

  // Additional Football-Specific Regions
  { code: 'EU', name: 'Europe', flag: "https://media.api-sports.io/flags/eu.svg" },
  { code: 'WORLD', name: 'World', flag: "https://media.api-sports.io/flags/world.svg" },

  // Australian States/Territories
  { code: 'AU-ACT', name: 'Australian Capital Territory', flag: "https://media.api-sports.io/flags/au-act.svg" },
  { code: 'AU-NSW', name: 'New South Wales', flag: "https://media.api-sports.io/flags/au-nsw.svg" },
  { code: 'AU-NT', name: 'Northern Territory', flag: "https://media.api-sports.io/flags/au-nt.svg" },
  { code: 'AU-QLD', name: 'Queensland', flag: "https://media.api-sports.io/flags/au-qld.svg" },
  { code: 'AU-SA', name: 'South Australia', flag: "https://media.api-sports.io/flags/au-sa.svg" },
  { code: 'AU-TAS', name: 'Tasmania', flag: "https://media.api-sports.io/flags/au-tas.svg" },
  { code: 'AU-VIC', name: 'Victoria', flag: "https://media.api-sports.io/flags/au-vic.svg" },
  { code: 'AU-WA', name: 'Western Australia', flag: "https://media.api-sports.io/flags/au-wa.svg" }
] as const;

// Generate comprehensive country translations from ALL_COUNTRIES list
const generateCountryTranslations = (): CountryTranslations => {
  const translations: CountryTranslations = {};

  // Base translations for known countries
  const knownTranslations: CountryTranslations = {
    // Europe
    'Andorra': { en: 'Andorra', zh: '安道爾', 'zh-hk': '安道爾', 'zh-tw': '安道爾', es: 'Andorra', de: 'Andorra', it: 'Andorra', pt: 'Andorra' },
    'Albania': { en: 'Albania', zh: '阿爾巴尼亞', 'zh-hk': '阿爾巴尼亞', 'zh-tw': '阿爾巴尼亞', es: 'Albania', de: 'Albanien', it: 'Albania', pt: 'Albânia' },
    'Armenia': { en: 'Armenia', zh: '亞美尼亞', 'zh-hk': '亞美尼亞', 'zh-tw': '亞美尼亞', es: 'Armenia', de: 'Armenien', it: 'Armenia', pt: 'Armênia' },
    'Austria': { en: 'Austria', zh: '奧地利', 'zh-hk': '奧地利', 'zh-tw': '奧地利', es: 'Austria', de: 'Österreich', it: 'Austria', pt: 'Áustria' },
    'Azerbaijan': { en: 'Azerbaijan', zh: '阿塞拜疆', 'zh-hk': '阿塞拜疆', 'zh-tw': '亞塞拜然', es: 'Azerbaiyán', de: 'Aserbaidschan', it: 'Azerbaigian', pt: 'Azerbaijão' },
    'Bosnia and Herzegovina': { en: 'Bosnia and Herzegovina', zh: '波斯尼亞和黑塞哥維那', 'zh-hk': '波斯尼亞和黑塞哥維那', 'zh-tw': '波斯尼亞和黑塞哥維那', es: 'Bosnia y Herzegovina', de: 'Bosnien und Herzegowina', it: 'Bosnia ed Erzegovina', pt: 'Bósnia e Herzegovina' },
    'Belgium': { en: 'Belgium', zh: '比利時', 'zh-hk': '比利時', 'zh-tw': '比利時', es: 'Bélgica', de: 'Belgien', it: 'Belgio', pt: 'Bélgica' },
    'Bulgaria': { en: 'Bulgaria', zh: '保加利亞', 'zh-hk': '保加利亞', 'zh-tw': '保加利亞', es: 'Bulgaria', de: 'Bulgarien', it: 'Bulgaria', pt: 'Bulgária' },
    'Belarus': { en: 'Belarus', zh: '白俄羅斯', 'zh-hk': '白俄羅斯', 'zh-tw': '白俄羅斯', es: 'Bielorrusia', de: 'Belarus', it: 'Bielorussia', pt: 'Bielorrússia' },
    'Switzerland': { en: 'Switzerland', zh: '瑞士', 'zh-hk': '瑞士', 'zh-tw': '瑞士', es: 'Suiza', de: 'Schweiz', it: 'Svizzera', pt: 'Suíça' },
    'Cyprus': { en: 'Cyprus', zh: '塞浦路斯', 'zh-hk': '塞浦路斯', 'zh-tw': '賽普勒斯', es: 'Chipre', de: 'Zypern', it: 'Cipro', pt: 'Chipre' },
    'Czech Republic': { en: 'Czech Republic', zh: '捷克共和國', 'zh-hk': '捷克共和國', 'zh-tw': '捷克共和國', es: 'República Checa', de: 'Tschechische Republik', it: 'Repubblica Ceca', pt: 'República Tcheca' },
    'Germany': { en: 'Germany', zh: '德國', 'zh-hk': '德國', 'zh-tw': '德國', es: 'Alemania', de: 'Deutschland', it: 'Germania', pt: 'Alemanha' },
    'Denmark': { en: 'Denmark', zh: '丹麥', 'zh-hk': '丹麥', 'zh-tw': '丹麥', es: 'Dinamarca', de: 'Dänemark', it: 'Danimarca', pt: 'Dinamarca' },
    'Estonia': { en: 'Estonia', zh: '愛沙尼亞', 'zh-hk': '愛沙尼亞', 'zh-tw': '愛沙尼亞', es: 'Estonia', de: 'Estland', it: 'Estonia', pt: 'Estônia' },
    'Spain': { en: 'Spain', zh: '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙', es: 'España', de: 'Spanien', it: 'Spagna', pt: 'Espanha' },
    'Finland': { en: 'Finland', zh: '芬蘭', 'zh-hk': '芬蘭', 'zh-tw': '芬蘭', es: 'Finlandia', de: 'Finnland', it: 'Finlandia', pt: 'Finlândia' },
    'Faroe Islands': { en: 'Faroe Islands', zh: '法羅群島', 'zh-hk': '法羅群島', 'zh-tw': '法羅群島', es: 'Islas Feroe', de: 'Färöer', it: 'Isole Faroe', pt: 'Ilhas Faroé' },
    'France': { en: 'France', zh: '法國', 'zh-hk': '法國', 'zh-tw': '法國', es: 'Francia', de: 'Frankreich', it: 'Francia', pt: 'França' },
    'United Kingdom': { en: 'United Kingdom', zh: '英國', 'zh-hk': '英國', 'zh-tw': '英國', es: 'Reino Unido', de: 'Vereinigtes Königreich', it: 'Regno Unito', pt: 'Reino Unido' },
    'England': { en: 'England', zh: '英格蘭', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭', es: 'Inglaterra', de: 'England', it: 'Inghilterra', pt: 'Inglaterra' },
    'Northern Ireland': { en: 'Northern Ireland', zh: '北愛爾蘭', 'zh-hk': '北愛爾蘭', 'zh-tw': '北愛爾蘭', es: 'Irlanda del Norte', de: 'Nordirland', it: 'Irlanda del Nord', pt: 'Irlanda do Norte' },
    'Scotland': { en: 'Scotland', zh: '蘇格蘭', 'zh-hk': '蘇格蘭', 'zh-tw': '蘇格蘭', es: 'Escocia', de: 'Schottland', it: 'Scozia', pt: 'Escócia' },
    'Wales': { en: 'Wales', zh: '威爾士', 'zh-hk': '威爾士', 'zh-tw': '威爾士', es: 'Gales', de: 'Wales', it: 'Galles', pt: 'País de Gales' },
    'Georgia': { en: 'Georgia', zh: '格魯吉亞', 'zh-hk': '格魯吉亞', 'zh-tw': '喬治亞', es: 'Georgia', de: 'Georgien', it: 'Georgia', pt: 'Geórgia' },
    'Gibraltar': { en: 'Gibraltar', zh: '直布羅陀', 'zh-hk': '直布羅陀', 'zh-tw': '直布羅陀', es: 'Gibraltar', de: 'Gibraltar', it: 'Gibilterra', pt: 'Gibraltar' },
    'Greece': { en: 'Greece', zh: '希臘', 'zh-hk': '希臘', 'zh-tw': '希臘', es: 'Grecia', de: 'Griechenland', it: 'Grecia', pt: 'Grécia' },
    'Croatia': { en: 'Croatia', zh: '克羅地亞', 'zh-hk': '克羅地亞', 'zh-tw': '克羅埃西亞', es: 'Croacia', de: 'Kroatien', it: 'Croazia', pt: 'Croácia' },
    'Hungary': { en: 'Hungary', zh: '匈牙利', 'zh-hk': '匈牙利', 'zh-tw': '匈牙利', es: 'Hungría', de: 'Ungarn', it: 'Ungheria', pt: 'Hungria' },
    'Ireland': { en: 'Ireland', zh: '愛爾蘭', 'zh-hk': '愛爾蘭', 'zh-tw': '愛爾蘭', es: 'Irlanda', de: 'Irland', it: 'Irlanda', pt: 'Irlanda' },
    'Iceland': { en: 'Iceland', zh: '冰島', 'zh-hk': '冰島', 'zh-tw': '冰島', es: 'Islandia', de: 'Island', it: 'Islanda', pt: 'Islândia' },
    'Italy': { en: 'Italy', zh: '意大利', 'zh-hk': '意大利', 'zh-tw': '義大利', es: 'Italia', de: 'Italien', it: 'Italia', pt: 'Itália' },
    'Liechtenstein': { en: 'Liechtenstein', zh: '列支敦士登', 'zh-hk': '列支敦士登', 'zh-tw': '列支敦斯登', es: 'Liechtenstein', de: 'Liechtenstein', it: 'Liechtenstein', pt: 'Liechtenstein' },
    'Lithuania': { en: 'Lithuania', zh: '立陶宛', 'zh-hk': '立陶宛', 'zh-tw': '立陶宛', es: 'Lituania', de: 'Litauen', it: 'Lituania', pt: 'Lituânia' },
    'Luxembourg': { en: 'Luxembourg', zh: '盧森堡', 'zh-hk': '盧森堡', 'zh-tw': '盧森堡', es: 'Luxemburgo', de: 'Luxemburg', it: 'Lussemburgo', pt: 'Luxemburgo' },
    'Latvia': { en: 'Latvia', zh: '拉脫維亞', 'zh-hk': '拉脫維亞', 'zh-tw': '拉脫維亞', es: 'Letonia', de: 'Lettland', it: 'Lettonia', pt: 'Letônia' },
    'Monaco': { en: 'Monaco', zh: '摩納哥', 'zh-hk': '摩納哥', 'zh-tw': '摩納哥', es: 'Mónaco', de: 'Monaco', it: 'Monaco', pt: 'Mônaco' },
    'Moldova': { en: 'Moldova', zh: '摩爾多瓦', 'zh-hk': '摩爾多瓦', 'zh-tw': '摩爾多瓦', es: 'Moldavia', de: 'Moldau', it: 'Moldavia', pt: 'Moldávia' },
    'Montenegro': { en: 'Montenegro', zh: '黑山', 'zh-hk': '黑山', 'zh-tw': '蒙特內哥羅', es: 'Montenegro', de: 'Montenegro', it: 'Montenegro', pt: 'Montenegro' },
    'North Macedonia': { en: 'North Macedonia', zh: '北馬其頓', 'zh-hk': '北馬其頓', 'zh-tw': '北馬其頓', es: 'Macedonia del Norte', de: 'Nordmazedonien', it: 'Macedonia del Nord', pt: 'Macedônia do Norte' },
    'Malta': { en: 'Malta', zh: '馬耳他', 'zh-hk': '馬耳他', 'zh-tw': '馬爾他', es: 'Malta', de: 'Malta', it: 'Malta', pt: 'Malta' },
    'Netherlands': { en: 'Netherlands', zh: '荷蘭', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭', es: 'Países Bajos', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos' },
    'Norway': { en: 'Norway', zh: '挪威', 'zh-hk': '挪威', 'zh-tw': '挪威', es: 'Noruega', de: 'Norwegen', it: 'Norvegia', pt: 'Noruega' },
    'Poland': { en: 'Poland', zh: '波蘭', 'zh-hk': '波蘭', 'zh-tw': '波蘭', es: 'Polonia', de: 'Polen', it: 'Polonia', pt: 'Polônia' },
    'Portugal': { en: 'Portugal', zh: '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙', es: 'Portugal', de: 'Portugal', it: 'Portogallo', pt: 'Portugal' },
    'Romania': { en: 'Romania', zh: '羅馬尼亞', 'zh-hk': '羅馬尼亞', 'zh-tw': '羅馬尼亞', es: 'Rumania', de: 'Rumänien', it: 'Romania', pt: 'Romênia' },
    'Serbia': { en: 'Serbia', zh: '塞爾維亞', 'zh-hk': '塞爾維亞', 'zh-tw': '塞爾維亞', es: 'Serbia', de: 'Serbien', it: 'Serbia', pt: 'Sérvia' },
    'Russia': { en: 'Russia', zh: '俄羅斯', 'zh-hk': '俄羅斯', 'zh-tw': '俄羅斯', es: 'Rusia', de: 'Russland', it: 'Russia', pt: 'Rússia' },
    'Sweden': { en: 'Sweden', zh: '瑞典', 'zh-hk': '瑞典', 'zh-tw': '瑞典', es: 'Suecia', de: 'Schweden', it: 'Svezia', pt: 'Suécia' },
    'Slovenia': { en: 'Slovenia', zh: '斯洛文尼亞', 'zh-hk': '斯洛文尼亞', 'zh-tw': '斯洛維尼亞', es: 'Eslovenia', de: 'Slowenien', it: 'Slovenia', pt: 'Eslovênia' },
    'Slovakia': { en: 'Slovakia', zh: '斯洛伐克', 'zh-hk': '斯洛伐克', 'zh-tw': '斯洛伐克', es: 'Eslovaquia', de: 'Slowakei', it: 'Slovacchia', pt: 'Eslováquia' },
    'San Marino': { en: 'San Marino', zh: '聖馬力諾', 'zh-hk': '聖馬力諾', 'zh-tw': '聖馬利諾', es: 'San Marino', de: 'San Marino', it: 'San Marino', pt: 'San Marino' },
    'Turkey': { en: 'Turkey', zh: '土耳其', 'zh-hk': '土耳其', 'zh-tw': '土耳其', es: 'Turquía', de: 'Türkei', it: 'Turchia', pt: 'Turquia' },
    'Ukraine': { en: 'Ukraine', zh: '烏克蘭', 'zh-hk': '烏克蘭', 'zh-tw': '烏克蘭', es: 'Ucrania', de: 'Ukraine', it: 'Ucraina', pt: 'Ucrânia' },
    'Vatican City': { en: 'Vatican City', zh: '梵蒂岡', 'zh-hk': '梵蒂岡', 'zh-tw': '梵蒂岡', es: 'Ciudad del Vaticano', de: 'Vatikanstadt', it: 'Città del Vaticano', pt: 'Cidade do Vaticano' },

    // Asia
    'Afghanistan': { en: 'Afghanistan', zh: '阿富汗', 'zh-hk': '阿富汗', 'zh-tw': '阿富汗', es: 'Afganistán', de: 'Afghanistan', it: 'Afghanistan', pt: 'Afeganistão' },
    'Bangladesh': { en: 'Bangladesh', zh: '孟加拉國', 'zh-hk': '孟加拉國', 'zh-tw': '孟加拉', es: 'Bangladesh', de: 'Bangladesch', it: 'Bangladesh', pt: 'Bangladesh' },
    'Bahrain': { en: 'Bahrain', zh: '巴林', 'zh-hk': '巴林', 'zh-tw': '巴林', es: 'Baréin', de: 'Bahrain', it: 'Bahrain', pt: 'Bahrein' },
    'Brunei': { en: 'Brunei', zh: '汶萊', 'zh-hk': '汶萊', 'zh-tw': '汶萊', es: 'Brunéi', de: 'Brunei', it: 'Brunei', pt: 'Brunei' },
    'Bhutan': { en: 'Bhutan', zh: '不丹', 'zh-hk': '不丹', 'zh-tw': '不丹', es: 'Bután', de: 'Bhutan', it: 'Bhutan', pt: 'Butão' },
    'China': { en: 'China', zh: '中國', 'zh-hk': '中國', 'zh-tw': '中國', es: 'China', de: 'China', it: 'Cina', pt: 'China' },
    'Hong Kong': { en: 'Hong Kong', zh: '香港', 'zh-hk': '香港', 'zh-tw': '香港', es: 'Hong Kong', de: 'Hongkong', it: 'Hong Kong', pt: 'Hong Kong' },
    'Indonesia': { en: 'Indonesia', zh: '印尼', 'zh-hk': '印尼', 'zh-tw': '印尼', es: 'Indonesia', de: 'Indonesien', it: 'Indonesia', pt: 'Indonésia' },
    'Israel': { en: 'Israel', zh: '以色列', 'zh-hk': '以色列', 'zh-tw': '以色列', es: 'Israel', de: 'Israel', it: 'Israele', pt: 'Israel' },
    'India': { en: 'India', zh: '印度', 'zh-hk': '印度', 'zh-tw': '印度', es: 'India', de: 'Indien', it: 'India', pt: 'Índia' },
    'Iraq': { en: 'Iraq', zh: '伊拉克', 'zh-hk': '伊拉克', 'zh-tw': '伊拉克', es: 'Irak', de: 'Irak', it: 'Iraq', pt: 'Iraque' },
    'Iran': { en: 'Iran', zh: '伊朗', 'zh-hk': '伊朗', 'zh-tw': '伊朗', es: 'Irán', de: 'Iran', it: 'Iran', pt: 'Irã' },
    'Jordan': { en: 'Jordan', zh: '約旦', 'zh-hk': '約旦', 'zh-tw': '約旦', es: 'Jordania', de: 'Jordanien', it: 'Giordania', pt: 'Jordânia' },
    'Japan': { en: 'Japan', zh: '日本', 'zh-hk': '日本', 'zh-tw': '日本', es: 'Japón', de: 'Japan', it: 'Giappone', pt: 'Japão' },
    'Kyrgyzstan': { en: 'Kyrgyzstan', zh: '吉爾吉斯斯坦', 'zh-hk': '吉爾吉斯斯坦', 'zh-tw': '吉爾吉斯', es: 'Kirguistán', de: 'Kirgisistan', it: 'Kirghizistan', pt: 'Quirguistão' },
    'Cambodia': { en: 'Cambodia', zh: '柬埔寨', 'zh-hk': '柬埔寨', 'zh-tw': '柬埔寨', es: 'Camboya', de: 'Kambodscha', it: 'Cambogia', pt: 'Camboja' },
    'North Korea': { en: 'North Korea', zh: '朝鮮', 'zh-hk': '朝鮮', 'zh-tw': '北韓', es: 'Corea del Norte', de: 'Nordkorea', it: 'Corea del Nord', pt: 'Coreia do Norte' },
    'South Korea': { en: 'South Korea', zh: '韓國', 'zh-hk': '韓國', 'zh-tw': '南韓', es: 'Corea del Sur', de: 'Südkorea', it: 'Corea del Sud', pt: 'Coreia do Sul' },
    'Kuwait': { en: 'Kuwait', zh: '科威特', 'zh-hk': '科威特', 'zh-tw': '科威特', es: 'Kuwait', de: 'Kuwait', it: 'Kuwait', pt: 'Kuwait' },
    'Kazakhstan': { en: 'Kazakhstan', zh: '哈薩克斯坦', 'zh-hk': '哈薩克斯坦', 'zh-tw': '哈薩克', es: 'Kazajistán', de: 'Kasachstan', it: 'Kazakistan', pt: 'Cazaquistão' },
    'Laos': { en: 'Laos', zh: '老撾', 'zh-hk': '老撾', 'zh-tw': '寮國', es: 'Laos', de: 'Laos', it: 'Laos', pt: 'Laos' },
    'Lebanon': { en: 'Lebanon', zh: '黎巴嫩', 'zh-hk': '黎巴嫩', 'zh-tw': '黎巴嫩', es: 'Líbano', de: 'Libanon', it: 'Libano', pt: 'Líbano' },
    'Sri Lanka': { en: 'Sri Lanka', zh: '斯里蘭卡', 'zh-hk': '斯里蘭卡', 'zh-tw': '斯里蘭卡', es: 'Sri Lanka', de: 'Sri Lanka', it: 'Sri Lanka', pt: 'Sri Lanka' },
    'Myanmar': { en: 'Myanmar', zh: '緬甸', 'zh-hk': '緬甸', 'zh-tw': '緬甸', es: 'Myanmar', de: 'Myanmar', it: 'Myanmar', pt: 'Myanmar' },
    'Mongolia': { en: 'Mongolia', zh: '蒙古', 'zh-hk': '蒙古', 'zh-tw': '蒙古', es: 'Mongolia', de: 'Mongolei', it: 'Mongolia', pt: 'Mongólia' },
    'Macau': { en: 'Macau', zh: '澳門', 'zh-hk': '澳門', 'zh-tw': '澳門', es: 'Macao', de: 'Macao', it: 'Macao', pt: 'Macau' },
    'Maldives': { en: 'Maldives', zh: '馬爾代夫', 'zh-hk': '馬爾代夫', 'zh-tw': '馬爾地夫', es: 'Maldivas', de: 'Malediven', it: 'Maldive', pt: 'Maldivas' },
    'Malaysia': { en: 'Malaysia', zh: '馬來西亞', 'zh-hk': '馬來西亞', 'zh-tw': '馬來西亞', es: 'Malasia', de: 'Malaysia', it: 'Malesia', pt: 'Malásia' },
    'Nepal': { en: 'Nepal', zh: '尼泊爾', 'zh-hk': '尼泊爾', 'zh-tw': '尼泊爾', es: 'Nepal', de: 'Nepal', it: 'Nepal', pt: 'Nepal' },
    'Oman': { en: 'Oman', zh: '阿曼', 'zh-hk': '阿曼', 'zh-tw': '阿曼', es: 'Omán', de: 'Oman', it: 'Oman', pt: 'Omã' },
    'Philippines': { en: 'Philippines', zh: '菲律賓', 'zh-hk': '菲律賓', 'zh-tw': '菲律賓', es: 'Filipinas', de: 'Philippinen', it: 'Filippine', pt: 'Filipinas' },
    'Pakistan': { en: 'Pakistan', zh: '巴基斯坦', 'zh-hk': '巴基斯坦', 'zh-tw': '巴基斯坦', es: 'Pakistán', de: 'Pakistan', it: 'Pakistan', pt: 'Paquistão' },
    'Palestine': { en: 'Palestine', zh: '巴勒斯坦', 'zh-hk': '巴勒斯坦', 'zh-tw': '巴勒斯坦', es: 'Palestina', de: 'Palästina', it: 'Palestina', pt: 'Palestina' },
    'Qatar': { en: 'Qatar', zh: '卡塔爾', 'zh-hk': '卡塔爾', 'zh-tw': '卡達', es: 'Catar', de: 'Katar', it: 'Qatar', pt: 'Catar' },
    'Saudi Arabia': { en: 'Saudi Arabia', zh: '沙特阿拉伯', 'zh-hk': '沙特阿拉伯', 'zh-tw': '沙烏地阿拉伯', es: 'Arabia Saudí', de: 'Saudi-Arabien', it: 'Arabia Saudita', pt: 'Arábia Saudita' },
    'Singapore': { en: 'Singapore', zh: '新加坡', 'zh-hk': '新加坡', 'zh-tw': '新加坡', es: 'Singapur', de: 'Singapur', it: 'Singapore', pt: 'Singapura' },
    'Syria': { en: 'Syria', zh: '敘利亞', 'zh-hk': '敘利亞', 'zh-tw': '敘利亞', es: 'Siria', de: 'Syrien', it: 'Siria', pt: 'Síria' },
    'Thailand': { en: 'Thailand', zh: '泰國', 'zh-hk': '泰國', 'zh-tw': '泰國', es: 'Tailandia', de: 'Thailand', it: 'Thailandia', pt: 'Tailândia' },
    'Tajikistan': { en: 'Tajikistan', zh: '塔吉克斯坦', 'zh-hk': '塔吉克斯坦', 'zh-tw': '塔吉克', es: 'Tayikistán', de: 'Tadschikistan', it: 'Tagikistan', pt: 'Tadjiquistão' },
    'Timor-Leste': { en: 'Timor-Leste', zh: '東帝汶', 'zh-hk': '東帝汶', 'zh-tw': '東帝汶', es: 'Timor Oriental', de: 'Osttimor', it: 'Timor Est', pt: 'Timor-Leste' },
    'Turkmenistan': { en: 'Turkmenistan', zh: '土庫曼斯坦', 'zh-hk': '土庫曼斯坦', 'zh-tw': '土庫曼', es: 'Turkmenistán', de: 'Turkmenistan', it: 'Turkmenistan', pt: 'Turcomenistão' },
    'Taiwan': { en: 'Taiwan', zh: '台灣', 'zh-hk': '台灣', 'zh-tw': '台灣', es: 'Taiwán', de: 'Taiwan', it: 'Taiwan', pt: 'Taiwan' },
    'Uzbekistan': { en: 'Uzbekistan', zh: '烏茲別克斯坦', 'zh-hk': '烏茲別克斯坦', 'zh-tw': '烏茲別克', es: 'Uzbekistán', de: 'Usbekistan', it: 'Uzbekistan', pt: 'Uzbequistão' },
    'Vietnam': { en: 'Vietnam', zh: '越南', 'zh-hk': '越南', 'zh-tw': '越南', es: 'Vietnam', de: 'Vietnam', it: 'Vietnam', pt: 'Vietnã' },
    'Yemen': { en: 'Yemen', zh: '也門', 'zh-hk': '也門', 'zh-tw': '葉門', es: 'Yemen', de: 'Jemen', it: 'Yemen', pt: 'Iémen' },
    'United Arab Emirates': { en: 'United Arab Emirates', zh: '阿拉伯聯合酋長國', 'zh-hk': '阿拉伯聯合酋長國', 'zh-tw': '阿聯酋', es: 'Emiratos Árabes Unidos', de: 'Vereinigte Arabische Emirate', it: 'Emirati Arabi Uniti', pt: 'Emirados Árabes Unidos' },

    // Africa
    'Algeria': { en: 'Algeria', zh: '阿爾及利亞', 'zh-hk': '阿爾及利亞', 'zh-tw': '阿爾及利亞', es: 'Argelia', de: 'Algerien', it: 'Algeria', pt: 'Argélia' },
    'Angola': { en: 'Angola', zh: '安哥拉', 'zh-hk': '安哥拉', 'zh-tw': '安哥拉', es: 'Angola', de: 'Angola', it: 'Angola', pt: 'Angola' },
    'Benin': { en: 'Benin', zh: '貝寧', 'zh-hk': '貝寧', 'zh-tw': '貝南', es: 'Benín', de: 'Benin', it: 'Benin', pt: 'Benin' },
    'Burkina Faso': { en: 'Burkina Faso', zh: '布基納法索', 'zh-hk': '布基納法索', 'zh-tw': '布吉納法索', es: 'Burkina Faso', de: 'Burkina Faso', it: 'Burkina Faso', pt: 'Burkina Faso' },
    'Burundi': { en: 'Burundi', zh: '布隆迪', 'zh-hk': '布隆迪', 'zh-tw': '蒲隆地', es: 'Burundi', de: 'Burundi', it: 'Burundi', pt: 'Burundi' },
    'Botswana': { en: 'Botswana', zh: '博茨瓦納', 'zh-hk': '博茨瓦納', 'zh-tw': '波札那', es: 'Botsuana', de: 'Botswana', it: 'Botswana', pt: 'Botswana' },
    'Democratic Republic of the Congo': { en: 'Democratic Republic of the Congo', zh: '剛果民主共和國', 'zh-hk': '剛果民主共和國', 'zh-tw': '剛果民主共和國', es: 'República Democrática del Congo', de: 'Demokratische Republik Kongo', it: 'Repubblica Democratica del Congo', pt: 'República Democrática do Congo' },
    'Central African Republic': { en: 'Central African Republic', zh: '中非共和國', 'zh-hk': '中非共和國', 'zh-tw': '中非共和國', es: 'República Centroafricana', de: 'Zentralafrikanische Republik', it: 'Repubblica Centrafricana', pt: 'República Centro-Africana' },
    'Republic of the Congo': { en: 'Republic of the Congo', zh: '剛果共和國', 'zh-hk': '剛果共和國', 'zh-tw': '剛果共和國', es: 'República del Congo', de: 'Republik Kongo', it: 'Repubblica del Congo', pt: 'República do Congo' },
    'Ivory Coast': { en: 'Ivory Coast', zh: '科特迪瓦', 'zh-hk': '科特迪瓦', 'zh-tw': '象牙海岸', es: 'Costa de Marfil', de: 'Elfenbeinküste', it: 'Costa d\'Avorio', pt: 'Costa do Marfim' },
    'Cameroon': { en: 'Cameroon', zh: '喀麥隆', 'zh-hk': '喀麥隆', 'zh-tw': '喀麥隆', es: 'Camerún', de: 'Kamerun', it: 'Camerun', pt: 'Camarões' },
    'Cape Verde': { en: 'Cape Verde', zh: '佛得角', 'zh-hk': '佛得角', 'zh-tw': '維德角', es: 'Cabo Verde', de: 'Kap Verde', it: 'Capo Verde', pt: 'Cabo Verde' },
    'Djibouti': { en: 'Djibouti', zh: '吉布提', 'zh-hk': '吉布提', 'zh-tw': '吉布地', es: 'Yibuti', de: 'Dschibuti', it: 'Gibuti', pt: 'Djibuti' },
    'Egypt': { en: 'Egypt', zh: '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及', es: 'Egipto', de: 'Ägypten', it: 'Egitto', pt: 'Egito' },
    'Eritrea': { en: 'Eritrea', zh: '厄立特里亞', 'zh-hk': '厄立特里亞', 'zh-tw': '厄利垂亞', es: 'Eritrea', de: 'Eritrea', it: 'Eritrea', pt: 'Eritreia' },
    'Ethiopia': { en: 'Ethiopia', zh: '埃塞俄比亞', 'zh-hk': '埃塞俄比亞', 'zh-tw': '衣索比亞', es: 'Etiopía', de: 'Äthiopien', it: 'Etiopia', pt: 'Etiópia' },
    'Gabon': { en: 'Gabon', zh: '加蓬', 'zh-hk': '加蓬', 'zh-tw': '加彭', es: 'Gabón', de: 'Gabun', it: 'Gabon', pt: 'Gabão' },
    'Ghana': { en: 'Ghana', zh: '加納', 'zh-hk': '加納', 'zh-tw': '迦納', es: 'Ghana', de: 'Ghana', it: 'Ghana', pt: 'Gana' },
    'Gambia': { en: 'Gambia', zh: '岡比亞', 'zh-hk': '岡比亞', 'zh-tw': '甘比亞', es: 'Gambia', de: 'Gambia', it: 'Gambia', pt: 'Gâmbia' },
    'Guinea': { en: 'Guinea', zh: '幾內亞', 'zh-hk': '幾內亞', 'zh-tw': '幾內亞', es: 'Guinea', de: 'Guinea', it: 'Guinea', pt: 'Guiné' },
    'Equatorial Guinea': { en: 'Equatorial Guinea', zh: '赤道幾內亞', 'zh-hk': '赤道幾內亞', 'zh-tw': '赤道幾內亞', es: 'Guinea Ecuatorial', de: 'Äquatorialguinea', it: 'Guinea Equatoriale', pt: 'Guiné Equatorial' },
    'Guinea-Bissau': { en: 'Guinea-Bissau', zh: '幾內亞比紹', 'zh-hk': '幾內亞比紹', 'zh-tw': '幾內亞比索', es: 'Guinea-Bisáu', de: 'Guinea-Bissau', it: 'Guinea-Bissau', pt: 'Guiné-Bissau' },
    'Kenya': { en: 'Kenya', zh: '肯尼亞', 'zh-hk': '肯尼亞', 'zh-tw': '肯亞', es: 'Kenia', de: 'Kenia', it: 'Kenya', pt: 'Quênia' },
    'Comoros': { en: 'Comoros', zh: '科摩羅', 'zh-hk': '科摩羅', 'zh-tw': '葛摩', es: 'Comoras', de: 'Komoren', it: 'Comore', pt: 'Comores' },
    'Liberia': { en: 'Liberia', zh: '利比里亞', 'zh-hk': '利比里亞', 'zh-tw': '賴比瑞亞', es: 'Liberia', de: 'Liberia', it: 'Liberia', pt: 'Libéria' },
    'Lesotho': { en: 'Lesotho', zh: '萊索托', 'zh-hk': '萊索托', 'zh-tw': '賴索托', es: 'Lesoto', de: 'Lesotho', it: 'Lesotho', pt: 'Lesoto' },
    'Libya': { en: 'Libya', zh: '利比亞', 'zh-hk': '利比亞', 'zh-tw': '利比亞', es: 'Libia', de: 'Libyen', it: 'Libia', pt: 'Líbia' },
    'Morocco': { en: 'Morocco', zh: '摩洛哥', 'zh-hk': '摩洛哥', 'zh-tw': '摩洛哥', es: 'Marruecos', de: 'Marokko', it: 'Marocco', pt: 'Marrocos' },
    'Madagascar': { en: 'Madagascar', zh: '馬達加斯加', 'zh-hk': '馬達加斯加', 'zh-tw': '馬達加斯加', es: 'Madagascar', de: 'Madagaskar', it: 'Madagascar', pt: 'Madagascar' },
    'Mali': { en: 'Mali', zh: '馬里', 'zh-hk': '馬里', 'zh-tw': '馬利', es: 'Malí', de: 'Mali', it: 'Mali', pt: 'Mali' },
    'Mauritania': { en: 'Mauritania', zh: '毛里塔尼亞', 'zh-hk': '毛里塔尼亞', 'zh-tw': '茅利塔尼亞', es: 'Mauritania', de: 'Mauretanien', it: 'Mauritania', pt: 'Mauritânia' },
    'Mauritius': { en: 'Mauritius', zh: '毛里求斯', 'zh-hk': '毛里求斯', 'zh-tw': '模里西斯', es: 'Mauricio', de: 'Mauritius', it: 'Mauritius', pt: 'Maurício' },
    'Malawi': { en: 'Malawi', zh: '馬拉維', 'zh-hk': '馬拉維', 'zh-tw': '馬拉威', es: 'Malaui', de: 'Malawi', it: 'Malawi', pt: 'Malawi' },
    'Mozambique': { en: 'Mozambique', zh: '莫桑比克', 'zh-hk': '莫桑比克', 'zh-tw': '莫三比克', es: 'Mozambique', de: 'Mosambik', it: 'Mozambico', pt: 'Moçambique' },
    'Namibia': { en: 'Namibia', zh: '納米比亞', 'zh-hk': '納米比亞', 'zh-tw': '納米比亞', es: 'Namibia', de: 'Namibia', it: 'Namibia', pt: 'Namíbia' },
    'Niger': { en: 'Niger', zh: '尼日爾', 'zh-hk': '尼日爾', 'zh-tw': '尼日', es: 'Níger', de: 'Niger', it: 'Niger', pt: 'Níger' },
    'Nigeria': { en: 'Nigeria', zh: '尼日利亞', 'zh-hk': '尼日利亞', 'zh-tw': '奈及利亞', es: 'Nigeria', de: 'Nigeria', it: 'Nigeria', pt: 'Nigéria' },
    'Rwanda': { en: 'Rwanda', zh: '盧旺達', 'zh-hk': '盧旺達', 'zh-tw': '盧安達', es: 'Ruanda', de: 'Ruanda', it: 'Ruanda', pt: 'Ruanda' },
    'Seychelles': { en: 'Seychelles', zh: '塞舌爾', 'zh-hk': '塞舌爾', 'zh-tw': '塞席爾', es: 'Seychelles', de: 'Seychellen', it: 'Seychelles', pt: 'Seicheles' },
    'Sudan': { en: 'Sudan', zh: '蘇丹', 'zh-hk': '蘇丹', 'zh-tw': '蘇丹', es: 'Sudán', de: 'Sudan', it: 'Sudan', pt: 'Sudão' },
    'Sierra Leone': { en: 'Sierra Leone', zh: '塞拉利昂', 'zh-hk': '塞拉利昂', 'zh-tw': '獅子山', es: 'Sierra Leona', de: 'Sierra Leone', it: 'Sierra Leone', pt: 'Serra Leoa' },
    'Senegal': { en: 'Senegal', zh: '塞內加爾', 'zh-hk': '塞內加爾', 'zh-tw': '塞內加爾', es: 'Senegal', de: 'Senegal', it: 'Senegal', pt: 'Senegal' },
    'Somalia': { en: 'Somalia', zh: '索馬里', 'zh-hk': '索馬里', 'zh-tw': '索馬利亞', es: 'Somalia', de: 'Somalia', it: 'Somalia', pt: 'Somália' },
    'South Sudan': { en: 'South Sudan', zh: '南蘇丹', 'zh-hk': '南蘇丹', 'zh-tw': '南蘇丹', es: 'Sudán del Sur', de: 'Südsudan', it: 'Sudan del Sud', pt: 'Sudão do Sul' },
    'São Tomé and Príncipe': { en: 'São Tomé and Príncipe', zh: '聖多美和普林西比', 'zh-hk': '聖多美和普林西比', 'zh-tw': '聖多美普林西比', es: 'Santo Tomé y Príncipe', de: 'São Tomé und Príncipe', it: 'São Tomé e Príncipe', pt: 'São Tomé e Príncipe' },
    'Eswatini': { en: 'Eswatini', zh: '斯威士蘭', 'zh-hk': '斯威士蘭', 'zh-tw': '史瓦帝尼', es: 'Esuatini', de: 'Eswatini', it: 'Eswatini', pt: 'Eswatini' },
    'Chad': { en: 'Chad', zh: '乍得', 'zh-hk': '乍得', 'zh-tw': '查德', es: 'Chad', de: 'Tschad', it: 'Ciad', pt: 'Chade' },
    'Togo': { en: 'Togo', zh: '多哥', 'zh-hk': '多哥', 'zh-tw': '多哥', es: 'Togo', de: 'Togo', it: 'Togo', pt: 'Togo' },
    'Tunisia': { en: 'Tunisia', zh: '突尼斯', 'zh-hk': '突尼斯', 'zh-tw': '突尼西亞', es: 'Túnez', de: 'Tunesien', it: 'Tunisia', pt: 'Tunísia' },
    'Tanzania': { en: 'Tanzania', zh: '坦桑尼亞', 'zh-hk': '坦桑尼亞', 'zh-tw': '坦尚尼亞', es: 'Tanzania', de: 'Tansania', it: 'Tanzania', pt: 'Tanzânia' },
    'Uganda': { en: 'Uganda', zh: '烏干達', 'zh-hk': '烏干達', 'zh-tw': '烏干達', es: 'Uganda', de: 'Uganda', it: 'Uganda', pt: 'Uganda' },
    'South Africa': { en: 'South Africa', zh: '南非', 'zh-hk': '南非', 'zh-tw': '南非', es: 'Sudáfrica', de: 'Südafrika', it: 'Sudafrica', pt: 'África do Sul' },
    'Zambia': { en: 'Zambia', zh: '贊比亞', 'zh-hk': '贊比亞', 'zh-tw': '尚比亞', es: 'Zambia', de: 'Sambia', it: 'Zambia', pt: 'Zâmbia' },
    'Zimbabwe': { en: 'Zimbabwe', zh: '津巴布韋', 'zh-hk': '津巴布韋', 'zh-tw': '辛巴威', es: 'Zimbabue', de: 'Simbabwe', it: 'Zimbabwe', pt: 'Zimbábue' },

    // North America
    'Antigua and Barbuda': { en: 'Antigua and Barbuda', zh: '安提瓜和巴布達', 'zh-hk': '安提瓜和巴布達', 'zh-tw': '安地卡及巴布達', es: 'Antigua y Barbuda', de: 'Antigua und Barbuda', it: 'Antigua e Barbuda', pt: 'Antígua e Barbuda' },
    'Barbados': { en: 'Barbados', zh: '巴巴多斯', 'zh-hk': '巴巴多斯', 'zh-tw': '巴貝多', es: 'Barbados', de: 'Barbados', it: 'Barbados', pt: 'Barbados' },
    'Belize': { en: 'Belize', zh: '伯利茲', 'zh-hk': '伯利茲', 'zh-tw': '貝里斯', es: 'Belice', de: 'Belize', it: 'Belize', pt: 'Belize' },
    'Bahamas': { en: 'Bahamas', zh: '巴哈馬', 'zh-hk': '巴哈馬', 'zh-tw': '巴哈馬', es: 'Bahamas', de: 'Bahamas', it: 'Bahamas', pt: 'Bahamas' },
    'Canada': { en: 'Canada', zh: '加拿大', 'zh-hk': '加拿大', 'zh-tw': '加拿大', es: 'Canadá', de: 'Kanada', it: 'Canada', pt: 'Canadá' },
    'Costa Rica': { en: 'Costa Rica', zh: '哥斯達黎加', 'zh-hk': '哥斯達黎加', 'zh-tw': '哥斯大黎加', es: 'Costa Rica', de: 'Costa Rica', it: 'Costa Rica', pt: 'Costa Rica' },
    'Cuba': { en: 'Cuba', zh: '古巴', 'zh-hk': '古巴', 'zh-tw': '古巴', es: 'Cuba', de: 'Kuba', it: 'Cuba', pt: 'Cuba' },
    'Dominica': { en: 'Dominica', zh: '多米尼克', 'zh-hk': '多米尼克', 'zh-tw': '多米尼克', es: 'Dominica', de: 'Dominica', it: 'Dominica', pt: 'Dominica' },
    'Dominican Republic': { en: 'Dominican Republic', zh: '多明尼加共和國', 'zh-hk': '多明尼加共和國', 'zh-tw': '多明尼加', es: 'República Dominicana', de: 'Dominikanische Republik', it: 'Repubblica Dominicana', pt: 'República Dominicana' },
    'Grenada': { en: 'Grenada', zh: '格林納達', 'zh-hk': '格林納達', 'zh-tw': '格瑞那達', es: 'Granada', de: 'Grenada', it: 'Grenada', pt: 'Granada' },
    'Guatemala': { en: 'Guatemala', zh: '危地馬拉', 'zh-hk': '危地馬拉', 'zh-tw': '瓜地馬拉', es: 'Guatemala', de: 'Guatemala', it: 'Guatemala', pt: 'Guatemala' },
    'Honduras': { en: 'Honduras', zh: '洪都拉斯', 'zh-hk': '洪都拉斯', 'zh-tw': '宏都拉斯', es: 'Honduras', de: 'Honduras', it: 'Honduras', pt: 'Honduras' },
    'Haiti': { en: 'Haiti', zh: '海地', 'zh-hk': '海地', 'zh-tw': '海地', es: 'Haití', de: 'Haiti', it: 'Haiti', pt: 'Haiti' },
    'Jamaica': { en: 'Jamaica', zh: '牙買加', 'zh-hk': '牙買加', 'zh-tw': '牙買加', es: 'Jamaica', de: 'Jamaika', it: 'Giamaica', pt: 'Jamaica' },
    'Saint Kitts and Nevis': { en: 'Saint Kitts and Nevis', zh: '聖基茨和尼維斯', 'zh-hk': '聖基茨和尼維斯', 'zh-tw': '聖克里斯多福及尼維斯', es: 'San Cristóbal y Nieves', de: 'St. Kitts und Nevis', it: 'Saint Kitts e Nevis', pt: 'São Cristóvão e Nevis' },
    'Saint Lucia': { en: 'Saint Lucia', zh: '聖盧西亞', 'zh-hk': '聖盧西亞', 'zh-tw': '聖露西亞', es: 'Santa Lucía', de: 'St. Lucia', it: 'Santa Lucia', pt: 'Santa Lúcia' },
    'Mexico': { en: 'Mexico', zh: '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥', es: 'México', de: 'Mexiko', it: 'Messico', pt: 'México' },
    'Nicaragua': { en: 'Nicaragua', zh: '尼加拉瓜', 'zh-hk': '尼加拉瓜', 'zh-tw': '尼加拉瓜', es: 'Nicaragua', de: 'Nicaragua', it: 'Nicaragua', pt: 'Nicarágua' },
    'Panama': { en: 'Panama', zh: '巴拿馬', 'zh-hk': '巴拿馬', 'zh-tw': '巴拿馬', es: 'Panamá', de: 'Panama', it: 'Panama', pt: 'Panamá' },
    'El Salvador': { en: 'El Salvador', zh: '薩爾瓦多', 'zh-hk': '薩爾瓦多', 'zh-tw': '薩爾瓦多', es: 'El Salvador', de: 'El Salvador', it: 'El Salvador', pt: 'El Salvador' },
    'Trinidad and Tobago': { en: 'Trinidad and Tobago', zh: '特立尼達和多巴哥', 'zh-hk': '特立尼達和多巴哥', 'zh-tw': '千里達及托巴哥', es: 'Trinidad y Tobago', de: 'Trinidad und Tobago', it: 'Trinidad e Tobago', pt: 'Trinidad e Tobago' },
    'USA': { en: 'USA', zh: '美國', 'zh-hk': '美國', 'zh-tw': '美國', es: 'Estados Unidos', de: 'USA', it: 'Stati Uniti', pt: 'Estados Unidos' },
    'Saint Vincent and the Grenadines': { en: 'Saint Vincent and the Grenadines', zh: '聖文森特和格林納丁斯', 'zh-hk': '聖文森特和格林納丁斯', 'zh-tw': '聖文森及格瑞那丁', es: 'San Vicente y las Granadinas', de: 'St. Vincent und die Grenadinen', it: 'Saint Vincent e Grenadine', pt: 'São Vicente e Granadinas' },

    // South America
    'Argentina': { en: 'Argentina', zh: '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷', es: 'Argentina', de: 'Argentinien', it: 'Argentina', pt: 'Argentina' },
    'Bolivia': { en: 'Bolivia', zh: '玻利維亞', 'zh-hk': '玻利維亞', 'zh-tw': '玻利維亞', es: 'Bolivia', de: 'Bolivien', it: 'Bolivia', pt: 'Bolívia' },
    'Brazil': { en: 'Brazil', zh: '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西', es: 'Brasil', de: 'Brasilien', it: 'Brasile', pt: 'Brasil' },
    'Chile': { en: 'Chile', zh: '智利', 'zh-hk': '智利', 'zh-tw': '智利', es: 'Chile', de: 'Chile', it: 'Cile', pt: 'Chile' },
    'Colombia': { en: 'Colombia', zh: '哥倫比亞', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞', es: 'Colombia', de: 'Kolumbien', it: 'Colombia', pt: 'Colômbia' },
    'Ecuador': { en: 'Ecuador', zh: '厄瓜多爾', 'zh-hk': '厄瓜多爾', 'zh-tw': '厄瓜多', es: 'Ecuador', de: 'Ecuador', it: 'Ecuador', pt: 'Equador' },
    'Falkland Islands': { en: 'Falkland Islands', zh: '福克蘭群島', 'zh-hk': '福克蘭群島', 'zh-tw': '福克蘭群島', es: 'Islas Malvinas', de: 'Falklandinseln', it: 'Isole Falkland', pt: 'Ilhas Malvinas' },
    'French Guiana': { en: 'French Guiana', zh: '法屬圭亞那', 'zh-hk': '法屬圭亞那', 'zh-tw': '法屬圭亞那', es: 'Guayana Francesa', de: 'Französisch-Guayana', it: 'Guyana francese', pt: 'Guiana Francesa' },
    'Guyana': { en: 'Guyana', zh: '圭亞那', 'zh-hk': '圭亞那', 'zh-tw': '蓋亞那', es: 'Guyana', de: 'Guyana', it: 'Guyana', pt: 'Guiana' },
    'Peru': { en: 'Peru', zh: '秘魯', 'zh-hk': '秘魯', 'zh-tw': '秘魯', es: 'Perú', de: 'Peru', it: 'Perù', pt: 'Peru' },
    'Paraguay': { en: 'Paraguay', zh: '巴拉圭', 'zh-hk': '巴拉圭', 'zh-tw': '巴拉圭', es: 'Paraguay', de: 'Paraguay', it: 'Paraguay', pt: 'Paraguai' },
    'Suriname': { en: 'Suriname', zh: '蘇里南', 'zh-hk': '蘇里南', 'zh-tw': '蘇利南', es: 'Surinam', de: 'Suriname', it: 'Suriname', pt: 'Suriname' },
    'Uruguay': { en: 'Uruguay', zh: '烏拉圭', 'zh-hk': '烏拉圭', 'zh-tw': '烏拉圭', es: 'Uruguay', de: 'Uruguay', it: 'Uruguay', pt: 'Uruguai' },
    'Venezuela': { en: 'Venezuela', zh: '委內瑞拉', 'zh-hk': '委內瑞拉', 'zh-tw': '委內瑞拉', es: 'Venezuela', de: 'Venezuela', it: 'Venezuela', pt: 'Venezuela' },

    // Oceania
    'Australia': { en: 'Australia', zh: '澳大利亞', 'zh-hk': '澳大利亞', 'zh-tw': '澳洲', es: 'Australia', de: 'Australien', it: 'Australia', pt: 'Austrália' },
    'Cook Islands': { en: 'Cook Islands', zh: '庫克群島', 'zh-hk': '庫克群島', 'zh-tw': '庫克群島', es: 'Islas Cook', de: 'Cookinseln', it: 'Isole Cook', pt: 'Ilhas Cook' },
    'Fiji': { en: 'Fiji', zh: '斐濟', 'zh-hk': '斐濟', 'zh-tw': '斐濟', es: 'Fiyi', de: 'Fidschi', it: 'Figi', pt: 'Fiji' },
    'Micronesia': { en: 'Micronesia', zh: '密克羅尼西亞', 'zh-hk': '密克羅尼西亞', 'zh-tw': '密克羅尼西亞', es: 'Micronesia', de: 'Mikronesien', it: 'Micronesia', pt: 'Micronésia' },
    'Kiribati': { en: 'Kiribati', zh: '基里巴斯', 'zh-hk': '基里巴斯', 'zh-tw': '吉里巴斯', es: 'Kiribati', de: 'Kiribati', it: 'Kiribati', pt: 'Kiribati' },
    'Marshall Islands': { en: 'Marshall Islands', zh: '馬紹爾群島', 'zh-hk': '馬紹爾群島', 'zh-tw': '馬紹爾群島', es: 'Islas Marshall', de: 'Marshallinseln', it: 'Isole Marshall', pt: 'Ilhas Marshall' },
    'New Caledonia': { en: 'New Caledonia', zh: '新喀里多尼亞', 'zh-hk': '新喀里多尼亞', 'zh-tw': '新喀里多尼亞', es: 'Nueva Caledonia', de: 'Neukaledonien', it: 'Nuova Caledonia', pt: 'Nova Caledônia' },
    'Nauru': { en: 'Nauru', zh: '瑙魯', 'zh-hk': '瑙魯', 'zh-tw': '諾魯', es: 'Nauru', de: 'Nauru', it: 'Nauru', pt: 'Nauru' },
    'Niue': { en: 'Niue', zh: '紐埃', 'zh-hk': '紐埃', 'zh-tw': '紐埃', es: 'Niue', de: 'Niue', it: 'Niue', pt: 'Niue' },
    'New Zealand': { en: 'New Zealand', zh: '新西蘭', 'zh-hk': '新西蘭', 'zh-tw': '紐西蘭', es: 'Nueva Zelanda', de: 'Neuseeland', it: 'Nuova Zelanda', pt: 'Nova Zelândia' },
    'French Polynesia': { en: 'French Polynesia', zh: '法屬波利尼西亞', 'zh-hk': '法屬波利尼西亞', 'zh-tw': '法屬玻里尼西亞', es: 'Polinesia Francesa', de: 'Französisch-Polynesien', it: 'Polinesia francese', pt: 'Polinésia Francesa' },
    'Papua New Guinea': { en: 'Papua New Guinea', zh: '巴布亞新幾內亞', 'zh-hk': '巴布亞新幾內亞', 'zh-tw': '巴布亞紐幾內亞', es: 'Papúa Nueva Guinea', de: 'Papua-Neuguinea', it: 'Papua Nuova Guinea', pt: 'Papua-Nova Guiné' },
    'Palau': { en: 'Palau', zh: '帛琉', 'zh-hk': '帛琉', 'zh-tw': '帛琉', es: 'Palaos', de: 'Palau', it: 'Palau', pt: 'Palau' },
    'Solomon Islands': { en: 'Solomon Islands', zh: '所羅門群島', 'zh-hk': '所羅門群島', 'zh-tw': '索羅門群島', es: 'Islas Salomón', de: 'Salomonen', it: 'Isole Salomone', pt: 'Ilhas Salomão' },
    'Tokelau': { en: 'Tokelau', zh: '托克勞', 'zh-hk': '托克勞', 'zh-tw': '托克勞', es: 'Tokelau', de: 'Tokelau', it: 'Tokelau', pt: 'Tokelau' },
    'Tonga': { en: 'Tonga', zh: '湯加', 'zh-hk': '湯加', 'zh-tw': '東加', es: 'Tonga', de: 'Tonga', it: 'Tonga', pt: 'Tonga' },
    'Tuvalu': { en: 'Tuvalu', zh: '圖瓦盧', 'zh-hk': '圖瓦盧', 'zh-tw': '吐瓦魯', es: 'Tuvalu', de: 'Tuvalu', it: 'Tuvalu', pt: 'Tuvalu' },
    'Vanuatu': { en: 'Vanuatu', zh: '瓦努阿圖', 'zh-hk': '瓦努阿圖', 'zh-tw': '萬那杜', es: 'Vanuatu', de: 'Vanuatu', it: 'Vanuatu', pt: 'Vanuatu' },
    'Wallis and Futuna': { en: 'Wallis and Futuna', zh: '瓦利斯和富圖納', 'zh-hk': '瓦利斯和富圖納', 'zh-tw': '瓦利斯和富圖納', es: 'Wallis y Futuna', de: 'Wallis und Futuna', it: 'Wallis e Futuna', pt: 'Wallis e Futuna' },
    'Samoa': { en: 'Samoa', zh: '薩摩亞', 'zh-hk': '薩摩亞', 'zh-tw': '薩摩亞', es: 'Samoa', de: 'Samoa', it: 'Samoa', pt: 'Samoa' },

    // Special regions and territories
    'Europe': { en: 'Europe', zh: '歐洲', 'zh-hk': '歐洲', 'zh-tw': '歐洲', es: 'Europa', de: 'Europa', it: 'Europa', pt: 'Europa' },
    'World': { en: 'World', zh: '世界', 'zh-hk': '世界', 'zh-tw': '世界', es: 'Mundial', de: 'Welt', it: 'Mondo', pt: 'Mundial' },

    // Australian States/Territories
    'Australian Capital Territory': { en: 'Australian Capital Territory', zh: '澳大利亞首都領地', 'zh-hk': '澳大利亞首都領地', 'zh-tw': '澳洲首都特區', es: 'Territorio de la Capital Australiana', de: 'Australisches Hauptstadtterritorium', it: 'Territorio della Capitale Australiana', pt: 'Território da Capital Australiana' },
    'New South Wales': { en: 'New South Wales', zh: '新南威爾士', 'zh-hk': '新南威爾士', 'zh-tw': '新南威爾斯', es: 'Nueva Gales del Sur', de: 'New South Wales', it: 'Nuovo Galles del Sud', pt: 'Nova Gales do Sul' },
    'Northern Territory': { en: 'Northern Territory', zh: '北領地', 'zh-hk': '北領地', 'zh-tw': '北領地', es: 'Territorio del Norte', de: 'Northern Territory', it: 'Territorio del Nord', pt: 'Território do Norte' },
    'Queensland': { en: 'Queensland', zh: '昆士蘭', 'zh-hk': '昆士蘭', 'zh-tw': '昆士蘭', es: 'Queensland', de: 'Queensland', it: 'Queensland', pt: 'Queensland' },
    'South Australia': { en: 'South Australia', zh: '南澳大利亞', 'zh-hk': '南澳大利亞', 'zh-tw': '南澳洲', es: 'Australia Meridional', de: 'Südaustralien', it: 'Australia Meridionale', pt: 'Austrália do Sul' },
    'Tasmania': { en: 'Tasmania', zh: '塔斯馬尼亞', 'zh-hk': '塔斯馬尼亞', 'zh-tw': '塔斯馬尼亞', es: 'Tasmania', de: 'Tasmanien', it: 'Tasmania', pt: 'Tasmânia' },
    'Victoria': { en: 'Victoria', zh: '維多利亞', 'zh-hk': '維多利亞', 'zh-tw': '維多利亞', es: 'Victoria', de: 'Victoria', it: 'Victoria', pt: 'Victoria' },
    'Western Australia': { en: 'Western Australia', zh: '西澳大利亞', 'zh-hk': '西澳大利亞', 'zh-tw': '西澳洲', es: 'Australia Occidental', de: 'Westaustralien', it: 'Australia Occidentale', pt: 'Austrália Ocidental' }
  };

  // Process each country from ALL_COUNTRIES
  ALL_COUNTRIES.forEach(country => {
    const countryName = country.name;

    if (knownTranslations[countryName]) {
      // Use existing translation
      translations[countryName] = knownTranslations[countryName];
    } else {
      // Create default translation (fallback to English for missing translations)
      translations[countryName] = {
        en: countryName,
        zh: countryName,
        'zh-hk': countryName,
        'zh-tw': countryName,
        es: countryName,
        de: countryName,
        it: countryName,
        pt: countryName
      };
    }
  });

  return translations;
};

// Country translations mapping - generated from ALL_COUNTRIES
const COUNTRY_TRANSLATIONS: CountryTranslations = generateCountryTranslations();

// League translations mapping
const LEAGUE_TRANSLATIONS: LeagueTranslations = {
  // England
  'Premier League': {
    en: 'Premier League', zh: '英超', 'zh-hk': '英超', 'zh-tw': '英超',
    es: 'Premier League', de: 'Premier League', it: 'Premier League', pt: 'Premier League'
  },
  'Championship': {
    en: 'Championship', zh: '英冠', 'zh-hk': '英冠', 'zh-tw': '英冠',
    es: 'Championship', de: 'Championship', it: 'Championship', pt: 'Championship'
  },
  'FA Cup': {
    en: 'FA Cup', zh: '足总杯', 'zh-hk': '足總盃', 'zh-tw': '足總盃',
    es: 'Copa FA', de: 'FA Cup', it: 'FA Cup', pt: 'Taça FA'
  },
  // Spain
  'La Liga': {
    en: 'La Liga', zh: '西甲', 'zh-hk': '西甲', 'zh-tw': '西甲',
    es: 'La Liga', de: 'La Liga', it: 'La Liga', pt: 'La Liga'
  },
  'Segunda División': {
    en: 'Segunda División', zh: '西乙', 'zh-hk': '西乙', 'zh-tw': '西乙',
    es: 'Segunda División', de: 'Segunda División', it: 'Segunda División', pt: 'Segunda División'
  },
  'Copa del Rey': {
    en: 'Copa del Rey', zh: '国王杯', 'zh-hk': '國王盃', 'zh-tw': '國王盃',
    es: 'Copa del Rey', de: 'Copa del Rey', it: 'Copa del Rey', pt: 'Taça do Rei'
  },
  // Italy
  'Serie A': {
    en: 'Serie A', zh: '意甲', 'zh-hk': '意甲', 'zh-tw': '意甲',
    es: 'Serie A', de: 'Serie A', it: 'Serie A', pt: 'Série A'
  },
  'Serie B': {
    en: 'Serie B', zh: '意乙', 'zh-hk': '意乙', 'zh-tw': '意乙',
    es: 'Serie B', de: 'Serie B', it: 'Serie B', pt: 'Série B'
  },
  'Coppa Italia': {
    en: 'Coppa Italia', zh: '意大利杯', 'zh-hk': '意大利盃', 'zh-tw': '意大利盃',
    es: 'Copa de Italia', de: 'Coppa Italia', it: 'Coppa Italia', pt: 'Taça de Itália'
  },
  // Germany
  'Bundesliga': {
    en: 'Bundesliga', zh: '德甲', 'zh-hk': '德甲', 'zh-tw': '德甲',
    es: 'Bundesliga', de: 'Bundesliga', it: 'Bundesliga', pt: 'Bundesliga'
  },
  '2. Bundesliga': {
    en: '2. Bundesliga', zh: '德乙', 'zh-hk': '德乙', 'zh-tw': '德乙',
    es: '2. Bundesliga', de: '2. Bundesliga', it: '2. Bundesliga', pt: '2. Bundesliga'
  },
  'DFB Pokal': {
    en: 'DFB Pokal', zh: '德国杯', 'zh-hk': '德國盃', 'zh-tw': '德國盃',
    es: 'Copa de Alemania', de: 'DFB-Pokal', it: 'Coppa di Germania', pt: 'Taça da Alemanha'
  },
  // France
  'Ligue 1': {
    en: 'Ligue 1', zh: '法甲', 'zh-hk': '法甲', 'zh-tw': '法甲',
    es: 'Ligue 1', de: 'Ligue 1', it: 'Ligue 1', pt: 'Ligue 1'
  },
  'Ligue 2': {
    en: 'Ligue 2', zh: '法乙', 'zh-hk': '法乙', 'zh-tw': '法乙',
    es: 'Ligue 2', de: 'Ligue 2', it: 'Ligue 2', pt: 'Ligue 2'
  },
  'Coupe de France': {
    en: 'Coupe de France', zh: '法国杯', 'zh-hk': '法國盃', 'zh-tw': '法國盃',
    es: 'Copa de Francia', de: 'Französischer Pokal', it: 'Coppa di Francia', pt: 'Taça de França'
  },
  // UEFA Competitions
  'UEFA Champions League': {
    en: 'UEFA Champions League', zh: '欧冠', 'zh-hk': '歐冠', 'zh-tw': '歐冠',
    es: 'Liga de Campeones', de: 'Champions League', it: 'Champions League', pt: 'Liga dos Campeões'
  },
  'UEFA Europa League': {
    en: 'UEFA Europa League', zh: '欧联杯', 'zh-hk': '歐聯盃', 'zh-tw': '歐聯盃',
    es: 'Liga Europa', de: 'Europa League', it: 'Europa League', pt: 'Liga Europa'
  },
  'UEFA Europa Conference League': {
    en: 'UEFA Europa Conference League', zh: '欧会杯', 'zh-hk': '歐會盃', 'zh-tw': '歐會盃',
    es: 'Conference League', de: 'Conference League', it: 'Conference League', pt: 'Conference League'
  },
  // International
  'FIFA World Cup': {
    en: 'FIFA World Cup', zh: '世界杯', 'zh-hk': '世界盃', 'zh-tw': '世界盃',
    es: 'Copa Mundial FIFA', de: 'FIFA-Weltmeisterschaft', it: 'Coppa del Mondo FIFA', pt: 'Copa do Mundo FIFA'
  },
  'UEFA European Championship': {
    en: 'UEFA European Championship', zh: '欧洲杯', 'zh-hk': '歐洲盃', 'zh-tw': '歐洲盃',
    es: 'Eurocopa', de: 'Europameisterschaft', it: 'Campionato Europeo', pt: 'Campeonato Europeu'
  },
  'Copa America': {
    en: 'Copa America', zh: '美洲杯', 'zh-hk': '美洲盃', 'zh-tw': '美洲盃',
    es: 'Copa América', de: 'Copa América', it: 'Copa América', pt: 'Copa América'
  }
};

// Static list of major leagues (add more as needed)
export const MAJOR_LEAGUES = [
  // England
  { id: 39, name: "Premier League", country: "England", countryCode: "GB-ENG" },
  { id: 40, name: "Championship", country: "England", countryCode: "GB-ENG" },
  { id: 41, name: "League One", country: "England", countryCode: "GB-ENG" },
  { id: 42, name: "League Two", country: "England", countryCode: "GB-ENG" },
  { id: 45, name: "FA Cup", country: "England", countryCode: "GB-ENG" },
  { id: 48, name: "EFL Cup", country: "England", countryCode: "GB-ENG" },

  // Spain
  { id: 140, name: "La Liga", country: "Spain", countryCode: "ES" },
  { id: 141, name: "Segunda División", country: "Spain", countryCode: "ES" },
  { id: 143, name: "Copa del Rey", country: "Spain", countryCode: "ES" },

  // Italy
  { id: 135, name: "Serie A", country: "Italy", countryCode: "IT" },
  { id: 136, name: "Serie B", country: "Italy", countryCode: "IT" },
  { id: 137, name: "Coppa Italia", country: "Italy", countryCode: "IT" },

  // Germany
  { id: 78, name: "Bundesliga", country: "Germany", countryCode: "DE" },
  { id: 79, name: "2. Bundesliga", country: "Germany", countryCode: "DE" },
  { id: 81, name: "DFB Pokal", country: "Germany", countryCode: "DE" },

  // France
  { id: 61, name: "Ligue 1", country: "France", countryCode: "FR" },
  { id: 62, name: "Ligue 2", country: "France", countryCode: "FR" },
  { id: 66, name: "Coupe de France", country: "France", countryCode: "FR" },

  // UEFA Competitions
  { id: 2, name: "UEFA Champions League", country: "World", countryCode: "WORLD" },
  { id: 3, name: "UEFA Europa League", country: "World", countryCode: "WORLD" },
  { id: 848, name: "UEFA Europa Conference League", country: "World", countryCode: "WORLD" },
  { id: 4, name: "UEFA Nations League", country: "World", countryCode: "WORLD" },
  { id: 5, name: "UEFA European Championship", country: "World", countryCode: "WORLD" },

  // Other Major Leagues
  { id: 88, name: "Eredivisie", country: "Netherlands", countryCode: "NL" },
  { id: 94, name: "Primeira Liga", country: "Portugal", countryCode: "PT" },
  { id: 203, name: "Süper Lig", country: "Turkey", countryCode: "TR" },
  { id: 235, name: "Russian Premier League", country: "Russia", countryCode: "RU" },
  { id: 218, name: "Scottish Premiership", country: "Scotland", countryCode: "GB-SCT" },

  // South American
  { id: 128, name: "Copa Libertadores", country: "World", countryCode: "WORLD" },
  { id: 129, name: "Copa Sudamericana", country: "World", countryCode: "WORLD" },

  // International
  { id: 1, name: "FIFA World Cup", country: "World", countryCode: "WORLD" },
  { id: 15, name: "Copa America", country: "World", countryCode: "WORLD" },
  { id: 16, name: "Africa Cup of Nations", country: "World", countryCode: "WORLD" },
  { id: 17, name: "AFC Asian Cup", country: "World", countryCode: "WORLD" },
] as const;

// Helper functions
export const getCountryByCode = (code: string) => {
  return ALL_COUNTRIES.find(country => country.code === code);
};

export const getCountryByName = (name: string) => {
  return ALL_COUNTRIES.find(country => 
    country.name.toLowerCase() === name.toLowerCase()
  );
};

export const getLeagueById = (id: number) => {
  return MAJOR_LEAGUES.find(league => league.id === id);
};

export const getLeaguesByCountry = (countryName: string) => {
  return MAJOR_LEAGUES.filter(league => 
    league.country.toLowerCase() === countryName.toLowerCase()
  );
};

export const getCountriesAsOptions = () => {
  return ALL_COUNTRIES.map(country => ({
    value: country.code,
    label: country.name,
    flag: country.flag
  }));
};

export const getLeaguesAsOptions = () => {
  return MAJOR_LEAGUES.map(league => ({
    value: league.id,
    label: league.name,
    country: league.country,
    countryCode: league.countryCode
  }));
};

// Translation helper functions
export const translateCountryName = (countryName: string, language: string = 'en'): string => {
  const translation = COUNTRY_TRANSLATIONS[countryName];
  if (translation && translation[language as keyof typeof translation]) {
    return translation[language as keyof typeof translation];
  }
  return countryName; // Return original if no translation found
};

export const translateLeagueName = (leagueName: string, language: string = 'en'): string => {
  const translation = LEAGUE_TRANSLATIONS[leagueName];
  if (translation && translation[language as keyof typeof translation]) {
    return translation[language as keyof typeof translation];
  }
  return leagueName; // Return original if no translation found
};

// Enhanced helper functions with translation support
export const getTranslatedCountriesAsOptions = (language: string = 'en') => {
  return ALL_COUNTRIES.map(country => ({
    value: country.code,
    label: translateCountryName(country.name, language),
    originalLabel: country.name,
    flag: country.flag
  }));
};

export const getTranslatedLeaguesAsOptions = (language: string = 'en') => {
  return MAJOR_LEAGUES.map(league => ({
    value: league.id,
    label: translateLeagueName(league.name, language),
    originalLabel: league.name,
    country: translateCountryName(league.country, language),
    originalCountry: league.country,
    countryCode: league.countryCode
  }));
};

// Get translated country by code
export const getTranslatedCountryByCode = (code: string, language: string = 'en') => {
  const country = ALL_COUNTRIES.find(country => country.code === code);
  if (country) {
    return {
      ...country,
      name: translateCountryName(country.name, language),
      originalName: country.name
    };
  }
  return null;
};

// Get translated league by ID
export const getTranslatedLeagueById = (id: number, language: string = 'en') => {
  const league = MAJOR_LEAGUES.find(league => league.id === id);
  if (league) {
    return {
      ...league,
      name: translateLeagueName(league.name, language),
      originalName: league.name,
      country: translateCountryName(league.country, language),
      originalCountry: league.country
    };
  }
  return null;
};

// Get leagues by country with translation support
export const getTranslatedLeaguesByCountry = (countryName: string, language: string = 'en') => {
  return MAJOR_LEAGUES
    .filter(league => league.country.toLowerCase() === countryName.toLowerCase())
    .map(league => ({
      ...league,
      name: translateLeagueName(league.name, language),
      originalName: league.name,
      country: translateCountryName(league.country, language),
      originalCountry: league.country
    }));
};

// Check if a country name has translation available
export const hasCountryTranslation = (countryName: string, language: string = 'en'): boolean => {
  const translation = COUNTRY_TRANSLATIONS[countryName];
  return !!(translation && translation[language as keyof typeof translation]);
};

// Check if a league name has translation available
export const hasLeagueTranslation = (leagueName: string, language: string = 'en'): boolean => {
  const translation = LEAGUE_TRANSLATIONS[leagueName];
  return !!(translation && translation[language as keyof typeof translation]);
};

// Get all supported languages
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'zh-hk', name: '中文 (香港)' },
    { code: 'zh-tw', name: '中文 (台灣)' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' }
  ];
};

// Batch translate multiple countries
export const batchTranslateCountries = (countryNames: string[], language: string = 'en') => {
  return countryNames.map(name => ({
    original: name,
    translated: translateCountryName(name, language),
    hasTranslation: hasCountryTranslation(name, language)
  }));
};

// Batch translate multiple leagues
export const batchTranslateLeagues = (leagueNames: string[], language: string = 'en') => {
  return leagueNames.map(name => ({
    original: name,
    translated: translateLeagueName(name, language),
    hasTranslation: hasLeagueTranslation(name, language)
  }));
};

// Type definitions
export type Country = typeof ALL_COUNTRIES[number];
export type League = typeof MAJOR_LEAGUES[number];
export type CountryOption = ReturnType<typeof getCountriesAsOptions>[number];
export type LeagueOption = ReturnType<typeof getLeaguesAsOptions>[number];

// Extended type definitions with translation support
export type TranslatedCountryOption = ReturnType<typeof getTranslatedCountriesAsOptions>[number];
export type TranslatedLeagueOption = ReturnType<typeof getTranslatedLeaguesAsOptions>[number];
export type TranslatedCountry = ReturnType<typeof getTranslatedCountryByCode>;
export type TranslatedLeague = ReturnType<typeof getTranslatedLeagueById>;
export type SupportedLanguage = ReturnType<typeof getSupportedLanguages>[number];