import React from 'react';

export const emptyFixture = {
  fixture: {
    id: 0,
    referee: "",
    timezone: "",
    date: "",
    timestamp: 0,
    periods: {
      first: null,
      second: null
    },
    venue: {
      id: null,
      name: null,
      city: null
    },
    status: {
      long: "",
      short: "",
      elapsed: null
    }
  },
  league: {
    id: 0,
    name: "",
    country: "",
    logo: "",
    flag: null,
    season: 0,
    round: ""
  },
  teams: {
    home: {
      id: 0,
      name: "",
      logo: ""
    },
    away: {
      id: 0,
      name: "",
      logo: ""
    }
  },
  goals: {
    home: null,
    away: null
  },
  score: {
    halftime: { home: null, away: null },
    fulltime: { home: null, away: null },
    extratime: { home: null, away: null },
    penalty: { home: null, away: null }
  }
};

export default emptyFixture;