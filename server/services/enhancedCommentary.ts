
export interface CommentaryEvent {
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'commentary' | 'chance' | 'foul';
  description: string;
  player?: string;
  team?: string;
  isImportant: boolean;
}

export class EnhancedCommentaryService {
  private static commentaryTemplates = {
    general: [
      "Good spell of possession for {team}",
      "Play switches from side to side",
      "The tempo is building here",
      "{team} looking to create something",
      "Both teams battling hard in midfield",
      "End-to-end action here",
      "The crowd is getting into this one"
    ],
    defensive: [
      "Solid defending from {team}",
      "Great clearance under pressure", 
      "Defensive line holding firm",
      "Good tracking back from {team}",
      "Goalkeeper called into action"
    ],
    attacking: [
      "Promising attack building for {team}",
      "Good movement in the final third",
      "Looking dangerous on the counter-attack",
      "Pace and purpose from {team}",
      "Testing the defense here"
    ],
    chances: [
      "Half-chance for {player}!",
      "Good opportunity goes begging",
      "Close! That was almost the breakthrough",
      "Inches away from the opener",
      "So close to breaking the deadlock"
    ]
  };

  static generateEnhancedCommentary(
    fixtureEvents: any[], 
    homeTeam: string, 
    awayTeam: string
  ): CommentaryEvent[] {
    const commentary: CommentaryEvent[] = [];
    
    // Convert real events
    fixtureEvents.forEach(event => {
      commentary.push({
        minute: event.time.elapsed,
        type: event.type,
        description: this.generateEventDescription(event, homeTeam, awayTeam),
        player: event.player?.name,
        team: event.team?.name,
        isImportant: true
      });
    });

    // Add synthetic commentary between events
    for (let minute = 5; minute <= 90; minute += 7) {
      const hasNearbyEvent = commentary.some(c => 
        Math.abs(c.minute - minute) <= 3
      );

      if (!hasNearbyEvent) {
        const team = Math.random() > 0.5 ? homeTeam : awayTeam;
        const category = this.selectCommentaryCategory(minute);
        const template = this.getRandomTemplate(category);
        
        commentary.push({
          minute,
          type: 'commentary',
          description: template.replace('{team}', team).replace('{player}', ''),
          isImportant: false
        });
      }
    }

    return commentary.sort((a, b) => b.minute - a.minute);
  }

  private static generateEventDescription(event: any, homeTeam: string, awayTeam: string): string {
    const playerName = event.player?.name || "Unknown Player";
    const teamName = event.team?.name || "Unknown Team";
    
    switch (event.type?.toLowerCase()) {
      case "goal":
        return `GOAL! ${playerName} finds the net for ${teamName}! What a moment!`;
      case "card":
        const cardType = event.detail?.toLowerCase().includes("yellow") ? "Yellow" : "Red";
        return `${cardType} card shown to ${playerName} (${teamName}).`;
      case "subst":
        return `Substitution: ${event.assist?.name || "New player"} comes on for ${playerName} (${teamName}).`;
      default:
        return `${event.detail || event.type} involving ${playerName} (${teamName}).`;
    }
  }

  private static selectCommentaryCategory(minute: number): keyof typeof this.commentaryTemplates {
    if (minute < 15 || minute > 75) return 'general';
    if (minute % 3 === 0) return 'attacking';
    if (minute % 5 === 0) return 'defensive';
    return 'general';
  }

  private static getRandomTemplate(category: keyof typeof this.commentaryTemplates): string {
    const templates = this.commentaryTemplates[category];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}
