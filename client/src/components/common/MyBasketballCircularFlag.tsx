
import React, { useState, useEffect } from "react";
import { getCountryCode } from "@/lib/flagUtils";

interface MyBasketballCircularFlagProps {
  teamName: string;
  teamId?: number | string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
  countryName?: string; // For basketball teams, we often have direct country info
}

const MyBasketballCircularFlag: React.FC<MyBasketballCircularFlagProps> = ({
  teamName,
  teamId,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  countryName,
}) => {
  const getBasketballCircleFlagUrl = (teamName: string, countryName?: string, fallbackUrl?: string) => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Use provided country name first, then extract from team name
    const targetCountry = countryName || teamName;
    const countryCode = getCountryCode(targetCountry);

    if (countryCode) {
      // Use Circle Flags from hatscripts.github.io
      return `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
    }

    // Basketball-specific country patterns (focusing on major basketball nations)
    const basketballCountryPatterns: { [key: string]: string } = {
      // Major basketball countries
      "United States": "us",
      "USA": "us",
      "Spain": "es",
      "France": "fr",
      "Greece": "gr",
      "Turkey": "tr",
      "Türkiye": "tr",
      "Germany": "de",
      "Italy": "it",
      "Serbia": "rs",
      "Croatia": "hr",
      "Lithuania": "lt",
      "Latvia": "lv",
      "Estonia": "ee",
      "Slovenia": "si",
      "Poland": "pl",
      "Czech Republic": "cz",
      "Russia": "ru",
      "Israel": "il",
      "Montenegro": "me",
      "Ukraine": "ua",
      "Finland": "fi",
      "Belgium": "be",
      "Netherlands": "nl",
      "Georgia": "ge",
      "Hungary": "hu",
      "Bosnia": "ba",
      "North Macedonia": "mk",
      "Bulgaria": "bg",
      "Slovakia": "sk",
      "Romania": "ro",
      "Switzerland": "ch",
      "Austria": "at",
      "Belarus": "by",
      "Moldova": "md",
      "Albania": "al",
      "Kosovo": "xk",
      // Other basketball regions
      "Argentina": "ar",
      "Brazil": "br",
      "Canada": "ca",
      "Australia": "au",
      "New Zealand": "nz",
      "China": "cn",
      "Japan": "jp",
      "South Korea": "kr",
      "Philippines": "ph",
      "Iran": "ir",
      "Lebanon": "lb",
      "Jordan": "jo",
      "Mexico": "mx",
      "Venezuela": "ve",
      "Puerto Rico": "pr",
      "Dominican Republic": "do",
      "Angola": "ao",
      "Nigeria": "ng",
      "Egypt": "eg",
      "Tunisia": "tn",
      "Morocco": "ma",
      "Senegal": "sn",
      "Cape Verde": "cv",
      "Ivory Coast": "ci",
      "Mali": "ml",
      "Rwanda": "rw",
      "Uganda": "ug",
      "Kenya": "ke",
      "Madagascar": "mg",
      "Cameroon": "cm",
    };

    // Try to find a pattern match in the team name or country
    for (const [country, code] of Object.entries(basketballCountryPatterns)) {
      if (targetCountry.toLowerCase().includes(country.toLowerCase())) {
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    // Final fallback
    return fallbackUrl || "/assets/fallback-logo.svg";
  };

  return (
    <div
      className={`flag-circle ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
      }}
    >
      <img
        src={getBasketballCircleFlagUrl(teamName, countryName, fallbackUrl)}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
          position: "relative",
          zIndex: 1,
          filter: "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)",
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
          }
        }}
      />
      <div className="gloss"></div>
    </div>
  );
};

export default MyBasketballCircularFlag;
