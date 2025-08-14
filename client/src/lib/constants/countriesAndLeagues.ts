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
  { code: 'INT', name: 'International', flag: "https://media.api-sports.io/flags/int.svg" },

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

// Type definitions
export type Country = typeof ALL_COUNTRIES[number];
export type League = typeof MAJOR_LEAGUES[number];
export type CountryOption = ReturnType<typeof getCountriesAsOptions>[number];
export type LeagueOption = ReturnType<typeof getLeaguesAsOptions>[number];