import { useLocation } from 'wouter';
import FixedScoreboard from './FixedScoreboard';

// This component is a direct pass-through to FixedScoreboard
// We're exporting FixedScoreboard directly to avoid nesting components
const FeaturedMatch = FixedScoreboard;

export default FeaturedMatch;