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
   * Whale Queen outcome: null | 'victory' | 'defeat'
   * victory = player REFUSED payment
   * defeat  = player PAID
   */
  whaleQueenOutcome: null,

  recordChoice(type) {
    if (type === 'gacha') this.gachaScore += 1
  },

  isGachaDemon() {
    return this.gachaScore >= 5
  },

  reset() {
    this.gender            = 'male'
    this.gachaScore        = 0
    this.speedBoostUnlocked = false
    this.whaleQueenOutcome  = null
  },
}

export default GameState
