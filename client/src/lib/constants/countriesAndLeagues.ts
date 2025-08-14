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

// Comprehensive country name translations - Expanded from API data
const countryTranslations: { [key: string]: { [key: string]: string } } = {
  // Major European Countries
  'World': {
    en: 'World', zh: '世界', 'zh-hk': '世界', 'zh-tw': '世界',
    es: 'Mundial', de: 'Welt', it: 'Mondo', pt: 'Mundial'
  },
  'England': {
    en: 'England', zh: '英格兰', 'zh-hk': '英格蘭', 'zh-tw': '英格蘭',
    es: 'Inglaterra', de: 'England', it: 'Inghilterra', pt: 'Inglaterra'
  },
  'Spain': {
    en: 'Spain', zh: '西班牙', 'zh-hk': '西班牙', 'zh-tw': '西班牙',
    es: 'España', de: 'Spanien', it: 'Spagna', pt: 'Espanha'
  },
  'Italy': {
    en: 'Italy', zh: '意大利', 'zh-hk': '意大利', 'zh-tw': '意大利',
    es: 'Italia', de: 'Italien', it: 'Italia', pt: 'Itália'
  },
  'Germany': {
    en: 'Germany', zh: '德國', 'zh-hk': '德國', 'zh-tw': '德國',
    es: 'Alemania', de: 'Deutschland', it: 'Germania', pt: 'Alemanha'
  },
  'France': {
    en: 'France', zh: '法国', 'zh-hk': '法國', 'zh-tw': '法國',
    es: 'Francia', de: 'Frankreich', it: 'Francia', pt: 'França'
  },
  'Netherlands': {
    en: 'Netherlands', zh: '荷兰', 'zh-hk': '荷蘭', 'zh-tw': '荷蘭',
    es: 'Países Bajos', de: 'Niederlande', it: 'Paesi Bassi', pt: 'Países Baixos'
  },
  'Portugal': {
    en: 'Portugal', zh: '葡萄牙', 'zh-hk': '葡萄牙', 'zh-tw': '葡萄牙',
    es: 'Portugal', de: 'Portugal', it: 'Portogallo', pt: 'Portugal'
  },
  'Belgium': {
    en: 'Belgium', zh: '比利时', 'zh-hk': '比利時', 'zh-tw': '比利時',
    es: 'Bélgica', de: 'Belgien', it: 'Belgio', pt: 'Bélgica'
  },
  'Switzerland': {
    en: 'Switzerland', zh: '瑞士', 'zh-hk': '瑞士', 'zh-tw': '瑞士',
    es: 'Suiza', de: 'Schweiz', it: 'Svizzera', pt: 'Suíça'
  },
  'Austria': {
    en: 'Austria', zh: '奧地利', 'zh-hk': '奧地利', 'zh-tw': '奧地利',
    es: 'Austria', de: 'Österreich', it: 'Austria', pt: 'Áustria'
  },
  'Scotland': {
    en: 'Scotland', zh: '蘇格蘭', 'zh-hk': '蘇格蘭', 'zh-tw': '蘇格蘭',
    es: 'Escocia', de: 'Schottland', it: 'Scozia', pt: 'Escócia'
  },
  'Turkey': {
    en: 'Turkey', zh: '土耳其', 'zh-hk': '土耳其', 'zh-tw': '土耳其',
    es: 'Turquía', de: 'Türkei', it: 'Turchia', pt: 'Turquia'
  },
  'Poland': {
    en: 'Poland', zh: '波兰', 'zh-hk': '波蘭', 'zh-tw': '波蘭',
    es: 'Polonia', de: 'Polen', it: 'Polonia', pt: 'Polônia'
  },
  'Czech Republic': {
    en: 'Czech Republic', zh: '捷克', 'zh-hk': '捷克', 'zh-tw': '捷克',
    es: 'República Checa', de: 'Tschechien', it: 'Repubblica Ceca', pt: 'República Tcheca'
  },
  'Hungary': {
    en: 'Hungary', zh: '匈牙利', 'zh-hk': '匈牙利', 'zh-tw': '匈牙利',
    es: 'Hungría', de: 'Ungarn', it: 'Ungheria', pt: 'Hungria'
  },
  'Croatia': {
    en: 'Croatia', zh: '克罗地亚', 'zh-hk': '克羅地亞', 'zh-tw': '克羅埃西亞',
    es: 'Croacia', de: 'Kroatien', it: 'Croazia', pt: 'Croácia'
  },
  'Serbia': {
    en: 'Serbia', zh: '塞尔维亚', 'zh-hk': '塞爾維亞', 'zh-tw': '塞爾維亞',
    es: 'Serbia', de: 'Serbien', it: 'Serbia', pt: 'Sérvia'
  },
  'Romania': {
    en: 'Romania', zh: '罗马尼亚', 'zh-hk': '羅馬尼亞', 'zh-tw': '羅馬尼亞',
    es: 'Rumania', de: 'Rumänien', it: 'Romania', pt: 'Romênia'
  },
  'Bulgaria': {
    en: 'Bulgaria', zh: '保加利亚', 'zh-hk': '保加利亞', 'zh-tw': '保加利亞',
    es: 'Bulgaria', de: 'Bulgarien', it: 'Bulgaria', pt: 'Bulgária'
  },
  'Greece': {
    en: 'Greece', zh: '希腊', 'zh-hk': '希臘', 'zh-tw': '希臘',
    es: 'Grecia', de: 'Griechenland', it: 'Grecia', pt: 'Grécia'
  },
  'Ukraine': {
    en: 'Ukraine', zh: '乌克兰', 'zh-hk': '烏克蘭', 'zh-tw': '烏克蘭',
    es: 'Ucrania', de: 'Ukraine', it: 'Ucraina', pt: 'Ucrânia'
  },
  'Russia': {
    en: 'Russia', zh: '俄罗斯', 'zh-hk': '俄羅斯', 'zh-tw': '俄羅斯',
    es: 'Rusia', de: 'Russland', it: 'Russia', pt: 'Rússia'
  },
  'Denmark': {
    en: 'Denmark', zh: '丹麦', 'zh-hk': '丹麥', 'zh-tw': '丹麥',
    es: 'Dinamarca', de: 'Dänemark', it: 'Danimarca', pt: 'Dinamarca'
  },
  'Sweden': {
    en: 'Sweden', zh: '瑞典', 'zh-hk': '瑞典', 'zh-tw': '瑞典',
    es: 'Suecia', de: 'Schweden', it: 'Svezia', pt: 'Suécia'
  },
  'Norway': {
    en: 'Norway', zh: '挪威', 'zh-hk': '挪威', 'zh-tw': '挪威',
    es: 'Noruega', de: 'Norwegen', it: 'Norvegia', pt: 'Noruega'
  },
  'Finland': {
    en: 'Finland', zh: '芬兰', 'zh-hk': '芬蘭', 'zh-tw': '芬蘭',
    es: 'Finlandia', de: 'Finnland', it: 'Finlandia', pt: 'Finlândia'
  },
  // Asia
  'China': {
    en: 'China', zh: '中国', 'zh-hk': '中國', 'zh-tw': '中國',
    es: 'China', de: 'China', it: 'Cina', pt: 'China'
  },
  'Japan': {
    en: 'Japan', zh: '日本', 'zh-hk': '日本', 'zh-tw': '日本',
    es: 'Japón', de: 'Japan', it: 'Giappone', pt: 'Japão'
  },
  'South Korea': {
    en: 'South Korea', zh: '韩国', 'zh-hk': '韓國', 'zh-tw': '韓國',
    es: 'Corea del Sur', de: 'Südkorea', it: 'Corea del Sud', pt: 'Coreia do Sul'
  },
  'Australia': {
    en: 'Australia', zh: '澳洲', 'zh-hk': '澳洲', 'zh-tw': '澳洲',
    es: 'Australia', de: 'Australien', it: 'Australia', pt: 'Austrália'
  },
  'Saudi Arabia': {
    en: 'Saudi Arabia', zh: '沙特阿拉伯', 'zh-hk': '沙特阿拉伯', 'zh-tw': '沙特阿拉伯',
    es: 'Arabia Saudí', de: 'Saudi-Arabien', it: 'Arabia Saudita', pt: 'Arábia Saudita'
  },
  'Iran': {
    en: 'Iran', zh: '伊朗', 'zh-hk': '伊朗', 'zh-tw': '伊朗',
    es: 'Irán', de: 'Iran', it: 'Iran', pt: 'Irã'
  },
  'Iraq': {
    en: 'Iraq', zh: '伊拉克', 'zh-hk': '伊拉克', 'zh-tw': '伊拉克',
    es: 'Irak', de: 'Irak', it: 'Iraq', pt: 'Iraque'
  },
  'UAE': {
    en: 'UAE', zh: '阿联酋', 'zh-hk': '阿聯酋', 'zh-tw': '阿聯酋',
    es: 'EAU', de: 'VAE', it: 'EAU', pt: 'EAU'
  },
  'Qatar': {
    en: 'Qatar', zh: '卡塔尔', 'zh-hk': '卡塔爾', 'zh-tw': '卡達',
    es: 'Catar', de: 'Katar', it: 'Qatar', pt: 'Catar'
  },
  'Kuwait': {
    en: 'Kuwait', zh: '科威特', 'zh-hk': '科威特', 'zh-tw': '科威特',
    es: 'Kuwait', de: 'Kuwait', it: 'Kuwait', pt: 'Kuwait'
  },
  'Bahrain': {
    en: 'Bahrain', zh: '巴林', 'zh-hk': '巴林', 'zh-tw': '巴林',
    es: 'Baréin', de: 'Bahrain', it: 'Bahrain', pt: 'Bahrein'
  },
  'Oman': {
    en: 'Oman', zh: '阿曼', 'zh-hk': '阿曼', 'zh-tw': '阿曼',
    es: 'Omán', de: 'Oman', it: 'Oman', pt: 'Omã'
  },
  'India': {
    en: 'India', zh: '印度', 'zh-hk': '印度', 'zh-tw': '印度',
    es: 'India', de: 'Indien', it: 'India', pt: 'Índia'
  },
  'Thailand': {
    en: 'Thailand', zh: '泰国', 'zh-hk': '泰國', 'zh-tw': '泰國',
    es: 'Tailandia', de: 'Thailand', it: 'Thailandia', pt: 'Tailândia'
  },
  'Vietnam': {
    en: 'Vietnam', zh: '越南', 'zh-hk': '越南', 'zh-tw': '越南',
    es: 'Vietnam', de: 'Vietnam', it: 'Vietnam', pt: 'Vietnã'
  },
  'Malaysia': {
    en: 'Malaysia', zh: '马来西亚', 'zh-hk': '馬來西亞', 'zh-tw': '馬來西亞',
    es: 'Malasia', de: 'Malaysia', it: 'Malesia', pt: 'Malásia'
  },
  'Singapore': {
    en: 'Singapore', zh: '新加坡', 'zh-hk': '新加坡', 'zh-tw': '新加坡',
    es: 'Singapur', de: 'Singapur', it: 'Singapore', pt: 'Singapura'
  },
  'Indonesia': {
    en: 'Indonesia', zh: '印度尼西亚', 'zh-hk': '印尼', 'zh-tw': '印尼',
    es: 'Indonesia', de: 'Indonesien', it: 'Indonesia', pt: 'Indonésia'
  },
  'Philippines': {
    en: 'Philippines', zh: '菲律宾', 'zh-hk': '菲律賓', 'zh-tw': '菲律賓',
    es: 'Filipinas', de: 'Philippinen', it: 'Filippine', pt: 'Filipinas'
  },
  'Kazakhstan': {
    en: 'Kazakhstan', zh: '哈萨克斯坦', 'zh-hk': '哈薩克斯坦', 'zh-tw': '哈薩克斯坦',
    es: 'Kazajistán', de: 'Kasachstan', it: 'Kazakistan', pt: 'Cazaquistão'
  },
  'Uzbekistan': {
    en: 'Uzbekistan', zh: '乌兹别克斯坦', 'zh-hk': '烏茲別克斯坦', 'zh-tw': '烏茲別克斯坦',
    es: 'Uzbekistán', de: 'Usbekistan', it: 'Uzbekistan', pt: 'Uzbequistão'
  },
  // Americas
  'Brazil': {
    en: 'Brazil', zh: '巴西', 'zh-hk': '巴西', 'zh-tw': '巴西',
    es: 'Brasil', de: 'Brasilien', it: 'Brasile', pt: 'Brasil'
  },
  'Argentina': {
    en: 'Argentina', zh: '阿根廷', 'zh-hk': '阿根廷', 'zh-tw': '阿根廷',
    es: 'Argentina', de: 'Argentinien', it: 'Argentina', pt: 'Argentina'
  },
  'United States': {
    en: 'United States', zh: '美国', 'zh-hk': '美國', 'zh-tw': '美國',
    es: 'Estados Unidos', de: 'Vereinigte Staaten', it: 'Stati Uniti', pt: 'Estados Unidos'
  },
  'Mexico': {
    en: 'Mexico', zh: '墨西哥', 'zh-hk': '墨西哥', 'zh-tw': '墨西哥',
    es: 'México', de: 'Mexiko', it: 'Messico', pt: 'México'
  },
  'Colombia': {
    en: 'Colombia', zh: '哥伦比亚', 'zh-hk': '哥倫比亞', 'zh-tw': '哥倫比亞',
    es: 'Colombia', de: 'Kolumbien', it: 'Colombia', pt: 'Colômbia'
  },
  'Chile': {
    en: 'Chile', zh: '智利', 'zh-hk': '智利', 'zh-tw': '智利',
    es: 'Chile', de: 'Chile', it: 'Cile', pt: 'Chile'
  },
  'Peru': {
    en: 'Peru', zh: '秘鲁', 'zh-hk': '秘魯', 'zh-tw': '秘魯',
    es: 'Perú', de: 'Peru', it: 'Perù', pt: 'Peru'
  },
  'Uruguay': {
    en: 'Uruguay', zh: '乌拉圭', 'zh-hk': '烏拉圭', 'zh-tw': '烏拉圭',
    es: 'Uruguay', de: 'Uruguay', it: 'Uruguay', pt: 'Uruguai'
  },
  'Paraguay': {
    en: 'Paraguay', zh: '巴拉圭', 'zh-hk': '巴拉圭', 'zh-tw': '巴拉圭',
    es: 'Paraguay', de: 'Paraguay', it: 'Paraguay', pt: 'Paraguai'
  },
  'Ecuador': {
    en: 'Ecuador', zh: '厄瓜多尔', 'zh-hk': '厄瓜多爾', 'zh-tw': '厄瓜多爾',
    es: 'Ecuador', de: 'Ecuador', it: 'Ecuador', pt: 'Equador'
  },
  'Bolivia': {
    en: 'Bolivia', zh: '玻利维亚', 'zh-hk': '玻利維亞', 'zh-tw': '玻利維亞',
    es: 'Bolivia', de: 'Bolivien', it: 'Bolivia', pt: 'Bolívia'
  },
  'Venezuela': {
    en: 'Venezuela', zh: '委内瑞拉', 'zh-hk': '委內瑞拉', 'zh-tw': '委內瑞拉',
    es: 'Venezuela', de: 'Venezuela', it: 'Venezuela', pt: 'Venezuela'
  },
  'Canada': {
    en: 'Canada', zh: '加拿大', 'zh-hk': '加拿大', 'zh-tw': '加拿大',
    es: 'Canadá', de: 'Kanada', it: 'Canada', pt: 'Canadá'
  },
  // Africa
  'South Africa': {
    en: 'South Africa', zh: '南非', 'zh-hk': '南非', 'zh-tw': '南非',
    es: 'Sudáfrica', de: 'Südafrika', it: 'Sudafrica', pt: 'África do Sul'
  },
  'Nigeria': {
    en: 'Nigeria', zh: '尼日利亚', 'zh-hk': '尼日利亞', 'zh-tw': '奈及利亞',
    es: 'Nigeria', de: 'Nigeria', it: 'Nigeria', pt: 'Nigéria'
  },
  'Morocco': {
    en: 'Morocco', zh: '摩洛哥', 'zh-hk': '摩洛哥', 'zh-tw': '摩洛哥',
    es: 'Marruecos', de: 'Marokko', it: 'Marocco', pt: 'Marrocos'
  },
  'Egypt': {
    en: 'Egypt', zh: '埃及', 'zh-hk': '埃及', 'zh-tw': '埃及',
    es: 'Egipto', de: 'Ägypten', it: 'Egitto', pt: 'Egito'
  },
  'Algeria': {
    en: 'Algeria', zh: '阿尔及利亚', 'zh-hk': '阿爾及利亞', 'zh-tw': '阿爾及利亞',
    es: 'Argelia', de: 'Algerien', it: 'Algeria', pt: 'Argélia'
  },
  'Tunisia': {
    en: 'Tunisia', zh: '突尼斯', 'zh-hk': '突尼斯', 'zh-tw': '突尼西亞',
    es: 'Túnez', de: 'Tunesien', it: 'Tunisia', pt: 'Tunísia'
  },
  'Ghana': {
    en: 'Ghana', zh: '加纳', 'zh-hk': '加納', 'zh-tw': '迦納',
    es: 'Ghana', de: 'Ghana', it: 'Ghana', pt: 'Gana'
  },
  'Kenya': {
    en: 'Kenya', zh: '肯尼亚', 'zh-hk': '肯尼亞', 'zh-tw': '肯亞',
    es: 'Kenia', de: 'Kenia', it: 'Kenya', pt: 'Quênia'
  },
  'Cameroon': {
    en: 'Cameroon', zh: '喀麦隆', 'zh-hk': '喀麥隆', 'zh-tw': '喀麥隆',
    es: 'Camerún', de: 'Kamerun', it: 'Camerun', pt: 'Camarões'
  },
  'Senegal': {
    en: 'Senegal', zh: '塞内加尔', 'zh-hk': '塞內加爾', 'zh-tw': '塞內加爾',
    es: 'Senegal', de: 'Senegal', it: 'Senegal', pt: 'Senegal'
  }
};

