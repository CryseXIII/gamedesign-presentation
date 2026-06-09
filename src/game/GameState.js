/**
 * GameState — global singleton for cross-scene player state.
 *
 * Tracks:
 *   gender     — 'male' | 'female', set at CharacterSelect before game starts
 *   gachaScore — incremented each time the player makes a gacha-friendly choice
 *   speedBoostUnlocked — true after the speedup succubus grants the diamond power
 *
 * Threshold: gachaScore >= 5 → player "becomes" a gacha demon (bad ending)
 *
 * Usage:
 *   import GameState from './GameState.js'
 *   GameState.gender      // 'male' | 'female'
 *   GameState.gachaScore  // number
 *   GameState.recordChoice('gacha')   // increments gachaScore
 *   GameState.recordChoice('fight')   // no score change
 *   GameState.isGachaDemon()          // true if score >= 5
 *   GameState.reset()                 // back to defaults (call on game exit)
 */

const GameState = {
  /** @type {'male'|'female'} */
  gender: 'male',

  /** How many dark-pattern choices the player made. */
  gachaScore: 0,

  /** Whether the speed boost / barrier power is unlocked. */
  speedBoostUnlocked: false,

  /**
   * Record a player choice.
   * @param {'gacha'|'fight'} type
   */
  recordChoice(type) {
    if (type === 'gacha') {
      this.gachaScore += 1
    }
  },

  /**
   * Returns true when the player has given in to enough dark patterns
   * to trigger the gacha demon ending.
   * @returns {boolean}
   */
  isGachaDemon() {
    return this.gachaScore >= 5
  },

  /**
   * Reset to defaults.  Call when returning to the title screen so
   * a new playthrough starts clean.
   */
  reset() {
    this.gender     = 'male'
    this.gachaScore = 0
    this.speedBoostUnlocked = false
  },
}

export default GameState
