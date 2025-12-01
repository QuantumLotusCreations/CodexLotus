import { DiceRoll } from "@dice-roller/rpg-dice-roller";

// --- Types ---

export type ComparisonOp = ">" | "<" | ">=" | "<=" | "==" | "!=";
export type MutationOp = "add" | "sub" | "set";

export interface SimulationResource {
  id: string;
  name: string;
  initialValue: number;
  min?: number; // e.g., 0 (Death/Failure)
  max?: number; // e.g., 10 (Success/Goal)
}

export interface SimulationCondition {
  resourceId: string;
  op: ComparisonOp;
  value: number;
}

export interface SimulationEffect {
  resourceId: string;
  op: MutationOp;
  valueFormula: string; // e.g., "1d6", "5", "2 * 1d4"
}

export interface SimulationAction {
  id: string;
  name: string;
  condition?: SimulationCondition; // Prerequisite (e.g., only use "Heal" if HP < 10)
  rollFormula?: string; // e.g., "1d20 + 5" (The check)
  target?: number;      // e.g., 15 (The DC)
  
  // Outcome if roll succeeds (or always, if no roll)
  onSuccess: SimulationEffect[];
  // Outcome if roll fails
  onFailure?: SimulationEffect[];
}

export interface ScenarioConfig {
  resources: SimulationResource[];
  actions: SimulationAction[];
  maxRounds: number;
  terminationConditions: {
    resourceId: string;
    op: ComparisonOp;
    value: number;
    result: "win" | "loss";
  }[];
}

export interface SimulationResult {
  iterations: number;
  winRate: number;
  avgRounds: number;
  resourceStats: Record<string, { min: number; max: number; avg: number }>;
}

// --- Engine ---

export class ScenarioEngine {
  private config: ScenarioConfig;

  constructor(config: ScenarioConfig) {
    this.config = config;
  }

  public run(iterations: number = 1000): SimulationResult {
    let wins = 0;
    let totalRounds = 0;
    const resourceTotals: Record<string, number> = {};
    const resourceMin: Record<string, number> = {};
    const resourceMax: Record<string, number> = {};

    // Initialize stats
    this.config.resources.forEach(r => {
        resourceTotals[r.id] = 0;
        resourceMin[r.id] = Infinity;
        resourceMax[r.id] = -Infinity;
    });

    for (let i = 0; i < iterations; i++) {
      const outcome = this.simulateSingleRun();
      
      if (outcome.result === "win") wins++;
      totalRounds += outcome.rounds;

      // Track end-state resources
      Object.entries(outcome.finalResources).forEach(([id, val]) => {
          resourceTotals[id] += val;
          if (val < resourceMin[id]) resourceMin[id] = val;
          if (val > resourceMax[id]) resourceMax[id] = val;
      });
    }

    // Compile stats
    const resourceStats: Record<string, { min: number; max: number; avg: number }> = {};
    this.config.resources.forEach(r => {
        resourceStats[r.id] = {
            min: resourceMin[r.id],
            max: resourceMax[r.id],
            avg: Number((resourceTotals[r.id] / iterations).toFixed(2))
        };
    });

    return {
      iterations,
      winRate: Number((wins / iterations).toFixed(2)),
      avgRounds: Number((totalRounds / iterations).toFixed(2)),
      resourceStats
    };
  }

  private simulateSingleRun() {
    // 1. Init State
    const state: Record<string, number> = {};
    this.config.resources.forEach(r => state[r.id] = r.initialValue);

    let round = 0;
    let result: "win" | "loss" | "draw" = "draw";

    // 2. Loop
    while (round < this.config.maxRounds) {
      round++;

      // Check termination BEFORE action (e.g. start with 0 HP)
      const term = this.checkTermination(state);
      if (term) {
          result = term;
          break;
      }

      // Execute Actions (Simple Round Robin: Try all valid actions in order)
      // In a complex sim, we'd have an "Actor" system, but for now, we execute the list.
      for (const action of this.config.actions) {
          
          // Check Prereqs
          if (action.condition && !this.evaluateCondition(action.condition, state)) {
              continue; 
          }

          // Resolve Action
          this.resolveAction(action, state);

          // Check termination immediately after effect
          const termPost = this.checkTermination(state);
          if (termPost) {
            result = termPost;
            break; // Break action loop
          }
      }
      
      if (result !== "draw") break; // Break round loop
    }

    return { result, rounds: round, finalResources: state };
  }

  private checkTermination(state: Record<string, number>): "win" | "loss" | null {
    for (const term of this.config.terminationConditions) {
        const current = state[term.resourceId];
        if (this.compare(current, term.op, term.value)) {
            return term.result;
        }
    }
    return null;
  }

  private resolveAction(action: SimulationAction, state: Record<string, number>) {
    let success = true;

    // Roll check?
    if (action.rollFormula && action.target !== undefined) {
        try {
            // Simple roll: "1d20+5"
            // We use a synchronous roll here. For massive iterations, we might want a faster PRNG, 
            // but rpg-dice-roller is robust for parsing.
            const roll = new DiceRoll(action.rollFormula).total;
            success = roll >= action.target; // Standard DC logic: Meet or beat
        } catch (e) {
            console.error(`Invalid formula for ${action.name}: ${action.rollFormula}`);
            success = false;
        }
    }

    const effects = success ? action.onSuccess : (action.onFailure || []);

    for (const effect of effects) {
        this.applyEffect(effect, state);
    }
  }

  private applyEffect(effect: SimulationEffect, state: Record<string, number>) {
      let val = 0;
      // Parse value formula (could be static "5" or dynamic "1d6")
      try {
          // Optimization: if it's just a number, parse it directly
          if (!isNaN(Number(effect.valueFormula))) {
              val = Number(effect.valueFormula);
          } else {
              val = new DiceRoll(effect.valueFormula).total;
          }
      } catch (e) {
          val = 0;
      }

      const current = state[effect.resourceId];
      
      // Apply cap checks based on resource config? 
      // Ideally yes, but for speed we trust the math for now. 
      // We'll enforce Min/Max if defined in config during setup.

      if (effect.op === "add") state[effect.resourceId] = current + val;
      else if (effect.op === "sub") state[effect.resourceId] = current - val;
      else if (effect.op === "set") state[effect.resourceId] = val;
  }

  private evaluateCondition(cond: SimulationCondition, state: Record<string, number>): boolean {
      return this.compare(state[cond.resourceId], cond.op, cond.value);
  }

  private compare(a: number, op: ComparisonOp, b: number): boolean {
      switch (op) {
          case ">": return a > b;
          case "<": return a < b;
          case ">=": return a >= b;
          case "<=": return a <= b;
          case "==": return a === b;
          case "!=": return a !== b;
          default: return false;
      }
  }
}

