declare module '@dice-roller/rpg-dice-roller' {
  export class DiceRoll {
    constructor(notation: string);
    total: number;
    output: string;
    notation: string;
    export(): string;
  }
}
