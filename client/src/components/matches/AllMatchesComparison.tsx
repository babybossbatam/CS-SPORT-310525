
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import LazyImage from '../common/LazyImage';
import { isNationalTeam } from '@/lib/teamLogoSources';

// All league IDs from your list
const ALL_LEAGUE_IDS = [
  3021, 3, 1132, 2, 39, 140, 135, 78, 61, 45, 48, 143, 137, 81, 66, 848, 4, 1135,
  301, 266, 233, 15, 32, 33, 34, 35, 36, 37, 38, 914, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 40, 41,
  42, 43, 44, 46, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 62, 63, 64,
  65, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 79, 80, 82, 83, 84, 85, 86, 87,
  88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
  106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 136, 138, 139,
  141, 142, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
  174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189,
  190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205,
  206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221,
  222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 234, 235, 236, 237, 238,
  239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
  255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 267, 268, 269, 270, 271,
  272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287,
  288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 302, 303, 304,
  305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320,
  321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336,
  337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352,
  353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368,
  369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384,
  385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400,
  401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
  417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432,
  433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448,
  449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464,
  465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480,
  481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496,
  497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512,
  513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528,
  529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544,
  545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560,
  561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576,
  577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592,
  593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608,
  609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624,
  625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640,
  641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656,
  657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672,
  673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688,
  689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704,
  705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720,
  721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736,
  737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752,
  753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768,
  769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784,
  785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800,
  801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816,
  817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832,
  833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 849,
  850, 851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865,
  866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881,
  882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897,
  898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913,
  915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930,
  931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946,
  947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962,
  963, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976, 977, 978,
  979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994,
  995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008,
  1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021,
  1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034,
  1035, 1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047,
  1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060,
  1061, 1062, 1063, 1064, 1065, 1066, 1067, 1068, 1069, 1070, 1071, 1072, 1073,
  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
  1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094, 1095, 1096, 1097, 1098, 1099,
  1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112,
  1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125,
  1126, 1127, 1128, 1129, 1130, 1131, 1133, 1134, 1136, 1137, 1138, 1139, 1140,
  1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153,
  1154, 1155, 1156, 1157, 1158, 1159, 1160, 1161, 1162, 1163, 1164, 1165, 1166,
  1167, 1168, 1169, 1170, 1171, 1172, 1173, 1174, 1175, 1176, 1177, 1178, 1179,
  1180, 1181, 1182, 1183, 1184, 1185, 1186, 1187, 1188, 1189, 1190, 1191, 1192,
  1193, 1194, 1195, 1196, 1197, 1198, 1199, 1200
];

interface AllMatchesComparisonProps {
  selectedDate: string;
}

const AllMatchesComparison: React.FC<AllMatchesComparisonProps> = ({ selectedDate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().slice(0, 10);

  // Fetch today's matches
  const { data: todayFixtures = [], isLoading: todayLoading } = useQuery({
    queryKey: ['all-matches-today', today],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${today}?all=true`);
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tomorrow's matches
  const { data: tomorrowFixtures = [], isLoading: tomorrowLoading } = useQuery({
    queryKey: ['all-matches-tomorrow', tomorrowString],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowString}?all=true`);
      return await response.json();
    },
  });

  // Filter matches to only include leagues from your list
  const filteredTodayMatches = useMemo(() => {
    return todayFixtures.filter(match => ALL_LEAGUE_IDS.includes(match.league.id));
  }, [todayFixtures]);

  const filteredTomorrowMatches = useMemo(() => {
    return tomorrowFixtures.filter(match => ALL_LEAGUE_IDS.includes(match.league.id));
  }, [tomorrowFixtures]);

  // Group matches by league
  const groupByLeague = (matches: any[]) => {
    return matches.reduce((acc, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: match.league,
          matches: []
        };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {} as any);
  };

  const todayByLeague = groupByLeague(filteredTodayMatches);
  const tomorrowByLeague = groupByLeague(filteredTomorrowMatches);

  const renderMatch = (match: any) => {
    const status = match.fixture.status.short;
    const fixtureDate = parseISO(match.fixture.date);

    return (
      <div key={match.fixture.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
        {/* Home Team */}
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-6 h-6">
            {isNationalTeam(match.teams.home, match.league) ? (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <LazyImage
                  src={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                  alt={match.teams.home.name}
                  className="w-full h-full object-cover"
                  fallbackSrc="/assets/fallback-logo.svg"
                />
              </div>
            ) : (
              <LazyImage
                src={`/api/team-logo/square/${match.teams.home.id}?size=24`}
                alt={match.teams.home.name}
                className="w-6 h-6"
                fallbackSrc="/assets/fallback-logo.svg"
              />
            )}
          </div>
          <span className="text-sm font-medium truncate">{match.teams.home.name}</span>
        </div>

        {/* Score/Time */}
        <div className="flex-shrink-0 mx-4 text-center min-w-[80px]">
          {['FT', 'AET', 'PEN'].includes(status) ? (
            <div className="text-sm font-bold">
              {match.goals.home} - {match.goals.away}
            </div>
          ) : ['1H', '2H', 'HT', 'LIVE'].includes(status) ? (
            <div className="text-sm font-bold text-green-600">
              {match.goals.home} - {match.goals.away}
              <div className="text-xs">{status}</div>
            </div>
          ) : (
            <div className="text-sm">
              {format(fixtureDate, 'HH:mm')}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <span className="text-sm font-medium truncate">{match.teams.away.name}</span>
          <div className="w-6 h-6">
            {isNationalTeam(match.teams.away, match.league) ? (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <LazyImage
                  src={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                  alt={match.teams.away.name}
                  className="w-full h-full object-cover"
                  fallbackSrc="/assets/fallback-logo.svg"
                />
              </div>
            ) : (
              <LazyImage
                src={`/api/team-logo/square/${match.teams.away.id}?size=24`}
                alt={match.teams.away.name}
                className="w-6 h-6"
                fallbackSrc="/assets/fallback-logo.svg"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (todayLoading || tomorrowLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading all matches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>All Matches Comparison - Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredTodayMatches.length}</p>
              <p className="text-sm text-gray-600">Today's Matches</p>
              <p className="text-xs text-gray-400">From {Object.keys(todayByLeague).length} leagues</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{filteredTomorrowMatches.length}</p>
              <p className="text-sm text-gray-600">Tomorrow's Matches</p>
              <p className="text-xs text-gray-400">From {Object.keys(tomorrowByLeague).length} leagues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Today's All Matches ({today})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(todayByLeague).length === 0 ? (
            <p className="p-6 text-center text-gray-500">No matches today from your league list</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.values(todayByLeague).map((group: any) => (
                <div key={group.league.id} className="border-b border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-sm">
                      {group.league.name} ({group.league.country}) - {group.matches.length} matches
                    </h3>
                  </div>
                  {group.matches.map(renderMatch)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tomorrow's Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's All Matches ({tomorrowString})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(tomorrowByLeague).length === 0 ? (
            <p className="p-6 text-center text-gray-500">No matches tomorrow from your league list</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.values(tomorrowByLeague).map((group: any) => (
                <div key={group.league.id} className="border-b border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-sm">
                      {group.league.name} ({group.league.country}) - {group.matches.length} matches
                    </h3>
                  </div>
                  {group.matches.map(renderMatch)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllMatchesComparison;
