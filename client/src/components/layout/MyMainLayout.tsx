import React, { useState, useMemo, Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocation } from "wouter";
import MyRightContent from "@/components/layout/MyRightContent";
import MyMainLayoutRight from "@/components/layout/MyMainLayoutRight";
import MySmartTimeFilter from "@/lib/MySmartTimeFilter";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Import language-specific layouts (365scores.com style)
import MyMainLayout_EN from "./MyMainLayout_EN";
import MyMainLayout_ES from "./MyMainLayout_ES";
import MyMainLayout_ZH from "./MyMainLayout_ZH";

// Lazy load the TodayMatchPageCard component
const TodayMatchPageCard = lazy(
  () => import("@/components/matches/TodayMatchPageCard"),
);

interface MyMainLayoutProps {
  fixtures: any[];
  loading?: boolean;
  children?: React.ReactNode;
}

const MyMainLayout: React.FC<MyMainLayoutProps> = ({
  fixtures,
  loading = false,
  children,
}) => {
  const { currentLanguage } = useLanguage();

  // 365scores.com style: Route to language-specific components
  // This approach provides better SEO and performance
  console.log(`🌍 [MyMainLayout] Rendering language-specific layout for: ${currentLanguage}`);

  switch (currentLanguage) {
    case 'es':
      return <MyMainLayout_ES fixtures={fixtures} loading={loading} children={children} />;
    case 'zh':
    case 'zh-hk':
      return <MyMainLayout_ZH fixtures={fixtures} loading={loading} children={children} />;
    case 'en':
    default:
      return <MyMainLayout_EN fixtures={fixtures} loading={loading} children={children} />;
  }
};

  
};

export default MyMainLayout;
