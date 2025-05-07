import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://mnqugjhbztzbkkvifzie.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseService = {
  /**
   * Authenticate a user with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Register a new user
   */
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Sign out a user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  /**
   * Get user profile data
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: any) {
    // Check if preferences exist first
    const existingPrefs = await this.getUserPreferences(userId);
    
    let result;
    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_id', userId);
      
      if (error) throw error;
      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({ ...preferences, user_id: userId });
      
      if (error) throw error;
      result = data;
    }
    
    return result;
  },
  
  /**
   * Add a team to favorites
   */
  async addFavoriteTeam(userId: string, teamId: string) {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      return this.updateUserPreferences(userId, {
        favorite_teams: [teamId]
      });
    }
    
    // Add team if not already in favorites
    const favoriteTeams = preferences.favorite_teams || [];
    if (!favoriteTeams.includes(teamId)) {
      return this.updateUserPreferences(userId, {
        favorite_teams: [...favoriteTeams, teamId]
      });
    }
    
    return preferences;
  },
  
  /**
   * Remove a team from favorites
   */
  async removeFavoriteTeam(userId: string, teamId: string) {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences && preferences.favorite_teams) {
      const favoriteTeams = preferences.favorite_teams.filter(
        (id: string) => id !== teamId
      );
      
      return this.updateUserPreferences(userId, {
        favorite_teams: favoriteTeams
      });
    }
    
    return preferences;
  },
  
  /**
   * Add a league to favorites
   */
  async addFavoriteLeague(userId: string, leagueId: string) {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      return this.updateUserPreferences(userId, {
        favorite_leagues: [leagueId]
      });
    }
    
    // Add league if not already in favorites
    const favoriteLeagues = preferences.favorite_leagues || [];
    if (!favoriteLeagues.includes(leagueId)) {
      return this.updateUserPreferences(userId, {
        favorite_leagues: [...favoriteLeagues, leagueId]
      });
    }
    
    return preferences;
  },
  
  /**
   * Remove a league from favorites
   */
  async removeFavoriteLeague(userId: string, leagueId: string) {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences && preferences.favorite_leagues) {
      const favoriteLeagues = preferences.favorite_leagues.filter(
        (id: string) => id !== leagueId
      );
      
      return this.updateUserPreferences(userId, {
        favorite_leagues: favoriteLeagues
      });
    }
    
    return preferences;
  }
};