// Expanded list of leagues with IDs, names, countries, logos, and types.
// This list is significantly expanded from the original MAJOR_LEAGUES to include more leagues from various regions.
export const MAJOR_LEAGUES: LeagueInfo[] = [
  // FIFA International Competitions
  { 
    id: 1, 
    name: 'World Cup', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/1.png',
    type: 'Cup'
  },
  { 
    id: 21, 
    name: 'Confederations Cup', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/21.png',
    type: 'Cup'
  },

  // UEFA International
  { 
    id: 2, 
    name: 'UEFA Champions League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    type: 'Cup'
  },
  { 
    id: 3, 
    name: 'UEFA Europa League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/3.png',
    type: 'Cup'
  },
  { 
    id: 848, 
    name: 'UEFA Conference League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/848.png',
    type: 'Cup'
  },
  { 
    id: 5, 
    name: 'UEFA Nations League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/5.png',
    type: 'Cup'
  },
  { 
    id: 4, 
    name: 'Euro Championship', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/4.png',
    type: 'Cup'
  },

  // Top 5 European Leagues
  { 
    id: 39, 
    name: 'Premier League', 
    country: 'England',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    type: 'League'
  },
  { 
    id: 140, 
    name: 'La Liga', 
    country: 'Spain',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    type: 'League'
  },
  { 
    id: 135, 
    name: 'Serie A', 
    country: 'Italy',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    type: 'League'
  },
  { 
    id: 78, 
    name: 'Bundesliga', 
    country: 'Germany',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    type: 'League'
  },
  { 
    id: 61, 
    name: 'Ligue 1', 
    country: 'France',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    type: 'League'
  },

  // Other Major European Leagues
  { 
    id: 88, 
    name: 'Eredivisie', 
    country: 'Netherlands',
    logo: 'https://media.api-sports.io/football/leagues/88.png',
    type: 'League'
  },
  { 
    id: 94, 
    name: 'Primeira Liga', 
    country: 'Portugal',
    logo: 'https://media.api-sports.io/football/leagues/94.png',
    type: 'League'
  },
  { 
    id: 144, 
    name: 'Jupiler Pro League', 
    country: 'Belgium',
    logo: 'https://media.api-sports.io/football/leagues/144.png',
    type: 'League'
  },
  { 
    id: 179, 
    name: 'Premiership', 
    country: 'Scotland',
    logo: 'https://media.api-sports.io/football/leagues/179.png',
    type: 'League'
  },

  // Extended European Leagues (from API data)
  { 
    id: 218, 
    name: 'Swiss Super League', 
    country: 'Switzerland',
    logo: 'https://media.api-sports.io/football/leagues/218.png',
    type: 'League'
  },
  { 
    id: 197, 
    name: 'Bundesliga', 
    country: 'Austria',
    logo: 'https://media.api-sports.io/football/leagues/197.png',
    type: 'League'
  },
  { 
    id: 203, 
    name: 'Fortuna Liga', 
    country: 'Slovakia',
    logo: 'https://media.api-sports.io/football/leagues/203.png',
    type: 'League'
  },
  { 
    id: 345, 
    name: 'First League', 
    country: 'Czech Republic',
    logo: 'https://media.api-sports.io/football/leagues/345.png',
    type: 'League'
  },
  { 
    id: 271, 
    name: 'Ekstraklasa', 
    country: 'Poland',
    logo: 'https://media.api-sports.io/football/leagues/271.png',
    type: 'League'
  },
  { 
    id: 210, 
    name: 'HNL', 
    country: 'Croatia',
    logo: 'https://media.api-sports.io/football/leagues/210.png',
    type: 'League'
  },
  { 
    id: 283, 
    name: 'Liga I', 
    country: 'Romania',
    logo: 'https://media.api-sports.io/football/leagues/283.png',
    type: 'League'
  },
  { 
    id: 327, 
    name: 'First League', 
    country: 'Bulgaria',
    logo: 'https://media.api-sports.io/football/leagues/327.png',
    type: 'League'
  },
  { 
    id: 317, 
    name: 'Super League', 
    country: 'Greece',
    logo: 'https://media.api-sports.io/football/leagues/317.png',
    type: 'League'
  },
  { 
    id: 262, 
    name: 'Premier Liga', 
    country: 'Ukraine',
    logo: 'https://media.api-sports.io/football/leagues/262.png',
    type: 'League'
  },
  { 
    id: 235, 
    name: 'Premier League', 
    country: 'Russia',
    logo: 'https://media.api-sports.io/football/leagues/235.png',
    type: 'League'
  },
  { 
    id: 119, 
    name: 'Superliga', 
    country: 'Denmark',
    logo: 'https://media.api-sports.io/football/leagues/119.png',
    type: 'League'
  },
  { 
    id: 113, 
    name: 'Allsvenskan', 
    country: 'Sweden',
    logo: 'https://media.api-sports.io/football/leagues/113.png',
    type: 'League'
  },
  { 
    id: 103, 
    name: 'Eliteserien', 
    country: 'Norway',
    logo: 'https://media.api-sports.io/football/leagues/103.png',
    type: 'League'
  },
  { 
    id: 244, 
    name: 'Veikkausliiga', 
    country: 'Finland',
    logo: 'https://media.api-sports.io/football/leagues/244.png',
    type: 'League'
  },
  { 
    id: 203, 
    name: 'Super Lig', 
    country: 'Turkey',
    logo: 'https://media.api-sports.io/football/leagues/203.png',
    type: 'League'
  },

  // South American Leagues
  { 
    id: 71, 
    name: 'Serie A', 
    country: 'Brazil',
    logo: 'https://media.api-sports.io/football/leagues/71.png',
    type: 'League'
  },
  { 
    id: 128, 
    name: 'Liga Profesional', 
    country: 'Argentina',
    logo: 'https://media.api-sports.io/football/leagues/128.png',
    type: 'League'
  },
  { 
    id: 239, 
    name: 'Primera A', 
    country: 'Colombia',
    logo: 'https://media.api-sports.io/football/leagues/239.png',
    type: 'League'
  },
  { 
    id: 265, 
    name: 'Liga Profesional', 
    country: 'Chile',
    logo: 'https://media.api-sports.io/football/leagues/265.png',
    type: 'League'
  },
  { 
    id: 281, 
    name: 'Liga 1', 
    country: 'Peru',
    logo: 'https://media.api-sports.io/football/leagues/281.png',
    type: 'League'
  },
  { 
    id: 274, 
    name: 'Primera División', 
    country: 'Uruguay',
    logo: 'https://media.api-sports.io/football/leagues/274.png',
    type: 'League'
  },
  { 
    id: 250, 
    name: 'División Profesional', 
    country: 'Paraguay',
    logo: 'https://media.api-sports.io/football/leagues/250.png',
    type: 'League'
  },
  { 
    id: 242, 
    name: 'Serie A', 
    country: 'Ecuador',
    logo: 'https://media.api-sports.io/football/leagues/242.png',
    type: 'League'
  },
  { 
    id: 293, 
    name: 'División Profesional', 
    country: 'Bolivia',
    logo: 'https://media.api-sports.io/football/leagues/293.png',
    type: 'League'
  },
  { 
    id: 298, 
    name: 'Primera División', 
    country: 'Venezuela',
    logo: 'https://media.api-sports.io/football/leagues/298.png',
    type: 'League'
  },

  // North American Leagues
  { 
    id: 253, 
    name: 'Major League Soccer', 
    country: 'United States',
    logo: 'https://media.api-sports.io/football/leagues/253.png',
    type: 'League'
  },
  { 
    id: 906, 
    name: 'Leagues Cup', 
    country: 'United States',
    logo: 'https://media.api-sports.io/football/leagues/906.png',
    type: 'Cup'
  },

  // Asian Leagues
  { 
    id: 188, 
    name: 'J1 League', 
    country: 'Japan',
    logo: 'https://media.api-sports.io/football/leagues/188.png',
    type: 'League'
  },
  { 
    id: 292, 
    name: 'K League 1', 
    country: 'South Korea',
    logo: 'https://media.api-sports.io/football/leagues/292.png',
    type: 'League'
  },
  { 
    id: 169, 
    name: 'Chinese Super League', 
    country: 'China',
    logo: 'https://media.api-sports.io/football/leagues/169.png',
    type: 'League'
  },
  { 
    id: 307, 
    name: 'Pro League', 
    country: 'Saudi Arabia',
    logo: 'https://media.api-sports.io/football/leagues/307.png',
    type: 'League'
  },
  { 
    id: 290, 
    name: 'Persian Gulf Pro League', 
    country: 'Iran',
    logo: 'https://media.api-sports.io/football/leagues/290.png',
    type: 'League'
  },
  { 
    id: 301, 
    name: 'Stars League', 
    country: 'Qatar',
    logo: 'https://media.api-sports.io/football/leagues/301.png',
    type: 'League'
  },
  { 
    id: 332, 
    name: 'Pro League', 
    country: 'UAE',
    logo: 'https://media.api-sports.io/football/leagues/332.png',
    type: 'League'
  },
  { 
    id: 173, 
    name: 'A-League', 
    country: 'Australia',
    logo: 'https://media.api-sports.io/football/leagues/173.png',
    type: 'League'
  },

  // African Leagues
  { 
    id: 366, 
    name: 'Premier League', 
    country: 'South Africa',
    logo: 'https://media.api-sports.io/football/leagues/366.png',
    type: 'League'
  },
  { 
    id: 233, 
    name: 'Egyptian Premier League', 
    country: 'Egypt',
    logo: 'https://media.api-sports.io/football/leagues/233.png',
    type: 'League'
  },
  { 
    id: 320, 
    name: 'Botola Pro', 
    country: 'Morocco',
    logo: 'https://media.api-sports.io/football/leagues/320.png',
    type: 'League'
  },

  // CONMEBOL Continental
  { 
    id: 13, 
    name: 'CONMEBOL Libertadores', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/13.png',
    type: 'Cup'
  },
  { 
    id: 11, 
    name: 'CONMEBOL Sudamericana', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/11.png',
    type: 'Cup'
  },

  // AFC Continental
  { 
    id: 15, 
    name: 'AFC Champions League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/15.png',
    type: 'Cup'
  },
  { 
    id: 16, 
    name: 'AFC Cup', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/16.png',
    type: 'Cup'
  },

  // CAF Continental
  { 
    id: 12, 
    name: 'CAF Champions League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/12.png',
    type: 'Cup'
  },
  { 
    id: 17, 
    name: 'CAF Confederation Cup', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/17.png',
    type: 'Cup'
  },

  // CONCACAF Continental
  { 
    id: 14, 
    name: 'CONCACAF Champions League', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/14.png',
    type: 'Cup'
  },

  // Friendlies
  { 
    id: 10, 
    name: 'Friendlies', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/10.png',
    type: 'Friendly'
  },
  { 
    id: 667, 
    name: 'Friendlies Clubs', 
    country: 'World',
    logo: 'https://media.api-sports.io/football/leagues/667.png',
    type: 'Friendly'
  }
];

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

// Function to translate country names with smart fallback
export function translateCountryName(countryName: string, language: string): string {
  if (!countryName || !language) return countryName;

  // First try our comprehensive static translations
  const translations = countryTranslations[countryName];
  if (translations && translations[language]) {
    return translations[language];
  }

  // Try with smart translation system (it should be imported and available)
  // This will be handled by the smart translation system via the context
  return countryName;
}

// Function to translate league names with smart fallback
export function translateLeagueName(leagueName: string, language: string): string {
  if (!leagueName || !language) return leagueName;

  // This will be handled by the smart translation system in the context
  // We return the original name and let the smart system handle translation
  return leagueName;
}

// Type definitions
export type Country = typeof ALL_COUNTRIES[number];
export type League = typeof MAJOR_LEAGUES[number];
export type CountryOption = ReturnType<typeof getCountriesAsOptions>[number];
export type LeagueOption = ReturnType<typeof getLeaguesAsOptions>[number];

// Define LeagueInfo type for clarity, assuming it's not defined elsewhere
interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo?: string; // Optional logo URL
  type: string; // e.g., 'League', 'Cup', 'Friendly'
  countryCode?: string; // Added for consistency with LeagueOption
}