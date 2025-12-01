import intro from './01-Introduction.md?raw';
import project from './02-ProjectManagement.md?raw';
import editor from './03-Editor.md?raw';
import statblocks from './04-StatBlocks.md?raw';
import dicetools from './05-DiceTools.md?raw';
import loremap from './06-LoreMap.md?raw';
import rulecalc from './07-RuleCalculators.md?raw';
import procedural from './08-ProceduralGeneration.md?raw';
import autotagger from './09-AutoTagger.md?raw';
import playtest from './10-PlaytestSimulator.md?raw';
import exportDoc from './11-Export.md?raw';
import settings from './12-Settings.md?raw';

export interface DocPage {
    id: string;
    title: string;
    content: string;
}

export const documentation: DocPage[] = [
    { id: 'intro', title: 'Introduction', content: intro },
    { id: 'project', title: 'Project Management', content: project },
    { id: 'editor', title: 'Markdown Editor', content: editor },
    { id: 'statblocks', title: 'Stat Blocks', content: statblocks },
    { id: 'dicetools', title: 'Dice Tools', content: dicetools },
    { id: 'loremap', title: 'Lore Map', content: loremap },
    { id: 'rulecalc', title: 'Rule Calculators', content: rulecalc },
    { id: 'procedural', title: 'Procedural Generation', content: procedural },
    { id: 'autotagger', title: 'Auto Tagger', content: autotagger },
    { id: 'playtest', title: 'Playtest Simulator', content: playtest },
    { id: 'export', title: 'Export', content: exportDoc },
    { id: 'settings', title: 'Settings', content: settings },
];

